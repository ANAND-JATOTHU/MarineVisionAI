import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import { Icon } from 'leaflet'
import { motion } from 'framer-motion'

// Custom marker icon using SVG encoded as data URI for offline safety
const customIcon = new Icon({
  iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2300E5FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

const auvIcon = new Icon({
  iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23FFA500" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12l-5-5v10z"></path><path d="M2 12h15"></path></svg>',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
})

const blueIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const greenIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  shadowSize: [41, 41]
});

function MapFlyTo({ detections }) {
  const map = useMap();
  useEffect(() => {
    if (detections && detections.length > 0) {
      const latest = detections[detections.length - 1];
      map.flyTo([latest.latitude, latest.longitude], map.getZoom(), {
        animate: true,
        duration: 1.5
      });
    }
  }, [detections, map]);
  return null;
}

export default function LeafletMap({ detections, selectedDetection, simTick = 0 }) {
  const defaultCenter = [12.5000, 80.5000] // Pure Ocean (Bay of Bengal)
  
  // AUV position simulates moving east slowly
  const auvPos = [12.5000, 80.5000 + (simTick * 0.0001)]

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        zoomControl={true}
        style={{ height: '100%', width: '100%', background: '#0a101d' }}
      >
        {/* ONLINE MAP TILES FOR FREE ZOOMING */}
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapFlyTo detections={detections} />
        
        {detections.map(det => (
          <Marker key={det.id} position={[det.latitude, det.longitude]} icon={det.status === 'confirmed' ? greenIcon : blueIcon}>
            <Popup className="custom-popup">
              <div style={{ fontFamily: 'var(--font-mono)' }}>
                <strong>{det.class_name.toUpperCase()}</strong><br/>
                Conf: {(det.final_confidence * 100).toFixed(1)}%<br/>
                Mat: {det.material_estimate}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Live AUV Location Marker */}
        <Marker position={auvPos} icon={auvIcon}>
          <Popup className="custom-popup">
            <div style={{ fontFamily: 'var(--font-mono)' }}>
              <strong>AUV CURRENT POSITION</strong><br/>
              Simulating survey path
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      
      {/* Absolute overlay for styling */}
      <div style={{ position: 'absolute', top: 10, left: 20, zIndex: 1000, pointerEvents: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
        GEOSPATIAL OVERLAY (INS-Corrected)
      </div>
    </div>
  )
}
