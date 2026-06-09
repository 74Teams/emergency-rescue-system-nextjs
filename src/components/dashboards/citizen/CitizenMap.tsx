"use client";

import { dictPriority, dictStatus, dictType } from "@/constants/dictionary";
import { cn } from "@/lib/utils";

import { OsmAddressResult, RequestDetail } from "@/types/request";

import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Layers,
  Loader2,
  LocateFixed,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { toast } from "sonner";
import RequestDetailDialog from "./CitizenRequestDetailDialog";

import MAP_LAYERS from "@/constants/map-layers";

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
    case "IN_PROGRESS":
      return {
        hex: "#3b82f6",
        border: "border-blue-600",
        bg: "bg-blue-600",
        text: "text-blue-600",
        ping: "bg-blue-500",
      };
    case "RESOLVED":
      return {
        hex: "#10b981",
        border: "border-emerald-500",
        bg: "bg-emerald-500",
        text: "text-emerald-500",
        ping: "",
      };
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
  const isFire = type === "FIRE";
  const baseClasses = `w-3.5 h-3.5 ${colorClass}`;

  if (isFire) {
    return `
      <svg class="${baseClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    `;
  }

  switch (type) {
    case "FLOOD":
      return `
        <svg class="${baseClasses}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 6c.6 0 1.2-.2 1.7-.6L5.3 4.3c.9-.9 2.4-.9 3.4 0l1.6 1.1c.9.9 2.4.9 3.4 0l1.6-1.1c.9-.9 2.4-.9 3.4 0l1.6 1.1c.5.4 1.1.6 1.7.6" />
          <path d="M2 12c.6 0 1.2-.2 1.7-.6L5.3 10.3c.9-.9 2.4-.9 3.4 0l1.6 1.1c.9.9 2.4.9 3.4 0l1.6-1.1c.9-.9 2.4-.9 3.4 0l1.6 1.1c.5.4 1.1.6 1.7.6" />
          <path d="M2 18c.6 0 1.2-.2 1.7-.6L5.3 16.3c.9-.9 2.4-.9 3.4 0l1.6 1.1c.9.9 2.4.9 3.4 0l1.6-1.1c.9-.9 2.4-.9 3.4 0l1.6 1.1c.5.4 1.1.6 1.7.6" />
        </svg>
      `;
    case "MEDICAL":
      return `
        <svg class="${baseClasses}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5v14M5 12h14" />
        </svg>
      `;
    case "LANDSLIDE":
    case "EARTHQUAKE":
      return `
        <svg class="${baseClasses}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9v4M12 17h.01M21 19a2 2 0 01-1.73 1H4.73a2 2 0 01-1.73-3L10.27 4a2 2 0 013.46 0l7.27 13A2 2 0 0121 19z" />
        </svg>
      `;
    case "TRAFFIC":
      return `
        <svg class="${baseClasses}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 001 13v3c0 .6.4 1 1 1h2a3 3 0 006 0h4a3 3 0 006 0z" />
        </svg>
      `;
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

function createRequestIcon(request: RequestDetail) {
  const mediaUrls = request.mediaUrl ?? [];
  const hasImage = mediaUrls.length > 0 && mediaUrls[0];
  const status = request.status || "DEFAULT";
  const color = getStatusColor(status);

  if (hasImage) {
    return new L.DivIcon({
      className: "bg-transparent border-none",
      iconSize: [44, 50],
      iconAnchor: [22, 50],
      popupAnchor: [0, -50],
      html: `
        <div class="relative flex flex-col items-center w-11 h-[50px]">
          <!-- Pulse ring -->
          ${color.ping ? `<span class="absolute top-0 inline-flex w-11 h-11 ${color.ping} rounded-full opacity-40 animate-ping"></span>` : ""}
          
          <!-- Image container -->
          <div class="relative w-11 h-11 rounded-full bg-white overflow-hidden shadow-lg z-10 flex items-center justify-center" style="border: 3px solid ${color.hex};">
            <img src="${mediaUrls[0]}" class="w-full h-full object-cover" style="width: 100%; height: 100%; border-radius: 9999px; object-fit: cover;" alt="Rescue Request" />
          </div>
          
          <!-- Pin tail pointing to coordinate -->
          <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] -mt-0.5 z-10" style="border-top-color: ${color.hex};"></div>

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
        <div class="relative flex flex-col items-center w-9 h-[46px]">
          <!-- Pulse ring -->
          ${color.ping ? `<span class="absolute top-0 inline-flex w-9 h-9 ${color.ping} rounded-full opacity-40 animate-ping"></span>` : ""}
          
          <!-- SVG Pin -->
          <div class="relative z-10 w-9 h-[46px] filter drop-shadow-md">
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
    IN_PROGRESS: {
      headerBg: "bg-blue-50/50 border-blue-100/50",
      text: "text-blue-600",
      dot: "bg-blue-600",
      ping: "bg-blue-400",
    },
    RESOLVED: {
      headerBg: "bg-emerald-50/50 border-emerald-100/50",
      text: "text-emerald-600",
      dot: "bg-emerald-600",
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

function MapSearchControl({
  onSelectLocation,
  children,
}: {
  onSelectLocation: (coords: [number, number], address: string) => void;
  children?: React.ReactNode;
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
        console.error("Lỗi search:", error);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // 3. CHUẨN HÓA HÀM SELECT: Khai báo rõ item là OsmAddressResult
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
      className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 z-[1000] flex flex-col gap-2 pointer-events-none"
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {/* Search bar row */}
      <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[420px] pointer-events-auto">
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
            className="w-full h-10 md:h-11 pl-10 pr-10 bg-white border border-slate-200 rounded-xl shadow-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800"
          />

          {query && (
            <button
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {open && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-[1001] mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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

      {/* Filter buttons row — wraps on mobile */}
      <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 w-full min-w-0">
        {children}
      </div>
    </div>
  );
}

export default function Map({ requests }: { requests: RequestDetail[] }) {
  const [position, setPosition] = useState<[number, number]>([
    16.0544, 108.2022,
  ]);
  const [layerIndex, setLayerIndex] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [popupContent, setPopupContent] = useState("Vị trí cứu hộ");

  const mapRef = useRef<LeafletMap | null>(null);
  const markerRefs = useRef<{ [key: string]: any }>({});

  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filterOptions = [
    {
      label: "Chờ xử lý",
      statuses: ["PENDING"],
      dotColor: "bg-amber-500",
      activeBg: "bg-amber-500 border-amber-500 text-white shadow-amber-200",
      inactiveBg: "bg-white hover:bg-amber-50 border-slate-200/80 text-slate-600 hover:border-amber-300"
    },
    {
      label: "Đang được tiếp nhận",
      statuses: ["ACCEPTED"],
      dotColor: "bg-orange-500",
      activeBg: "bg-orange-500 border-orange-500 text-white shadow-orange-200",
      inactiveBg: "bg-white hover:bg-orange-50 border-slate-200/80 text-slate-600 hover:border-orange-300"
    },
    {
      label: "Đang xử lý",
      statuses: ["IN_PROGRESS"],
      dotColor: "bg-blue-600",
      activeBg: "bg-blue-600 border-blue-600 text-white shadow-blue-200",
      inactiveBg: "bg-white hover:bg-blue-50 border-slate-200/80 text-slate-600 hover:border-blue-300"
    },
    {
      label: "Đã giải quyết",
      statuses: ["COMPLETED", "RESOLVED", "CLOSED"],
      dotColor: "bg-emerald-500",
      activeBg: "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200",
      inactiveBg: "bg-white hover:bg-emerald-50 border-slate-200/80 text-slate-600 hover:border-emerald-300"
    },
    {
      label: "Đã hủy",
      statuses: ["CANCELED", "REJECTED", "ABORTED"],
      dotColor: "bg-slate-500",
      activeBg: "bg-slate-600 border-slate-600 text-white shadow-slate-200",
      inactiveBg: "bg-white hover:bg-slate-50 border-slate-200/80 text-slate-600 hover:border-slate-400"
    }
  ];

  const handleToggleFilter = (label: string) => {
    setSelectedFilters((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const handleResetFilters = () => {
    setSelectedFilters([]);
  };

  const getCount = (statuses: string[]) => {
    return requests.filter(r => statuses.includes(r.status)).length;
  };

  const filteredRequests = requests.filter((req) => {
    if (selectedFilters.length === 0) return true;
    const activeOptions = filterOptions.filter(opt => selectedFilters.includes(opt.label));
    return activeOptions.some(opt => opt.statuses.includes(req.status));
  });

  useEffect(() => {
    const handleMoveMap = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { lat, lng, requestId } = customEvent.detail;
      const numLat = Number(lat);
      const numLng = Number(lng);

      if (mapRef.current && !isNaN(numLat) && !isNaN(numLng)) {
        mapRef.current.flyTo([numLat, numLng], 17, { animate: true, duration: 1.5 });
      }

      if (requestId) {
        setTimeout(() => {
          const marker = markerRefs.current[requestId];
          if (marker) {
            marker.openPopup();
          }
        }, 100);
      }
    };

    window.addEventListener("MOVE_MAP", handleMoveMap);
    return () => window.removeEventListener("MOVE_MAP", handleMoveMap);
  }, []);

  const handleSwitchLayer = () =>
    setLayerIndex((prev) => (prev + 1) % MAP_LAYERS.length);

  const handleLocate = () => {
    if (!mapRef.current) return;

    if (!navigator.geolocation) {
      toast.error("Lỗi định vị", {
        description:
          "Trình duyệt hoặc thiết bị của bạn không hỗ trợ định vị GPS.",
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

        toast.success(" Đã định vị thành công", {
          description: "Bản đồ đã di chuyển đến vị trí hiện tại của bạn.",
        });
      },
      (error) => {
        setIsLocating(false);

        let errorMessage = "Đã xảy ra lỗi không xác định khi lấy GPS.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Bạn đã từ chối cấp quyền vị trí. Vui lòng mở cài đặt trình duyệt và cấp quyền lại!";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Không thể xác định được vị trí hiện tại của bạn (Mất tín hiệu GPS).";
            break;
          case error.TIMEOUT:
            errorMessage =
              "Quá thời gian chờ lấy tọa độ. Vui lòng kiểm tra lại mạng hoặc thử lại.";
            break;
        }

        toast.error("Không thể lấy tọa độ", {
          description: errorMessage,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleSelectSearchResult = (
    coords: [number, number],
    address: string,
  ) => {
    setPosition(coords);
    setPopupContent(address);
  };

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const btnClass =
    "w-10 h-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center text-[#20448c] hover:bg-blue-50 hover:text-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer";
  const tooltipClass =
    "absolute right-12 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none";

  return (
    <div className="w-full h-full bg-slate-50 relative">
      <div className="w-full h-full rounded-sm overflow-hidden border border-slate-200 shadow-sm relative">
        <MapContainer
          ref={mapRef}
          center={position}
          zoom={12}
          zoomControl={false}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <MapSearchControl onSelectLocation={handleSelectSearchResult}>
            {/* Tất cả button */}
            <button
              onClick={handleResetFilters}
              className={cn(
                "flex items-center gap-1.5 px-2.5 md:px-3 h-8 md:h-9 rounded-lg border text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shadow-md whitespace-nowrap",
                selectedFilters.length === 0
                  ? "bg-blue-600 border-blue-600 text-white shadow-blue-200"
                  : "bg-white hover:bg-slate-50 border-slate-200/80 text-slate-600 hover:border-blue-300"
              )}
            >
              <span className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                selectedFilters.length === 0 ? "bg-white animate-pulse" : "bg-slate-400"
              )} />
              Tất cả ({requests.length})
            </button>

            {/* Individual status buttons */}
            {filterOptions.map((opt) => {
              const isActive = selectedFilters.includes(opt.label);
              const count = getCount(opt.statuses);
              return (
                <button
                  key={opt.label}
                  onClick={() => handleToggleFilter(opt.label)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 md:px-3 h-8 md:h-9 rounded-lg border text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shadow-md whitespace-nowrap",
                    isActive ? opt.activeBg : opt.inactiveBg
                  )}
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    isActive ? "bg-white animate-pulse" : opt.dotColor
                  )} />
                  {opt.label} ({count})
                </button>
              );
            })}

            {/* Reset button */}
            {selectedFilters.length > 0 && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 md:px-3 h-8 md:h-9 rounded-lg border border-rose-300 bg-rose-500 text-white hover:bg-rose-600 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shadow-md whitespace-nowrap"
              >
                <X className="w-3 h-3" />
                Đặt lại
              </button>
            )}
          </MapSearchControl>

          <TileLayer
            key={MAP_LAYERS[layerIndex].url}
            attribution={MAP_LAYERS[layerIndex].attribution}
            url={MAP_LAYERS[layerIndex].url}
          />

          {filteredRequests &&
            filteredRequests.map((request) => {
              const cfg = getPopupHeaderConfig(request.status);
              return (
                <Marker
                  key={request.id}
                  position={[
                    request.location?.latitude || 16.0544,
                    request.location?.longitude || 108.2022,
                  ]}
                  icon={createRequestIcon(request)}
                  ref={(r) => {
                    markerRefs.current[request.id] = r;
                  }}
                >
                  <Popup className="shadcn-popup" autoPan={false}>
                    <div className="flex flex-col w-[200px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                      <div className={cn("px-3 py-2 border-b flex items-center justify-between", cfg.headerBg)}>
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            {cfg.ping && (
                              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", cfg.ping)}></span>
                            )}
                            <span className={cn("relative inline-flex rounded-full h-2 w-2", cfg.dot)}></span>
                          </span>
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider", cfg.text)}>
                            {dictPriority[request.priority] || request.priority}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          ID-{request.id?.substring(0, 4)}
                        </span>
                      </div>

                      <div className="p-3 space-y-3">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base leading-none">
                            {dictType[request.emergencyType] ||
                              request.emergencyType}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {dictStatus[request.status] || request.status}
                            {" · "}
                            {request.location?.address
                              ? request.location.address
                                .split(",")
                                .slice(0, 2)
                                .join(",")
                              : "Đang cập nhật vị trí"}
                          </p>
                        </div>

                        <RequestDetailDialog request={request}>
                          <button className="w-full cursor-pointer group relative flex items-center justify-center gap-2 bg-[#003da5] hover:bg-blue-700 text-white text-[11px] font-bold py-2.5 rounded-xl transition-all duration-300 active:scale-95 overflow-hidden">
                            <span className="relative z-10">
                              Xem chi tiết báo cáo
                            </span>
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </RequestDetailDialog>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

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
        </MapContainer>
      </div>



      <div className="absolute bottom-6 md:bottom-20 right-3 md:right-6 z-10 flex flex-col gap-2 md:gap-3 items-end pointer-events-none">
        <button
          onClick={handleSwitchLayer}
          className={cn(`group relative pointer-events-auto`, btnClass)}
        >
          <Layers className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
          <span className={tooltipClass}>{MAP_LAYERS[layerIndex].name}</span>
        </button>

        <button
          onClick={handleLocate}
          disabled={isLocating}
          className={`group relative ${btnClass} ${isLocating ? "opacity-70" : ""} pointer-events-auto`}
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" strokeWidth={2.5} />
          ) : (
            <LocateFixed className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
          )}
          <span className={tooltipClass}>Định vị GPS</span>
        </button>

        <div className="flex flex-col bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden w-9 md:w-10 pointer-events-auto">
          <button
            onClick={handleZoomIn}
            className="group relative w-full h-9 md:h-10 flex items-center justify-center text-[#20448c] hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 transition-colors border-b border-slate-100 cursor-pointer"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
            <span className={`${tooltipClass} z-50`}>Phóng to</span>
          </button>

          <button
            onClick={handleZoomOut}
            className="group relative w-full h-9 md:h-10 flex items-center justify-center text-[#20448c] hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
            <span className={`${tooltipClass} z-50`}>Thu nhỏ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
