import config from '../../config.yaml'

export default function MonitorHistogram({
  kvMonitorsFailedDaysArray,
  monitor,
  kvMonitor,
}) {
  // create date and set date - daysInHistogram for the first day of the histogram
  let date = new Date()
  date.setDate(date.getDate() - config.settings.daysInHistogram)

  if (typeof window !== 'undefined') {
    return (
      <div
        key={`${monitor.id}-histogram`}
        className="horizontal flex histogram"
      >
        {Array.from(Array(config.settings.daysInHistogram + 1).keys()).map(key => {
          date.setDate(date.getDate() + 1)
          const dayInHistory = date.toISOString().split('T')[0]
          const dayInHistoryKey = 'h_' + monitor.id + '_' + dayInHistory

          let bg = ''
          let dayInHistoryStatus = 'No data'

          // filter all dates before first check, check the rest
          if (kvMonitor && kvMonitor.firstCheck <= dayInHistory) {
            if (!kvMonitorsFailedDaysArray.includes(dayInHistoryKey)) {
              bg = 'green'
              dayInHistoryStatus = 'No outage recorded'
            } else {
              bg = 'orange'
              dayInHistoryStatus = 'Some outages'
            }
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
