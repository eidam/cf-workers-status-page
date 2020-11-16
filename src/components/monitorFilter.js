import config from '../../config.yaml'
import { useState } from 'react'

export default function MonitorFilter({ active, callback }) {
  const [input, setInput] = useState('')

  const handleInput = (event) => {
    // ignore focus trigger
    if (event.target.value === '/') {
      return
    }
    setInput(event.target.value)
    callback(event.target.value)
  }

  const handleKeyDown = (event) => {
    // blur input field on escape
    if (event.keyCode === 27) {
      event.target.blur()
    }
  }

  return (
    <div className="ui search">
      <div className="ui icon input">
        <input
          className="prompt"
          type="text"
          value={input}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Tap '/' to search"
          tabIndex={0}
          ref={
            (e) => e && active && e.focus()
          }
        />
        <i className="search icon"></i>
      </div>
    </div>
  )
}
