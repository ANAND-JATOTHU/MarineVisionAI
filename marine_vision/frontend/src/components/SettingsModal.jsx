import { motion, AnimatePresence } from 'framer-motion'
import { X, Sliders, Database, Cpu } from 'lucide-react'

export default function SettingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-panel"
          style={{
            width: '450px',
            background: 'rgba(16, 22, 34, 0.95)',
            borderRadius: '12px',
            padding: '24px',
            position: 'relative'
          }}
        >
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>

          <h2 style={{ fontSize: '1.2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} color="var(--accent-cyan)" /> System Configuration
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={14} /> YOLO Inference Threshold
              </label>
              <input type="range" min="0" max="100" defaultValue="65" style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>Aggressive (30%)</span>
                <span>Conservative (80%)</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={14} /> Database WAL Sync
              </label>
              <select style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-glass)', borderRadius: '4px' }}>
                <option>NORMAL (Fastest, Edge Default)</option>
                <option>FULL (Safest)</option>
              </select>
            </div>
            
            <button 
              onClick={onClose}
              style={{
                marginTop: '12px',
                background: 'rgba(0, 229, 255, 0.1)',
                border: '1px solid var(--accent-cyan)',
                color: 'white',
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Apply Settings
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
