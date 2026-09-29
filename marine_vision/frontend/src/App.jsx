import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import WaterfallCanvas from './components/WaterfallCanvas'
import LeafletMap from './components/LeafletMap'
import DetectionDrawer from './components/DetectionDrawer'
import StatusFooter from './components/StatusFooter'
import SettingsModal from './components/SettingsModal'

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [telemetry, setTelemetry] = useState({ pitch: 0, roll: 0, heave: 0, depth: 0, speed: 0 })
  const [detections, setDetections] = useState([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [isHardwareConnected, setIsHardwareConnected] = useState(false)
  const [selectedDetection, setSelectedDetection] = useState(null)
  const [simTick, setSimTick] = useState(0)
  
  const handleConfirm = (id) => {
    setDetections(prev => prev.map(d => d.id === id ? { ...d, status: 'confirmed' } : d))
  }

  const handleReject = (id) => {
    setDetections(prev => prev.filter(d => d.id !== id))
    if (selectedDetection?.id === id) setSelectedDetection(null)
  }

  // Hardware Detection Polling Simulation
  useEffect(() => {
    // In a real scenario, this polls /api/hardware-status
    const hwPoll = setInterval(() => {
      // Simulate hardware plugging in after 10 seconds of simulation
      if (isSimulating && !isHardwareConnected) {
        setSimTick(t => t + 1)
        
        // Spawn immediate mock detections after a few seconds of streaming so the user sees something!
        if (simTick > 2 && detections.length === 0) {
           setDetections([{
             id: 'sim_1',
             latitude: 12.5020,
             longitude: 80.5020,
             class_name: "ghost_net",
             final_confidence: 0.88,
             material_estimate: "Soft (Nylon)"
           }]);
        }
      }
    }, 1000)
    return () => clearInterval(hwPoll)
  }, [isSimulating, isHardwareConnected, simTick, detections.length])
  
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
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      <Navbar 
        isSimulating={isSimulating} 
        setIsSimulating={setIsSimulating} 
        isHardwareConnected={isHardwareConnected}
        setIsHardwareConnected={setIsHardwareConnected}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onImageAnalyzed={(newDets) => setDetections(prev => [...prev, ...newDets])}
        detections={detections}
      />
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar telemetry={telemetry} />
        
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
          <WaterfallCanvas />
          <LeafletMap detections={detections} selectedDetection={selectedDetection} simTick={simTick} />
          
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
          onConfirm={handleConfirm}
          onReject={handleReject}
        />
      </div>
      
      <StatusFooter />
    </div>
  )
}
