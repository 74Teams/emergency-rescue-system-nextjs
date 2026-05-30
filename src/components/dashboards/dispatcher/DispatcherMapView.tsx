"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { RequestSummary, RescueTeamSummary, TeamStatus } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Navigation,
  Layers,
  Loader2,
  Maximize,
  Plus,
  Minus,
  MapPin,
  AlertTriangle,
  Clock,
  Shield,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import MAP_LAYERS from "@/constants/map-layers";
import { dictTeamStatus } from "@/constants/dictionary";
import { emergencyTypeLabels, priorityLabels, statusLabels } from "@/lib/api/features/requests/dispatcher.queries";

delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface DispatcherMapViewProps {
  requests: RequestSummary[];
  teams: RescueTeamSummary[];
  selectedRequestId?: string | null;
  onSelectRequest?: (request: RequestSummary | null) => void;
  onAssignRequest?: (request: RequestSummary) => void;
  onViewTeamDetails?: (teamId: string) => void;
}

const createMarkerHtml = (color: string, svgPath: string, isHighlighted = false, isSquare = false) => `
  <div style="
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0px ${isHighlighted ? '8px' : '4px'} ${isHighlighted ? '12px' : '6px'} rgba(0,0,0,0.3));
    transform: ${isHighlighted ? 'scale(1.2) translateY(-4px)' : 'scale(1)'};
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  ">
    <div style="
      background: linear-gradient(135deg, ${color}, ${color}dd);
      width: ${isHighlighted ? '42px' : '36px'};
      height: ${isHighlighted ? '42px' : '36px'};
      border-radius: ${isSquare ? '12px' : '50%'};
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      z-index: 2;
      position: relative;
      box-shadow: inset 0 2px 4px rgba(255,255,255,0.3);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="${isHighlighted ? '22' : '18'}" height="${isHighlighted ? '22' : '18'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        ${svgPath}
      </svg>
    </div>
    <div style="
      width: 0;
      height: 0;
      border-left: ${isHighlighted ? '10px' : '8px'} solid transparent;
      border-right: ${isHighlighted ? '10px' : '8px'} solid transparent;
      border-top: ${isHighlighted ? '14px' : '12px'} solid white;
      margin-top: -2px;
      z-index: 1;
      position: relative;
    ">
      <div style="
        position: absolute;
        top: -${isHighlighted ? '14px' : '12px'};
        left: -${isHighlighted ? '7px' : '5px'};
        width: 0;
        height: 0;
        border-left: ${isHighlighted ? '7px' : '5px'} solid transparent;
        border-right: ${isHighlighted ? '7px' : '5px'} solid transparent;
        border-top: ${isHighlighted ? '10px' : '9px'} solid ${color};
      "></div>
    </div>
  </div>
`;

const ICONS_SVG = {
  AVAILABLE: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>', // Shield Check
  ON_MISSION: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>', // Activity
  UNAVAILABLE: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>', // X Circle
  MAINTENANCE: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>', // Wrench
  REQUEST: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>' // AlertTriangle
};

const TEAM_STATUS_ICONS: Record<TeamStatus, L.DivIcon> = {
  AVAILABLE: L.divIcon({
    className: "custom-marker-transparent",
    html: createMarkerHtml("#10b981", ICONS_SVG.AVAILABLE), // emerald-500
    iconSize: [36, 48],
    iconAnchor: [18, 48],
  }),
  ON_MISSION: L.divIcon({
    className: "custom-marker-transparent",
    html: createMarkerHtml("#3b82f6", ICONS_SVG.ON_MISSION), // blue-500
    iconSize: [36, 48],
    iconAnchor: [18, 48],
  }),
  UNAVAILABLE: L.divIcon({
    className: "custom-marker-transparent",
    html: createMarkerHtml("#f43f5e", ICONS_SVG.UNAVAILABLE), // rose-500
    iconSize: [36, 48],
    iconAnchor: [18, 48],
  }),
  MAINTENANCE: L.divIcon({
    className: "custom-marker-transparent",
    html: createMarkerHtml("#f59e0b", ICONS_SVG.MAINTENANCE), // amber-500
    iconSize: [36, 48],
    iconAnchor: [18, 48],
  }),
};

const REQUEST_PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444", // red-500
  HIGH: "#f97316", // orange-500
  MEDIUM: "#eab308", // yellow-500
  LOW: "#3b82f6", // blue-500
};

