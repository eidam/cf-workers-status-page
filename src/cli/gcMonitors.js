const yaml = require('yaml-loader')
const fetch = require('node-fetch')
const fs = require('fs')

const accountId = process.env.CF_ACCOUNT_ID
const namespaceId = process.env.KV_NAMESPACE_ID
const apiToken = process.env.CF_API_TOKEN

const kvPrefix = 's_'

if (!accountId || !namespaceId || !apiToken) {
  console.error(
    'Missing required environment variables: CF_ACCOUNT_ID, KV_NAMESPACE_ID, CF_API_TOKEN',
  )
  process.exit(0)
}

async function getKvMonitors(kvPrefix) {
  const init = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys?limit=100&prefix=${kvPrefix}`,
    init,
  )
  const json = await res.json()
  return json.result
}

async function deleteKvBulk(keys) {
  const init = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    method: 'DELETE',
    body: JSON.stringify(keys),
  }

  return await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/bulk`,
    init,
  )
}

function loadConfig() {
  const configFile = fs.readFileSync('./config.yaml', 'utf8')
  const config = yaml(configFile)
  return JSON.parse(config)
}

getKvMonitors(kvPrefix)
  .then(async (kvMonitors) => {
    const config = loadConfig()
    const monitors = config.monitors.map((key) => {
      return key.id
    })
    const kvState = kvMonitors.map((key) => {
      return key.name
    })
    const keysForRemoval = kvState.filter(
      (x) => !monitors.includes(x.replace(kvPrefix, '')),
    )

    if (keysForRemoval.length > 0) {
      console.log(
        `Removing following keys from KV storage as they are no longer in the config: ${keysForRemoval.join(
          ', ',
        )}`,
      )
      await deleteKvBulk(keysForRemoval)
    }
  })
  .catch((e) => console.log(e))
