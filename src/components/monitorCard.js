import config from '../../config.yaml'
import MonitorStatusLabel from './monitorStatusLabel'
import MonitorHistogram from './monitorHistogram'

const infoIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-5 mr-2 mx-auto text-blue-500 dark:text-blue-400"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
)

export default function MonitorCard({ key, monitor, data }) {
  return (
    <div key={key} className="card">
      <div className="flex flex-row justify-between items-center mb-2">
        <div className="flex flex-row items-center align-center">
          {monitor.description && (
            <div className="tooltip">
              {infoIcon}
              <div className="content text-center transform -translate-y-1/2 top-1/2 ml-8 w-72 text-sm object-left">
                {monitor.description}
              </div>
            </div>
          )}
          {(monitor.linkable === true || monitor.linkable === undefined) ?
            (
              <a href={monitor.url} target="_blank">
                <div className="text-xl">{monitor.name}</div>
              </a>
            )
            :
            (
              <span>
                <div className="text-xl">{monitor.name}</div>
              </span>
            )
          }

        </div>
        <MonitorStatusLabel kvMonitor={data} />
      </div>

      <MonitorHistogram monitorId={monitor.id} kvMonitor={data} />

      <div className="flex flex-row justify-between items-center text-gray-400 text-sm">
        <div>{config.settings.daysInHistogram} days ago</div>
        <div>Today</div>
      </div>
    </div>
  )
}
