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

const rescuePinIcons: Record<string, L.DivIcon> = {
  PENDING: new L.DivIcon({
    className: "bg-transparent border-none",
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <span class="absolute inline-flex w-full h-full bg-amber-500 rounded-full opacity-75 animate-ping"></span>
        <div class="relative w-3 h-3 bg-amber-600 rounded-full border-2 border-white shadow-sm"></div>
      </div>
    `,
    iconSize: [24, 24],
  }),
  IN_PROGRESS: new L.DivIcon({
    className: "bg-transparent border-none",
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <span class="absolute inline-flex w-full h-full bg-blue-500 rounded-full opacity-75 animate-ping"></span>
        <div class="relative w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>
      </div>
    `,
    iconSize: [24, 24],
  }),
  RESOLVED: new L.DivIcon({
    className: "bg-transparent border-none",
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <div class="relative w-3 h-3 bg-emerald-600 rounded-full border-2 border-white shadow-sm"></div>
      </div>
    `,
    iconSize: [24, 24],
  }),
  CLOSED: new L.DivIcon({
    className: "bg-transparent border-none",
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <div class="relative w-3 h-3 bg-slate-500 rounded-full border-2 border-white shadow-sm"></div>
      </div>
    `,
    iconSize: [24, 24],
  }),
  DEFAULT: new L.DivIcon({
    className: "bg-transparent border-none",
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <span class="absolute inline-flex w-full h-full bg-red-500 rounded-full opacity-75 animate-ping"></span>
        <div class="relative w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-sm"></div>
      </div>
    `,
    iconSize: [24, 24],
  }),
};

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
      className="absolute top-4 left-4 z-1000 w-full max-w-[320px] md:max-w-[400px]"
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
          className="w-full h-11 pl-10 pr-10 bg-white border border-slate-200 rounded-xl shadow-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800"
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
        <div className="mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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

export default function Map({ requests }: { requests: RequestDetail[] }) {
  const [position, setPosition] = useState<[number, number]>([
    16.0544, 108.2022,
  ]);
  const [layerIndex, setLayerIndex] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [popupContent, setPopupContent] = useState("Vị trí cứu hộ");

  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    const handleMoveMap = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { lat, lng } = customEvent.detail;

      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 17, { animate: true, duration: 2 });
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
          <MapSearchControl onSelectLocation={handleSelectSearchResult} />

          <TileLayer
            key={MAP_LAYERS[layerIndex].url}
            attribution={MAP_LAYERS[layerIndex].attribution}
            url={MAP_LAYERS[layerIndex].url}
          />

          {requests &&
            requests.map((request) => {
              const cfg = getPopupHeaderConfig(request.status);
              return (
                <Marker
                  key={request.id}
                  position={[
                    request.location?.latitude || 16.0544,
                    request.location?.longitude || 108.2022,
                  ]}
                  icon={rescuePinIcons[request.status] ?? rescuePinIcons.DEFAULT}
                >
                  <Popup className="shadcn-popup">
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

      <div className="absolute bottom-20 right-6 z-10 flex flex-col gap-3 items-end pointer-events-none">
        <button
          onClick={handleSwitchLayer}
          className={cn(`group relative pointer-events-auto`, btnClass)}
        >
          <Layers className="w-5 h-5" strokeWidth={2.5} />
          <span className={tooltipClass}>{MAP_LAYERS[layerIndex].name}</span>
        </button>

        <button
          onClick={handleLocate}
          disabled={isLocating}
          className={`group relative ${btnClass} ${isLocating ? "opacity-70" : ""} pointer-events-auto`}
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
    </div>
  );
}
