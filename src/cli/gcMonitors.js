const yaml = require('yaml-loader')
const fetch = require('node-fetch')
const fs = require('fs')

const accountId = process.env.CF_ACCOUNT_ID
const namespaceId = process.env.KV_NAMESPACE_ID
const apiToken = process.env.CF_API_TOKEN

const kvMonitorsKey = 'monitors_data_v1_1'

if (!accountId || !namespaceId || !apiToken) {
  console.error(
    'Missing required environment variables: CF_ACCOUNT_ID, KV_NAMESPACE_ID, CF_API_TOKEN',
  )
  process.exit(0)
}

async function getKvMonitors(kvMonitorsKey) {
  const init = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${kvMonitorsKey}`,
    init,
  )
  const json = await res.json()
  return json
}

async function saveKVMonitors(kvMonitorsKey, data) {
  const init = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(data),
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${kvMonitorsKey}`,
    init,
  )

  return res
}

function loadConfig() {
  const configFile = fs.readFileSync('./config.yaml', 'utf8')
  const config = yaml(configFile)
  return JSON.parse(config)
}

getKvMonitors(kvMonitorsKey)
  .then(async (kvMonitors) => {
    let stateMonitors = kvMonitors

    const config = loadConfig()
    const configMonitors = config.monitors.map((key) => {
      return key.id
    })

    Object.keys(stateMonitors.monitors).map((monitor) => {
      // remove monitor data from state if missing in config
      if (!configMonitors.includes(monitor)) {
        delete stateMonitors.monitors[monitor]
      }

      // delete dates older than config.settings.daysInHistogram
      let date = new Date()
      date.setDate(date.getDate() - config.settings.daysInHistogram)
      date.toISOString().split('T')[0]
      const cleanUpDate = date.toISOString().split('T')[0]

      Object.keys(stateMonitors.monitors[monitor].checks).map((checkDay) => {
        if (checkDay < cleanUpDate) {
          delete stateMonitors.monitors[monitor].checks[checkDay]
        }
      })
    })

    // sanity check + if good save the KV
    if (configMonitors.length === Object.keys(stateMonitors.monitors).length) {
      await saveKVMonitors(kvMonitorsKey, stateMonitors)
    }
  })
  .catch((e) => console.log(e))
