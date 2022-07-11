import config from '../../config.yaml'
import { locations } from '../functions/locations'

const classes = {
  green:
    'bg-green-200 text-green-700 dark:bg-green-700 dark:text-green-200 border-green-300 dark:border-green-600',
  yellow:
    'bg-yellow-200 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600',
}

export default function MonitorStatusHeader({ monitors }) {
  let color = 'green'
  let text = config.settings.allmonitorsOperational

  if (monitors.find(x => !x.operational)) {
    color = 'yellow'
    text = config.settings.notAllmonitorsOperational
  }

  const updates = monitors.map(m => {
    return new Date(m.last_updated).getTime();
  });

  const lastUpdated = Math.max(...updates);

  return (
    <div className={`card mb-4 font-semibold ${classes[color]}`}>
      <div className="flex flex-row justify-between items-center">
        <div>{text}</div>
        {lastUpdated && typeof window !== 'undefined' && (
          <div className="text-xs font-light">
            checked{' '}
            {Math.round((Date.now() - lastUpdated) / 1000)} sec
            ago
          </div>
        )}
      </div>
    </div>
  )
}
