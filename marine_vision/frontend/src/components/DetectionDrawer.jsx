import { motion, AnimatePresence } from 'framer-motion'
import { Target, CheckCircle, XCircle } from 'lucide-react'

export default function DetectionDrawer({ detections, selectedDetection, setSelectedDetection }) {
  return (
    <div className="glass-panel" style={{
      width: '320px',
      height: '100%',
      borderLeft: '1px solid var(--border-glass)',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(9, 11, 16, 0.85)'
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-glass)' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={18} color="var(--accent-red)" /> Anomaly Targets
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          {detections.length} objects identified
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AnimatePresence>
          {detections.map((det) => (
            <motion.div
              key={det.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedDetection(det.id)}
              style={{
                background: selectedDetection === det.id ? 'rgba(0, 229, 255, 0.15)' : 'rgba(16, 22, 34, 0.6)',
                border: `1px solid ${selectedDetection === det.id ? 'var(--accent-cyan)' : 'var(--border-glass)'}`,
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selectedDetection === det.id ? '0 0 15px rgba(0, 229, 255, 0.2)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '0.85rem' }}>
                  {det.class_name.replace('_', ' ').toUpperCase()}
                </span>
                <span style={{ 
                  color: det.final_confidence > 0.8 ? 'var(--accent-cyan)' : 'var(--accent-yellow)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem'
                }}>
                  {(det.final_confidence * 100).toFixed(1)}%
                </span>
              </div>
              
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Material: <span style={{ color: '#fff' }}>{det.material_estimate}</span><br/>
                Lat: {det.latitude.toFixed(5)}<br/>
                Lon: {det.longitude.toFixed(5)}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ flex: 1, padding: '4px', background: 'rgba(41, 98, 255, 0.2)', border: '1px solid var(--accent-blue)', color: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <CheckCircle size={14} /> CONFIRM
                </button>
                <button style={{ flex: 1, padding: '4px', background: 'rgba(255, 23, 68, 0.1)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <XCircle size={14} /> REJECT
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {detections.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '40px' }}>
            No anomalies detected yet.<br/>Start stream to begin.
          </div>
        )}
      </div>
    </div>
  )
}
