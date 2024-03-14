import config from '../../config.yaml'
import {
  notifySlack,
  notifyTelegram,
  getCheckLocation,
  getKVMonitors,
  setKVMonitors,
  notifyDiscord,
} from './helpers'

function getDate() {
  return new Date().toISOString().split('T')[0]
}

async function checkMonitorStatus(monitor, init) {
  const requestStartTime = Date.now()
  const checkResponse = await fetch(monitor.url, init)
  const requestTime = Math.round(Date.now() - requestStartTime)
  const operational = checkResponse.status === (monitor.expectStatus || 200)
  return {
    operational,
    requestTime,
    status: checkResponse.status,
    statusText: checkResponse.statusText,
  }
}

async function sendNotifications(
  event,
  monitor,
  monitorOperational,
  monitorStatusChanged,
) {
  if (monitorStatusChanged) {
    const shouldNotifySlack =
      typeof SECRET_SLACK_WEBHOOK_URL !== 'undefined' &&
      SECRET_SLACK_WEBHOOK_URL !== 'default-gh-action-secret'
    if (shouldNotifySlack) {
      event.waitUntil(notifySlack(monitor, monitorOperational))
    }

    const shouldNotifyTelegram =
      typeof SECRET_TELEGRAM_API_TOKEN !== 'undefined' &&
      SECRET_TELEGRAM_API_TOKEN !== 'default-gh-action-secret'
    if (shouldNotifyTelegram) {
      event.waitUntil(notifyTelegram(monitor, monitorOperational))
    }

    const shouldNotifyDiscord =
      typeof SECRET_DISCORD_WEBHOOK_URL !== 'undefined' &&
      SECRET_DISCORD_WEBHOOK_URL !== 'default-gh-action-secret'
    if (shouldNotifyDiscord) {
      event.waitUntil(notifyDiscord(monitor, monitorOperational))
    }
  }
}

function updateMonitorState(
  monitorsState,
  monitor,
  operational,
  status,
  statusText,
  checkDay,
  requestTime,
  checkLocation,
) {
  let stateChanged = false
  const monitorState = monitorsState.monitors[monitor.id]
  if (monitorState.lastCheck.operational !== operational) {
    monitorState.lastCheck = { status, statusText, operational }
    stateChanged = true
  }
  if (config.settings.collectResponseTimes && operational) {
    if (!monitorState.checks[checkDay]) {
      monitorState.checks[checkDay] = { fails: 0, res: {} }
      stateChanged = true
    }
    if (!monitorState.checks[checkDay].res[checkLocation]) {
      monitorState.checks[checkDay].res[checkLocation] = { n: 0, ms: 0, a: 0 }
    }
    const locData = monitorState.checks[checkDay].res[checkLocation]
    locData.n++
    locData.ms += requestTime
    locData.a = Math.round(locData.ms / locData.n)
    // stateChanged = true
  } else if (!operational) {
    if (!monitorState.checks[checkDay]) {
      monitorState.checks[checkDay] = { fails: 1, res: {} }
      stateChanged = true
    } else if (monitorState.checks[checkDay].fails === 0 || stateChanged) {
      monitorState.checks[checkDay].fails++
      stateChanged = true
    }
  }

  // Returning the possibly updated monitorsState
  return { updated: stateChanged, monitorsState }
}

export async function processCronTrigger(event) {
  const checkLocation = await getCheckLocation()
  const checkDay = getDate()
  let monitorsState = (await getKVMonitors()) || {
    lastUpdate: { time: 0 },
    monitors: {},
  }
  let isUpdateRequired = false

  const now = Date.now()
  const cooldownMinutes = (config.settings.kvWriteCooldownMinutes || 60) * 60000
  if (now - monitorsState.lastUpdate.time > cooldownMinutes) {
    isUpdateRequired = true
  }

  for (const monitor of config.monitors) {
    const init = {
      method: monitor.method || 'GET',
      headers: {
        'User-Agent': config.settings.user_agent || 'cf-worker-status-page',
      },
      redirect: monitor.followRedirect ? 'follow' : 'manual',
    }
    const {
      operational,
      requestTime,
      status,
      statusText,
    } = await checkMonitorStatus(monitor, init)
    const monitorOperational = operational // This was not defined previously, assuming it's the result of the operational check.
    const monitorStatusChanged =
      monitorsState.monitors[monitor.id]?.lastCheck?.operational !==
      monitorOperational

    if (!monitorsState.monitors[monitor.id]) {
      monitorsState.monitors[monitor.id] = {
        firstCheck: checkDay,
        lastCheck: {},
        checks: {},
      }
      isUpdateRequired = true
    }

    const updateResult = updateMonitorState(
      monitorsState,
      monitor,
      operational,
      status,
      statusText,
      checkDay,
      requestTime,
      checkLocation,
    )

    monitorsState = updateResult.monitorsState
    isUpdateRequired = isUpdateRequired || updateResult.updated

    try {
      await sendNotifications(event, monitor, operational, monitorStatusChanged)
    } catch (e) {
      console.error('Failed to send notifications', e)
    }
  }

  if (isUpdateRequired) {
    monitorsState.lastUpdate.time = now
    monitorsState.lastUpdate.loc = checkLocation
    await setKVMonitors(monitorsState)
  } else {
    console.log('Skipping write status to KV!')
  }

  return new Response('OK', { status: 200 })
}
