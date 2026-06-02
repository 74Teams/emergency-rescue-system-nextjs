"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MissionDetailMapProps {
  latitude: number;
  longitude: number;
  address: string;
}

export default function MissionDetailMap({
  latitude,
  longitude,
  address,
}: MissionDetailMapProps) {
  return (
    <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden relative border border-slate-200">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>
            <div className="text-xs font-semibold text-slate-850 p-1">
              <span className="font-bold block mb-1">Vị trí sự cố:</span>
              {address}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
