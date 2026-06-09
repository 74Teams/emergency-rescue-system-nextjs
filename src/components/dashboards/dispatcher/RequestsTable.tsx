"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  emergencyTypeLabels,
  priorityLabels,
  statusLabels,
  useChangeRequestStatusMutation,
  useCreateMissionMutation,
  useTeamMembersQuery,
  useDeleteRequestMutation,
  useUpdateRequestMutation,
} from "@/lib/api/features/requests/dispatcher.queries";
import type { RequestSummary, RescueTeamSummary, MissionSummary } from "@/lib/api/types";
import { useProfileQuery } from "@/lib/api/use-profile";
import {
  Loader2,
  MapPin,
  Phone,
  Send,
  UserCircle,
  Users,
  Clock,
  Filter,
  ChevronRight,
  Truck,
  Trash2,
  AlertTriangle,
  ClipboardList,
  Search,
  ArrowUpDown,
  Calendar,
  FileText,
  Volume2,
  Download,
  Music,
} from "lucide-react";
import { UserProfileDialog } from "./UserProfileDialog";
import { cn } from "@/lib/utils";
import { dictTeamStatus } from "@/constants/dictionary";

const DispatcherMapView = dynamic(
  () => import("@/components/dashboards/dispatcher/DispatcherMapView"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 border-l border-slate-200">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    ),
  }
);

interface Props {
  requests: RequestSummary[];
  allRequests: RequestSummary[];
  teams: RescueTeamSummary[];
  statusFilter: string; // Tạm giữ prop cũ để tránh lỗi compile, nhưng chúng ta sẽ tự quản lý multi-select
  onStatusFilterChange: (status: string) => void;
  selectedRequest: RequestSummary | null;
  onSelectRequest: (req: RequestSummary | null) => void;
  missions: MissionSummary[];
  viewMode?: "list" | "map";
}

const statusConfigs: Record<
  string,
  {
    label: string;
    colorClass: string;
    dotClass: string;
    bgClass: string;
    borderClass: string;
  }
> = {
  PENDING: {
    label: "Chờ xử lý",
    colorClass: "text-amber-700 bg-amber-50/50 border-amber-250 hover:bg-amber-100/50",
    dotClass: "bg-amber-500",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
  },
  ACCEPTED: {
    label: "Đã tiếp nhận",
    colorClass: "text-blue-700 bg-blue-50/50 border-blue-250 hover:bg-blue-100/50",
    dotClass: "bg-blue-500",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
  },
  IN_PROGRESS: {
    label: "Đang xử lý",
    colorClass: "text-indigo-700 bg-indigo-50/50 border-indigo-250 hover:bg-indigo-100/50",
    dotClass: "bg-indigo-500",
    bgClass: "bg-indigo-50",
    borderClass: "border-indigo-200",
  },
  COMPLETED: {
    label: "Hoàn thành",
    colorClass: "text-emerald-700 bg-emerald-50/50 border-emerald-250 hover:bg-emerald-100/50",
    dotClass: "bg-emerald-500",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
  },
  CANCELED: {
    label: "Đã hủy",
    colorClass: "text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100",
    dotClass: "bg-slate-450",
    bgClass: "bg-slate-100",
    borderClass: "border-slate-200",
  },
  REJECTED: {
    label: "Từ chối",
    colorClass: "text-rose-700 bg-rose-50/50 border-rose-250 hover:bg-rose-100/50",
    dotClass: "bg-rose-500",
    bgClass: "bg-rose-50",
    borderClass: "border-rose-200",
  },
};

const priorityColor: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-blue-100 text-blue-700",
};

