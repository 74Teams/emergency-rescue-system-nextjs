'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { Loader2, Navigation, Layers, ShieldAlert, Phone, AlertTriangle, User, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import MAP_LAYERS from '@/constants/map-layers'

import type { MissionSummary } from '@/lib/api/features/missions/missions.types'
import { useRequestDetail } from '@/lib/api/features/requests/requests.queries'
import { dictPriority, dictType as dictEmergencyType, dictStatus as dictMissionStatus } from '@/constants/dictionary'

// Fix default icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const createMarkerHtml = (color: string, iconHtml: string) => `
  <div style="
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0px 8px 12px rgba(0,0,0,0.3));
    transform: scale(1.1) translateY(-4px);
  ">
    <div style="
      background: linear-gradient(135deg, ${color}, ${color}dd);
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      z-index: 2;
      position: relative;
      box-shadow: inset 0 2px 4px rgba(255,255,255,0.3);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        ${iconHtml}
      </svg>
    </div>
    <div style="
      width: 0;
      height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 14px solid white;
      margin-top: -2px;
      z-index: 1;
      position: relative;
    ">
      <div style="
        position: absolute;
        top: -14px;
        left: -7px;
        width: 0;
        height: 0;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        border-top: 10px solid ${color};
      "></div>
    </div>
  </div>
