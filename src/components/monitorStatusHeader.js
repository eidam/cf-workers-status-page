import config from '../../config.yaml'

export default function MonitorStatusHeader({ operational, lastUpdate }) {
  let backgroundColor = 'green'
  let headerText = config.settings.allmonitorsOperational
  let textColor = 'black'

  if (!operational) {
    backgroundColor = 'yellow'
    headerText = config.settings.notAllmonitorsOperational
  }

  const lastCheckAgo = Math.round((Date.now() - lastUpdate.value) / 1000)

  return (
    <div className={`ui inverted segment ${backgroundColor}`}>
      <div className="horizontal flex between">
        <div className={`ui marginless header ${textColor}-text`}>
          {headerText}
        </div>
        {
          lastUpdate.metadata && typeof window !== 'undefined' && (
          <div className={`${textColor}-text`}>
            checked {lastCheckAgo} sec ago (from {lastUpdate.metadata.loc})
          </div>
          )
        }
      </div>
    </div>
  )
}
