import { useEffect, useRef } from 'react'

export default function WaterfallCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let offset = 0
    
    const bgImage = new Image()
    bgImage.src = '/waterfall_bg.jpg'
    
    bgImage.onload = () => {
      const draw = () => {
        const width = canvas.width
        const height = canvas.height
        
        ctx.clearRect(0, 0, width, height)
        
        // Draw scrolling background
        offset += 1.5 // Scroll speed
        if (offset >= bgImage.height) offset = 0
        
        ctx.drawImage(bgImage, 0, offset - bgImage.height, width, bgImage.height)
        ctx.drawImage(bgImage, 0, offset, width, bgImage.height)
        
        // Draw nadir (center line)
        ctx.fillStyle = '#0a1020'
        ctx.fillRect(width/2 - 4, 0, 8, height)
        ctx.fillStyle = '#1e3a8a'
        ctx.fillRect(width/2 - 1, 0, 2, height)
        
        animationFrameId = requestAnimationFrame(draw)
      }
      draw()
    }
    
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
