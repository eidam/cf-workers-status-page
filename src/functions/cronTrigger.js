import config from '../../config.yaml'

import { setKV, getKVWithMetadata, gcMonitors, getKV } from './helpers'

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
        'User-Agent': 'cf-worker-status-page',
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

    // Write current status if status changed or for first time
    if (
      !kvState.metadata ||
      kvState.metadata.operational !== newMetadata.operational
    ) {
      console.log('Saving changed state..')

      await setKV('s_' + monitor.id, null, newMetadata)

      if (typeof SECRET_SLACK_WEBHOOK !== 'undefined') {
        await notifySlack(monitor, newMetadata)
      }

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

    // save last check timestamp
    await setKV('lastUpdate', Date.now())
  }
  await gcMonitors(config)

  return new Response('OK')
}
