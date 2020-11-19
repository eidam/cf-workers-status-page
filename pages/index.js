import Head from 'flareact/head'
import MonitorHistogram from '../src/components/monitorHistogram'

import {
  getMonitors,
  useKeyPress,
} from '../src/functions/helpers'

import config from '../config.yaml'
import MonitorStatusLabel from '../src/components/monitorStatusLabel'
import MonitorStatusHeader from '../src/components/monitorStatusHeader'
import MonitorFilter from '../src/components/monitorFilter'

import { Store } from 'laco'
import { useStore } from 'laco-react'

const MonitorStore = new Store(
  {
    monitors: config.monitors,
    visible: config.monitors,
    activeFilter: false
  }
)

const filterByTerm = (term) => MonitorStore.set(
  state => ({ visible: state.monitors.filter((monitor) => monitor.name.toLowerCase().includes(term)) })
)

export async function getEdgeProps() {
  // get KV data
  const {value: kvMonitors, metadata: kvMonitorsMetadata } = await getMonitors()

  return {
    props: {
      config,
      kvMonitors: kvMonitors || {},
      kvMonitorsMetadata: kvMonitorsMetadata || {}
    },
    // Revalidate these props once every x seconds
    revalidate: 5,
  }
}

export default function Index({
  config,
  kvMonitors,
  kvMonitorsMetadata,
}) {
  const state = useStore(MonitorStore)
  const slash = useKeyPress('/')

  return (
    <div>
      <Head>
        <title>{config.settings.title}</title>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/fomantic-ui/2.8.7/semantic.min.css"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="./main.css" />
      </Head>
      <div className="ui basic segment container">
        <div className="horizontal flex between">
          <h1 className="ui huge marginless title header">
            <img
              className="ui middle aligned tiny image"
              src={config.settings.logo}
            />
            {config.settings.title}
          </h1>
          <MonitorFilter
            active={slash}
            callback={filterByTerm}
          />
        </div>
        <MonitorStatusHeader
          kvMonitorsMetadata={kvMonitorsMetadata}
        />
        {state.visible.map((monitor, key) => {
          return (
            <div key={key} className="ui segment">
              <div
                className="ui horizontal flex between"
                style={{ marginBottom: '8px' }}
              >
                <div className="ui marginless header">
                  {monitor.description && (
                    <span data-tooltip={monitor.description}>
                      <i className="blue small info circle icon" />
                    </span>
                  )}
                  <div className="content">{monitor.name}</div>
                </div>
                <MonitorStatusLabel
                  kvMonitor={kvMonitors[monitor.id]}
                />
              </div>

              <MonitorHistogram
                monitorId={monitor.id}
                kvMonitor={kvMonitors[monitor.id]}
              />

              <div className="horizontal flex between grey-text">
                <div>{config.settings.daysInHistogram} days ago</div>
                <div>Today</div>
              </div>
            </div>
          )
        })}
        <div className="horizontal flex between grey-text">
          <div>
            Powered by{' '}
            <a href="https://workers.cloudflare.com/" target="_blank">
              Cloudflare Workers{' '}
            </a>
            &{' '}
            <a href="https://flareact.com/" target="_blank">
              Flareact{' '}
            </a>
          </div>
          <div>
            <a
              href="https://github.com/eidam/cf-workers-status-page"
              target="_blank"
            >
              Get Your Status Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
