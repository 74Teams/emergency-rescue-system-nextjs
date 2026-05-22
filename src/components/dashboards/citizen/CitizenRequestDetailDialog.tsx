"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { dictPriority, dictStatus, dictType } from "@/constants/dictionary";
import { cn } from "@/lib/utils";
import FlyToLocationButton from "@/components/shared/FlyToLocationButton";
import type { RequestDetail } from "@/types/request";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ImageOff,
  MapPin,
  Navigation,
  Phone,
  Radio,
  User,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

// ─── Status config ────────────────────────────────────────────────────────────
function statusConfig(status: string) {
  const cfg: Record<string, { color: string; icon: React.ReactNode }> = {
    PENDING:     { color: "text-amber-700 bg-amber-50 border-amber-200",   icon: <Clock className="size-3" /> },
    IN_PROGRESS: { color: "text-blue-700 bg-blue-50 border-blue-200",      icon: <Radio className="size-3" /> },
    RESOLVED:    { color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="size-3" /> },
    CLOSED:      { color: "text-slate-500 bg-slate-50 border-slate-200",   icon: <XCircle className="size-3" /> },
    ON_MISSION:  { color: "text-violet-700 bg-violet-50 border-violet-200", icon: <Radio className="size-3" /> },
  };
  return cfg[status] ?? cfg.CLOSED;
}

const priorityColors: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  HIGH:     "bg-orange-100 text-orange-700 border-orange-200",
  MEDIUM:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  LOW:      "bg-slate-100 text-slate-600 border-slate-200",
};

// ─── Image Gallery ────────────────────────────────────────────────────────────
function ImageGallery({ urls }: { urls: string[] }) {
  const [active, setActive] = useState(0);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  if (urls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-40 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
        <ImageOff className="size-8 text-slate-300" />
        <p className="text-xs text-slate-400">Không có hình ảnh đính kèm</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Main image */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
        {imgError[active] ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
            <ImageOff className="size-8" />
            <p className="text-xs">Không tải được ảnh</p>
          </div>
        ) : (
          <Image
            src={urls[active]}
            alt={`Hình ảnh ${active + 1}`}
            fill
            unoptimized
            className="object-cover"
            onError={() => setImgError((prev) => ({ ...prev, [active]: true }))}
          />
        )}

        {/* Prev / Next arrows */}
        {urls.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((p) => (p - 1 + urls.length) % urls.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setActive((p) => (p + 1) % urls.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>

            {/* Counter badge */}
            <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-black/50 text-white px-2 py-0.5 rounded-full">
              {active + 1} / {urls.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {urls.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {urls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative shrink-0 size-14 rounded-lg overflow-hidden border-2 transition-all",
                active === i ? "border-blue-500" : "border-transparent opacity-60 hover:opacity-90",
              )}
            >
              {imgError[i] ? (
                <div className="flex size-full items-center justify-center bg-slate-100">
                  <ImageOff className="size-4 text-slate-300" />
                </div>
              ) : (
                <Image src={url} alt={`Thumb ${i + 1}`} fill unoptimized className="object-cover"
                  onError={() => setImgError((prev) => ({ ...prev, [i]: true }))}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {icon && <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
        <span className="text-slate-800 font-medium leading-snug">{value}</span>
      </div>
    </div>
  );
}

// ─── Main Dialog ─────────────────────────────────────────────────────────────
interface CitizenRequestDetailDialogProps {
  request: RequestDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CitizenRequestDetailDialog({ request, open, onOpenChange }: CitizenRequestDetailDialogProps) {
  if (!request) return null;

  const status = statusConfig(request.status);
  const mediaUrls = request.mediaUrl ?? [];
  const createdAt = new Date(request.createdAt).toLocaleString("vi-VN", {
    hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border-slate-200">
        {/* Header */}
        <DialogHeader className="px-5 py-4 bg-white border-b border-slate-100 shrink-0">
          <DialogTitle className="flex items-center gap-2.5 text-base text-slate-900">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 shrink-0">
              <Activity className="size-4 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold leading-none">Chi tiết yêu cầu cứu trợ</span>
              <span className="text-[10px] text-slate-400 font-mono font-normal mt-0.5">
                #{request.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh]">
          <div className="flex flex-col gap-5 p-5">

            {/* Status + Priority badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border",
                status.color
              )}>
                {status.icon}
                {dictStatus[request.status] ?? request.status}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border",
                priorityColors[request.priority] ?? priorityColors.LOW
              )}>
                <AlertTriangle className="size-3" />
                {dictPriority[request.priority] ?? request.priority}
              </span>
              <Badge variant="outline" className="text-xs font-semibold text-slate-600 border-slate-200">
                {dictType[request.emergencyType] ?? request.emergencyType}
              </Badge>
            </div>

            <Separator />

            {/* Image gallery */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Hình ảnh hiện trường ({mediaUrls.length})
              </p>
              <ImageGallery urls={mediaUrls} />
            </div>

            <Separator />

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả tình trạng</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2.5 leading-relaxed whitespace-pre-wrap">
                {request.description || "Không có mô tả."}
              </p>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vị trí sự cố</p>
                <FlyToLocationButton
                  lat={request.location.latitude}
                  lng={request.location.longitude}
                  label="Xem bản đồ"
                />
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 flex flex-col gap-1.5">
                <InfoRow
                  label="Địa chỉ"
                  icon={<MapPin className="size-3.5" />}
                  value={request.location.address}
                />
                <InfoRow
                  label="Tọa độ GPS"
                  icon={<Navigation className="size-3.5" />}
                  value={
                    <span className="font-mono text-xs">
                      {request.location.latitude.toFixed(5)}, {request.location.longitude.toFixed(5)}
                    </span>
                  }
                />
                {request.location.landmark && (
                  <InfoRow
                    label="Mốc nhận diện"
                    value={request.location.landmark}
                  />
                )}
              </div>
            </div>

            {/* Reporter info (hidden in public view) */}
            {!request.isPublicView ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Người báo cáo</p>
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 grid grid-cols-2 gap-3">
                  <InfoRow label="Họ tên" icon={<User className="size-3.5" />} value={request.requestedBy?.fullName ?? "N/A"} />
                  <InfoRow label="Số điện thoại" icon={<Phone className="size-3.5" />} value={request.requestedBy?.phoneNumber ?? "N/A"} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 italic">
                Thông tin cá nhân không hiển thị trên bản đồ công khai.
              </p>
            )}

            {/* Time */}
            <InfoRow
              label="Thời gian gửi yêu cầu"
              icon={<Calendar className="size-3.5" />}
              value={createdAt}
            />

            {/* Missions */}
            {request.missions && request.missions.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Đội cứu hộ đã điều động ({request.missions.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {request.missions.map((mission) => (
                    <div
                      key={mission.id}
                      className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-bold text-blue-800">
                          {mission.rescueTeam?.teamName ?? "Đội đang đến"}
                        </p>
                        <p className="text-[10px] font-mono text-blue-500 mt-0.5">
                          ID: {mission.id.substring(0, 8)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold text-blue-700 border-blue-200 bg-white">
                        {dictStatus[mission.status] ?? mission.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Keep default export for backward compatibility ───────────────────────────
export default function CitizenRequestDetailDialogLegacy({
  request,
  children,
}: {
  request: RequestDetail;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">{children}</span>
      <CitizenRequestDetailDialog request={request} open={open} onOpenChange={setOpen} />
    </>
  );
}
