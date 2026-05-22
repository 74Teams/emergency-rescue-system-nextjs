"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { RescueTeamSummary, TeamStatus } from "@/lib/api/types";
import { useRescueTeams } from "@/lib/api/features/commander/commander-dashboard.queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Dùng các Icon giống hệt bên CitizenMap
import {
  Navigation,
  Layers,
  Loader2,
  Maximize,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MAP_LAYERS from "@/constants/map-layers"; // IMPORT LỚP BẢN ĐỒ XỊN SÒ TỪ CITIZEN MAP

// Fix Leaflet default icon issue in Next.js
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
  statusFilter?: TeamStatus | "ALL";
}

// Custom marker icons theo status (giữ nguyên logic gốc)
const STATUS_ICONS: Record<TeamStatus, L.DivIcon> = {
  AVAILABLE: L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: #22c55e; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
  ON_MISSION: L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
  UNAVAILABLE: L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
  MAINTENANCE: L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: #f97316; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
};

const HIGHLIGHTED_ICON = L.divIcon({
  className: "custom-marker",
  html: `<div style="background-color: #8b5cf6; width: 32px; height: 32px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4); animation: pulse 2s infinite;"></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
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
          15,
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
  statusFilter = "ALL",
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

  // STYLES CSS ĐƯỢC BÊ NGUYÊN TỪ CITIZEN MAP
  const btnClass =
    "w-10 h-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center text-[#20448c] hover:bg-blue-50 hover:text-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer pointer-events-auto";
  const tooltipClass =
    "absolute right-12 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none";

  return (
    <div className="w-full h-full bg-slate-50 relative">
      <div className="w-full h-full rounded-sm overflow-hidden border border-slate-200 shadow-sm relative">
        <MapContainer
          center={[16.0544, 108.2022]} // Tâm mặc định như CitizenMap
          zoom={12}
          zoomControl={false} // Ẩn zoom gốc
          style={{ height: "100%", width: "100%", zIndex: 0 }}
          ref={mapRef}
        >
          {/* TILE LAYER ĐẸP LẤY TỪ MAP_LAYERS */}
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
                  <div className="flex flex-col w-[200px] bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className="px-3 py-3 space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-sm leading-none">
                        {team.teamName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold text-slate-600 bg-slate-50"
                        >
                          {team.status}
                        </Badge>
                      </div>

                      <div className="space-y-1 mt-2">
                        {team.leader && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            <span className="font-semibold text-slate-700">
                              Chỉ huy:
                            </span>{" "}
                            {team.leader.fullName}
                          </p>
                        )}
                        {team.baseLocation && (
                          <p className="text-xs text-slate-500 line-clamp-2">
                            <span className="font-semibold text-slate-700">
                              Cứ điểm:
                            </span>{" "}
                            {team.baseLocation.address
                              ?.split(",")
                              .slice(0, 3)
                              .join(",")}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleMarkerClick(team.id)}
                        className="w-full mt-2 cursor-pointer group relative flex items-center justify-center gap-2 bg-[#003da5] hover:bg-blue-700 text-white text-[11px] font-bold py-2 rounded-lg transition-all duration-300 active:scale-95 overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center">
                          <Navigation className="h-3 w-3 mr-1" /> Chi tiết
                        </span>
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* FLOAT BUTTONS ĐƯỢC THIẾT KẾ Y HỆT CITIZEN MAP */}
      <div className="absolute bottom-10 right-6 z-10 flex flex-col gap-3 items-end pointer-events-none">
        {/* Nút Đổi Lớp Bản Đồ */}
        <button
          onClick={handleSwitchLayer}
          className={cn("group relative pointer-events-auto", btnClass)}
        >
          <Layers className="w-5 h-5" strokeWidth={2.5} />
          <span className={tooltipClass}>{MAP_LAYERS[layerIndex].name}</span>
        </button>

        {/* Nút Fit Bounds (Xem toàn bộ đội) */}
        <button
          onClick={handleFitBounds}
          className={cn("group relative pointer-events-auto", btnClass)}
        >
          <Maximize className="w-5 h-5" strokeWidth={2.5} />
          <span className={tooltipClass}>Xem toàn bộ đội</span>
        </button>

        {/* Cụm Zoom In / Zoom Out */}
        <div className="flex flex-col bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden w-10 pointer-events-auto">
          <button
            onClick={handleZoomIn}
            className="group relative w-full h-10 flex items-center justify-center text-[#20448c] hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 transition-colors border-b border-slate-100 cursor-pointer"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            <span className={`${tooltipClass} z-50`}>Phóng to</span>
          </button>
          <button
            onClick={handleZoomOut}
            className="group relative w-full h-10 flex items-center justify-center text-[#20448c] hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 transition-colors cursor-pointer"
          >
            <Minus className="w-5 h-5" strokeWidth={3} />
            <span className={`${tooltipClass} z-50`}>Thu nhỏ</span>
          </button>
        </div>
      </div>

      {/* Label đếm số đội (Dời lên góc trên cùng) */}
      <div className="absolute top-4 left-4 z-10 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md border border-slate-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
          <span className="text-sm font-bold text-[#003da5]">
            {teamsWithLocation.length} Đội Cứu Hộ
          </span>
        </div>
      </div>
    </div>
  );
}
