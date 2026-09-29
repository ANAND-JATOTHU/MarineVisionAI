import { Server, Database, Cpu } from 'lucide-react'

export default function StatusFooter() {
  const Indicator = ({ label, active, icon }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
      {icon}
      <div style={{ 
        width: '8px', 
        height: '8px', 
        borderRadius: '50%', 
        background: active ? '#00E5FF' : '#FF1744',
        boxShadow: active ? '0 0 8px #00E5FF' : 'none'
      }} />
      {label}
    </div>
  )

  return (
    <div className="glass-panel" style={{
      height: '32px',
      borderTop: '1px solid var(--border-glass)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: '24px',
      zIndex: 100,
      background: 'rgba(9, 11, 16, 0.95)'
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
        SYSTEM STATUS: ONLINE
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
        <Indicator label="YOLOv11n-seg (INT8)" active={true} icon={<Cpu size={14} />} />
        <Indicator label="FastAPI Backend" active={true} icon={<Server size={14} />} />
        <Indicator label="SQLite WAL" active={true} icon={<Database size={14} />} />
      </div>
    </div>
  )
}
