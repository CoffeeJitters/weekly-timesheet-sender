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
import SignaturePad from './components/SignaturePad'

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

  const getClosestFriday = () => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
    
    let daysToAdd = 0
    if (dayOfWeek <= 5) {
      // Sunday through Friday: add days to get to Friday
      daysToAdd = 5 - dayOfWeek
    } else {
      // Saturday: add 6 days to get to next Friday
      daysToAdd = 6
    }
    
    const friday = new Date(today)
    friday.setDate(today.getDate() + daysToAdd)
    
    // Return in YYYY-MM-DD format for HTML date input
    const year = friday.getFullYear()
    const month = String(friday.getMonth() + 1).padStart(2, '0')
    const day = String(friday.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // Modal form state
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeId: '',
    foremanName: '',
    weekEnding: getClosestFriday()
  })

  const handleNewEntry = () => {
    setCurrentView('modal')
    setFormData({
      employeeName: '',
      employeeId: '',
      foremanName: '',
      weekEnding: getClosestFriday()
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
      // Align both labels and values in the same column position
      const totalsLabelX = colPositions[5] - 30
      const totalsValueX = colPositions[5]
      
      // Total Hours
      doc.text('Total Hours:', totalsLabelX, yPos)
      doc.text(totalHours.toFixed(2) + ' hrs', totalsValueX, yPos)
      yPos += 6
      
      // Total Price (under Total Hours)
      doc.text('Total Price:', totalsLabelX, yPos)
      doc.text(`$${totalAmount.toFixed(2)}`, totalsValueX, yPos)
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
      
      // Helper function to calculate day total (same logic as DailyTimeGrid component)
      const calculateDayTotal = (dayData) => {
        if (!dayData.in || !dayData.out) return 0
        
        const parseTime = (timeStr) => {
          if (!timeStr) return null
          const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
          if (!match) return null
          
          let hours = parseInt(match[1])
          const minutes = parseInt(match[2])
          const period = match[3].toUpperCase()
          
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
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
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
        doc.text(dayTotal > 0 ? dayTotal.toFixed(2) : '--', timeColPositions[9], yPos)
        
        doc.line(tableStartX, yPos + 3, tableEndX, yPos + 3)
        yPos += 5
      })
      
      // Grand Total
      const grandTotal = days.reduce((sum, day) => {
        return sum + calculateDayTotal(selectedTimesheet.dailyTimeGrid[day] || {})
      }, 0)
      
      yPos += 2
      doc.line(tableStartX, yPos, tableEndX, yPos)
      yPos += 5
      doc.setFont(undefined, 'bold')
      doc.setFontSize(9)
      doc.text('Grand Total:', timeColPositions[9] - 20, yPos)
      doc.text(grandTotal.toFixed(2) + ' hrs', timeColPositions[9], yPos)
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
    
    // Foreman Signature and Date (show actual signature image drawn in app)
    const foremanSignatureY = employeeSignatureY + 5
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.text('Foreman Signature', tableStartX, foremanSignatureY)
    const foremanImgY = foremanSignatureY + 8
    
    if (selectedTimesheet.foremanSignature) {
      try {
        // Add signature image that was drawn with mouse in the app
        const imgWidth = 60
        const imgHeight = 25
        doc.addImage(selectedTimesheet.foremanSignature, 'PNG', tableStartX, foremanImgY, imgWidth, imgHeight)
        
        // Date that foreman selected in the app (match what's shown in UI)
        const foremanDateX = tableStartX + imgWidth + 20
        doc.text('Date:', foremanDateX, foremanImgY + 5)
        const foremanDateValue = selectedTimesheet.signatureDate || new Date().toISOString().split('T')[0]
        doc.text(formatDate(foremanDateValue), foremanDateX + 15, foremanImgY + 5)
      } catch (error) {
        console.error('Error adding foreman signature to PDF:', error)
        doc.text('Foreman Signature: [Signature not available]', tableStartX, foremanImgY)
        const foremanDateValueFallback = selectedTimesheet.signatureDate || new Date().toISOString().split('T')[0]
        doc.text('Date: ' + formatDate(foremanDateValueFallback), tableStartX, foremanImgY + 6)
      }
    } else {
      // If no signature drawn, show blank line
      doc.line(tableStartX, foremanImgY, tableStartX + 80, foremanImgY)
      const foremanDateX = tableStartX + 100
      doc.text('Date:', foremanDateX, foremanImgY)
      const foremanDateValueNoSig = selectedTimesheet.signatureDate || new Date().toISOString().split('T')[0]
      doc.text(formatDate(foremanDateValueNoSig), foremanDateX + 15, foremanImgY)
    }
    
    doc.save(`timesheet-${selectedTimesheet.employeeName}-${selectedTimesheet.weekEnding}.pdf`)
  }

  const handleUpdateLineItem = (itemId, field, value) => {
    if (!selectedTimesheet) return
    
    const updatedItems = selectedTimesheet.lineItems.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value }
        // Calculate total if hrs and price are numeric
        const hrs = parseFloat(updated.hrs) || 0
        const price = parseFloat(updated.price) || 0
        updated.total = hrs * price
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
    <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
      <div className="text-lg font-semibold">Weekly Timesheet Sender</div>
      <div className="flex items-center gap-2">
        {currentView === 'detail' && (
          <button
            onClick={() => setCurrentView('list')}
            className="px-3 py-1.5 text-sm bg-white text-slate-900 rounded hover:bg-gray-100"
          >
            Back to Dashboard
          </button>
        )}
        <button
          onClick={handleNewEntry}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New Entry
        </button>
        <button className="p-1.5 hover:bg-slate-800 rounded">
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
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">Timesheets</h1>
              <div className="relative">
                <button
                  onClick={() => setShowImportDropdown(!showImportDropdown)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
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
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Upload CSV...
                      </button>
                      <button
                        onClick={() => setShowImportDropdown(false)}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Download template
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
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
            
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {timesheets.length > 0 ? `1 - ${timesheets.length} of ${timesheets.length}` : '0 timesheets'}
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-gray-100 rounded disabled:opacity-50" disabled>
                  <ChevronLeft size={16} />
                </button>
                <button className="px-2 py-1 text-sm bg-blue-600 text-white rounded">1</button>
                <button className="p-1 hover:bg-gray-100 rounded disabled:opacity-50" disabled>
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
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setCurrentView('list')}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Create New Timesheet</h2>
              <button
                onClick={() => setCurrentView('list')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                <input
                  type="text"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID (optional)</label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foreman Name</label>
                <input
                  type="text"
                  value={formData.foremanName}
                  onChange={(e) => setFormData({ ...formData, foremanName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Week Ending</label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.weekEnding}
                    onChange={(e) => setFormData({ ...formData, weekEnding: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <Calendar size={18} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setCurrentView('list')}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTimesheet}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
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
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setCurrentView('list')}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <h1 className="text-2xl font-semibold text-gray-900">Timesheet for {selectedTimesheet.employeeName}</h1>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 ml-6">
                    <span>Foreman: {selectedTimesheet.foremanName || 'N/A'}</span>
                    <span>Employee ID: {selectedTimesheet.employeeId || 'N/A'}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-3">
                  <div className="text-sm text-gray-600">Week Ending: {formatDate(selectedTimesheet.weekEnding)}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveDraft}
                      className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                      Export PDF
                      <Settings size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
              <div className="overflow-x-auto">
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
                            value={item.total.toFixed(2)}
                            readOnly
                            className="w-full px-2 py-1 border border-gray-200 bg-gray-50 rounded text-xs"
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
              
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
                <button
                  onClick={handleAddLineItem}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Plus size={14} />
                  Add Line Item
                </button>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Weekly Hours:</span>
                    <span className="text-gray-900 font-medium">{totalHours.toFixed(2)} hrs</span>
                  </div>
                  <div className="flex items-center gap-2">
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
              
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Signatures</h2>
                
                {/* Foreman Signature Section */}
                <div className="flex gap-4 items-start justify-center">
                  <div className="flex flex-col items-center flex-1 max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Foreman Signature
                    </label>
                    <p className="text-xs text-gray-500 mb-2 text-center">Draw your signature using your mouse or touch screen</p>
                    <SignaturePad
                      value={selectedTimesheet.foremanSignature || ''}
                      onChange={(dataURL) => setSelectedTimesheet({ ...selectedTimesheet, foremanSignature: dataURL })}
                    />
                  </div>
                  <div className="flex flex-col items-center w-40 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={selectedTimesheet.signatureDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedTimesheet({ ...selectedTimesheet, signatureDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default App

