import config from '../../config.yaml'
import {useEffect, useState} from 'react'

export async function getMonitors() {
  const monitors = await listKV('s_')
  return monitors.keys
}

export async function getMonitorsHistory() {
  const monitorsHistory = await listKV('h_', 300)
  return monitorsHistory.keys
}

export async function getLastUpdate() {
  return await getKVWithMetadata('lastUpdate')
}

export async function listKV(prefix = '', cacheTtl = false) {
  const cacheKey = 'list_' + prefix + '_' + process.env.BUILD_ID

  if (cacheTtl) {
    const cachedResponse = await getKV(cacheKey)
    if (cachedResponse) {
      return JSON.parse(cachedResponse)
    }
  }

  let list = []
  let cursor = null
  let res = {}
  do {
    res = await KV_STATUS_PAGE.list({ prefix: prefix, cursor })
    list = list.concat(res.keys)
    cursor = res.cursor
  } while (!res.list_complete)

  if (cacheTtl) {
    await setKV(cacheKey, JSON.stringify({ keys: list }), null, cacheTtl)
  }
  return { keys: list }
}

export async function setKV(key, value, metadata, expirationTtl) {
  return KV_STATUS_PAGE.put(key, value, { metadata, expirationTtl })
}

export async function getKV(key, type = 'text') {
  return KV_STATUS_PAGE.get(key, type)
}

export async function getKVWithMetadata(key) {
  return KV_STATUS_PAGE.getWithMetadata(key)
}

export async function deleteKV(key) {
  return KV_STATUS_PAGE.delete(key)
}

export async function gcMonitors(config) {
  const checkKvPrefix = 's_'

  const monitors = config.monitors.map(key => {
    return key.id
  })

  const kvMonitors = await listKV(checkKvPrefix)
  const kvState = kvMonitors.keys.map(key => {
    return key.metadata.id
  })

  const keysForRemoval = kvState.filter(x => !monitors.includes(x))

  for (const key of keysForRemoval) {
    console.log('gc: deleting ' + checkKvPrefix + key)
    await deleteKV(checkKvPrefix + key)
  }
}

export async function notifySlack(monitor, newMetadata) {
  const payload = {
    attachments: [
      {
        color: newMetadata.operational ? '#36a64f' : '#f2c744',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Monitor *${monitor.name}* changed status to *${
                newMetadata.operational
                  ? config.settings.monitorLabelOperational
                  : config.settings.monitorLabelNotOperational
              }*`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `${
                  newMetadata.operational ? ':white_check_mark:' : ':x:'
                } \`${monitor.method ? monitor.method : "GET"} ${monitor.url}\` - :eyes: <${
                  config.settings.url
                }|Status Page>`,
              },
            ],
          },
        ],
      },
    ],
  }
  return fetch(SECRET_SLACK_WEBHOOK_URL, {
    body: JSON.stringify(payload),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

export function useKeyPress(targetKey) {
  const [keyPressed, setKeyPressed] = useState(false)

  function downHandler({ key }) {
    if (key === targetKey) {
      setKeyPressed(true);
    }
  }

  const upHandler = ({ key }) => {
    if (key === targetKey) {
      setKeyPressed(false);
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [])

  return keyPressed
}
