"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";

import type { RequestSummary, RescueTeamSummary, TeamStatus } from "@/lib/api/types";
import type { OsmAddressResult } from "@/types/request";
import { cn } from "@/lib/utils";
import MAP_LAYERS from "@/constants/map-layers";
import { dictPriority, dictStatus, dictType, dictTeamStatus } from "@/constants/dictionary";

import {
  Navigation,
  Layers,
  Loader2,
  Maximize,
  Plus,
  Minus,
  MapPin,
  Clock,
  Shield,
  Send,
  Search,
  X,
  LocateFixed
} from "lucide-react";

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

// -------------------------------------------------------------
// 1. CẤU HÌNH BIỂU TƯỢNG VÀ MÀU SẮC THEO PHONG CÁCH /map
// -------------------------------------------------------------

const shadcnIcon = new L.DivIcon({
  className: "bg-transparent border-none",
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <span class="absolute inline-flex w-full h-full bg-blue-400 rounded-full opacity-50 animate-ping"></span>
      <svg class="relative z-10 w-8 h-8 text-blue-700 fill-blue-100 drop-shadow-md" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function getStatusColor(status: string) {
  switch (status) {
    case "PENDING":
      return {
        hex: "#f59e0b",
        border: "border-amber-500",
        bg: "bg-amber-500",
        text: "text-amber-500",
        ping: "bg-amber-500",
      };
    case "ACCEPTED":
      return {
        hex: "#3b82f6",
        border: "border-blue-600",
        bg: "bg-blue-600",
        text: "text-blue-600",
        ping: "bg-blue-500",
      };
    case "IN_PROGRESS":
      return {
        hex: "#6366f1",
        border: "border-indigo-600",
        bg: "bg-indigo-600",
        text: "text-indigo-600",
        ping: "bg-indigo-500",
      };
    case "COMPLETED":
    case "RESOLVED":
      return {
        hex: "#10b981",
        border: "border-emerald-500",
        bg: "bg-emerald-500",
        text: "text-emerald-500",
        ping: "",
      };
    case "CANCELED":
    case "CLOSED":
      return {
        hex: "#64748b",
        border: "border-slate-500",
        bg: "bg-slate-500",
        text: "text-slate-500",
        ping: "",
      };
    default:
      return {
        hex: "#ef4444",
        border: "border-red-600",
        bg: "bg-red-600",
        text: "text-red-600",
        ping: "bg-red-500",
      };
  }
}

function getEmergencyIconSvg(type: string, colorClass: string = "text-slate-600") {
  const baseClasses = `w-3.5 h-3.5 ${colorClass}`;
  const normalized = type ? type.toUpperCase() : "";
  
  if (normalized === "FIRE") {
    return `
      <svg class="${baseClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    `;
  }

  switch (normalized) {
    case "FLOOD":
      return `
        <svg class="${baseClasses}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 6c.6 0 1.2-.2 1.7-.6L5.3 4.3c.9-.9 2.4-.9 3.4 0l1.6 1.1c.9.9 2.4.9 3.4 0l1.6-1.1c.9-.9 2.4-.9 3.4 0l1.6 1.1c.5.4 1.1.6 1.7.6" />
          <path d="M2 12c.6 0 1.2-.2 1.7-.6L5.3 10.3c.9-.9 2.4-.9 3.4 0l1.6 1.1c.9.9 2.4.9 3.4 0l1.6-1.1c.9-.9 2.4-.9 3.4 0l1.6 1.1c.5.4 1.1.6 1.7.6" />
          <path d="M2 18c.6 0 1.2-.2 1.7-.6L5.3 16.3c.9-.9 2.4-.9 3.4 0l1.6 1.1c.9.9 2.4.9 3.4 0l1.6-1.1c.9-.9 2.4-.9 3.4 0l1.6 1.1c.5.4 1.1.6 1.7.6" />
        </svg>
      `;
    case "MEDICAL_EMERGENCY":
    case "MEDICAL":
      return `
        <svg class="${baseClasses}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5v14M5 12h14" />
        </svg>
      `;
    case "LANDSLIDE":
    case "EARTHQUAKE":
    case "NATURAL_DISASTER":
      return `
        <svg class="${baseClasses}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9v4M12 17h.01M21 19a2 2 0 01-1.73 1H4.73a2 2 0 01-1.73-3L10.27 4a2 2 0 013.46 0l7.27 13A2 2 0 0121 19z" />
        </svg>
      `;
    case "TRAFFIC_EMERGENCY":
    case "TRAFFIC":
      return `
        <svg class="${baseClasses}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 001 13v3c0 .6.4 1 1 1h2a3 3 0 006 0h4a3 3 0 006 0z" />
        </svg>
      `;
    case "BUILDING_COLLAPSE":
    case "COLLAPSE":
      return `
        <svg class="${baseClasses}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 21h18M6 21V4a2 2 0 012-2h8a2 2 0 012 2v17M9 9h6M9 13h6" />
        </svg>
      `;
    default:
      return `
        <svg class="${baseClasses}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
        </svg>
      `;
  }
}

function createRequestIcon(request: RequestSummary, isSelected: boolean) {
  const mediaUrls = request.medias ? request.medias.filter(m => m.mediaType === "IMAGE").map(m => m.mediaUrl) : [];
  const hasImage = mediaUrls.length > 0 && mediaUrls[0];
  const status = request.status || "DEFAULT";
  const color = getStatusColor(status);
  const scaleClass = isSelected ? "scale-125 -translate-y-2 z-[9999]" : "scale-100 drop-shadow-md z-10";

  if (hasImage) {
    return new L.DivIcon({
      className: "bg-transparent border-none",
      iconSize: [44, 50],
      iconAnchor: [22, 50],
      popupAnchor: [0, -50],
      html: `
        <div class="relative flex flex-col items-center w-11 h-[50px] transition-all duration-300 ${scaleClass}">
          <!-- Pulse ring -->
          ${color.ping ? `<span class="absolute top-0 inline-flex w-11 h-11 ${color.ping} rounded-full opacity-40 animate-ping"></span>` : ""}
          
          <!-- Image container -->
          <div class="relative w-11 h-11 rounded-full bg-white overflow-hidden shadow-lg flex items-center justify-center" style="border: 3px solid ${color.hex};">
            <img src="${mediaUrls[0]}" class="w-full h-full object-cover" style="width: 100%; height: 100%; border-radius: 9999px; object-fit: cover;" alt="Rescue Request" />
          </div>
          
          <!-- Pin tail pointing to coordinate -->
          <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] -mt-0.5" style="border-top-color: ${color.hex};"></div>

          <!-- Emergency category badge (top-right overlay) -->
          <div class="absolute -top-1 -right-1 w-5 h-5 rounded-full ${color.bg} border border-white flex items-center justify-center shadow-md z-20">
            ${getEmergencyIconSvg(request.emergencyType, "text-white")}
          </div>
        </div>
      `,
    });
  } else {
    return new L.DivIcon({
      className: "bg-transparent border-none",
      iconSize: [36, 46],
      iconAnchor: [18, 46],
      popupAnchor: [0, -46],
      html: `
        <div class="relative flex flex-col items-center w-9 h-[46px] transition-all duration-300 ${scaleClass}">
          <!-- Pulse ring -->
          ${color.ping ? `<span class="absolute top-0 inline-flex w-9 h-9 ${color.ping} rounded-full opacity-40 animate-ping"></span>` : ""}
          
          <!-- SVG Pin -->
          <div class="relative w-9 h-[46px] filter drop-shadow-md">
            <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 0C8.05888 0 0 8.05888 0 18C0 29.8333 18 46 18 46C18 46 36 29.8333 36 18C36 8.05888 27.9411 0 18 0Z" fill="${color.hex}"/>
              <circle cx="18" cy="18" r="11" fill="white"/>
            </svg>
            <!-- Emergency category icon overlay -->
            <div class="absolute top-[6px] left-[6px] w-6 h-6 flex items-center justify-center">
              ${getEmergencyIconSvg(request.emergencyType, color.text)}
            </div>
          </div>
        </div>
      `,
    });
  }
}

function getPopupHeaderConfig(status: string) {
  const cfg: Record<string, { headerBg: string; text: string; dot: string; ping: string | null }> = {
    PENDING: {
      headerBg: "bg-amber-50/50 border-amber-100/50",
      text: "text-amber-600",
      dot: "bg-amber-600",
      ping: "bg-amber-400",
    },
    ACCEPTED: {
      headerBg: "bg-blue-50/50 border-blue-100/50",
      text: "text-blue-600",
      dot: "bg-blue-600",
      ping: "bg-blue-400",
    },
    IN_PROGRESS: {
      headerBg: "bg-indigo-50/50 border-indigo-100/50",
      text: "text-indigo-600",
      dot: "bg-indigo-600",
      ping: "bg-indigo-400",
    },
    COMPLETED: {
      headerBg: "bg-emerald-50/50 border-emerald-100/50",
      text: "text-emerald-600",
      dot: "bg-emerald-600",
      ping: null,
    },
    RESOLVED: {
      headerBg: "bg-emerald-50/50 border-emerald-100/50",
      text: "text-emerald-600",
      dot: "bg-emerald-600",
      ping: null,
    },
    CANCELED: {
      headerBg: "bg-slate-50/50 border-slate-100/50",
      text: "text-slate-500",
      dot: "bg-slate-500",
      ping: null,
    },
    CLOSED: {
      headerBg: "bg-slate-50/50 border-slate-100/50",
      text: "text-slate-500",
      dot: "bg-slate-500",
      ping: null,
    },
  };
  return cfg[status] ?? {
    headerBg: "bg-red-50/50 border-red-100/50",
    text: "text-red-600",
    dot: "bg-red-600",
    ping: "bg-red-400",
  };
}

// -------------------------------------------------------------
// CẤU HÌNH MARKER ĐỘI CỨU HỘ VÀ POPUP THEO PHONG CÁCH MỚI
// -------------------------------------------------------------

const createTeamMarkerHtml = (color: string, svgPath: string) => `
  <div style="
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3));
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  ">
    <div style="
      background: linear-gradient(135deg, ${color}, ${color}dd);
      width: 36px;
      height: 36px;
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
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        ${svgPath}
      </svg>
    </div>
    <div style="
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 12px solid white;
      margin-top: -2px;
      z-index: 1;
      position: relative;
    ">
      <div style="
        position: absolute;
        top: -12px;
        left: -5px;
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 9px solid ${color};
      "></div>
    </div>
  </div>
`;

const TEAM_ICONS_SVG = {
  AVAILABLE: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  ON_MISSION: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  UNAVAILABLE: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  MAINTENANCE: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
};

const TEAM_STATUS_ICONS: Record<TeamStatus, L.DivIcon> = {
  AVAILABLE: L.divIcon({
    className: "custom-marker-transparent",
    html: createTeamMarkerHtml("#10b981", TEAM_ICONS_SVG.AVAILABLE), // emerald-500
    iconSize: [36, 48],
    iconAnchor: [18, 48],
  }),
  ON_MISSION: L.divIcon({
    className: "custom-marker-transparent",
    html: createTeamMarkerHtml("#3b82f6", TEAM_ICONS_SVG.ON_MISSION), // blue-500
    iconSize: [36, 48],
    iconAnchor: [18, 48],
  }),
  UNAVAILABLE: L.divIcon({
    className: "custom-marker-transparent",
    html: createTeamMarkerHtml("#f43f5e", TEAM_ICONS_SVG.UNAVAILABLE), // rose-500
    iconSize: [36, 48],
    iconAnchor: [18, 48],
  }),
  MAINTENANCE: L.divIcon({
    className: "custom-marker-transparent",
    html: createTeamMarkerHtml("#f59e0b", TEAM_ICONS_SVG.MAINTENANCE), // amber-500
    iconSize: [36, 48],
    iconAnchor: [18, 48],
  }),
};

function getTeamStatusConfig(status: string) {
  const cfg: Record<string, { headerBg: string; text: string; dot: string; ping: string | null }> = {
    AVAILABLE: {
      headerBg: "bg-emerald-50/50 border-emerald-100/50",
      text: "text-emerald-600",
      dot: "bg-emerald-600",
      ping: "bg-emerald-400",
    },
    ON_MISSION: {
      headerBg: "bg-blue-50/50 border-blue-100/50",
      text: "text-blue-600",
      dot: "bg-blue-600",
      ping: "bg-blue-400",
    },
    MAINTENANCE: {
      headerBg: "bg-amber-50/50 border-amber-100/50",
      text: "text-amber-600",
      dot: "bg-amber-600",
      ping: null,
    },
    UNAVAILABLE: {
      headerBg: "bg-red-50/50 border-red-100/50",
      text: "text-red-600",
      dot: "bg-red-600",
      ping: null,
    },
  };
  return cfg[status] ?? {
    headerBg: "bg-slate-50/50 border-slate-100/50",
    text: "text-slate-500",
    dot: "bg-slate-500",
    ping: null,
  };
}

// -------------------------------------------------------------
// 2. COMPONENT BỘ TÌM KIẾM ĐỊA ĐIỂM (MAP SEARCH CONTROL)
// -------------------------------------------------------------

function MapSearchControl({
  onSelectLocation,
}: {
  onSelectLocation: (coords: [number, number], address: string) => void;
}) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OsmAddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const skipSearch = useRef(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=vn`,
        );
        const data = await response.json();
        setResults(data);
        setOpen(true);
      } catch (error) {
        console.error("Lỗi tìm kiếm bản đồ:", error);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (item: OsmAddressResult) => {
    skipSearch.current = true;
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    onSelectLocation([lat, lon], item.display_name);
    map.flyTo([lat, lon], 16, { animate: true, duration: 1.5 });
    setOpen(false);
    setQuery(item.display_name);
  };

  return (
    <div
      className="absolute top-4 left-4 z-[1000] w-full max-w-[320px] md:max-w-[400px]"
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm địa điểm..."
          className="w-full h-11 pl-10 pr-10 bg-white border border-slate-200 rounded-xl shadow-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 pointer-events-auto"
        />

        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors pointer-events-auto"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
          {results.map((item, index) => (
            <button
              key={item.place_id || index}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-none flex flex-col gap-0.5 transition-colors cursor-pointer"
            >
              <span className="font-medium text-slate-900 truncate">
                {item.display_name.split(",")[0]}
              </span>
              <span className="text-xs text-slate-500 truncate">
                {item.display_name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 3. ĐIỀU KHIỂN BẢN ĐỒ TỰ ĐỘNG KHI CHỌN SỰ CỐ TỪ DANH SÁCH BÊN NGOÀI
// -------------------------------------------------------------

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

// -------------------------------------------------------------
// 4. TRANG BẢN ĐỒ ĐIỀU PHỐI VIÊN CHÍNH (DISPATCHER MAP VIEW)
// -------------------------------------------------------------

export default function DispatcherMapView({
  requests,
  teams,
  selectedRequestId,
  onSelectRequest,
  onAssignRequest,
  onViewTeamDetails,
}: DispatcherMapViewProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [layerIndex, setLayerIndex] = useState(0);

  // States hỗ trợ chức năng tìm kiếm & định vị giống /map
  const [position, setPosition] = useState<[number, number]>([
    16.0544, 108.2022,
  ]);
  const [popupContent, setPopupContent] = useState("Vị trí cứu hộ");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [requests, teams]);

  const handleSwitchLayer = () => setLayerIndex((prev) => (prev + 1) % MAP_LAYERS.length);
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  const handleLocate = () => {
    if (!mapRef.current) return;

    if (!navigator.geolocation) {
      toast.error("Lỗi định vị", {
        description: "Trình duyệt hoặc thiết bị của bạn không hỗ trợ định vị GPS.",
      });
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setPosition(newCoords);
        setPopupContent("Vị trí của bạn");
        mapRef.current?.flyTo(newCoords, 16);
        setIsLocating(false);

        toast.success("Đã định vị thành công", {
          description: "Bản đồ đã di chuyển đến vị trí hiện tại của bạn.",
        });
      },
      (error) => {
        setIsLocating(false);
        let errorMessage = "Đã xảy ra lỗi không xác định khi lấy GPS.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Bạn đã từ chối cấp quyền vị trí. Vui lòng cấp quyền lại trong cài đặt.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Không thể xác định được vị trí hiện tại (Mất tín hiệu GPS).";
            break;
          case error.TIMEOUT:
            errorMessage = "Quá thời gian chờ lấy tọa độ. Vui lòng thử lại.";
            break;
        }
        toast.error("Không thể lấy tọa độ", {
          description: errorMessage,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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

  const handleSelectSearchResult = (
    coords: [number, number],
    address: string,
  ) => {
    setPosition(coords);
    setPopupContent(address);
  };

  const requestsWithLocation = requests.filter(r => r.location?.latitude && r.location?.longitude);
  const teamsWithLocation = teams.filter(t => t.baseLocation?.latitude && t.baseLocation?.longitude);

  // Class style nút bấm đồng bộ hoàn toàn với /map
  const btnClass = "w-10 h-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center text-[#20448c] hover:bg-blue-50 hover:text-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer pointer-events-auto";
  const tooltipClass = "absolute right-12 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none";

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
          {/* Bộ tìm kiếm địa điểm trên bản đồ */}
          <MapSearchControl onSelectLocation={handleSelectSearchResult} />

          <TileLayer
            key={MAP_LAYERS[layerIndex].url}
            attribution={MAP_LAYERS[layerIndex].attribution}
            url={MAP_LAYERS[layerIndex].url}
          />

          <MapController
            selectedRequestId={selectedRequestId}
            requests={requestsWithLocation}
          />

          {/* Render Marker tìm kiếm thủ công */}
          <Marker position={position} icon={shadcnIcon}>
            <Popup className="shadcn-popup">
              <div className="font-semibold text-slate-900 line-clamp-1">
                {popupContent}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {position[0].toFixed(5)}, {position[1].toFixed(5)}
              </div>
            </Popup>
          </Marker>

          {/* Render Teams Markers */}
          {teamsWithLocation.map((team) => {
            const teamCfg = getTeamStatusConfig(team.status);
            return (
              <Marker
                key={team.id}
                position={[team.baseLocation!.latitude, team.baseLocation!.longitude]}
                icon={TEAM_STATUS_ICONS[team.status]}
                zIndexOffset={100} // các đội cứu hộ ở dưới sự cố
              >
                <Popup className="shadcn-popup">
                  <div className="flex flex-col w-[240px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className={cn("px-3 py-2 border-b flex items-center justify-between", teamCfg.headerBg)}>
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          {teamCfg.ping && (
                            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", teamCfg.ping)}></span>
                          )}
                          <span className={cn("relative inline-flex rounded-full h-2 w-2", teamCfg.dot)}></span>
                        </span>
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", teamCfg.text)}>
                          {dictTeamStatus[team.status] || team.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
                        <Shield className="w-3 h-3 text-slate-400" />
                        LỰC LƯỢNG
                      </span>
                    </div>

                    <div className="p-3 space-y-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base leading-none truncate">
                          {team.teamName}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1.5 flex items-start gap-1 leading-relaxed">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{team.baseLocation?.address ?? "Chưa rõ vị trí"}</span>
                        </p>
                      </div>

                      {onViewTeamDetails && (
                        <button 
                          className="w-full cursor-pointer group relative flex items-center justify-center gap-2 bg-[#003da5] hover:bg-blue-700 text-white text-[11px] font-bold py-2.5 rounded-xl transition-all duration-300 active:scale-95 overflow-hidden"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewTeamDetails(team.id);
                          }}
                        >
                          <Navigation className="w-3.5 h-3.5 mr-1" />
                          <span className="relative z-10">
                            Xem chi tiết đội
                          </span>
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Render Request Markers */}
          {requestsWithLocation.map((req) => {
            const isSelected = selectedRequestId === req.id;
            return (
              <Marker
                key={req.id}
                position={[req.location!.latitude, req.location!.longitude]}
                icon={createRequestIcon(req, isSelected)}
                zIndexOffset={1000 + (isSelected ? 100 : 0)} // sự cố được xếp đè lên trên các đội cứu hộ
                eventHandlers={{
                  click: () => {
                    onSelectRequest?.(req);
                    onAssignRequest?.(req);
                  },
                }}
              />
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
          <Layers className="w-5 h-5" strokeWidth={2.5} />
          <span className={tooltipClass}>{MAP_LAYERS[layerIndex].name}</span>
        </button>

        <button
          onClick={handleFitBounds}
          className={cn("group relative pointer-events-auto", btnClass)}
        >
          <Maximize className="w-5 h-5" strokeWidth={2.5} />
          <span className={tooltipClass}>Xem toàn bộ</span>
        </button>

        <button
          onClick={handleLocate}
          disabled={isLocating}
          className={cn("group relative pointer-events-auto", btnClass, isLocating && "opacity-70")}
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
          ) : (
            <LocateFixed className="w-5 h-5" strokeWidth={2.5} />
          )}
          <span className={tooltipClass}>Định vị GPS</span>
        </button>

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
      
      {/* Legend / Stats */}
      <div className="absolute top-4 right-4 z-[400] pointer-events-none flex flex-col gap-2">
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
