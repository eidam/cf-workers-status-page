export default function MonitorStatusLabel({ kvMonitorsMap, monitor }) {
  let labelColor = 'grey'
  let labelText = 'No data'

  if (typeof kvMonitorsMap[monitor.id] !== 'undefined') {
    if (kvMonitorsMap[monitor.id].operational) {
      labelColor = 'green'
      labelText = 'Operational'
    } else {
      labelColor = 'orange'
      labelText = 'Not great not terrible'
    }
  }

  return <div className={`ui ${labelColor} horizontal label`}>{labelText}</div>
}
