import config from '../../config.yaml'
import { useEffect, useState } from 'react'

const kvDataKey = 'monitors_data_v1_1'

export async function getKVMonitors() {
  // trying both to see performance difference
  return KV_STATUS_PAGE.get(kvDataKey, 'json')
  //return JSON.parse(await KV_STATUS_PAGE.get(kvDataKey, 'text'))
}

export async function setKVMonitors(data) {
  return setKV(kvDataKey, JSON.stringify(data))
}

const getOperationalLabel = (operational) => {
  return operational
    ? config.settings.monitorLabelOperational
    : config.settings.monitorLabelNotOperational
}

export async function setKV(key, value, metadata, expirationTtl) {
  return KV_STATUS_PAGE.put(key, value, { metadata, expirationTtl })
}

export async function notifySlack(monitor, operational) {
  const payload = {
    attachments: [
      {
        fallback: `Monitor ${monitor.name} changed status to ${getOperationalLabel(operational)}`,
        color: operational ? '#36a64f' : '#f2c744',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Monitor *${
                monitor.name
              }* changed status to *${getOperationalLabel(operational)}*`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `${operational ? ':white_check_mark:' : ':x:'} \`${
                  monitor.method ? monitor.method : 'GET'
                } ${monitor.url}\` - :eyes: <${
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

export async function notifyTelegram(monitor, operational) {
  const text = `Monitor *${monitor.name.replaceAll(
    '-',
    '\\-',
  )}* changed status to *${getOperationalLabel(operational)}*
  ${operational ? '✅' : '❌'} \`${monitor.method ? monitor.method : 'GET'} ${
    monitor.url
  }\` \\- 👀 [Status Page](${config.settings.url})`

  const payload = new FormData()
  payload.append('chat_id', SECRET_TELEGRAM_CHAT_ID)
  payload.append('parse_mode', 'MarkdownV2')
  payload.append('text', text)

  const telegramUrl = `https://api.telegram.org/bot${SECRET_TELEGRAM_API_TOKEN}/sendMessage`
  return fetch(telegramUrl, {
    body: payload,
    method: 'POST',
  })
}

// Visualize your payload using https://leovoel.github.io/embed-visualizer/
export async function notifyDiscord(monitor, operational) {
  const payload = {
    username: `${config.settings.title}`,
    avatar_url: `${config.settings.url}/${config.settings.logo}`,
    embeds: [
      {
        title: `${monitor.name} is ${getOperationalLabel(operational)} ${
          operational ? ':white_check_mark:' : ':x:'
        }`,
        description: `\`${monitor.method ? monitor.method : 'GET'} ${
          monitor.url
        }\` - :eyes: [Status Page](${config.settings.url})`,
        color: operational ? 3581519 : 13632027,
      },
    ],
  }
  return fetch(SECRET_DISCORD_WEBHOOK_URL, {
    body: JSON.stringify(payload),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

export function useKeyPress(targetKey) {
  const [keyPressed, setKeyPressed] = useState(false)

  function downHandler({ key }) {
    if (key === targetKey) {
      setKeyPressed(true)
    }
  }

  const upHandler = ({ key }) => {
    if (key === targetKey) {
      setKeyPressed(false)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', downHandler)
    window.addEventListener('keyup', upHandler)

    return () => {
      window.removeEventListener('keydown', downHandler)
      window.removeEventListener('keyup', upHandler)
    }
  }, [])

  return keyPressed
}

export async function getCheckLocation() {
  const res = await fetch('https://cloudflare-dns.com/dns-query', {
    method: 'OPTIONS',
  })
  return res.headers.get('cf-ray').split('-')[1]
}
