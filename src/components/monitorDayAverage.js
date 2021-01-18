import { locations } from '../functions/helpers'

export default function MonitorDayAverage({ location, avg }) {
  return (
    <>
      <br />
      <small>
        {locations[location] || location}: {avg}ms
      </small>
    </>
  )
}
