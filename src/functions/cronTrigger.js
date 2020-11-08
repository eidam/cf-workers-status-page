import config from '../../config.yaml'

import { setKV, getKV, getKVWithMetadata, gcMonitors } from './helpers'

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

    const response = await fetch(monitor.url, init)
    const monitorOperational = response.status === (monitor.expectStatus || 200)
    const kvMonitor = await getKVWithMetadata('s_' + monitor.id)

    // metadata from monitor settings
    const metadata = {
      operational: monitorOperational,
      statusCode: response.status,
      id: monitor.id,
    }

    // write current status if status changed or for first time
    if (
      !kvMonitor.metadata ||
      kvMonitor.metadata.operational !== monitorOperational
    ) {
      console.log('saving new results..')

      if (typeof SECRET_SLACK_WEBHOOK !== 'undefined') {
        await notifySlack(metadata)
      }

      await setKV('s_' + monitor.id, null, metadata)
    }

    // check day status, write only on not operational or for first time
    const kvDayStatusKey =
      'h_' + monitor.id + '_' + new Date().toISOString().split('T')[0]
    //console.log(kvDayStatusKey)
    const kvDayStatus = await getKV(kvDayStatusKey)

    if (!kvDayStatus || (kvDayStatus && !monitorOperational)) {
      await setKV(kvDayStatusKey, null, metadata)
    }

    await setKV('lastUpdate', Date.now())
  }
  await gcMonitors(config)

  return new Response('OK')
}
