import config from '../../config.yaml'

export default function MonitorStatusLabel({ kvMonitor }) {
  let labelColor = 'grey'
  let labelText = 'No data'

  if (typeof kvMonitor !== 'undefined') {
    if (kvMonitor.operational) {
      labelColor = 'green'
      labelText = config.settings.monitorLabelOperational
    } else {
      labelColor = 'orange'
      labelText = config.settings.monitorLabelNotOperational
    }
  }

  return <div className={`ui ${labelColor} horizontal label`}>{labelText}</div>
}
