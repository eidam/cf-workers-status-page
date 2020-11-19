import config from '../../config.yaml'

export default function MonitorHistogram({
  monitorId,
  kvMonitor,
}) {
  // create date and set date - daysInHistogram for the first day of the histogram
  let date = new Date()
  date.setDate(date.getDate() - config.settings.daysInHistogram)

  if (typeof window !== 'undefined') {
    return (
      <div
        key={`${monitorId}-histogram`}
        className="horizontal flex histogram"
      >
        {Array.from(Array(config.settings.daysInHistogram).keys()).map(key => {
          date.setDate(date.getDate() + 1)
          const dayInHistogram = date.toISOString().split('T')[0]

          let bg = ''
          let dayInHistogramLabel = config.settings.dayInHistogramNoData

          // filter all dates before first check, check the rest
          if (kvMonitor && kvMonitor.firstCheck <= dayInHistogram) {
            if (!kvMonitor.failedDays.includes(dayInHistogram)) {
              bg = 'green'
              dayInHistogramLabel = config.settings.dayInHistogramOperational
            } else {
              bg = 'orange'
              dayInHistogramLabel = config.settings.dayInHistogramNotOperational
            }
          }

          return (
            <div key={key} className="hitbox">
              <div
                className={`${bg} bar`}
                data-tooltip={`${dayInHistogram} - ${dayInHistogramLabel}`}
              />
            </div>
          )
        })}
      </div>
    )
  } else {
    return (
      <div
        key={`${monitorId}-histogram`}
        className="horizontal flex histogram"
      >
        <div className="grey-text">Loading histogram ...</div>
      </div>
    )
  }
}
