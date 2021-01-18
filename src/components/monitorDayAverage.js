const locations = {
  WAW: 'Warsaw',
  SCL: 'Santiago de Chile',
  MEL: 'Melbourne',
  SIN: 'Singapore',
}

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
