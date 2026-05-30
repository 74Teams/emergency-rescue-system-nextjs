"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { RescueTeamSummary, TeamStatus } from "@/lib/api/types";
import { useRescueTeams } from "@/lib/api/features/commander/commander-dashboard.queries";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import MAP_LAYERS from "@/constants/map-layers"
import { dictTeamStatus } from "@/constants/dictionary";


delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapViewProps {
  selectedTeamId?: string;
  hoveredTeamId?: string;
  onSelectTeam?: (teamId: string) => void;
  onHoverTeam?: (teamId: string | null) => void;
  onTeamAction?: (action: string, teamId: string) => void;
  statusFilter?: TeamStatus | "ALL";
  isActionPanelOpen?: boolean;
  isRescueTeamsListOpen?: boolean;
}

const createMarkerHtml = (color: string, svgPath: string, isHighlighted = false) => `
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
  HIGHLIGHTED: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/>' // Shield with dot
};

const STATUS_ICONS: Record<TeamStatus, L.DivIcon> = {
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

const STATUS_BADGE_COLOR: Record<string, string> = {
  AVAILABLE: "bg-green-500 text-white border-transparent",
  ON_MISSION: "bg-blue-500 text-white border-transparent",
  UNAVAILABLE: "bg-red-500 text-white border-transparent",
  MAINTENANCE: "bg-orange-500 text-white border-transparent",
};

const HIGHLIGHTED_ICON = L.divIcon({
  className: "custom-marker-transparent",
  html: createMarkerHtml("#8b5cf6", ICONS_SVG.HIGHLIGHTED, true), // violet-500
  iconSize: [42, 56],
  iconAnchor: [21, 56],
});

function MapController({
  selectedTeamId,
  teams,
}: {
  selectedTeamId?: string;
  teams: RescueTeamSummary[];
}) {
  const map = useMap();
  const lastFlownTeamIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!selectedTeamId || selectedTeamId === lastFlownTeamIdRef.current) {
      return;
    }

    if (teams.length > 0) {
      const selectedTeam = teams.find((t) => t.id === selectedTeamId);
      if (selectedTeam?.baseLocation) {
        lastFlownTeamIdRef.current = selectedTeamId;

        map.invalidateSize();
        map.flyTo(
          [
            selectedTeam.baseLocation.latitude,
            selectedTeam.baseLocation.longitude,
          ],
          14,
          { animate: true, duration: 1.5 },
        );
      }
    }
  }, [selectedTeamId, teams, map]);

  useEffect(() => {
    if (!selectedTeamId) {
      lastFlownTeamIdRef.current = undefined;
    }
  }, [selectedTeamId]);

  return null;
}

export default function MapView({
  selectedTeamId,
  hoveredTeamId,
  onSelectTeam,
  onHoverTeam,
  onTeamAction,
  statusFilter = "ALL",
  isActionPanelOpen = false,
  isRescueTeamsListOpen = true,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);

  const [layerIndex, setLayerIndex] = useState(0);

  const {
    data: teams,
    isLoading,
    isError,
  } = useRescueTeams({
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  useEffect(() => {
    if (mapRef.current) {
      // Đợi một khoảng thời gian cực ngắn (100ms-200ms) để CSS Animation của ActionPanel chạy xong
      const timer = setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [selectedTeamId, teams]);
  const handleMarkerClick = (teamId: string) => {
    if (onSelectTeam) onSelectTeam(teamId);
  };

  const handleMarkerMouseEnter = (teamId: string) => {
    if (onHoverTeam) onHoverTeam(teamId);
  };

  const handleMarkerMouseLeave = () => {
    if (onHoverTeam) onHoverTeam(null);
  };

  // Các thao tác điều khiển bản đồ
  const handleSwitchLayer = () =>
    setLayerIndex((prev) => (prev + 1) % MAP_LAYERS.length);
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleFitBounds = () => {
    if (mapRef.current && teams && teams.length > 0) {
      const bounds = L.latLngBounds(
        teams
          .filter((t) => t.baseLocation)
          .map((t) => [t.baseLocation!.latitude, t.baseLocation!.longitude]),
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 relative border border-slate-200">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError || !teams || teams.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 relative border border-slate-200">
        <Layers className="h-12 w-12 text-slate-400 mb-4" />
        <p className="text-sm text-slate-600">
          Không có dữ liệu vị trí đội cứu hộ
        </p>
      </div>
    );
  }

  const filteredTeams =
    statusFilter === "ALL"
      ? teams
      : teams.filter((t) => t.status === statusFilter);
  const teamsWithLocation = filteredTeams.filter((t) => t.baseLocation);

  // STYLES CSS CAO CẤP (GLASSMORPHISM)
  const btnClass =
    "w-11 h-11 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 flex items-center justify-center text-slate-700 hover:bg-white hover:text-blue-600 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer pointer-events-auto";
  const tooltipClass =
    "absolute right-14 bg-slate-900/90 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all duration-300 pointer-events-none shadow-xl transform translate-x-2 group-hover:translate-x-0";

  // Tính toán vị trí để không đè lên các Floating Panel
  const rightOffset = (selectedTeamId && isActionPanelOpen) ? "420px" : "24px";
  const leftOffset = isRescueTeamsListOpen ? "420px" : "24px";

  return (
    <div className="w-full h-full bg-slate-50 relative">
      <div className="w-full h-full relative">
        <MapContainer
          center={[16.0544, 108.2022]} // Tâm mặc định như CitizenMap
          zoom={12}
          zoomControl={false} // Ẩn zoom gốc
          style={{ height: "100%", width: "100%", zIndex: 0 }}
          ref={mapRef}
        >
          {/* TILE LAYER */}
          <TileLayer
            key={MAP_LAYERS[layerIndex].url}
            attribution={MAP_LAYERS[layerIndex].attribution}
            url={MAP_LAYERS[layerIndex].url}
          />

          <MapController
            selectedTeamId={selectedTeamId}
            teams={teamsWithLocation}
          />

          {teamsWithLocation.map((team) => {
            const isHovered = hoveredTeamId === team.id;
            const isSelected = selectedTeamId === team.id;
            const icon =
              isHovered || isSelected
                ? HIGHLIGHTED_ICON
                : STATUS_ICONS[team.status];

            return (
              <Marker
                key={team.id}
                position={[
                  team.baseLocation!.latitude,
                  team.baseLocation!.longitude,
                ]}
                icon={icon}
                eventHandlers={{
                  click: () => handleMarkerClick(team.id),
                  mouseover: () => handleMarkerMouseEnter(team.id),
                  mouseout: handleMarkerMouseLeave,
                }}
              >
                {/* Style của Popup cũng được bo góc mềm mại hơn */}
                <Popup className="shadcn-popup">
                  <div className="flex flex-col w-[240px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-white/50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className="px-5 py-4 space-y-3">
                      <h3 className="font-semibold text-slate-800 text-base tracking-tight leading-tight">
                        {team.teamName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase font-bold",
                            STATUS_BADGE_COLOR[team.status] || "text-slate-600 bg-slate-50 border-slate-200"
                          )}
                        >
                          {dictTeamStatus[team.status] || team.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
                        {team.leader && (
                          <p className="text-xs text-slate-600 line-clamp-1">
                            <span className="font-medium text-slate-500 mr-1">
                              Chỉ huy:
                            </span>
                            <span className="font-semibold text-slate-700">{team.leader.fullName}</span>
                          </p>
                        )}
                        {team.baseLocation && (
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            <span className="font-medium text-slate-500 mr-1">
                              Cứ điểm:
                            </span>
                            <span className="font-medium text-slate-700">{team.baseLocation.address
                              ?.split(",")
                              .slice(0, 3)
                              .join(",")}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            if (onTeamAction) onTeamAction('assign_mission', team.id);
                          }}
                          className="flex-1 cursor-pointer group relative flex items-center justify-center gap-1.5 bg-[#003da5] hover:bg-blue-800 text-white text-[11px] font-bold py-2 rounded-lg shadow-md transition-all duration-300 active:scale-95"
                        >
                          <MapPin className="h-3 w-3" />
                          Phân công
                        </button>
                        <button
                          onClick={() => {
                            if (onTeamAction) onTeamAction('view_details', team.id);
                          }}
                          className="flex-1 cursor-pointer group relative flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold py-2 rounded-lg transition-all duration-300 active:scale-95"
                        >
                          <Navigation className="h-3 w-3" />
                          Chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* FLOAT BUTTONS */}
      <div
        className="absolute bottom-8 z-10 flex flex-col gap-3 items-end pointer-events-none transition-all duration-500 ease-out"
        style={{ right: rightOffset }}
      >
        {/* Nút Đổi Lớp Bản Đồ */}
        <button
          onClick={handleSwitchLayer}
          className={cn("group relative pointer-events-auto", btnClass)}
        >
          <Layers className="w-5 h-5" strokeWidth={2} />
          <span className={tooltipClass}>{MAP_LAYERS[layerIndex].name}</span>
        </button>

        {/* Nút Fit Bounds (Xem toàn bộ đội) */}
        <button
          onClick={handleFitBounds}
          className={cn("group relative pointer-events-auto", btnClass)}
        >
          <Maximize className="w-5 h-5" strokeWidth={2} />
          <span className={tooltipClass}>Xem toàn bộ bản đồ</span>
        </button>

        {/* Cụm Zoom In / Zoom Out */}
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

      {/* Label đếm số đội (Dời qua bên phải của Panel) */}
      <div
        className="absolute top-6 z-10 pointer-events-auto transition-all duration-500 ease-out"
        style={{ left: leftOffset }}
      >
        <div className="bg-white/90 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-white/50 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.8)] animate-pulse"></div>
          <span className="text-sm font-black tracking-wide text-slate-800">
            {teamsWithLocation.length} LỰC LƯỢNG TRÊN BẢN ĐỒ
          </span>
        </div>
      </div>
    </div>
  );
}
