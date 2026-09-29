import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { Icon } from 'leaflet'
import { motion } from 'framer-motion'

// Custom marker icon using SVG encoded as data URI for offline safety
const customIcon = new Icon({
  iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2300E5FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

export default function LeafletMap({ detections, selectedDetection }) {
  const defaultCenter = [12.5000, 80.5000] // Pure Ocean (Bay of Bengal)

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={14} 
        minZoom={10}
        maxZoom={14}
        zoomControl={false}
        style={{ height: '100%', width: '100%', background: '#0a101d' }}
      >
        {/* TRUE OFFLINE MAP TILES - Loaded from local /tiles directory */}
        <TileLayer
          attribution='Offline MarineVision System'
          url="/tiles/{z}/{x}/{y}.png"
          minZoom={10}
          maxZoom={14}
        />
        
        {detections.map(det => (
          <Marker key={det.id} position={[det.latitude, det.longitude]} icon={customIcon}>
            <Popup className="custom-popup">
              <div style={{ fontFamily: 'var(--font-mono)' }}>
                <strong>{det.class_name.toUpperCase()}</strong><br/>
                Conf: {(det.final_confidence * 100).toFixed(1)}%<br/>
                Mat: {det.material_estimate}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Absolute overlay for styling */}
      <div style={{ position: 'absolute', top: 10, left: 20, zIndex: 1000, pointerEvents: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
        GEOSPATIAL OVERLAY (INS-Corrected)
      </div>
    </div>
  )
}
