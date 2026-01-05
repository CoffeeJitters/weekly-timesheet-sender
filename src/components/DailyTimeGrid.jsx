import { useState } from 'react'
import TimeCell from './TimeCell'

const DailyTimeGrid = ({ weekEnding, onDataChange, initialData, initialRate }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  const [dailyTimes, setDailyTimes] = useState(() => {
    if (initialData) {
      return initialData
    }
    const initial = {}
    days.forEach(day => {
      initial[day] = {
        in: '',
        rest1: { in: '', out: '' },
        meal: { in: '', out: '' },
        rest2: { in: '', out: '' },
        out: ''
      }
    })
    return initial
  })

  const [ratePerHour, setRatePerHour] = useState(initialRate || 15.00)

  // Calculate hours for a single day
  const calculateDayTotal = (day) => {
    const times = dailyTimes[day]
    if (!times.in || !times.out) return 0

    // Parse times
    const parseTime = (timeStr) => {
      if (!timeStr) return null
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
      if (!match) return null
      
      let hours = parseInt(match[1])
      const minutes = parseInt(match[2])
      const period = match[3].toUpperCase()
      
      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0
      
      return hours * 60 + minutes // Return total minutes
    }

    // Calculate break duration from in/out times
    const calculateBreakDuration = (breakTimes) => {
      if (!breakTimes.in || !breakTimes.out) return 0
      const startTime = parseTime(breakTimes.in)
      const endTime = parseTime(breakTimes.out)
      if (!startTime || !endTime) return 0
      
      let duration = endTime - startTime
      // Handle case where break spans midnight (shouldn't happen but handle it)
      if (duration < 0) {
        duration += 24 * 60
      }
      return duration
    }

    const inTime = parseTime(times.in)
    const outTime = parseTime(times.out)
    
    if (!inTime || !outTime) return 0

    // Handle overnight shifts (out time is next day)
    let totalMinutes = outTime - inTime
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60 // Add 24 hours
    }

    // Deduct breaks - calculate actual durations
    totalMinutes -= calculateBreakDuration(times.rest1)
    totalMinutes -= calculateBreakDuration(times.meal)
    totalMinutes -= calculateBreakDuration(times.rest2)

    return Math.max(0, totalMinutes / 60) // Convert to hours
  }

  // Calculate grand total
  const grandTotal = days.reduce((sum, day) => sum + calculateDayTotal(day), 0)

  // Get default time based on field type
  const getDefaultTime = (breakType, subField) => {
    if (breakType === 'in') return '8:00 AM'
    if (breakType === 'out') return '5:00 PM'
    
    // Break defaults
    if (breakType === 'rest1') {
      return subField === 'in' ? '10:00 AM' : '10:15 AM'
    }
    if (breakType === 'meal') {
      return subField === 'in' ? '12:00 PM' : '12:30 PM'
    }
    if (breakType === 'rest2') {
      return subField === 'in' ? '2:00 PM' : '2:15 PM'
    }
    
    return '12:00 PM'
  }

  const handleTimeChange = (day, breakType, subField, value) => {
    setDailyTimes(prev => {
      const updated = {
        ...prev,
        [day]: {
          ...prev[day],
          [breakType]: breakType === 'in' || breakType === 'out' 
            ? value 
            : {
                ...prev[day][breakType],
                [subField]: value
              }
        }
      }
      
      // Notify parent component if callback exists
      if (onDataChange) {
        onDataChange(updated, ratePerHour)
      }
      
      return updated
    })
  }

  const handleRateChange = (value) => {
    const rate = parseFloat(value) || 0
    setRatePerHour(rate)
    if (onDataChange) {
      onDataChange(dailyTimes, rate)
    }
  }

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Daily Time Grid</h2>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <label className="text-gray-600">Rate per hour:</label>
            <input
              type="number"
              value={ratePerHour}
              onChange={(e) => handleRateChange(e.target.value)}
              step="0.01"
              min="0"
              className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Grand Total:</span>
            <span className="text-green-600 font-medium">{grandTotal.toFixed(2)} hrs</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">In</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Break 1 In</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Break 1 Out</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Meal In</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Meal Out</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Break 2 In</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Break 2 Out</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Out</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {days.map((day) => {
              const dayTotal = calculateDayTotal(day)
              return (
                <tr key={day} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{day}</td>
                  <td className="px-3 py-2">
                    <TimeCell
                      value={dailyTimes[day].in}
                      onChange={(value) => handleTimeChange(day, 'in', null, value)}
                      defaultTime={getDefaultTime('in', null)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <TimeCell
                      value={dailyTimes[day].rest1.in}
                      onChange={(value) => handleTimeChange(day, 'rest1', 'in', value)}
                      defaultTime={getDefaultTime('rest1', 'in')}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <TimeCell
                      value={dailyTimes[day].rest1.out}
                      onChange={(value) => handleTimeChange(day, 'rest1', 'out', value)}
                      defaultTime={getDefaultTime('rest1', 'out')}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <TimeCell
                      value={dailyTimes[day].meal.in}
                      onChange={(value) => handleTimeChange(day, 'meal', 'in', value)}
                      defaultTime={getDefaultTime('meal', 'in')}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <TimeCell
                      value={dailyTimes[day].meal.out}
                      onChange={(value) => handleTimeChange(day, 'meal', 'out', value)}
                      defaultTime={getDefaultTime('meal', 'out')}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <TimeCell
                      value={dailyTimes[day].rest2.in}
                      onChange={(value) => handleTimeChange(day, 'rest2', 'in', value)}
                      defaultTime={getDefaultTime('rest2', 'in')}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <TimeCell
                      value={dailyTimes[day].rest2.out}
                      onChange={(value) => handleTimeChange(day, 'rest2', 'out', value)}
                      defaultTime={getDefaultTime('rest2', 'out')}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <TimeCell
                      value={dailyTimes[day].out}
                      onChange={(value) => handleTimeChange(day, 'out', null, value)}
                      defaultTime={getDefaultTime('out', null)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={dayTotal > 0 ? dayTotal.toFixed(2) : '--'}
                      readOnly
                      className="w-full px-2 py-1 border border-gray-200 bg-gray-50 rounded text-xs text-center"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DailyTimeGrid

