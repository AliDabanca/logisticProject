import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Rectangle, useMap } from 'react-leaflet';
import { io } from 'socket.io-client';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- HARİTA ODAKLAMA KONTROLÜ ---
const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      // TypeScript hatasını önlemek için tüm ayarları tek bir seviyede yazıyoruz
      map.setView(center, 15, {
        animate: true,
        duration: 1.2,      // Kayma süresi
        easeLinearity: 0.25, // Kayma yumuşaklığı
        noMoveStart: true    // Gereksiz olay tetiklemelerini önleyerek titremeyi azaltır
      });
    }
  }, [center, map]);

  return null;
};
const getVehicleIcon = (type: string, speed: number) => {
  const isOverSpeed = speed > 60;
  let iconUrl = '';
  if (type === 'sea') iconUrl = 'https://cdn-icons-png.flaticon.com/512/2830/2830217.png';
  else if (type === 'motor') iconUrl = 'https://cdn-icons-png.flaticon.com/512/3198/3198336.png';
  else iconUrl = 'https://cdn-icons-png.flaticon.com/512/2554/2554978.png';

  return L.divIcon({
    html: `
      <div style="background-color: ${isOverSpeed ? '#e53e3e' : '#3182ce'}; padding: 5px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <img src="${iconUrl}" style="width: 20px; height: 20px; filter: invert(1);" />
      </div>`,
    className: 'custom-vehicle-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface Vehicle {
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;
}

function App() {
  const [vehicles, setVehicles] = useState<Record<string, Vehicle>>({});
  const [vehiclePaths, setVehiclePaths] = useState<Record<string, [number, number][]>>({});
  const [showOnlyOverSpeed, setShowOnlyOverSpeed] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [historyPath, setHistoryPath] = useState<[number, number][]>([]);

  useEffect(() => {
    const socket = io('http://localhost:3001', { transports: ['websocket'] });
    socket.on('vehicle_updated', (data: Vehicle) => {
      setVehicles(prev => ({ ...prev, [data.vehicleId]: data }));

      setVehiclePaths(prev => {
        const currentPath = prev[data.vehicleId] || [];
        const lastPoint = currentPath[currentPath.length - 1];

        // Koordinatları 5 basamağa sabitle (Mikro titremeleri engeller)
        const newLat = Number(data.lat.toFixed(5));
        const newLng = Number(data.lng.toFixed(5));

        if (lastPoint && lastPoint[0] === newLat && lastPoint[1] === newLng) {
          return prev;
        }

        return {
          ...prev,
          [data.vehicleId]: [...currentPath.slice(-50), [newLat, newLng]]
        };
      });
    });
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => { setHistoryPath([]); }, [selectedVehicleId]);

  const fetchHistory = async (vehicleId: string) => {
    const response = await fetch(`http://localhost:3001/vehicles/history/${vehicleId}`);
    const data = await response.json();
    setHistoryPath(data.map((item: any) => [item.lat, item.lng]));
  };

  const filteredVehicles = useMemo(() => {
    return Object.values(vehicles).filter(v => showOnlyOverSpeed ? v.speed > 60 : true);
  }, [vehicles, showOnlyOverSpeed]);

  const avgSpeed = useMemo(() => {
    const vals = Object.values(vehicles);
    return vals.length ? (vals.reduce((acc, v) => acc + v.speed, 0) / vals.length).toFixed(1) : 0;
  }, [vehicles]);

  const SAFE_ZONE_BOUNDS: [[number, number], [number, number]] = [[40.98, 28.95], [41.05, 29.15]];
  const isInsideGeoFence = (lat: number, lng: number) => {
    const [sw, ne] = SAFE_ZONE_BOUNDS;
    return lat >= sw[0] && lat <= ne[0] && lng >= sw[1] && lng <= ne[1];
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: '#1a202c', color: 'white', fontFamily: 'sans-serif' }}>

      {/* SOL PANEL (İLK KODUNDAKİ GİBİ TAM DETAYLI) */}
      <div style={{ width: '300px', padding: '20px', borderRight: '1px solid #4a5568', zIndex: 2000, overflowY: 'auto' }}>
        <h2>📊 Filo Paneli</h2>
        <hr />
        <div style={{ margin: '20px 0' }}>
          <p>Aktif Araç: {Object.keys(vehicles).length}</p>
          <p>Ortalama Hız: {avgSpeed} km/h</p>
        </div>

        <div style={{ marginTop: '15px' }}>
          <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '5px' }}>HIZ DURUMU</p>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#4a5568', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${(filteredVehicles.filter(v => v.speed <= 60).length / Math.max(Object.keys(vehicles).length, 1)) * 100}%`, backgroundColor: '#48bb78' }}></div>
            <div style={{ width: `${(filteredVehicles.filter(v => v.speed > 60).length / Math.max(Object.keys(vehicles).length, 1)) * 100}%`, backgroundColor: '#f56565' }}></div>
          </div>
        </div>

        <button onClick={() => setShowOnlyOverSpeed(!showOnlyOverSpeed)} style={{ padding: '10px', width: '100%', cursor: 'pointer', backgroundColor: showOnlyOverSpeed ? '#e53e3e' : '#3182ce', border: 'none', color: 'white', borderRadius: '5px', marginTop: '20px' }}>
          {showOnlyOverSpeed ? "Hepsini Göster" : "Hızlı Araçları Filtrele (>60)"}
        </button>

        <div style={{ marginTop: '20px' }}>
          {filteredVehicles.map(v => (
            <div key={v.vehicleId} onClick={() => setSelectedVehicleId(v.vehicleId)} style={{ padding: '10px', borderBottom: '1px solid #2d3748', cursor: 'pointer', color: v.speed > 60 ? '#f56565' : 'white' }}>
              {v.vehicleId} - {v.speed} km/h
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', padding: '10px', borderRadius: '8px', backgroundColor: '#2d3748' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>🚨 Güvenlik Uyarıları</h4>
          {Object.values(vehicles).map(v => !isInsideGeoFence(v.lat, v.lng) ? (
            <div key={v.vehicleId} style={{ color: '#fc8181', fontSize: '13px', marginBottom: '5px' }}>⚠️ {v.vehicleId}: BÖLGE DIŞI!</div>
          ) : null)}
        </div>
      </div>

      {/* SAĞ PANEL: HARİTA */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={[41.04, 28.95]} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <Rectangle bounds={SAFE_ZONE_BOUNDS} pathOptions={{ color: 'green', weight: 2, fillOpacity: 0.1 }} />

          {selectedVehicleId && vehicles[selectedVehicleId] && (
            <MapController center={[vehicles[selectedVehicleId].lat, vehicles[selectedVehicleId].lng]} />
          )}

          {historyPath.length > 0 && (
            <Polyline positions={historyPath} color="#f56565" weight={4} dashArray="10, 10" opacity={0.8} smoothFactor={2} />
          )}

          {filteredVehicles.map(v => (
            <React.Fragment key={v.vehicleId}>
              <Polyline
                positions={vehiclePaths[v.vehicleId] || []}
                color={v.speed > 60 ? "#e53e3e" : "#63b3ed"}
                weight={3}
                opacity={0.6}
                smoothFactor={2.0} // Çizgiyi basitleştirerek CPU yükünü azaltır
                noClip={false}     // Harita dışına taşan kısımları keser, sapıtmayı önler
              />
              <Marker position={[v.lat, v.lng] as LatLngExpression} icon={getVehicleIcon(v.vehicleId.includes('GEMI') ? 'sea' : (v.vehicleId.includes('MOTOR') ? 'motor' : 'land'), v.speed)} eventHandlers={{ click: () => setSelectedVehicleId(v.vehicleId) }} />
            </React.Fragment>
          ))}
        </MapContainer>

        {/* SAĞ DETAY PANELİ (İLK KODUNDAKİ TÜM DETAYLARLA) */}
        {selectedVehicleId && vehicles[selectedVehicleId] && (
          <div style={{ position: 'absolute', right: '20px', top: '20px', width: '300px', backgroundColor: '#2d3748', padding: '20px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)', zIndex: 3000, border: '1px solid #4a5568' }}>
            <button onClick={() => setSelectedVehicleId(null)} style={{ position: 'absolute', right: '15px', top: '15px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}>✖</button>
            <h3 style={{ color: '#63b3ed', marginTop: '0' }}>🚚 Araç Detayı</h3>
            <hr style={{ borderColor: '#4a5568', margin: '15px 0' }} />
            <p><b>ID:</b> {vehicles[selectedVehicleId].vehicleId}</p>
            <p><b>Hız:</b> <span style={{ color: vehicles[selectedVehicleId].speed > 60 ? '#f6e05e' : '#68d391' }}>{vehicles[selectedVehicleId].speed} km/h</span></p>
            <p><b>Konum:</b> {vehicles[selectedVehicleId].lat.toFixed(4)}, {vehicles[selectedVehicleId].lng.toFixed(4)}</p>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#1a202c', borderRadius: '10px' }}>
              <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '10px' }}>DURUM ANALİZİ</p>
              <p>⛽ Yakıt: %{Math.floor(Math.random() * 100)}</p>
              <p>👨‍✈️ Şoför: Ali Dağlı</p>
              <p>🛣️ Toplam Yol: {(Math.random() * 500).toFixed(1)} km</p>

              <button onClick={() => fetchHistory(selectedVehicleId)} style={{ backgroundColor: '#3182ce', color: 'white', padding: '10px', marginTop: '15px', borderRadius: '5px', cursor: 'pointer', border: 'none', width: '100%', fontWeight: 'bold' }}>🕒 Geçmiş Rotayı Göster</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;