const getRequestIcon = (priority: string, isHighlighted: boolean) => {
  const color = REQUEST_PRIORITY_COLORS[priority] || "#64748b";
  return L.divIcon({
    className: "custom-marker-transparent",
    html: createMarkerHtml(color, ICONS_SVG.REQUEST, isHighlighted, true),
    iconSize: isHighlighted ? [42, 56] : [36, 48],
    iconAnchor: isHighlighted ? [21, 56] : [18, 48],
  });
};

const STATUS_BADGE_COLOR: Record<string, string> = {
  AVAILABLE: "bg-green-500 text-white border-transparent",
  ON_MISSION: "bg-blue-500 text-white border-transparent",
  UNAVAILABLE: "bg-red-500 text-white border-transparent",
  MAINTENANCE: "bg-orange-500 text-white border-transparent",
};

const REQ_STATUS_BADGE_COLOR: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  ACCEPTED: "bg-blue-100 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700 border-indigo-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELED: "bg-slate-100 text-slate-700 border-slate-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

function MapController({
  selectedRequestId,
  requests,
}: {
  selectedRequestId?: string | null;
  requests: RequestSummary[];
}) {
  const map = useMap();
  const lastFlownIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedRequestId || selectedRequestId === lastFlownIdRef.current) {
      return;
    }

    const req = requests.find((r) => r.id === selectedRequestId);
    if (req?.location?.latitude && req?.location?.longitude) {
      lastFlownIdRef.current = selectedRequestId;
      map.invalidateSize();
      map.flyTo(
        [req.location.latitude, req.location.longitude],
        15,
        { animate: true, duration: 1.5 },
      );
    }
  }, [selectedRequestId, requests, map]);

  useEffect(() => {
    if (!selectedRequestId) {
      lastFlownIdRef.current = null;
    }
  }, [selectedRequestId]);

  return null;
}

