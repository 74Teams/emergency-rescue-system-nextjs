"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { RescueTeamSummary, TeamStatus } from "@/lib/api/types";
import {
  useUpdateTeamStatus,
  useRescueTeamDetail,
  useTeamMissions,
} from "@/lib/api/dashboards/comander-queries";
import {
  Clock,
  MapPin,
  Users,
  Calendar,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils/initials";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

interface ActionPanelProps {
  selectedTeamId?: string;
  onClose?: () => void;
  onAssignMission?: (teamId: string) => void;
  isChangeStatusOpen?: boolean;
  onOpenChangeStatus?: (isOpen: boolean) => void;
}

const STATUS_OPTIONS: {
  value: TeamStatus;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    value: "AVAILABLE",
    label: "Sẵn sàng",
    icon: CheckCircle2,
    color: "bg-green-500",
  },
  {
    value: "ON_MISSION",
    label: "Đang nhiệm vụ",
    icon: Clock,
    color: "bg-blue-500",
  },
  {
    value: "UNAVAILABLE",
    label: "Không hoạt động",
    icon: X,
    color: "bg-red-500",
  },
  {
    value: "MAINTENANCE",
    label: "Bảo trì",
    icon: AlertTriangle,
    color: "bg-orange-500",
  },
];

export default function ActionPanel({
  selectedTeamId,
  onClose,
  onAssignMission,
  isChangeStatusOpen = false,
  onOpenChangeStatus,
}: ActionPanelProps) {
  const {
    data: team,
    isLoading: isLoadingTeam,
    isError: isTeamError,
  } = useRescueTeamDetail(selectedTeamId ?? "");
  const [selectedStatus, setSelectedStatus] = useState<TeamStatus>(
    (team?.status as TeamStatus) || "AVAILABLE",
  );
  const [statusNote, setStatusNote] = useState("");
  const { data: missions, isLoading: isLoadingMissions } = useTeamMissions(
    selectedTeamId ?? "",
  );
  const updateStatusMutation = useUpdateTeamStatus();

  // // Tự động gán trạng thái hiện tại vào ô Select khi Modal mở lên
  // useEffect(() => {
  //   if (isChangeStatusOpen && team?.status) {
  //     setSelectedStatus(team.status as TeamStatus);
  //   }
  // }, [isChangeStatusOpen, team?.status]);

  const handleChangeStatus = async () => {
    if (!selectedTeamId) return;
    try {
      await updateStatusMutation.mutateAsync({
        teamId: selectedTeamId,
        newStatus: selectedStatus,
      });
      if (onOpenChangeStatus) onOpenChangeStatus(false);
      setStatusNote("");
      toast.success("Đã cập nhật trạng thái đội cứu hộ");
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleAssignMission = () => {
    if (onAssignMission && selectedTeamId) onAssignMission(selectedTeamId);
  };

  if (!selectedTeamId) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center text-slate-500 dark:text-slate-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Chọn một đội cứu hộ để xem chi tiết</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingTeam) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (isTeamError || !team) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center text-red-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-sm">Không thể tải thông tin đội cứu hộ</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = STATUS_OPTIONS.find((s) => s.value === team.status);

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-12 w-12">
                {/* <AvatarImage src={team.leader?.avatar} /> */}
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {getInitials(team.teamName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg">{team.teamName}</CardTitle>
                {statusConfig && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "mt-1 gap-1",
                      statusConfig.color,
                      "text-white",
                    )}
                  >
                    <statusConfig.icon className="h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                )}
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <Separator className="my-2" />
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Thông tin đội
              </h4>
              <div className="space-y-1">
                {team.leader && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Users className="h-4 w-4" />
                    <span>Đội trưởng: {team.leader.fullName}</span>
                  </div>
                )}
                {team.memberCount !== undefined && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Users className="h-4 w-4" />
                    <span>{team.memberCount} thành viên</span>
                  </div>
                )}
                {team.createdAt && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Ngày tạo:{" "}
                      {format(new Date(team.createdAt), "dd/MM/yyyy", {
                        locale: vi,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nhiệm vụ gần đây
              </h4>
              {isLoadingMissions ? (
                <div className="text-sm text-slate-500 dark:text-slate-500">
                  Đang tải...
                </div>
              ) : missions && missions.length > 0 ? (
                <div className="space-y-2">
                  {missions.slice(0, 3).map((mission) => (
                    <div
                      key={mission.id}
                      className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          Mission #{mission.id.slice(-6)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {mission.status}
                        </Badge>
                      </div>
                      {mission.startTime && (
                        <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          Bắt đầu:{" "}
                          {format(
                            new Date(mission.startTime),
                            "dd/MM/yyyy HH:mm",
                            { locale: vi },
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 dark:text-slate-500">
                  Chưa có nhiệm vụ
                </div>
              )}
            </div>

            {team.description && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Mô tả
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {team.description}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {/* MỞ DIALOG QUA HÀM CỦA COMPONENT CHA */}
          <Button
            className="w-full"
            onClick={() => onOpenChangeStatus && onOpenChangeStatus(true)}
            disabled={updateStatusMutation.isLoading}
          >
            <Clock className="h-4 w-4 mr-2" /> Đổi trạng thái
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleAssignMission}
          >
            <MapPin className="h-4 w-4 mr-2" /> Phân công nhiệm vụ
          </Button>
        </div>
      </Card>

      <Dialog open={isChangeStatusOpen} onOpenChange={onOpenChangeStatus}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi trạng thái đội cứu hộ</DialogTitle>
            <DialogDescription>
              Chọn trạng thái mới cho đội {team.teamName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Trạng thái mới</Label>
              <Select
                value={selectedStatus}
                onValueChange={(v) => setSelectedStatus(v as TeamStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ghi chú (tùy chọn)</Label>
              <Textarea
                placeholder="Nhập ghi chú về lý do đổi trạng thái..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            {/* ĐÓNG DIALOG QUA HÀM CỦA COMPONENT CHA */}
            <Button
              variant="outline"
              onClick={() => onOpenChangeStatus && onOpenChangeStatus(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleChangeStatus}
              disabled={updateStatusMutation.isLoading}
            >
              {updateStatusMutation.isLoading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}{" "}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
