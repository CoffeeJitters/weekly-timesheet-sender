import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

const TimeWheelPicker = ({ value, onChange, onClose, defaultTime = null }) => {
  const [hours, setHours] = useState(8)
  const [minutes, setMinutes] = useState(0)
  const [ampm, setAmpm] = useState('AM')
  const popoverRef = useRef(null)
  const hoursRef = useRef(null)
  const minutesRef = useRef(null)
  const ampmRef = useRef(null)

  useEffect(() => {
    // Parse existing value or use default
    let parsedHours = 8
    let parsedMinutes = 0
    let parsedAmpm = 'AM'

    if (value) {
      const match = value.match(/(\d+):(\d+)\s*(AM|PM)/i)
      if (match) {
        parsedHours = parseInt(match[1])
        parsedMinutes = parseInt(match[2])
        parsedAmpm = match[3].toUpperCase()
      }
    } else if (defaultTime) {
      const match = defaultTime.match(/(\d+):(\d+)\s*(AM|PM)/i)
      if (match) {
        parsedHours = parseInt(match[1])
        parsedMinutes = parseInt(match[2])
        parsedAmpm = match[3].toUpperCase()
      }
    }

    setHours(parsedHours)
    setMinutes(parsedMinutes)
    setAmpm(parsedAmpm)

    // Auto-scroll to selected values
    setTimeout(() => {
      if (hoursRef.current) {
        const hourIndex = parsedHours - 1
        const hourElement = hoursRef.current.children[hourIndex]
        if (hourElement) {
          hourElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
      if (minutesRef.current) {
        const minuteIndex = [0, 15, 30, 45].indexOf(parsedMinutes)
        const minuteElement = minutesRef.current.children[minuteIndex]
        if (minuteElement) {
          minuteElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
      if (ampmRef.current) {
        const ampmIndex = parsedAmpm === 'AM' ? 0 : 1
        const ampmElement = ampmRef.current.children[ampmIndex]
        if (ampmElement) {
          ampmElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }, 50)

    // Handle click outside
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose()
      }
    }

    // Handle Escape key
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [value, defaultTime, onClose])

  const handleConfirm = () => {
    const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`
    onChange(formattedTime)
    onClose()
  }

  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  const minuteOptions = [0, 15, 30, 45]
  const ampmOptions = ['AM', 'PM']

  return (
    <div
      ref={popoverRef}
      className="bg-white border border-gray-300 rounded-lg shadow-lg p-4"
      style={{ minWidth: '240px' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Select Time</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X size={16} className="text-gray-600" />
        </button>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        {/* Hours Wheel */}
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1 text-center">Hours</div>
          <div 
            ref={hoursRef}
            className="border border-gray-300 rounded h-32 overflow-y-auto scroll-smooth" 
            style={{ scrollSnapType: 'y mandatory' }}
          >
            {hourOptions.map((hour) => (
              <div
                key={hour}
                onClick={() => setHours(hour)}
                className={`px-3 py-2 text-center cursor-pointer ${
                  hours === hour
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'hover:bg-gray-50'
                }`}
                style={{ scrollSnapAlign: 'start' }}
              >
                {hour}
              </div>
            ))}
          </div>
        </div>

        {/* Minutes Wheel */}
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1 text-center">Minutes</div>
          <div 
            ref={minutesRef}
            className="border border-gray-300 rounded h-32 overflow-y-auto scroll-smooth" 
            style={{ scrollSnapType: 'y mandatory' }}
          >
            {minuteOptions.map((min) => (
              <div
                key={min}
                onClick={() => setMinutes(min)}
                className={`px-3 py-2 text-center cursor-pointer ${
                  minutes === min
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'hover:bg-gray-50'
                }`}
                style={{ scrollSnapAlign: 'start' }}
              >
                {min.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>

        {/* AM/PM Wheel */}
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1 text-center">Period</div>
          <div 
            ref={ampmRef}
            className="border border-gray-300 rounded h-32 overflow-y-auto scroll-smooth" 
            style={{ scrollSnapType: 'y mandatory' }}
          >
            {ampmOptions.map((period) => (
              <div
                key={period}
                onClick={() => setAmpm(period)}
                className={`px-3 py-2 text-center cursor-pointer ${
                  ampm === period
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'hover:bg-gray-50'
                }`}
                style={{ scrollSnapAlign: 'start' }}
              >
                {period}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Confirm
        </button>
      </div>
    </div>
  )
}

export default TimeWheelPicker