export default function DispatcherMapView({
  requests,
  teams,
  selectedRequestId,
  onSelectRequest,
  onAssignRequest,
  onViewTeamDetails,
}: DispatcherMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [layerIndex, setLayerIndex] = useState(0);

  useEffect(() => {
    if (mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [requests, teams]);

  // Các thao tác điều khiển bản đồ
  const handleSwitchLayer = () => setLayerIndex((prev) => (prev + 1) % MAP_LAYERS.length);
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleFitBounds = () => {
    if (mapRef.current) {
      const bounds = L.latLngBounds([]);
      requests.forEach(r => {
        if (r.location?.latitude && r.location?.longitude) {
          bounds.extend([r.location.latitude, r.location.longitude]);
        }
      });
      teams.forEach(t => {
        if (t.baseLocation?.latitude && t.baseLocation?.longitude) {
          bounds.extend([t.baseLocation.latitude, t.baseLocation.longitude]);
        }
      });
      
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  };

  const requestsWithLocation = requests.filter(r => r.location?.latitude && r.location?.longitude);
  const teamsWithLocation = teams.filter(t => t.baseLocation?.latitude && t.baseLocation?.longitude);

  // STYLES
  const btnClass = "w-11 h-11 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 flex items-center justify-center text-slate-700 hover:bg-white hover:text-blue-600 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer pointer-events-auto";
  const tooltipClass = "absolute right-14 bg-slate-900/90 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all duration-300 pointer-events-none shadow-xl transform translate-x-2 group-hover:translate-x-0";

  return (
    <div className="w-full h-full bg-slate-50 relative overflow-hidden">
      <div className="w-full h-full relative">
        <MapContainer
          center={[16.0544, 108.2022]}
          zoom={12}
          zoomControl={false}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
          ref={mapRef}
        >
          <TileLayer
            key={MAP_LAYERS[layerIndex].url}
            attribution={MAP_LAYERS[layerIndex].attribution}
            url={MAP_LAYERS[layerIndex].url}
          />

          <MapController
            selectedRequestId={selectedRequestId}
            requests={requestsWithLocation}
          />

          {/* Render Teams Markers */}
          {teamsWithLocation.map((team) => (
            <Marker
              key={team.id}
              position={[team.baseLocation!.latitude, team.baseLocation!.longitude]}
              icon={TEAM_STATUS_ICONS[team.status]}
              zIndexOffset={100} // teams below requests
            >
              <Popup className="shadcn-popup">
                <div className="flex flex-col w-[240px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-white/50 overflow-hidden p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm truncate">
                        {team.teamName}
                      </h3>
                      <Badge variant="outline" className={cn("text-[9px] uppercase mt-1", STATUS_BADGE_COLOR[team.status])}>
                        {dictTeamStatus[team.status] || team.status}
                      </Badge>
                    </div>
                  </div>
                  {onViewTeamDetails && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewTeamDetails(team.id);
                      }}
                    >
                      <Navigation className="w-3.5 h-3.5 mr-2" />
                      Xem chi tiết đội
                    </Button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Render Request Markers */}
          {requestsWithLocation.map((req) => {
            const isSelected = selectedRequestId === req.id;
            return (
              <Marker
                key={req.id}
                position={[req.location!.latitude, req.location!.longitude]}
                icon={getRequestIcon(req.priority, isSelected)}
                zIndexOffset={1000 + (isSelected ? 100 : 0)} // requests above teams
                eventHandlers={{
                  click: () => onSelectRequest?.(req),
                  popupclose: () => onSelectRequest?.(null),
                }}
              >
                <Popup className="shadcn-popup">
                  <div className="flex flex-col w-[260px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-white/50 overflow-hidden p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 text-sm">
                        {emergencyTypeLabels[req.emergencyType] ?? req.emergencyType}
                      </h3>
                      <Badge variant="outline" className={cn("text-[9px] uppercase border-0", REQ_STATUS_BADGE_COLOR[req.status])}>
                        {statusLabels[req.status] || req.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1.5 mb-3">
                      <p className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{req.location?.address ?? "Chưa rõ vị trí"}</span>
                      </p>
                      <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.createdAt ? new Date(req.createdAt).toLocaleString("vi-VN") : "Chưa rõ thời gian"}</span>
                      </p>
                    </div>

                    {(req.status === "PENDING" || req.status === "ACCEPTED") && onAssignRequest && (
                      <Button 
                        size="sm" 
                        className="w-full bg-[#003da5] hover:bg-blue-800 text-white font-bold h-9"
                        onClick={() => {
                          onSelectRequest?.(req);
                          onAssignRequest(req);
                        }}
                      >
                        <Send className="w-3.5 h-3.5 mr-2" />
                        Giao nhiệm vụ
                      </Button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* FLOAT BUTTONS */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-3 items-end pointer-events-none transition-all duration-500 ease-out">
        <button
          onClick={handleSwitchLayer}
          className={cn("group relative pointer-events-auto", btnClass)}
        >
          <Layers className="w-5 h-5" strokeWidth={2} />
          <span className={tooltipClass}>{MAP_LAYERS[layerIndex].name}</span>
        </button>

        <button
          onClick={handleFitBounds}
          className={cn("group relative pointer-events-auto", btnClass)}
        >
          <Maximize className="w-5 h-5" strokeWidth={2} />
          <span className={tooltipClass}>Xem toàn bộ</span>
        </button>

        <div className="flex flex-col bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 overflow-hidden w-11 pointer-events-auto">
          <button
            onClick={handleZoomIn}
            className="group relative w-full h-11 flex items-center justify-center text-slate-700 hover:bg-white hover:text-blue-600 active:bg-blue-50 transition-colors border-b border-slate-200/50 cursor-pointer"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            <span className={`${tooltipClass} z-50`}>Phóng to</span>
          </button>
          <button
            onClick={handleZoomOut}
            className="group relative w-full h-11 flex items-center justify-center text-slate-700 hover:bg-white hover:text-blue-600 active:bg-blue-50 transition-colors cursor-pointer"
          >
            <Minus className="w-5 h-5" strokeWidth={2.5} />
            <span className={`${tooltipClass} z-50`}>Thu nhỏ</span>
          </button>
        </div>
      </div>
      
      {/* Legend / Stats */}
      <div className="absolute top-4 left-4 z-[400] pointer-events-none flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-xl px-4 py-2.5 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-white/50 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
          <span className="text-[11px] font-bold tracking-wide text-slate-700 uppercase">
            {requestsWithLocation.length} Sự cố
          </span>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
          <span className="text-[11px] font-bold tracking-wide text-slate-700 uppercase">
            {teamsWithLocation.length} Đội
          </span>
        </div>
      </div>
    </div>
  );
}
