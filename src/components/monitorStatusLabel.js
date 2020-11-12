import config from '../../config.yaml'

export default function MonitorStatusLabel({ kvMonitorsMap, monitor }) {
  let labelColor = 'grey'
  let labelText = 'No data'

  if (typeof kvMonitorsMap[monitor.id] !== 'undefined') {
    if (kvMonitorsMap[monitor.id].operational) {
      labelColor = 'green'
      labelText = config.settings.monitorLabelOperational
    } else {
      labelColor = 'orange'
      labelText = config.settings.monitorLabelNotOperational
    }
  }

  return <div className={`ui ${labelColor} horizontal label`}>{labelText}</div>
}
