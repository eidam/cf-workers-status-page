import config from '../../config.yaml'

export default function MonitorStatusHeader({kvMonitorsMetadata}) {
  let backgroundColor = 'green'
  let headerText = config.settings.allmonitorsOperational
  let textColor = 'black'

  if (!kvMonitorsMetadata.monitorsOperational) {
    backgroundColor = 'yellow'
    headerText = config.settings.notAllmonitorsOperational
  }

  return (
    <div className={`ui inverted segment ${backgroundColor}`}>
      <div className="horizontal flex between">
        <div className={`ui marginless header ${textColor}-text`}>
          {headerText}
        </div>
        {
          kvMonitorsMetadata.lastUpdate && typeof window !== 'undefined' && (
          <div className={`${textColor}-text`}>
            checked {Math.round((Date.now() - kvMonitorsMetadata.lastUpdate.time) / 1000)} sec ago (from {kvMonitorsMetadata.lastUpdate.loc})
          </div>
          )
        }
      </div>
    </div>
  )
}
