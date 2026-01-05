import { useState, useRef, useEffect } from 'react'
import TimeWheelPicker from './TimeWheelPicker'

const TimeCell = ({ value, onChange, defaultTime = null }) => {
  const [isOpen, setIsOpen] = useState(false)
  const cellRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cellRef.current && !cellRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={cellRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-left focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-gray-400 bg-white"
      >
        {value || '--:--'}
      </button>
      {isOpen && (
        <div className="absolute z-50" style={{ left: 0, top: '100%', marginTop: '4px' }}>
          <TimeWheelPicker
            value={value}
            onChange={onChange}
            onClose={() => setIsOpen(false)}
            defaultTime={defaultTime}
          />
        </div>
      )}
    </div>
  )
}

export default TimeCell

