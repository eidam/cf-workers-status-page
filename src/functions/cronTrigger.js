import config from '../../config.yaml'

import {
  setKV,
  getKVWithMetadata,
  gcMonitors,
  getKV,
  notifySlack,
} from './helpers'

function getDate() {
  return new Date().toISOString().split('T')[0]
}

export async function processCronTrigger(event) {
  for (const monitor of config.monitors) {
    console.log(`Checking ${monitor.name} ...`)

    const init = {
      method: monitor.method || 'GET',
      redirect: monitor.followRedirect ? 'follow' : 'manual',
      headers: {
        'User-Agent': config.settings.user_agent || 'cf-worker-status-page',
      },
    }

    const checkResponse = await fetch(monitor.url, init)
    const kvState = await getKVWithMetadata('s_' + monitor.id)

    // metadata from monitor settings
    const newMetadata = {
      operational: checkResponse.status === (monitor.expectStatus || 200),
      id: monitor.id,
      firstCheck: kvState.metadata ? kvState.metadata.firstCheck : getDate(),
    }

    // write current status if status changed or for first time
    if (
      !kvState.metadata ||
      kvState.metadata.operational !== newMetadata.operational
    ) {
      console.log('Saving changed state..')

      // first try to notify Slack in case fetch() or other limit is reached
      if (typeof SECRET_SLACK_WEBHOOK_URL !== 'undefined' && SECRET_SLACK_WEBHOOK_URL !== 'default-gh-action-secret') {
        await notifySlack(monitor, newMetadata)
      }

      await setKV('s_' + monitor.id, null, newMetadata)
    }

    // write daily status if monitor is not operational
    if (!newMetadata.operational) {
      // try to get failed daily status first as KV read is cheaper than write
      const kvFailedDayStatusKey = 'h_' + monitor.id + '_' + getDate()
      const kvFailedDayStatus = await getKV(kvFailedDayStatusKey)

      // write if not found
      if (!kvFailedDayStatus) {
        console.log('Saving new failed daily status..')
        await setKV(kvFailedDayStatusKey, null)
      }
    }
  }

  // save last check timestamp including PoP location
  const res = await fetch("https://www.cloudflare.com/cdn-cgi/trace")
  const resText = await res.text()
  const loc = /loc=([\w]{2})/.exec(resText)[1]
  await setKV('lastUpdate', Date.now(), {loc})

  // gc monitor statuses
  event.waitUntil(gcMonitors(config))

  return new Response('OK')
}
