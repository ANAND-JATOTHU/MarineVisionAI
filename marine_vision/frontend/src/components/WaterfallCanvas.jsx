import { useEffect, useRef } from 'react'

export default function WaterfallCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    
    // Procedural sonar waterfall generation (Mock)
    const draw = () => {
      const width = canvas.width
      const height = canvas.height
      
      // Shift down
      const imgData = ctx.getImageData(0, 0, width, height - 2)
      ctx.putImageData(imgData, 0, 2)
      
      // Draw new scanline at top
      ctx.fillStyle = '#0c182b'
      ctx.fillRect(0, 0, width, 2)
      
      for(let i=0; i<width; i+=4) {
        if(Math.random() > 0.8) {
          const intensity = Math.floor(Math.random() * 50) + 10
          ctx.fillStyle = `rgb(${intensity}, ${intensity+20}, ${intensity+40})`
          ctx.fillRect(i, 0, 4, 2)
        }
      }
      
      // Draw nadir (center line)
      ctx.fillStyle = '#1e3a8a'
      ctx.fillRect(width/2 - 2, 0, 4, 2)
      
      animationFrameId = requestAnimationFrame(draw)
    }
    
    draw()
    
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return (
    <div style={{ flex: 1, borderBottom: '1px solid var(--border-glass)', position: 'relative', overflow: 'hidden', background: '#090B10' }}>
      <div style={{ position: 'absolute', top: 10, left: 20, zIndex: 10, color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
        SONAR WATERFALL (High-Freq SSS)
      </div>
      <canvas 
        ref={canvasRef}
        width={800} 
        height={400} 
        style={{ width: '100%', height: '100%', display: 'block', opacity: 0.8 }} 
      />
    </div>
  )
}
