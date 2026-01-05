import { useState } from 'react'
import { 
  Plus, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  FileText, 
  Copy, 
  Trash2, 
  X, 
  Calendar,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import jsPDF from 'jspdf'
import DailyTimeGrid from './components/DailyTimeGrid'

// Seeded timesheet data
const initialTimesheets = []

const jobCodes = ['Framing', 'Electrical', 'Plumbing', 'Flooring', 'Roofing', 'Drywall', 'Painting']

function App() {
  const [timesheets, setTimesheets] = useState(initialTimesheets)
  const [currentView, setCurrentView] = useState('list') // 'list', 'modal', 'detail'
  const [selectedTimesheet, setSelectedTimesheet] = useState(null)
  const [showImportDropdown, setShowImportDropdown] = useState(false)
  
  const formatDate = (dateString) => {
    if (!dateString) return ''
    // Parse date string (YYYY-MM-DD) to avoid timezone issues
    const parts = dateString.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0])
      const month = parseInt(parts[1]) - 1 // Month is 0-indexed
      const day = parseInt(parts[2])
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${months[month]} ${day}, ${year}`
    }
    // Fallback to original method if format is different
    const date = new Date(dateString)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }

  const getClosestThursday = () => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, ..., 4 = Thursday, 5 = Friday, 6 = Saturday
    
    let daysToAdd = 0
    if (dayOfWeek <= 4) {
      // Sunday through Thursday: add days to get to Thursday
      daysToAdd = 4 - dayOfWeek
    } else {
      // Friday or Saturday: add days to get to next Thursday
      daysToAdd = 4 + (7 - dayOfWeek)
    }
    
    const thursday = new Date(today)
    thursday.setDate(today.getDate() + daysToAdd)
    
    // Return in YYYY-MM-DD format for HTML date input
    const year = thursday.getFullYear()
    const month = String(thursday.getMonth() + 1).padStart(2, '0')
    const day = String(thursday.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // Modal form state
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeId: '',
    foremanName: '',
    weekEnding: getClosestThursday()
  })

  const handleNewEntry = () => {
    setCurrentView('modal')
    setFormData({
      employeeName: '',
      employeeId: '',
      foremanName: '',
      weekEnding: getClosestThursday()
    })
  }

  const handleCreateTimesheet = () => {
    const newTimesheet = {
      id: timesheets.length + 1,
      employeeName: formData.employeeName,
      employeeId: formData.employeeId,
      foremanName: formData.foremanName,
      weekEnding: formData.weekEnding,
      lastEdited: 'Today',
      status: 'Draft',
      lineItems: [],
      notes: '',
      foremanSignature: '',
      signatureDate: new Date().toISOString().split('T')[0],
      employeeSignature: '',
      employeeSignatureDate: new Date().toISOString().split('T')[0],
      dailyTimeGrid: null,
      ratePerHour: 15.00
    }
    setTimesheets([newTimesheet, ...timesheets])
    setSelectedTimesheet(newTimesheet)
    setCurrentView('detail')
  }

  const handleEdit = (timesheet) => {
    setSelectedTimesheet(timesheet)
    setCurrentView('detail')
  }

  const handleSaveDraft = () => {
    if (selectedTimesheet) {
      const updated = { ...selectedTimesheet, lastEdited: 'Today' }
      setTimesheets(timesheets.map(t => 
        t.id === selectedTimesheet.id ? updated : t
      ))
      setSelectedTimesheet(updated)
    }
  }

  const handleExportPDF = () => {
    if (!selectedTimesheet) return
    
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 14
    const tableStartX = margin
    const tableEndX = pageWidth - margin
    let yPos = 20
    
    // Header Section
    doc.setFontSize(20)
    doc.setFont(undefined, 'bold')
    doc.text('Weekly Timesheet', pageWidth / 2, yPos, { align: 'center' })
    yPos += 15
    
    // Timesheet Details Table
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    const detailsY = yPos
    const detailsHeight = 20
    
    // Draw details table border
    doc.rect(tableStartX, detailsY - 5, tableEndX - tableStartX, detailsHeight)
    
    // Details content
    doc.setFont(undefined, 'bold')
    doc.text('Employee Name:', tableStartX + 2, detailsY + 2)
    doc.setFont(undefined, 'normal')
    doc.text(selectedTimesheet.employeeName || 'N/A', tableStartX + 35, detailsY + 2)
    
    doc.setFont(undefined, 'bold')
    doc.text('Employee ID:', tableStartX + 2, detailsY + 8)
    doc.setFont(undefined, 'normal')
    doc.text(selectedTimesheet.employeeId || 'N/A', tableStartX + 35, detailsY + 8)
    
    doc.setFont(undefined, 'bold')
    doc.text('Foreman:', tableStartX + 2, detailsY + 14)
    doc.setFont(undefined, 'normal')
    doc.text(selectedTimesheet.foremanName || 'N/A', tableStartX + 35, detailsY + 14)
    
    doc.setFont(undefined, 'bold')
    doc.text('Week Ending:', tableStartX + 100, detailsY + 2)
    doc.setFont(undefined, 'normal')
    doc.text(formatDate(selectedTimesheet.weekEnding), tableStartX + 135, detailsY + 2)
    
    yPos = detailsY + detailsHeight + 10
    
    // Line Items Table
    if (selectedTimesheet.lineItems && selectedTimesheet.lineItems.length > 0) {
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('Line Items', tableStartX, yPos)
      yPos += 8
      
      // Table column widths
      const colWidths = [40, 20, 25, 25, 20, 15, 20, 20]
      const colPositions = [tableStartX + 2]
      for (let i = 1; i < colWidths.length; i++) {
        colPositions.push(colPositions[i - 1] + colWidths[i - 1])
      }
      
      // Table header
      const headerY = yPos
      doc.setFontSize(8)
      doc.setFont(undefined, 'bold')
      doc.text('Job Name', colPositions[0], headerY)
      doc.text('Job #', colPositions[1], headerY)
      doc.text('Cost Code', colPositions[2], headerY)
      doc.text('Operation', colPositions[3], headerY)
      doc.text('Lot #s', colPositions[4], headerY)
      doc.text('Hrs.', colPositions[5], headerY)
      doc.text('Price', colPositions[6], headerY)
      doc.text('Total', colPositions[7], headerY)
      
      // Draw header underline
      doc.line(tableStartX, headerY + 3, tableEndX, headerY + 3)
      yPos = headerY + 6
      
      // Table rows
      doc.setFont(undefined, 'normal')
      doc.setFontSize(8)
      selectedTimesheet.lineItems.forEach((item, index) => {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        
        doc.text((item.jobName || '').substring(0, 15), colPositions[0], yPos)
        doc.text((item.jobNumber || '').substring(0, 8), colPositions[1], yPos)
        doc.text((item.jobCode || '').substring(0, 10), colPositions[2], yPos)
        doc.text((item.operation || '').substring(0, 10), colPositions[3], yPos)
        doc.text((item.lotNumbers || '').substring(0, 8), colPositions[4], yPos)
        doc.text(item.hrs || '', colPositions[5], yPos)
        doc.text(item.price || '', colPositions[6], yPos)
        doc.text(`$${(item.total || 0).toFixed(2)}`, colPositions[7], yPos)
        
        // Draw row separator
        doc.line(tableStartX, yPos + 3, tableEndX, yPos + 3)
        yPos += 6
      })
      
      // Summary row
      const totalHours = selectedTimesheet.lineItems.reduce((sum, item) => {
        const hrs = parseFloat(item.hrs) || 0
        return sum + hrs
      }, 0)
      
      const totalAmount = selectedTimesheet.lineItems.reduce((sum, item) => {
        return sum + (item.total || 0)
      }, 0)
      
      yPos += 3
      doc.line(tableStartX, yPos, tableEndX, yPos)
      yPos += 5
      
      doc.setFont(undefined, 'bold')
      doc.setFontSize(10)
      // Align labels to a consistent position from right edge for both sections
      // Use right alignment for labels so colons align perfectly
      const totalsLabelX = tableEndX - 50
      const totalsValueX = tableEndX - 15
      
      // Total Hours - right align label so colon aligns with Total Price colon
      doc.text('Total Hours:', totalsLabelX, yPos, { align: 'right' })
      // Format hours and minutes for line items
      const formatHoursMinutes = (decimalHours) => {
        if (decimalHours <= 0) return '0 hrs 0 min'
        const hours = Math.floor(decimalHours)
        const minutes = Math.round((decimalHours - hours) * 60)
        if (minutes === 0) {
          return `${hours} hrs`
        }
        return `${hours} hrs ${minutes} min`
      }
      doc.text(formatHoursMinutes(totalHours), totalsValueX, yPos)
      yPos += 6
      
      // Total Price - right align label so colon aligns with Total Hours colon
      doc.text('Total Price:', totalsLabelX, yPos, { align: 'right' })
      doc.text('$' + totalAmount.toFixed(2), totalsValueX, yPos)
      yPos += 15
    }
    
    // Daily Time Grid Table
    if (selectedTimesheet.dailyTimeGrid) {
      // Check if we need a new page
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }
      
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('Daily Time Grid', tableStartX, yPos)
      yPos += 8
      
      // Helper function to format decimal hours to hours and minutes
      const formatHoursMinutes = (decimalHours) => {
        if (decimalHours <= 0) return '0 hrs 0 min'
        const hours = Math.floor(decimalHours)
        const minutes = Math.round((decimalHours - hours) * 60)
        if (minutes === 0) {
          return `${hours} hrs`
        }
        return `${hours} hrs ${minutes} min`
      }

      // Helper function to calculate day total (same logic as DailyTimeGrid component)
      const calculateDayTotal = (dayData) => {
        if (!dayData.in || !dayData.out) return 0
        
        const parseTime = (timeStr) => {
          if (!timeStr) return null
          const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
          if (!match) return null
          
          let hours = parseInt(match[1], 10)
          const minutes = parseInt(match[2], 10)
          const period = match[3].toUpperCase()
          
          // Validate hours and minutes
          if (isNaN(hours) || isNaN(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
            return null
          }
          
          if (period === 'PM' && hours !== 12) hours += 12
          if (period === 'AM' && hours === 12) hours = 0
          
          return hours * 60 + minutes
        }
        
        const calculateBreakDuration = (breakTimes) => {
          if (!breakTimes || !breakTimes.in || !breakTimes.out) return 0
          const startTime = parseTime(breakTimes.in)
          const endTime = parseTime(breakTimes.out)
          if (!startTime || !endTime) return 0
          
          let duration = endTime - startTime
          if (duration < 0) duration += 24 * 60
          return duration
        }
        
        const inTime = parseTime(dayData.in)
        const outTime = parseTime(dayData.out)
        if (!inTime || !outTime) return 0
        
        let totalMinutes = outTime - inTime
        if (totalMinutes < 0) totalMinutes += 24 * 60
        
        totalMinutes -= calculateBreakDuration(dayData.rest1)
        totalMinutes -= calculateBreakDuration(dayData.meal)
        totalMinutes -= calculateBreakDuration(dayData.rest2)
        
        return Math.max(0, totalMinutes / 60)
      }
      
      // Table columns - narrower to fit
      const timeColWidths = [25, 18, 18, 18, 18, 18, 18, 18, 18, 15]
      const timeColPositions = [tableStartX + 2]
      for (let i = 1; i < timeColWidths.length; i++) {
        timeColPositions.push(timeColPositions[i - 1] + timeColWidths[i - 1])
      }
      
      // Table header
      const timeHeaderY = yPos
      doc.setFontSize(7)
      doc.setFont(undefined, 'bold')
      doc.text('Day', timeColPositions[0], timeHeaderY)
      doc.text('In', timeColPositions[1], timeHeaderY)
      doc.text('B1 In', timeColPositions[2], timeHeaderY)
      doc.text('B1 Out', timeColPositions[3], timeHeaderY)
      doc.text('M In', timeColPositions[4], timeHeaderY)
      doc.text('M Out', timeColPositions[5], timeHeaderY)
      doc.text('B2 In', timeColPositions[6], timeHeaderY)
      doc.text('B2 Out', timeColPositions[7], timeHeaderY)
      doc.text('Out', timeColPositions[8], timeHeaderY)
      doc.text('Total', timeColPositions[9], timeHeaderY)
      
      doc.line(tableStartX, timeHeaderY + 3, tableEndX, timeHeaderY + 3)
      yPos = timeHeaderY + 5
      
      // Table rows
      const days = ['Friday', 'Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
      doc.setFont(undefined, 'normal')
      doc.setFontSize(7)
      
      days.forEach(day => {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        
        const dayData = selectedTimesheet.dailyTimeGrid[day] || {}
        const dayTotal = calculateDayTotal(dayData)
        
        doc.text(day.substring(0, 3), timeColPositions[0], yPos)
        doc.text((dayData.in || '--').substring(0, 7), timeColPositions[1], yPos)
        doc.text((dayData.rest1?.in || '--').substring(0, 7), timeColPositions[2], yPos)
        doc.text((dayData.rest1?.out || '--').substring(0, 7), timeColPositions[3], yPos)
        doc.text((dayData.meal?.in || '--').substring(0, 7), timeColPositions[4], yPos)
        doc.text((dayData.meal?.out || '--').substring(0, 7), timeColPositions[5], yPos)
        doc.text((dayData.rest2?.in || '--').substring(0, 7), timeColPositions[6], yPos)
        doc.text((dayData.rest2?.out || '--').substring(0, 7), timeColPositions[7], yPos)
        doc.text((dayData.out || '--').substring(0, 7), timeColPositions[8], yPos)
        doc.text(dayTotal > 0 ? formatHoursMinutes(dayTotal) : '--', timeColPositions[9], yPos)
        
        doc.line(tableStartX, yPos + 3, tableEndX, yPos + 3)
        yPos += 5
      })
      
      // Total Hours and Total Amount
      const grandTotal = days.reduce((sum, day) => {
        return sum + calculateDayTotal(selectedTimesheet.dailyTimeGrid[day] || {})
      }, 0)
      
      const ratePerHour = selectedTimesheet.ratePerHour || 15.00
      const totalAmount = grandTotal * ratePerHour
      
      yPos += 2
      doc.line(tableStartX, yPos, tableEndX, yPos)
      yPos += 5
      doc.setFont(undefined, 'bold')
      doc.setFontSize(9)
      // Use same alignment as line items section to align colons
      const totalsLabelX = tableEndX - 50
      const totalsValueX = tableEndX - 15
      
      // Total Hours - right align label so colon aligns with Total Amount colon
      doc.text('Total Hours:', totalsLabelX, yPos, { align: 'right' })
      doc.text(formatHoursMinutes(grandTotal), totalsValueX, yPos)
      yPos += 6
      
      // Total Amount - right align label so colon aligns with Total Hours colon
      doc.text('Total Amount:', totalsLabelX, yPos, { align: 'right' })
      const amountText = '$' + totalAmount.toFixed(2)
      doc.text(amountText, totalsValueX, yPos)
      yPos += 10
    }
    
    // Signature Section
    yPos += 5
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Signatures', tableStartX, yPos)
    yPos += 10
    
    // Employee Signature and Date (blank line for physical signing)
    let employeeSignatureY = yPos
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.text('Employee Signature', tableStartX, employeeSignatureY)
    employeeSignatureY += 8
    
    // Draw signature line
    const signatureLineWidth = 80
    doc.line(tableStartX, employeeSignatureY, tableStartX + signatureLineWidth, employeeSignatureY)
    
    // Date line for manual entry (blank line, not showing the date value)
    const dateX = tableStartX + signatureLineWidth + 20
    doc.text('Date:', dateX, employeeSignatureY)
    const dateLineWidth = 50
    doc.line(dateX + 15, employeeSignatureY, dateX + 15 + dateLineWidth, employeeSignatureY)
    employeeSignatureY += 15
    
    // Superintendent Signature and Date (blank line for physical signing)
    let superintendentSignatureY = employeeSignatureY + 5
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.text('Superintendent Signature', tableStartX, superintendentSignatureY)
    superintendentSignatureY += 8
    
    // Draw signature line (reuse signatureLineWidth from Employee section)
    doc.line(tableStartX, superintendentSignatureY, tableStartX + signatureLineWidth, superintendentSignatureY)
    
    // Date line for manual entry (blank line, not showing the date value)
    const superintendentDateX = tableStartX + signatureLineWidth + 20
    doc.text('Date:', superintendentDateX, superintendentSignatureY)
    doc.line(superintendentDateX + 15, superintendentSignatureY, superintendentDateX + 15 + dateLineWidth, superintendentSignatureY)
    
    doc.save(`timesheet-${selectedTimesheet.employeeName}-${selectedTimesheet.weekEnding}.pdf`)
  }

  const handleUpdateLineItem = (itemId, field, value) => {
    if (!selectedTimesheet) return
    
    const updatedItems = selectedTimesheet.lineItems.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value }
        // Only auto-calculate total if hrs or price changed, not if total is being manually edited
        if (field === 'hrs' || field === 'price') {
          const hrs = parseFloat(updated.hrs) || 0
          const price = parseFloat(updated.price) || 0
          updated.total = hrs * price
        } else if (field === 'total') {
          // Parse the manually entered total value
          updated.total = parseFloat(value) || 0
        }
        return updated
      }
      return item
    })
    
    setSelectedTimesheet({ ...selectedTimesheet, lineItems: updatedItems })
  }

  const handleAddLineItem = () => {
    if (!selectedTimesheet) return
    
    const newItem = {
      id: Date.now(),
      jobName: '',
      jobNumber: '',
      jobCode: '',
      operation: '',
      lotNumbers: '',
      hrs: '',
      price: '',
      total: 0
    }
    setSelectedTimesheet({
      ...selectedTimesheet,
      lineItems: [...selectedTimesheet.lineItems, newItem]
    })
  }

  const handleRemoveLineItem = (itemId) => {
    if (!selectedTimesheet) return
    
    setSelectedTimesheet({
      ...selectedTimesheet,
      lineItems: selectedTimesheet.lineItems.filter(item => item.id !== itemId)
    })
  }

  const handleDeleteTimesheet = (id) => {
    setTimesheets(timesheets.filter(t => t.id !== id))
  }

  const getStatusColor = (status) => {
    return status === 'Draft' 
      ? 'bg-gray-100 text-gray-600' 
      : 'bg-green-50 text-green-700'
  }

  // Top bar component (always visible)
  const TopBar = () => (
    <div className="bg-slate-900 text-white px-4 md:px-6 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
      <div className="text-base md:text-lg font-semibold">Weekly Timesheet Sender</div>
      <div className="flex items-center gap-2 w-full md:w-auto">
        {currentView === 'detail' && (
          <button
            onClick={() => setCurrentView('list')}
            className="px-4 py-2.5 md:px-3 md:py-1.5 text-sm bg-white text-slate-900 rounded hover:bg-gray-100 min-h-[44px] md:min-h-0 flex-1 md:flex-none"
          >
            Back to Dashboard
          </button>
        )}
        <button
          onClick={handleNewEntry}
          className="px-4 py-2.5 md:px-4 md:py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 min-h-[44px] md:min-h-0 flex-1 md:flex-none"
        >
          New Entry
        </button>
        <button className="p-2.5 md:p-1.5 hover:bg-slate-800 rounded min-h-[44px] md:min-h-0 min-w-[44px] md:min-w-0">
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  )

  // State A: List View
  if (currentView === 'list') {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Timesheets</h1>
              <div className="relative w-full md:w-auto">
                <button
                  onClick={() => setShowImportDropdown(!showImportDropdown)}
                  className="w-full md:w-auto px-4 py-2.5 md:py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center md:justify-start gap-2 min-h-[44px] md:min-h-0"
                >
                  Import CSV
                  <ChevronDown size={16} />
                </button>
                {showImportDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowImportDropdown(false)}
                    />
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-lg z-20">
                      <button
                        onClick={() => setShowImportDropdown(false)}
                        className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 min-h-[44px]"
                      >
                        Upload CSV...
                      </button>
                      <button
                        onClick={() => setShowImportDropdown(false)}
                        className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 min-h-[44px]"
                      >
                        Download template
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Mobile Card Layout */}
            <div className="block md:hidden divide-y divide-gray-200">
              {timesheets.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">No timesheets</div>
              ) : (
                timesheets.map((timesheet) => (
                  <div key={timesheet.id} className="px-4 py-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-base font-medium text-gray-900 mb-1">{timesheet.employeeName}</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Week Ending: {formatDate(timesheet.weekEnding)}</div>
                          <div>Last Edited: {timesheet.lastEdited}</div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(timesheet.status)}`}>
                        {timesheet.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleEdit(timesheet)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center gap-1.5 min-h-[44px]"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 min-h-[44px] min-w-[60px]">
                        PDF
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded min-h-[44px] min-w-[44px] flex items-center justify-center">
                        <Copy size={16} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteTimesheet(timesheet.id)}
                        className="p-2 hover:bg-gray-100 rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week Ending</th>
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Edited</th>
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timesheets.map((timesheet) => (
                    <tr key={timesheet.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{timesheet.employeeName}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(timesheet.weekEnding)}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">{timesheet.lastEdited}</td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(timesheet.status)}`}>
                          {timesheet.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(timesheet)}
                            className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
                          >
                            <Edit size={12} />
                            Edit
                          </button>
                          <button className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50">
                            PDF
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Copy size={14} className="text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteTimesheet(timesheet.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Trash2 size={14} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                {timesheets.length > 0 ? `1 - ${timesheets.length} of ${timesheets.length}` : '0 timesheets'}
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 md:p-1 hover:bg-gray-100 rounded disabled:opacity-50 min-h-[44px] md:min-h-0 min-w-[44px] md:min-w-0 flex items-center justify-center" disabled>
                  <ChevronLeft size={16} />
                </button>
                <button className="px-3 py-2 md:px-2 md:py-1 text-sm bg-blue-600 text-white rounded min-h-[44px] md:min-h-0">1</button>
                <button className="p-2 md:p-1 hover:bg-gray-100 rounded disabled:opacity-50 min-h-[44px] md:min-h-0 min-w-[44px] md:min-w-0 flex items-center justify-center" disabled>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // State B: Modal
  if (currentView === 'modal') {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 md:items-center"
          onClick={() => setCurrentView('list')}
        >
          <div 
            className="bg-white w-full h-full md:h-auto md:rounded-lg shadow-2xl md:w-full md:max-w-md md:mx-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Create New Timesheet</h2>
              <button
                onClick={() => setCurrentView('list')}
                className="p-2 hover:bg-gray-100 rounded min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:p-1 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="px-4 md:px-6 py-4 md:py-4 space-y-4 md:space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name</label>
                <input
                  type="text"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  className="w-full px-4 py-3 md:px-3 md:py-2 border border-gray-300 rounded text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] md:min-h-0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID (optional)</label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-4 py-3 md:px-3 md:py-2 border border-gray-300 rounded text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] md:min-h-0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Foreman Name</label>
                <input
                  type="text"
                  value={formData.foremanName}
                  onChange={(e) => setFormData({ ...formData, foremanName: e.target.value })}
                  className="w-full px-4 py-3 md:px-3 md:py-2 border border-gray-300 rounded text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] md:min-h-0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Week Ending (Thursday)</label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.weekEnding}
                    onChange={(e) => setFormData({ ...formData, weekEnding: e.target.value })}
                    className="w-full px-4 py-3 md:px-3 md:py-2 border border-gray-300 rounded text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 min-h-[44px] md:min-h-0"
                  />
                  <Calendar size={18} className="absolute right-3 top-3 md:top-2.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            
            <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row justify-end gap-3 md:gap-3">
              <button
                onClick={() => setCurrentView('list')}
                className="w-full md:w-auto px-4 py-3 md:py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 min-h-[44px] md:min-h-0"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTimesheet}
                className="w-full md:w-auto px-4 py-3 md:py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 min-h-[44px] md:min-h-0"
              >
                Create Timesheet
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // State C: Detail View
  if (currentView === 'detail' && selectedTimesheet) {
    // Format decimal hours to hours and minutes
    const formatHoursMinutes = (decimalHours) => {
      if (decimalHours <= 0) return '0 hrs 0 min'
      const hours = Math.floor(decimalHours)
      const minutes = Math.round((decimalHours - hours) * 60)
      if (minutes === 0) {
        return `${hours} hrs`
      }
      return `${hours} hrs ${minutes} min`
    }

    const totalHours = selectedTimesheet.lineItems.reduce((sum, item) => {
      const hrs = parseFloat(item.hrs) || 0
      return sum + hrs
    }, 0)
    
    const totalAmount = selectedTimesheet.lineItems.reduce((sum, item) => {
      return sum + (item.total || 0)
    }, 0)

    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setCurrentView('list')}
                      className="text-gray-600 hover:text-gray-900 p-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Timesheet for {selectedTimesheet.employeeName}</h1>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-gray-600 ml-6 md:ml-6">
                    <span>Foreman: {selectedTimesheet.foremanName || 'N/A'}</span>
                    <span>Employee ID: {selectedTimesheet.employeeId || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex flex-col md:text-right md:items-end gap-3">
                  <div className="text-sm text-gray-600">Week Ending: {formatDate(selectedTimesheet.weekEnding)}</div>
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <button
                      onClick={handleSaveDraft}
                      className="w-full md:w-auto px-4 py-2.5 md:py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 min-h-[44px] md:min-h-0"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full md:w-auto px-4 py-2.5 md:py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 min-h-[44px] md:min-h-0"
                    >
                      Export PDF
                      <Settings size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-4 md:px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
              
              {/* Mobile Card Layout */}
              <div className="block md:hidden space-y-4">
                {selectedTimesheet.lineItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700">Line Item</h3>
                      <button
                        onClick={() => handleRemoveLineItem(item.id)}
                        className="text-red-600 hover:text-red-800 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Job Name</label>
                        <input
                          type="text"
                          value={item.jobName || ''}
                          onChange={(e) => handleUpdateLineItem(item.id, 'jobName', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Job #</label>
                          <input
                            type="text"
                            value={item.jobNumber || ''}
                            onChange={(e) => handleUpdateLineItem(item.id, 'jobNumber', e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Cost Code</label>
                          <select
                            value={item.jobCode || ''}
                            onChange={(e) => handleUpdateLineItem(item.id, 'jobCode', e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select...</option>
                            {jobCodes.map(code => (
                              <option key={code} value={code}>{code}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Operation</label>
                        <input
                          type="text"
                          value={item.operation || ''}
                          onChange={(e) => handleUpdateLineItem(item.id, 'operation', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Lot #s</label>
                        <input
                          type="text"
                          value={item.lotNumbers || ''}
                          onChange={(e) => handleUpdateLineItem(item.id, 'lotNumbers', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Hrs.</label>
                          <input
                            type="text"
                            value={item.hrs || ''}
                            onChange={(e) => handleUpdateLineItem(item.id, 'hrs', e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                          <input
                            type="text"
                            value={item.price || ''}
                            onChange={(e) => handleUpdateLineItem(item.id, 'price', e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                          <input
                            type="text"
                            value={item.total !== undefined && item.total !== null ? item.total : ''}
                            onChange={(e) => handleUpdateLineItem(item.id, 'total', e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedTimesheet.lineItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">No line items yet</div>
                )}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Job Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Job #</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[140px]">Cost Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Operation</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lot #s</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hrs.</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedTimesheet.lineItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.jobName || ''}
                            onChange={(e) => handleUpdateLineItem(item.id, 'jobName', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.jobNumber || ''}
                            onChange={(e) => handleUpdateLineItem(item.id, 'jobNumber', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 min-w-[140px]">
                          <select
                            value={item.jobCode || ''}
                            onChange={(e) => handleUpdateLineItem(item.id, 'jobCode', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Select...</option>
                            {jobCodes.map(code => (
                              <option key={code} value={code}>{code}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.operation || ''}
                            onChange={(e) => handleUpdateLineItem(item.id, 'operation', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.lotNumbers || ''}
                            onChange={(e) => handleUpdateLineItem(item.id, 'lotNumbers', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.hrs || ''}
                            onChange={(e) => handleUpdateLineItem(item.id, 'hrs', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.price || ''}
                            onChange={(e) => handleUpdateLineItem(item.id, 'price', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.total !== undefined && item.total !== null ? item.total : ''}
                            onChange={(e) => handleUpdateLineItem(item.id, 'total', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleRemoveLineItem(item.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-t border-gray-200 pt-3">
                <button
                  onClick={handleAddLineItem}
                  className="w-full md:w-auto px-4 py-2.5 md:py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-700 min-h-[44px] md:min-h-0"
                >
                  <Plus size={16} />
                  Add Line Item
                </button>
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-6 text-sm w-full md:w-auto">
                  <div className="flex items-center justify-between md:justify-start gap-2">
                    <span className="text-gray-600">Weekly Hours:</span>
                    <span className="text-gray-900 font-medium">{formatHoursMinutes(totalHours)}</span>
                  </div>
                  <div className="flex items-center justify-between md:justify-start gap-2">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="text-green-600 font-medium">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <DailyTimeGrid 
                weekEnding={selectedTimesheet.weekEnding}
                onDataChange={(dailyTimes, rate) => {
                  setSelectedTimesheet({
                    ...selectedTimesheet,
                    dailyTimeGrid: dailyTimes,
                    ratePerHour: rate
                  })
                }}
                initialData={selectedTimesheet.dailyTimeGrid}
                initialRate={selectedTimesheet.ratePerHour}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default App

