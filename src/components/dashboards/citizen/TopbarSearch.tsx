"use client";

import FlyToLocationButton from "@/components/shared/FlyToLocationButton";
import { Input } from "@/components/ui/input";
import { dictType } from "@/constants/dictionary";
import { useCitizenRequestsQuery } from "@/lib/api/features/requests/citizen.queries";
import type { RequestDetail } from "@/types/request";
import { AlertTriangle, MapPin, Search, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
const EMPTY_REQUESTS: RequestDetail[] = [];

export default function TopbarSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { data } = useCitizenRequestsQuery();
  const requests = data?.items ?? EMPTY_REQUESTS;

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim() === "") {
      setIsDropdownOpen(false);
      return;
    }

    setIsDropdownOpen(true);
  };

  const results = useMemo(() => {
    if (searchTerm.trim() === "") {
      return [];
    }

    const lowerTerm = searchTerm.toLowerCase();

    return requests.filter(
      (req) =>
        req.location?.address?.toLowerCase().includes(lowerTerm) ||
        req.requestedBy?.fullName?.toLowerCase().includes(lowerTerm) ||
        dictType[req.emergencyType]?.toLowerCase().includes(lowerTerm),
    );
  }, [requests, searchTerm]);

  const handleSelectResult = (request: RequestDetail) => {
    setSearchTerm("");
    setIsDropdownOpen(false);

    if (request.location?.latitude && request.location?.longitude) {
      const event = new CustomEvent("MOVE_MAP", {
        detail: {
          lat: request.location.latitude,
          lng: request.location.longitude,
        },
      });
      window.dispatchEvent(event);
    }
  };

  const handleCloseDropdown = () => {
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  return (
    <div ref={searchContainerRef} className="relative w-full z-100">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Tìm kiếm theo địa chỉ, người gọi, hoặc loại sự cố..."
        className="pl-10 rounded-full bg-slate-100 border-transparent focus-visible:ring-blue-300 w-full shadow-sm"
      />

      {isDropdownOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
            Tìm thấy {results.length} sự cố
          </div>
          {results.map((req) => (
            <div
              key={req.id}
              onClick={() => handleSelectResult(req)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-50 last:border-none transition-colors group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-blue-900 group-hover:text-blue-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                  {dictType[req.emergencyType] || req.emergencyType}
                </span>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                  {req.priority}
                </span>
              </div>

              <div className="text-xs text-slate-600 flex items-start gap-1.5 mt-1.5">
                <div className="text-xs text-slate-600 flex items-start gap-1.5 pr-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{req.location?.address}</span>
                </div>
                {req.location?.latitude && (
                  <FlyToLocationButton
                    lat={req.location.latitude}
                    lng={req.location.longitude}
                    label="BAY TỚI"
                    onAfterClick={handleCloseDropdown}
                  />
                )}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {req.requestedBy?.fullName} - {req.requestedBy?.phoneNumber}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isDropdownOpen && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-center text-sm text-slate-500">
          Không tìm thấy sự cố nào phù hợp.
        </div>
      )}
    </div>
  );
}
