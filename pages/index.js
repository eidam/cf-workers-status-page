import Head from 'flareact/head'
import MonitorHistogram from '../src/components/monitorHistogram'

import {
  getLastUpdate,
  getMonitors,
  getMonitorsHistory,
} from '../src/functions/helpers'

import config from '../config.yaml'
import MonitorStatusLabel from '../src/components/monitorStatusLabel'

export async function getEdgeProps() {
  // get KV data
  const kvMonitors = await getMonitors()
  const kvMonitorsFailedDays = await getMonitorsHistory()
  const kvLastUpdate = await getLastUpdate()

  // prepare data maps for components
  let monitorsOperational = true
  let kvMonitorsMap = {}
  kvMonitors.forEach(x => {
    kvMonitorsMap[x.metadata.id] = x.metadata
    if (x.metadata.operational === false) monitorsOperational = false
  })

  // transform KV list to array of failed days
  const kvMonitorsFailedDaysArray = kvMonitorsFailedDays.map(x => {
    return x.name
  })

  return {
    props: {
      config,
      kvMonitorsMap,
      kvMonitorsFailedDaysArray,
      monitorsOperational,
      kvLastUpdate,
    },
    // Revalidate these props once every x seconds
    revalidate: 5,
  }
}

export default function Index({
  config,
  kvMonitorsMap,
  kvMonitorsFailedDaysArray,
  monitorsOperational,
  kvLastUpdate,
}) {
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
        <h1 className="ui huge header">
          <img
            className="ui middle aligned tiny image"
            src={config.settings.logo}
          />
          {config.settings.title}
        </h1>
        <div
          className={`ui inverted segment ${
            monitorsOperational ? 'green' : 'yellow'
          }`}
        >
          <div className="horizontal flex between">
            <div className="ui marginless header black-text">
              {monitorsOperational
                ? config.settings.allmonitorsOperational
                : config.settings.notAllmonitorsOperational}
            </div>
            {typeof window !== 'undefined' ? (
              <div className="black-text">
                checked {Math.round((Date.now() - kvLastUpdate) / 1000)} sec ago
              </div>
            ) : (
              ''
            )}
          </div>
        </div>
        {config.monitors.map((monitor, key) => {
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
                  kvMonitorsMap={kvMonitorsMap}
                  monitor={monitor}
                />
              </div>

              <MonitorHistogram
                kvMonitorsFailedDaysArray={kvMonitorsFailedDaysArray}
                monitor={monitor}
                kvMonitor={kvMonitorsMap[monitor.id]}
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
