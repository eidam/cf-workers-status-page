import config from '../../config.yaml'

export default function MonitorHistogram({ monitorId, kvMonitor }) {
  // create date and set date - daysInHistogram for the first day of the histogram
  let date = new Date()
  date.setDate(date.getDate() - config.settings.daysInHistogram)

  let content = null

  if (typeof window !== 'undefined') {
    content = Array.from(Array(config.settings.daysInHistogram).keys()).map(
      (key) => {
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
            bg = 'yellow'
            dayInHistogramLabel = config.settings.dayInHistogramNotOperational
          }
        }

        return (
          <div key={key} className="hitbox tooltip">
            <div className={`${bg} bar`} />
            <div className="content text-center py-1 px-2 mt-2 left-1/2 -ml-20 w-40 text-xs">
              {dayInHistogram}
              <br />
              <span className="font-semibold text-sm">
                {dayInHistogramLabel}
              </span>
            </div>
          </div>
        )
      },
    )
  }

  return (
    <div
      key={`${monitorId}-histogram`}
      className="flex flex-row items-center histogram"
    >
      {content}
    </div>
  )
}
