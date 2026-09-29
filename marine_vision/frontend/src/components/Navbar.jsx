import { Anchor, Download, Settings, Activity, Usb, UploadCloud } from 'lucide-react'
import { useRef } from 'react'

export default function Navbar({ isSimulating, setIsSimulating, isHardwareConnected, setIsHardwareConnected, onOpenSettings }) {
  const fileInputRef = useRef(null)
  return (
    <div className="glass-panel" style={{
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      borderBottom: '1px solid var(--border-glass)',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Anchor color="var(--accent-cyan)" size={28} />
        <h1 className="text-gradient" style={{ fontSize: '1.2rem', margin: 0 }}>MarineVision AI</h1>
        <span style={{ 
          background: 'rgba(0, 229, 255, 0.1)', 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '0.75rem', 
          color: 'var(--accent-cyan)',
          border: '1px solid var(--border-glass)',
          marginLeft: '12px'
        }}>
          mission_2026_09_21.xtf
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isHardwareConnected ? (
          <div style={{
            background: 'rgba(0, 255, 136, 0.2)',
            border: '1px solid #00FF88',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600'
          }}>
            <Usb size={18} color="#00FF88" />
            LIVE HARDWARE CONNECTED
          </div>
        ) : (
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            style={{
              background: isSimulating ? 'rgba(255,23,68,0.2)' : 'rgba(0, 229, 255, 0.1)',
              border: `1px solid ${isSimulating ? 'var(--accent-red)' : 'var(--accent-cyan)'}`,
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <Activity size={18} color={isSimulating ? 'var(--accent-red)' : 'var(--accent-cyan)'} />
            {isSimulating ? "STOP SIMULATION" : "START SIMULATED TEST (1Hr)"}
          </button>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".xtf,.sl2,.jpg,.png"
          onChange={(e) => alert(`Loaded sonar log: ${e.target.files[0].name}. (Backend processing initiated...)`)}
        />
        
        <button 
          onClick={() => fileInputRef.current.click()}
          style={{
            background: 'rgba(41, 98, 255, 0.1)',
            border: '1px solid var(--accent-blue)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
          <UploadCloud size={18} /> UPLOAD LOG
        </button>

        <a href="http://127.0.0.1:8000/api/export-report" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
          <button style={{
            background: 'transparent',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-main)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Download size={18} /> EXPORT PDF
          </button>
        </a>
        
        <button 
          onClick={onOpenSettings}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Settings size={20} color="var(--text-muted)" />
        </button>
      </div>
    </div>
  )
}