`

const TEAM_ICON = L.divIcon({
    className: 'custom-marker-transparent',
    html: createMarkerHtml('#3b82f6', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'),
    iconSize: [42, 56],
    iconAnchor: [21, 56],
})

const REQUEST_ICON = L.divIcon({
    className: 'custom-marker-transparent',
    html: createMarkerHtml('#ef4444', '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    iconSize: [42, 56],
    iconAnchor: [21, 56],
})

interface RescuerMapViewProps {
    currentMission: MissionSummary | null
    teamLocation: { latitude: number; longitude: number } | null
}

function MapController({ teamLoc, reqLoc }: { teamLoc: any, reqLoc: any }) {
    const map = useMap()

    useEffect(() => {
        if (teamLoc && reqLoc) {
            const bounds = L.latLngBounds(
                [teamLoc.latitude, teamLoc.longitude],
                [reqLoc.latitude, reqLoc.longitude]
            )
            map.fitBounds(bounds, { padding: [100, 100], animate: true, duration: 1.5 })
        } else if (teamLoc) {
            map.setView([teamLoc.latitude, teamLoc.longitude], 15, { animate: true })
        }
    }, [teamLoc, reqLoc, map])

    return null
}

export default function RescuerMapView({ currentMission, teamLocation }: RescuerMapViewProps) {
    const [layerIndex, setLayerIndex] = useState(0)
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
    const [routeDistance, setRouteDistance] = useState<string>('')
    const [routeDuration, setRouteDuration] = useState<string>('')

    // Lấy thông tin nạn nhân từ Request
    const { data: requestDetails, isLoading } = useRequestDetail(currentMission?.requestId || '')
    const reqLoc = requestDetails?.location

    // Lấy đường đi thực tế bằng OSRM
    useEffect(() => {
        if (teamLocation && reqLoc) {
            const fetchRoute = async () => {
                try {
                    const response = await fetch(
                        `https://router.project-osrm.org/route/v1/driving/${teamLocation.longitude},${teamLocation.latitude};${reqLoc.longitude},${reqLoc.latitude}?overview=full&geometries=geojson`
                    )
                    const data = await response.json()
                    if (data.routes && data.routes.length > 0) {
                        const route = data.routes[0]
                        const coords = route.geometry.coordinates.map(
                            (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
                        )
                        setRouteCoords(coords)
                        
                        // Distance & Duration
                        const distKm = (route.distance / 1000).toFixed(1)
                        setRouteDistance(`${distKm} km`)
                        const durMin = Math.ceil(route.duration / 60)
                        setRouteDuration(`${durMin} phút`)
                    }
                } catch (error) {
                    console.error("Failed to fetch route from OSRM", error)
                    setRouteCoords([])
                }
            }
            fetchRoute()
        }
    }, [teamLocation, reqLoc])

    const mapCenter: [number, number] = teamLocation 
        ? [teamLocation.latitude, teamLocation.longitude] 
        : [16.0544, 108.2022]

    if (isLoading && currentMission) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 border border-slate-200">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        )
    }

    if (!teamLocation) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border border-slate-200 text-slate-500">
                <MapPin className="h-10 w-10 mb-4 text-slate-300" />
                <p>Không có dữ liệu vị trí hiện tại của đội</p>
            </div>
        )
    }

    return (
        <div className="w-full h-full relative">
            <MapContainer
                center={mapCenter}
                zoom={14}
                zoomControl={false}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
                <TileLayer
                    key={MAP_LAYERS[layerIndex].url}
                    attribution={MAP_LAYERS[layerIndex].attribution}
                    url={MAP_LAYERS[layerIndex].url}
                />

                <MapController teamLoc={teamLocation} reqLoc={reqLoc} />

                {/* Team Location Marker */}
                <Marker position={[teamLocation.latitude, teamLocation.longitude]} icon={TEAM_ICON} />

                {/* Request Location Marker & Path */}
                {reqLoc && (
                    <>
                        <Marker position={[reqLoc.latitude, reqLoc.longitude]} icon={REQUEST_ICON} />
                        
                        {/* Đường dẫn đi theo đường phố thực tế */}
                        <Polyline 
                            positions={routeCoords.length > 0 ? routeCoords : [
                                [teamLocation.latitude, teamLocation.longitude],
                                [reqLoc.latitude, reqLoc.longitude]
                            ]}
                            color="#3b82f6"
                            weight={6}
                            opacity={0.8}
                            className={routeCoords.length > 0 ? "" : "animate-pulse"}
                            dashArray={routeCoords.length > 0 ? "none" : "10, 15"}
                        />
                    </>
                )}
            </MapContainer>

            {/* Float Button Đổi Lớp Bản Đồ */}
            <div className="absolute bottom-6 right-6 z-10">
                <button
                    onClick={() => setLayerIndex((prev) => (prev + 1) % MAP_LAYERS.length)}
                    className="w-12 h-12 bg-white/90 backdrop-blur-xl rounded-full shadow-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:text-orange-600 hover:scale-110 active:scale-95 transition-all duration-300"
                >
                    <Layers className="w-5 h-5" strokeWidth={2} />
                </button>
            </div>

            {/* HUD (Heads Up Display) Chi Tiết Nhiệm Vụ */}
            <div className="absolute top-6 left-6 z-10 w-[350px]">
                {!currentMission ? (
                    <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl shadow-xl border border-white/50 text-center">
                        <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-800 text-lg">Đội Đang Ở Trạng Thái Standby</h3>
                        <p className="text-sm text-slate-500 mt-1">Chưa có nhiệm vụ nào được phân công. Vị trí trên bản đồ là cứ điểm hiện tại của đội.</p>
                    </div>
                ) : (
                    <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-black text-lg tracking-tight uppercase">
                                        Nhiệm Vụ Đang Xử Lý
                                    </h3>
                                    <p className="text-xs text-slate-300 mt-1 font-medium flex items-center gap-1.5">
                                        <MapPin size={12} />
                                        Mã Request: #{currentMission.requestId.slice(-6)}
                                    </p>
                                </div>
                                <div className="px-3 py-1.5 bg-orange-500 rounded-lg text-[10px] font-black tracking-widest text-white animate-pulse">
                                    {dictMissionStatus[currentMission.status as keyof typeof dictMissionStatus] || currentMission.status}
                                </div>
                            </div>
                        </div>

                        {requestDetails && (
                            <div className="p-5 space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Loại Sự Cố</h4>
                                        <span className={cn(
                                            "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                                            String(requestDetails.priority) === 'CRITICAL' || String(requestDetails.priority) === '1' ? 'bg-red-100 text-red-700' :
                                            String(requestDetails.priority) === 'HIGH' || String(requestDetails.priority) === '2' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                        )}>
                                            {dictPriority[String(requestDetails.priority).toUpperCase()] || requestDetails.priority}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle size={18} className="text-orange-500" />
                                        <p className="font-bold text-slate-800 text-base">
                                            {dictEmergencyType[String(requestDetails.emergencyType || '').toUpperCase()] || requestDetails.emergencyType}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Địa chỉ hiện trường</p>
                                    <p className="text-sm font-semibold text-slate-700 leading-snug">
                                        {requestDetails.location?.address}
                                    </p>
                                    {requestDetails.location?.landmark && (
                                        <p className="text-xs text-slate-500 mt-1 italic">
                                            Ghi chú: {requestDetails.location.landmark}
                                        </p>
                                    )}
                                </div>

                                {requestDetails.description && (
                                    <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                                        <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-1.5">Mô tả nhiệm vụ</p>
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                            {requestDetails.description}
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Người Báo Cáo</p>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                            <User size={14} className="text-slate-500" />
                                            {requestDetails.requestedBy?.fullName || 'Không rõ'}
                                        </div>
                                    </div>
                                    {requestDetails.requestedBy?.phoneNumber && (
                                        <a href={`tel:${requestDetails.requestedBy.phoneNumber}`} className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors cursor-pointer">
                                            <Phone size={16} fill="currentColor" />
                                        </a>
                                    )}
                                </div>
                                
                                {routeDistance && routeDuration && (
                                    <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                                        <div className="text-center flex-1 border-r border-blue-100/50">
                                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Khoảng cách</p>
                                            <p className="font-black text-blue-700">{routeDistance}</p>
                                        </div>
                                        <div className="text-center flex-1">
                                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Thời gian tới</p>
                                            <p className="font-black text-blue-700">{routeDuration}</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="pt-2">
                                    <button 
                                        onClick={() => {
                                            const destination = reqLoc?.latitude && reqLoc?.longitude 
                                                ? `${reqLoc.latitude},${reqLoc.longitude}`
                                                : encodeURIComponent(requestDetails.location?.address || '');
                                                
                                            const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
                                            window.open(url, '_blank', 'noopener,noreferrer');
                                        }}
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 rounded-xl transition-all flex justify-center items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
                                    >
                                        <Navigation size={16} />
                                        Chỉ đường Google Maps
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
