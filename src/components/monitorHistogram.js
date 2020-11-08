import config from '../../config.yaml'

export default function MonitorHistogram({ kvMonitorsDaysMap, monitor }) {
  let date = new Date()
  date.setDate(date.getDate() - config.settings.daysInHistory)

  if (typeof window !== 'undefined') {
    return (
      <div
        key={`${monitor.id}-histogram`}
        className="horizontal flex histogram"
      >
        {Array.from(Array(config.settings.daysInHistory).keys()).map(key => {
          date.setDate(date.getDate() + 1)
          const dayInHistory = date.toISOString().split('T')[0]
          const dayInHistoryKey = 'h_' + monitor.id + '_' + dayInHistory

          let bg = ''
          let dayInHistoryStatus = 'No data'

          if (typeof kvMonitorsDaysMap[dayInHistoryKey] !== 'undefined') {
            bg = kvMonitorsDaysMap[dayInHistoryKey] ? 'green' : 'orange'
            dayInHistoryStatus = kvMonitorsDaysMap[dayInHistoryKey]
              ? 'No outages'
              : 'Some outages'
          }

          return (
            <div key={key} className="hitbox">
              <div
                className={`${bg} bar`}
                data-tooltip={`${dayInHistory} - ${dayInHistoryStatus}`}
              />
            </div>
          )
        })}
      </div>
    )
  } else {
    return (
      <div
        key={`${monitor.id}-histogram`}
        className="horizontal flex histogram"
      >
        <div className="grey-text">Loading histogram ...</div>
      </div>
    )
  }
}
