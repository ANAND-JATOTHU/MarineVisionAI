import { Compass, Waves, Navigation, Zap } from 'lucide-react'

export default function Sidebar({ telemetry }) {
  const Stat = ({ icon, label, value, unit }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: 'rgba(0, 229, 255, 0.05)',
      borderRadius: '8px',
      border: '1px solid rgba(0, 229, 255, 0.1)',
      marginBottom: '8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
        {icon}
        <span style={{ fontSize: '0.85rem' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
        {value} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{unit}</span>
      </div>
    </div>
  )

  return (
    <div className="glass-panel" style={{
      width: '280px',
      height: '100%',
      borderRight: '1px solid var(--border-glass)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass size={18} color="var(--text-muted)" /> INS Telemetry
        </h3>
        <Stat icon={<Navigation size={16} />} label="Pitch" value={telemetry.pitch} unit="deg" />
        <Stat icon={<Navigation size={16} style={{ transform: 'rotate(90deg)' }}/>} label="Roll" value={telemetry.roll} unit="deg" />
        <Stat icon={<Waves size={16} />} label="Heave" value={telemetry.heave} unit="m" />
        <Stat icon={<Zap size={16} />} label="Speed" value={telemetry.speed} unit="kts" />
      </div>

      <div style={{ marginTop: 'auto' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} color="var(--text-muted)" /> Fusion Engine
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {["YOLOv11 Objectness", "Acoustic Backscatter", "Temporal Persistence"].map((lbl, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>{lbl}</span>
                <span>W{idx}</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '33%', background: 'var(--accent-blue)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
