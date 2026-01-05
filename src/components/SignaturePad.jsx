import { useRef, useEffect, useState } from 'react'

const SignaturePad = ({ value, onChange }) => {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Load existing signature if value exists, otherwise clear
    if (value) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        setHasSignature(true)
      }
      img.src = value
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasSignature(false)
    }
  }, [value])

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const coords = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!isDrawing) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const coords = getCoordinates(e)
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
  }

  const stopDrawing = (e) => {
    e.preventDefault()
    if (isDrawing) {
      setIsDrawing(false)
      const canvas = canvasRef.current
      const dataURL = canvas.toDataURL('image/png')
      setHasSignature(true)
      if (onChange) {
        onChange(dataURL)
      }
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    if (onChange) {
      onChange('')
    }
  }

  return (
    <div className="signature-pad-container">
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="border border-gray-300 rounded cursor-crosshair bg-white w-full max-w-md"
        style={{ touchAction: 'none' }}
      />
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={clearSignature}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
        >
          Clear
        </button>
      </div>
    </div>
  )
}

export default SignaturePad

