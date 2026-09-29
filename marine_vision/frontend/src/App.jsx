import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import WaterfallCanvas from './components/WaterfallCanvas'
import LeafletMap from './components/LeafletMap'
import DetectionDrawer from './components/DetectionDrawer'
import StatusFooter from './components/StatusFooter'

export default function App() {
  const [telemetry, setTelemetry] = useState({ pitch: 0, roll: 0, heave: 0, depth: 0, speed: 0 })
  const [detections, setDetections] = useState([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [selectedDetection, setSelectedDetection] = useState(null)
  
  // Connect to FastAPI WebSocket
  useEffect(() => {
    // In production, this would be the actual websocket connection
    // For now, we mock it to showcase the interactive UI
    const interval = setInterval(() => {
      if(isSimulating) {
        setTelemetry({
          pitch: (Math.random() * 2 - 1).toFixed(2),
          roll: (Math.random() * 2 - 1).toFixed(2),
          heave: (Math.random() * 0.5 - 0.25).toFixed(2),
          depth: (Math.random() * 2 + 18).toFixed(1),
          speed: (Math.random() * 1 + 2.5).toFixed(1)
        })
        
        // Randomly "find" a detection
        if (Math.random() > 0.95) {
          const materials = ["Hard (Metal)", "Medium (Plastic)", "Soft (Net)"]
          const classes = ["pipe", "ghost_net", "plastic_bottle", "tire"]
          const newDetection = {
            id: crypto.randomUUID(),
            class_name: classes[Math.floor(Math.random() * classes.length)],
            final_confidence: (Math.random() * 0.4 + 0.6).toFixed(2),
            acoustic_reflectivity: (Math.random()).toFixed(2),
            material_estimate: materials[Math.floor(Math.random() * materials.length)],
            latitude: 13.0241 + (Math.random() * 0.001 - 0.0005),
            longitude: 80.2411 + (Math.random() * 0.001 - 0.0005),
            time: new Date().toLocaleTimeString()
          }
          setDetections(prev => [newDetection, ...prev])
        }
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isSimulating])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <Navbar isSimulating={isSimulating} setIsSimulating={setIsSimulating} />
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar telemetry={telemetry} />
        
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
          <WaterfallCanvas />
          <LeafletMap detections={detections} selectedDetection={selectedDetection} />
          
          <AnimatePresence>
            {isSimulating && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                style={{
                  position: 'absolute',
                  bottom: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(255,23,68,0.2)',
                  border: '1px solid var(--accent-red)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  color: 'white',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 1000,
                  pointerEvents: 'none'
                }}
                className="glass-panel"
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-red)', boxShadow: '0 0 10px var(--accent-red)' }} />
                LIVE AUV STREAM
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <DetectionDrawer 
          detections={detections} 
          selectedDetection={selectedDetection}
          setSelectedDetection={setSelectedDetection}
        />
      </div>
      
      <StatusFooter />
    </div>
  )
}
