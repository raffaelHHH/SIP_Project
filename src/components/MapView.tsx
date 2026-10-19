// Loaded lazily (only when the user opens Map view) so Leaflet doesn't slow the first load.
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { useT } from '../i18n';
import { categoryIcon } from '../lib/data';
import type { LatLng } from '../lib/geo';
import { navigate } from '../router';
import type { Category, Spot } from '../types';
import './map.css';

const SINGAPORE: LatLng = { lat: 1.3521, lng: 103.8198 };

// Emoji pins: no image files to download, and they match the list icons.
const icons = new Map<Category, L.DivIcon>();
function pinFor(cat: Category): L.DivIcon {
  let icon = icons.get(cat);
  if (!icon) {
    icon = L.divIcon({
      className: 'kaki-pin',
      html: `<span><i>${categoryIcon[cat]}</i></span>`,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      popupAnchor: [0, -40],
    });
    icons.set(cat, icon);
  }
  return icon;
}

export interface MapItem {
  spot: Spot;
  walk: number | null;
}

export default function MapView({ items, origin }: { items: MapItem[]; origin: LatLng | null }) {
  const { t, p } = useT();
  const center = origin ?? SINGAPORE;

  return (
    <div className="map-wrap">
      <MapContainer center={[center.lat, center.lng]} zoom={origin ? 15 : 11} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {origin && (
          <CircleMarker
            center={[origin.lat, origin.lng]}
            radius={10}
            pathOptions={{ color: '#fff', weight: 3, fillColor: '#1565c0', fillOpacity: 1 }}
          />
        )}
        {items.map(({ spot, walk }) => (
          <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={pinFor(spot.category)}>
            <Popup autoPanPaddingTopLeft={[56, 16]} autoPanPaddingBottomRight={[16, 16]}>
              <div className="map-popup">
                <strong>{p(spot.name)}</strong>
                {walk !== null && <div>🚶 {t('minWalk', { n: walk })}</div>}
                <button className="btn btn-primary" onClick={() => navigate(`/spot/${spot.id}`)}>
                  {t('openSpot')} →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
