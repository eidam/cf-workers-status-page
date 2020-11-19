import config from '../../config.yaml'
import {useEffect, useState} from 'react'

export async function getMonitors() {
  return await getKVWithMetadata('monitors_data', "json")
}

export async function setKV(key, value, metadata, expirationTtl) {
  return KV_STATUS_PAGE.put(key, value, { metadata, expirationTtl })
}

export async function getKVWithMetadata(key, type = 'text') {
  return KV_STATUS_PAGE.getWithMetadata(key, type)
}

export async function notifySlack(monitor, operational) {
  const payload = {
    attachments: [
      {
        color: operational ? '#36a64f' : '#f2c744',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Monitor *${monitor.name}* changed status to *${
                operational
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
                  operational ? ':white_check_mark:' : ':x:'
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
