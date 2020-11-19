import config from '../../config.yaml'

import {
  setKV,
  getKVWithMetadata,
  notifySlack,
} from './helpers'

function getDate() {
  return new Date().toISOString().split('T')[0]
}

export async function processCronTrigger(event) {
  // Get monitors state from KV
  let {value: monitorsState, metadata: monitorsStateMetadata} = await getKVWithMetadata('monitors_data', 'json')

  // Create empty state objects if not exists in KV storage yet
  if (!monitorsState) {
    monitorsState = {}
  }
  if (!monitorsStateMetadata) {
    monitorsStateMetadata = {}
  }

  // Reset default all monitors state to true
  monitorsStateMetadata.monitorsOperational = true

  for (const monitor of config.monitors) {
    // Create default monitor state if does not exist yet
    if (typeof monitorsState[monitor.id] === 'undefined') {
      monitorsState[monitor.id] = {failedDays: []}
    }

    console.log(`Checking ${monitor.name} ...`)

    // Fetch the monitors URL
    const init = {
      method: monitor.method || 'GET',
      redirect: monitor.followRedirect ? 'follow' : 'manual',
      headers: {
        'User-Agent': config.settings.user_agent || 'cf-worker-status-page',
      },
    }

    const checkResponse = await fetch(monitor.url, init)
    const monitorOperational = checkResponse.status === (monitor.expectStatus || 200)

    // Send Slack message on monitor change
    if (monitorsState[monitor.id].operational !== monitorOperational && typeof SECRET_SLACK_WEBHOOK_URL !== 'undefined' && SECRET_SLACK_WEBHOOK_URL !== 'default-gh-action-secret') {
        event.waitUntil(notifySlack(monitor, monitorOperational))
    }

    monitorsState[monitor.id].operational = checkResponse.status === (monitor.expectStatus || 200)
    monitorsState[monitor.id].firstCheck = monitorsState[monitor.id].firstCheck || getDate()

    // Set monitorsOperational and push current day to failedDays
    if (!monitorOperational) {
      monitorsStateMetadata.monitorsOperational = false

      const failedDay = getDate()
      if (!monitorsState[monitor.id].failedDays.includes(failedDay)) {
        console.log('Saving new failed daily status ...')
        monitorsState[monitor.id].failedDays.push(failedDay)
      }
    }
  }

  // Get Worker PoP and save it to monitorsStateMetadata
  const res = await fetch('https://cloudflare-dns.com/dns-query', {
    method: 'OPTIONS',
  })
  const loc = res.headers.get('cf-ray').split('-')[1]
  monitorsStateMetadata.lastUpdate = {
    loc,
    time: Date.now()
  }

  // Save monitorsState and monitorsStateMetadata to KV storage
  await setKV('monitors_data', JSON.stringify(monitorsState), monitorsStateMetadata)

  return new Response('OK')
}