const priorityWeight: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function getRelativeTime(iso?: string) {
  if (!iso) return "Chưa rõ thời gian";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff <= 65) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export function RequestsTable({
  requests,
  allRequests,
  teams,
  statusFilter,
  onStatusFilterChange,
  selectedRequest,
  onSelectRequest,
  missions,
  viewMode = "map",
}: Props) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  // States hỗ trợ Tìm kiếm, Sắp xếp, Lọc nhiều trạng thái và Phân trang
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "PENDING",
    "ACCEPTED",
    "IN_PROGRESS",
  ]);
  const [sortBy, setSortBy] = useState<"time" | "priority">("time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: profile } = useProfileQuery();
  const createMission = useCreateMissionMutation();
  const changeStatus = useChangeRequestStatusMutation();
  const deleteRequest = useDeleteRequestMutation();
  const updateRequest = useUpdateRequestMutation();
  const teamMembersQuery = useTeamMembersQuery(
    detailDialogOpen && selectedTeamId ? selectedTeamId : null,
  );
  const selectedTeamMembers = teamMembersQuery.data ?? [];

  // Reset trang về 1 khi lọc thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatuses, sortBy, sortOrder]);

  const handleAssignMission = async () => {
    if (!selectedRequest || !selectedTeamId) return;

    const dispatcherId = profile?.id;
    if (!dispatcherId) {
      toast.error("Không lấy được thông tin điều phối viên");
      return;
    }

    try {
      if (selectedRequest.status === "PENDING") {
        await changeStatus.mutateAsync({
          requestId: selectedRequest.id,
          newStatus: "ACCEPTED",
          note: "Điều phối viên tiếp nhận",
        });
      }

      await createMission.mutateAsync({
        requestId: selectedRequest.id,
        dispatcherId,
        rescueTeamId: selectedTeamId,
      });

      toast.success("Đã tạo nhiệm vụ thành công!", {
        description: "Đội cứu hộ đã được phân công.",
      });
      setDetailDialogOpen(false);
      setSelectedTeamId("");
    } catch (error) {
      toast.error("Lỗi tạo nhiệm vụ", {
        description: getApiErrorMessage(error),
      });
    }
  };

  const handleUpdatePriority = async (newPriority: string) => {
    if (!selectedRequest) return;

    try {
      await updateRequest.mutateAsync({
        requestId: selectedRequest.id,
        payload: {
          emergencyType: selectedRequest.emergencyType,
          priority: newPriority,
          description: selectedRequest.description,
          locationId: selectedRequest.location?.id ?? "",
        },
      });
      toast.success("Đã cập nhật mức độ ưu tiên thành công!");
      // Đồng bộ thông tin selectedRequest mới
      onSelectRequest({
        ...selectedRequest,
        priority: newPriority as any,
      });
    } catch (error) {
      toast.error("Lỗi cập nhật mức độ ưu tiên", {
        description: getApiErrorMessage(error),
      });
    }
  };

  const handleSort = (field: "time" | "priority") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      // Giữ lại ít nhất 1 trạng thái
      if (selectedStatuses.length > 1) {
        setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
      } else {
        toast.warning("Vui lòng chọn ít nhất một trạng thái hiển thị.");
      }
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  // Áp dụng bộ lọc tìm kiếm & trạng thái lên danh sách
  const filtered = allRequests.filter((req) => {
    // 1. Lọc trạng thái (nhiều trạng thái cùng lúc)
    const matchesStatus = selectedStatuses.includes(req.status);

    // 2. Lọc tìm kiếm theo Mô tả, Địa chỉ hoặc Người gửi
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !normalizedQuery ||
      (req.description && req.description.toLowerCase().includes(normalizedQuery)) ||
      (req.location?.address && req.location.address.toLowerCase().includes(normalizedQuery)) ||
      (req.requestedBy?.fullName && req.requestedBy.fullName.toLowerCase().includes(normalizedQuery)) ||
      (req.requestedBy?.phoneNumber && req.requestedBy.phoneNumber.includes(normalizedQuery));

    return matchesStatus && matchesQuery;
  });

  // Áp dụng sắp xếp
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "time") {
      const t1 = new Date(a.createdAt ?? 0).getTime();
      const t2 = new Date(b.createdAt ?? 0).getTime();
      return sortOrder === "desc" ? t2 - t1 : t1 - t2;
    } else {
      const w1 = priorityWeight[a.priority] ?? 0;
      const w2 = priorityWeight[b.priority] ?? 0;
      return sortOrder === "desc" ? w2 - w1 : w1 - w2;
    }
  });

  // Áp dụng phân trang (chỉ cho chế độ danh sách)
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRequests = sorted.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <>
      {viewMode === "list" ? (
        // ── CHẾ ĐỘ HIỂN THỊ DANH SÁCH BẢNG TOÀN MÀN HÌNH (DATA TABLE) ──
        <div className="flex flex-col h-full w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 pb-6 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg uppercase tracking-tight">
                Danh sách yêu cầu cứu trợ
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Tìm kiếm, sắp xếp và lọc đa trạng thái trực quan các cuộc gọi cứu hộ.
              </p>
            </div>

            {/* Điều khiển: Search & Multi-select Checkboxes */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
              {/* Lọc checkbox nhiều trạng thái bằng giao diện Radio */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" /> Lọc trạng thái:
                </span>
                {Object.entries(statusConfigs).map(([statusKey, config]) => {
                  const isSelected = selectedStatuses.includes(statusKey);
                  const count = allRequests.filter((r) => r.status === statusKey).length;
                  return (
                    <button
                      key={statusKey}
                      onClick={() => toggleStatus(statusKey)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer shadow-3xs",
                        isSelected
                          ? config.colorClass + " font-extrabold border-current ring-1 ring-current/25"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {/* Radio Circle */}
                      <div
                        className={cn(
                          "w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all shrink-0",
                          isSelected ? "border-current bg-white" : "border-slate-300 bg-white"
                        )}
                      >
                        {isSelected && (
                          <div className={cn("w-1.5 h-1.5 rounded-full animate-scale-in", config.dotClass)} />
                        )}
                      </div>
                      <span>
                        {config.label} ({count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tìm kiếm */}
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mô tả, địa chỉ, SĐT..."
                  className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <ScrollArea className="flex-1 mt-6">
            {paginatedRequests.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                <ClipboardList className="w-10 h-10 stroke-[1.5]" />
                <span className="text-sm font-medium">Không tìm thấy yêu cầu phù hợp</span>
              </div>
            ) : (
              <div className="w-full overflow-x-auto border border-slate-200/80 rounded-xl shadow-3xs bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Mã (ID)</th>
                      <th className="py-3 px-4">Sự cố</th>
                      <th
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none transition-colors"
                        onClick={() => handleSort("priority")}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Mức độ</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          {sortBy === "priority" && (sortOrder === "desc" ? "↓" : "↑")}
                        </div>
                      </th>
                      <th className="py-3 px-4">Người báo cáo</th>
                      <th className="py-3 px-4">Địa điểm</th>
                      <th
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none transition-colors"
                        onClick={() => handleSort("time")}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Thời gian gửi</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          {sortBy === "time" && (sortOrder === "desc" ? "↓" : "↑")}
                        </div>
                      </th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {paginatedRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          <span
                            className="bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded-md font-semibold cursor-pointer transition-colors shadow-3xs"
                            title="Nhấp để sao chép mã sự cố đầy đủ"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(req.id);
                              toast.success("Đã sao chép mã sự cố!");
                            }}
                          >
                            #{req.id.substring(0, 8)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {emergencyTypeLabels[req.emergencyType] ?? req.emergencyType}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] font-bold border-0 uppercase px-2 py-0.5",
                              priorityColor[req.priority]
                            )}
                          >
                            {priorityLabels[req.priority] || req.priority}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          {req.requestedBy ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-800">{req.requestedBy.fullName}</span>
                              {req.requestedBy.phoneNumber && (
                                <span className="text-[10px] text-slate-450 font-medium">
                                  {req.requestedBy.phoneNumber}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Ẩn danh</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 max-w-[240px] truncate" title={req.location?.address}>
                          {req.location?.address ?? "Chưa rõ địa chỉ"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5 text-slate-700">
                            <span className="font-semibold flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {isMounted && req.createdAt ? new Date(req.createdAt).toLocaleString("vi-VN") : "---"}
                            </span>
                            <span className="text-[10px] text-slate-450 font-medium pl-5">
                              {isMounted ? getRelativeTime(req.createdAt) : "---"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] uppercase font-bold px-2 py-0.5",
                              req.status === "PENDING"
                                ? "bg-amber-50 text-amber-600 border-amber-200 animate-pulse"
                                : req.status === "ACCEPTED"
                                ? "bg-blue-50 text-blue-600 border-blue-200"
                                : req.status === "IN_PROGRESS"
                                ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                : req.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-slate-50 text-slate-500 border-slate-200"
                            )}
                          >
                            {statusLabels[req.status] || req.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              onClick={() => {
                                onSelectRequest(req);
                                setDetailDialogOpen(true);
                              }}
                              className="h-7 px-2.5 text-[11px] border-slate-200 hover:border-blue-450 text-blue-600 font-bold hover:bg-blue-50/50 rounded-lg cursor-pointer"
                            >
                              Chi tiết
                            </Button>

                            {(req.status === "PENDING" || req.status === "ACCEPTED") && (
                              <Button
                                variant="outline"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await changeStatus.mutateAsync({
                                      requestId: req.id,
                                      newStatus: "CANCELED",
                                      note: "Từ chối từ bảng",
                                    });
                                    toast.success("Đã từ chối sự cố.");
                                  } catch (err) {
                                    toast.error("Lỗi từ chối", {
                                      description: getApiErrorMessage(err),
                                    });
                                  }
                                }}
                                className="h-7 px-2.5 text-[11px] border-amber-200 text-amber-655 font-bold hover:bg-amber-50 hover:border-amber-400 rounded-lg cursor-pointer"
                              >
                                Từ chối
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectRequest(req);
                                setConfirmDeleteDialogOpen(true);
                              }}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ScrollArea>

          {/* Phân Trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4 text-xs text-slate-500">
              <div className="flex items-center gap-2 font-medium">
                <span>Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 outline-none font-semibold cursor-pointer"
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span>trong tổng số {sorted.length} sự vụ lọc được</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="h-8 px-2.5 border-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer hover:bg-slate-100"
                >
                  Trước
                </Button>
                {getPageNumbers().map((page, index) => {
                  const isPageNumber = typeof page === "number";
                  return (
                    <Button
                      key={index}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      disabled={!isPageNumber}
                      onClick={() => isPageNumber && setCurrentPage(page as number)}
                      className={cn(
                        "h-8 w-8 p-0 font-bold rounded-lg transition-all",
                        !isPageNumber && "border-none hover:bg-transparent cursor-default",
                        currentPage === page
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : isPageNumber
                          ? "border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                          : "text-slate-400"
                      )}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="h-8 px-2.5 border-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer hover:bg-slate-100"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // ── CHẾ ĐỘ HIỂN THỊ BẢN ĐỒ CHIA ĐÔI (MẶC ĐỊNH) ──
        <div className="flex h-full w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white relative">
          <div className="w-[380px] shrink-0 flex flex-col bg-slate-50 border-r border-slate-200 z-10">
            {/* Header / Search & Filter */}
            <div className="p-4 bg-white border-b border-slate-200 shadow-sm space-y-3 sticky top-0">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-[13px] uppercase tracking-wider">
                  Yêu cầu sự cố
                </h3>
              </div>

              {/* Tìm kiếm nhanh */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mô tả, địa chỉ..."
                  className="w-full h-8 pl-8 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-medium text-slate-700"
                />
              </div>

              {/* Lọc checkbox trạng thái nhanh bằng giao diện Radio */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.entries(statusConfigs).map(([statusKey, config]) => {
                  const isSelected = selectedStatuses.includes(statusKey);
                  return (
                    <button
                      key={statusKey}
                      onClick={() => toggleStatus(statusKey)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer",
                        isSelected
                          ? config.colorClass + " border-current"
                          : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-500"
                      )}
                    >
                      {/* Small Radio Circle */}
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full border flex items-center justify-center shrink-0",
                          isSelected ? "border-current bg-white" : "border-slate-300 bg-white"
                        )}
                      >
                        {isSelected && (
                          <div className={cn("w-1 h-1 rounded-full", config.dotClass)} />
                        )}
                      </div>
                      <span>{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <ScrollArea className="flex-1 p-3">
              {sorted.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm font-medium">
                  Không tìm thấy sự vụ
                </div>
              ) : (
                <div className="space-y-3">
                  {sorted.map((req) => {
                    const isSelected = selectedRequest?.id === req.id;
                    return (
                      <div
                        key={req.id}
                        onClick={() => onSelectRequest(req)}
                        className={cn(
                          "p-4 rounded-xl border transition-all cursor-pointer relative group",
                          isSelected
                            ? "bg-white border-blue-400 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.3)] ring-1 ring-blue-400/50"
                            : "bg-white border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>
                        )}

                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                req.status === "PENDING" ? "bg-amber-500 animate-pulse" : "bg-blue-500"
                              )}
                            ></div>
                            <h4 className="font-bold text-slate-800 text-[13px]">
                              {emergencyTypeLabels[req.emergencyType] ?? req.emergencyType}
                            </h4>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px] font-bold border-0 uppercase", priorityColor[req.priority])}
                          >
                            {priorityLabels[req.priority] || req.priority}
                          </Badge>
                        </div>

                        <div className="space-y-1.5 mt-3">
                          <p className="text-[11px] text-slate-600 flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed">
                              {req.location?.address ?? "Chưa rõ vị trí"}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-650 flex items-center gap-2 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{isMounted ? getRelativeTime(req.createdAt) : "---"}</span>
                          </p>
                        </div>

                        <div
                          className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRequest(req);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <span className="flex items-center gap-1.5 font-bold">
                            <Send className="w-3.5 h-3.5" /> Chi tiết & Điều phối
                          </span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="flex-1 h-full bg-slate-100 relative z-0">
            <DispatcherMapView
              requests={sorted}
              teams={teams}
              selectedRequestId={selectedRequest?.id}
              onSelectRequest={onSelectRequest}
              onAssignRequest={(req) => {
                onSelectRequest(req);
                setDetailDialogOpen(true);
              }}
              onViewTeamDetails={(teamId) => {
                router.push(`/dashboard/dispatcher?view=teams&teamId=${teamId}`);
              }}
            />
          </div>
        </div>
      )}

      {/* ── DIALOG CHI TIẾT SỰ CỐ & ĐIỀU ĐỘNG & THAO TÁC CẬP NHẬT ── */}
      <Dialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) {
            setSelectedTeamId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-5xl w-[95vw] bg-white h-[85vh] max-h-[90vh] overflow-hidden p-0 flex flex-col rounded-2xl border border-slate-200 shadow-2xl">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-slate-100 shrink-0">
            <DialogTitle className="text-base font-black text-slate-900 flex items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2">
                <span className="bg-red-50 text-red-600 p-2 rounded-xl">
                  <MapPin className="w-5 h-5" />
                </span>
                <span className="text-sm font-extrabold uppercase tracking-wider">Thông tin sự cố khẩn cấp</span>
              </div>
              {selectedRequest && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] font-extrabold border-0 uppercase px-2.5 py-1 tracking-wider",
                    priorityColor[selectedRequest.priority]
                  )}
                >
                  {priorityLabels[selectedRequest.priority] || selectedRequest.priority}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest ? (
            <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
              {/* CỘT TRÁI: CHI TIẾT SỰ CỐ (Scrollable, 55%) */}
              <div className="flex-1 md:max-w-[55%] overflow-y-auto custom-scrollbar p-6 space-y-6 border-b md:border-b-0 md:border-r border-slate-100 bg-white">
                
                {/* Ảnh hiện trường khẩn cấp nổi bật */}
                {selectedRequest.medias && selectedRequest.medias.some(m => m.mediaType === "IMAGE") && (
                  <div className="relative w-full h-[180px] sm:h-[220px] rounded-xl overflow-hidden border border-slate-200/80 bg-slate-950 shadow-2xs group/hero">
                    <img
                      src={selectedRequest.medias.find(m => m.mediaType === "IMAGE")?.mediaUrl}
                      alt="Hình ảnh tại hiện trường"
                      className="w-full h-full object-cover group-hover/hero:scale-[1.02] transition-transform duration-500 cursor-zoom-in"
                      onClick={() => window.open(selectedRequest.medias!.find(m => m.mediaType === "IMAGE")!.mediaUrl, "_blank")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-[10px] text-white px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                      <span>Hình ảnh tại hiện trường sự vụ</span>
                    </div>
                  </div>
                )}

                {/* Chi tiết sự cố */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                        Loại sự cố
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        {emergencyTypeLabels[selectedRequest.emergencyType]}
                      </h3>
                    </div>

                    {/* THAO TÁC CẬP NHẬT: Thay đổi mức độ ưu tiên bằng nút tương tác */}
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                        Thay đổi mức độ ưu tiên
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(priorityLabels).map(([key, label]) => {
                          const isSelected = selectedRequest.priority === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleUpdatePriority(key)}
                              disabled={updateRequest.isPending}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs",
                                isSelected
                                  ? cn(
                                      key === "CRITICAL" && "bg-red-50 border-red-300 text-red-700 ring-1 ring-red-350/20",
                                      key === "HIGH" && "bg-orange-50 border-orange-300 text-orange-700 ring-1 ring-orange-350/20",
                                      key === "MEDIUM" && "bg-amber-50 border-amber-300 text-amber-700 ring-1 ring-amber-350/20",
                                      key === "LOW" && "bg-blue-50 border-blue-300 text-blue-700 ring-1 ring-blue-350/20"
                                    )
                                  : "bg-slate-50 border-slate-200 text-slate-450 hover:bg-slate-100 hover:text-slate-600"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full transition-all shrink-0",
                                  key === "CRITICAL" && "bg-red-500",
                                  key === "HIGH" && "bg-orange-500",
                                  key === "MEDIUM" && "bg-amber-500",
                                  key === "LOW" && "bg-blue-500",
                                  isSelected ? "scale-110 shadow-xs animate-pulse" : "opacity-40"
                                )}
                              />
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                      {updateRequest.isPending && (
                        <p className="text-[10px] text-blue-600 font-medium mt-1.5 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Đang cập nhật mức độ ưu tiên...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Thông tin người gửi */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                        Người gửi sự cố
                      </span>
                      {selectedRequest.requestedBy ? (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex items-center gap-2">
                            <UserCircle className="w-5 h-5 text-slate-400" />
                            <span className="text-xs font-bold text-slate-900">
                              {selectedRequest.requestedBy.fullName || selectedRequest.requestedBy.userName || "Người dùng"}
                            </span>
                          </div>
                          {selectedRequest.requestedBy.phoneNumber && (
                            <a
                              href={`tel:${selectedRequest.requestedBy.phoneNumber}`}
                              className="flex items-center gap-2 text-xs text-blue-600 hover:underline font-semibold"
                            >
                              <Phone className="w-4 h-4 text-blue-500" />
                              <span>{selectedRequest.requestedBy.phoneNumber}</span>
                            </a>
                          )}
                          {selectedRequest.requestedBy.email && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                              <span className="font-mono text-[10px]">{selectedRequest.requestedBy.email}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Gửi ẩn danh</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                      Mô tả sự vụ
                    </span>
                    <p className="text-xs text-slate-650 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                      {selectedRequest.description || "Không có mô tả chi tiết."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                        Vị trí sự cố
                      </span>
                      <p className="text-xs text-slate-700 font-semibold flex items-start gap-1">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <span>{selectedRequest.location?.address}</span>
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                        Thời gian báo cáo
                      </span>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 font-semibold">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>
                          {isMounted && selectedRequest.createdAt
                            ? new Date(selectedRequest.createdAt).toLocaleString("vi-VN")
                            : "Không rõ thời gian"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gallery Media */}
                {selectedRequest.medias && selectedRequest.medias.length > 0 && (
                  <div className="space-y-4 pt-2">
                    {selectedRequest.medias.some(m => m.mediaType === "IMAGE" || m.mediaType === "VIDEO") && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Hình ảnh & Video hiện trường
                        </span>
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                          {selectedRequest.medias
                            .filter(m => m.mediaType === "IMAGE" || m.mediaType === "VIDEO")
                            .map((media) => (
                              <div key={media.id} className="relative rounded-xl overflow-hidden border border-slate-200/80 bg-slate-950 group shadow-xs aspect-video">
                                {media.mediaType === "IMAGE" ? (
                                  <>
                                    <img
                                      src={media.mediaUrl}
                                      alt="Hiện trường cứu trợ"
                                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                                      onClick={() => window.open(media.mediaUrl, "_blank")}
                                    />
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-[9px] text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                      Hình ảnh
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <video
                                      src={media.mediaUrl}
                                      controls
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2 bg-red-650/90 backdrop-blur-xs text-[9px] text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                      Video
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {selectedRequest.medias.some(m => m.mediaType === "AUDIO" || m.mediaType === "FILE") && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Âm thanh & Tài liệu đính kèm
                        </span>
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                          {selectedRequest.medias
                            .filter(m => m.mediaType === "AUDIO" || m.mediaType === "FILE")
                            .map((media) => {
                              if (media.mediaType === "AUDIO") {
                                return (
                                  <div key={media.id} className="flex flex-col p-3 rounded-xl border border-slate-200 bg-slate-50/50 gap-2 shadow-3xs">
                                    <div className="flex items-center gap-2 text-slate-700">
                                      <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                                        <Volume2 className="w-3.5 h-3.5" />
                                      </div>
                                      <span className="text-[11px] font-bold text-slate-800">Ghi âm hiện trường</span>
                                    </div>
                                    <audio src={media.mediaUrl} controls className="w-full h-8" />
                                  </div>
                                );
                              }
                              return (
                                <a
                                  key={media.id}
                                  href={media.mediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-300 transition-all group shadow-3xs cursor-pointer"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="bg-amber-100 text-amber-600 p-2 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="overflow-hidden text-left">
                                      <p className="text-xs font-bold truncate text-slate-800 group-hover:text-blue-700">Tệp tin đính kèm</p>
                                      <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider mt-0.5">{media.mediaType} FILE</p>
                                    </div>
                                  </div>
                                  <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 transform group-hover:translate-x-0.5 transition-transform" />
                                </a>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: BẢNG ĐIỀU PHỐI NHANH (Scrollable, 45%) */}
              <div className="w-full md:w-[45%] bg-slate-50/40 overflow-y-auto custom-scrollbar p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100">
                <div>
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider pb-3 border-b border-slate-200/60 mb-4">
                    <Send className="w-4 h-4 text-blue-600" /> Điều động lực lượng ứng cứu nhanh
                  </h4>

                  {selectedRequest.status === "PENDING" || selectedRequest.status === "ACCEPTED" ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-500" /> Chọn đội cứu hộ khả dụng
                        </label>

                        {/* HIỂN THỊ CÁC ĐỘI CỨU HỘ DẠNG SCROLL, KHÔNG COMBO BOX */}
                        <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-3xs">
                          <ScrollArea className="h-[220px]">
                            {teams.length === 0 ? (
                              <p className="p-4 text-center text-xs text-slate-400 italic">
                                Không có đội cứu hộ nào khả dụng
                              </p>
                            ) : (
                              <div className="divide-y divide-slate-105">
                                {teams.map((t) => {
                                  const hasActiveMission = missions.some(
                                    (m) =>
                                      m.rescueTeamId === t.id &&
                                      ["ASSIGNED", "EN_ROUTE", "ON_SITE", "IN_PROGRESS"].includes(m.status)
                                  );
                                  const isWorking = hasActiveMission || t.status === "ON_MISSION";
                                  const isAvailable = t.status === "AVAILABLE" && !isWorking;
                                  const isSelected = selectedTeamId === t.id;

                                  return (
                                    <div
                                      key={t.id}
                                      onClick={() => {
                                        if (isAvailable) {
                                          setSelectedTeamId(t.id);
                                        }
                                      }}
                                      className={cn(
                                        "p-3 flex items-center justify-between cursor-pointer transition-all",
                                        !isAvailable
                                          ? "opacity-50 bg-slate-50/50 cursor-not-allowed"
                                          : isSelected
                                          ? "bg-blue-50/80 border-l-4 border-l-blue-600 pl-2"
                                          : "hover:bg-slate-50/60"
                                      )}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {/* Custom Radio checkmark indicator */}
                                        <div
                                          className={cn(
                                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all",
                                            !isAvailable
                                              ? "border-slate-200 bg-slate-100"
                                              : isSelected
                                              ? "border-blue-600 bg-white"
                                              : "border-slate-300 bg-white"
                                          )}
                                        >
                                          {isSelected && isAvailable && (
                                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                                          )}
                                        </div>

                                        <div className="text-left overflow-hidden">
                                          <p className={cn(
                                            "text-xs font-bold truncate",
                                            isSelected && isAvailable ? "text-blue-700" : "text-slate-800"
                                          )}>
                                            {t.teamName}
                                          </p>
                                          <p className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">
                                            {t.memberCount || 0} thành viên
                                          </p>
                                        </div>
                                      </div>

                                      <Badge
                                        variant="secondary"
                                        className={cn(
                                          "text-[9px] uppercase font-extrabold px-1.5 py-0.5 tracking-wider shrink-0",
                                          isAvailable
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : isWorking
                                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                                            : "bg-slate-50 text-slate-500 border border-slate-200"
                                        )}
                                      >
                                        {isWorking
                                          ? dictTeamStatus["ON_MISSION"]
                                          : dictTeamStatus[t.status] || t.status}
                                      </Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </div>

                      {/* Hiển thị thành viên đội cứu hộ được chọn */}
                      {selectedTeamId && teamMembersQuery.isLoading && (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        </div>
                      )}

                      {selectedTeamId && !teamMembersQuery.isLoading && selectedTeamMembers.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-3xs">
                          <h5 className="text-[10px] font-extrabold text-blue-800 flex items-center gap-1.5 uppercase tracking-wider">
                            <Users className="w-3.5 h-3.5" /> Lực lượng đội ({selectedTeamMembers.length})
                          </h5>
                          <div className="grid grid-cols-2 gap-2 max-h-[110px] overflow-y-auto custom-scrollbar">
                            {selectedTeamMembers.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg p-1.5"
                              >
                                <UserCircle className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="overflow-hidden">
                                  <p className="text-[10px] font-bold text-slate-800 truncate">{member.fullName}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        Yêu cầu này đang ở trạng thái{" "}
                        <span className="font-bold text-slate-800">
                          "{statusLabels[selectedRequest.status] || selectedRequest.status}"
                        </span>{" "}
                        và không thể điều động lực lượng.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer thao tác ở cột phải */}
                {selectedRequest.status === "PENDING" || selectedRequest.status === "ACCEPTED" ? (
                  <div className="pt-4 border-t border-slate-200 flex justify-end mt-6">
                    <Button
                      onClick={handleAssignMission}
                      disabled={!selectedTeamId || createMission.isPending || changeStatus.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs h-10 rounded-xl cursor-pointer shadow-sm flex items-center justify-center gap-2"
                    >
                      {(createMission.isPending || changeStatus.isPending) && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      <Send className="w-3.5 h-3.5" />
                      Xác nhận điều phối lực lượng
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Xác Nhận Xóa Yêu Cầu
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-600 leading-relaxed py-2">
            Hành động này sẽ xóa vĩnh viễn sự cố này khỏi cơ sở dữ liệu. Bạn có chắc chắn muốn tiếp tục?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteDialogOpen(false)}
              className="font-bold text-xs border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (!selectedRequest) return;
                try {
                  await deleteRequest.mutateAsync(selectedRequest.id);
                  toast.success("Đã xóa sự cố thành công.");
                  setConfirmDeleteDialogOpen(false);
                  setDetailDialogOpen(false);
                } catch (error) {
                  toast.error("Lỗi xóa sự cố", {
                    description: getApiErrorMessage(error),
                  });
                }
              }}
              disabled={deleteRequest.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg"
            >
              {deleteRequest.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Xác nhận xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UserProfileDialog
        open={!!profileUserId}
        userId={profileUserId}
        onOpenChange={(isOpen) => !isOpen && setProfileUserId(null)}
      />
    </>
  );
}
