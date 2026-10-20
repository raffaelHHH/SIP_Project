// Map for choosing a location (lazy-loaded with Leaflet, like MapView).
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import type { LatLng } from '../lib/geo';
import './map.css';

const pin = L.divIcon({
  className: 'kaki-pin',
  html: '<span><i>📍</i></span>',
  iconSize: [44, 44],
  iconAnchor: [22, 44],
});

function ClickToMove({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

export default function PinPicker({ value, onChange }: { value: LatLng; onChange: (p: LatLng) => void }) {
  return (
    <div className="map-wrap" style={{ height: '45vh', minHeight: 260 }}>
      <MapContainer center={[value.lat, value.lng]} zoom={17} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ClickToMove onPick={onChange} />
        <Marker
          position={[value.lat, value.lng]}
          icon={pin}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = (e.target as L.Marker).getLatLng();
              onChange({ lat: p.lat, lng: p.lng });
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
