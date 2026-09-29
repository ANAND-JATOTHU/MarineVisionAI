import { Anchor, Download, Settings, Activity, Usb, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'

export default function Navbar({ isSimulating, setIsSimulating, isHardwareConnected, setIsHardwareConnected, onOpenSettings, onImageAnalyzed }) {
  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("http://127.0.0.1:8000/api/analyze-image", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.status === "success") {
        onImageAnalyzed(data.detections);
        alert(`Processed ${file.name}! Target plotted on map.`);
      }
    } catch (err) {
      console.error(err);
      alert("Backend analysis failed. Is the server running?");
    } finally {
      setIsUploading(false);
      e.target.value = null; // reset input
    }
  }
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
          onChange={handleFileUpload}
        />
        
        <button 
          onClick={() => fileInputRef.current.click()}
          disabled={isUploading}
          style={{
            background: 'rgba(41, 98, 255, 0.1)',
            border: '1px solid var(--accent-blue)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: isUploading ? 0.5 : 1
          }}>
          <UploadCloud size={18} /> {isUploading ? "ANALYZING..." : "UPLOAD LOG"}
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
