import config from '../../config.yaml'
import { Database } from '../d1'

import {
  getCheckLocation,
  getMonitors,
} from './helpers'

function getDate() {
  return new Date().toISOString().split('T')[0]
}

export async function processCronTrigger(event) {
  // Get Worker PoP and save it to monitorsStateMetadata
  const checkLocation = await getCheckLocation()
  const checkDay = getDate()

  const db = new Database(D1UNSAFE)

  const monitors = await getMonitors()
  let statements = []
  const updateMonitorStatement = db.prepare('UPDATE monitors SET operational = ?2, last_updated = ?3 WHERE id = ?1')
  const insertCheckStatement = db.prepare('INSERT INTO monitors_checks (monitor_id, location, res_ms, operational, date, timestamp) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')

  for (const monitor of monitors) {
    // Create default monitor state if does not exist yet
    console.log(`Checking ${monitor.name} ...`)

    // Fetch the monitors URL
    const init = {
      method: monitor.method || 'GET',
      redirect: monitor.follow_redirect ? 'follow' : 'manual',
      headers: {
        'User-Agent': config.settings.user_agent || 'cf-worker-status-page',
      },
    }

    // Perform a check and measure time
    const requestStartTime = Date.now()
    const checkResponse = await fetch(monitor.url, init)
    const requestTime = Math.round(Date.now() - requestStartTime)

    // Determine whether operational and status changed
    const monitorOperational =
      checkResponse.status === (monitor.expect_status || 200) ? 1 : 0
    
      statements.push(
        insertCheckStatement.bind( monitor.id, checkLocation, requestTime, monitorOperational, checkDay, new Date().toISOString()),
        updateMonitorStatement.bind( monitor.id, monitorOperational, new Date().toISOString())
      )
  }

  const test = await db.batch(statements)

  return new Response(JSON.stringify(test))
}
