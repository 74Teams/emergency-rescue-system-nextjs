"use client";

import {
  Activity,
  Bell,
  BellRing,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Crosshair,
  FileWarning,
  Info,
  LogOut,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Settings,
  ShieldAlert,
  Target,
  UserCircle,
  XCircle,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import {
  MemberDashboardData,
  RescuerNotification,
} from "@/types/rescue-team/member";
import { cn } from "@/lib/utils";
import { useMemberDashboard } from "@/hooks/use-member-dashboard";

const MiniMap = dynamic(
  () => import("@/components/rescue-team/member/MiniMap"),
  { ssr: false }
);

const NavigateMap = dynamic(() => import("@/components/NavigateMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-card rounded-xl border h-full w-full">
      <div className="size-10 rounded-full border-4 border-muted border-t-primary animate-spin mb-4"></div>
      <span className="font-medium text-muted-foreground text-sm">Đang tải bản đồ...</span>
    </div>
  ),
});

const getNotificationDetails = (type: string) => {
  switch (type) {
    case "NEW_MISSION_ASSIGNED":
      return {
        badgeVariant: "destructive" as const,
        icon: <BellRing className="size-4 text-destructive" />,
        bg: "bg-destructive/10",
      };
    case "MISSION_CANCELED":
      return {
        badgeVariant: "destructive" as const,
        icon: <XCircle className="size-4 text-destructive" />,
        bg: "bg-destructive/10",
      };
    case "SYSTEM_ALERT":
      return {
        badgeVariant: "default" as const,
        icon: <Info className="size-4 text-primary" />,
        bg: "bg-primary/10",
      };
    case "LEAVE_APPROVED":
      return {
        badgeVariant: "secondary" as const,
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
        bg: "bg-emerald-500/10",
      };
    case "LEAVE_REJECTED":
      return {
        badgeVariant: "outline" as const,
        icon: <FileWarning className="size-4 text-muted-foreground" />,
        bg: "bg-muted",
      };
    default:
      return {
        badgeVariant: "secondary" as const,
        icon: <Bell className="size-4 text-muted-foreground" />,
        bg: "bg-muted",
      };
  }
};

const formatTimeAgoSafe = (isoString: string) => {
  try {
    const past = new Date(isoString).getTime();
    const now = new Date().getTime();
    const diffInSeconds = Math.max(0, Math.floor((now - past) / 1000));
    if (diffInSeconds < 60) return "VỪA XONG";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} PHÚT TRƯỚC`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} GIỜ TRƯỚC`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} NGÀY TRƯỚC`;
  } catch (error) {
    return "GẦN ĐÂY";
  }
};

export default function MemberDashboardPage() {
  const { data, isLoading, isError } = useMemberDashboard();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
          <p className="text-muted-foreground font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-destructive flex-col gap-2">
        <XCircle className="size-12 opacity-50" />
        <p className="font-semibold">Đã có lỗi xảy ra khi tải dữ liệu</p>
      </div>
    );
  }

  return <MemberDashboardContent data={data} />;
}

function MemberDashboardContent({ data }: { data: MemberDashboardData }) {
  const [isOnline, setIsOnline] = useState(data.dutyStatus.isOnline);
  const [activeTab, setActiveTab] = useState<
    "missions" | "chat" | "navigate" | "duty"
  >(data.activeMission ? "navigate" : "missions");
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  const avatarInitials = data.profile.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2);

  const mainVictim = data.activeMission?.victims?.[0];

  const visibleNotifications = data.activeMission
    ? data.notifications.filter((noti) => noti.type !== "NEW_MISSION_ASSIGNED")
    : data.notifications;

  const renderNotificationItem = (notification: RescuerNotification) => {
    const details = getNotificationDetails(notification.type);

    return (
      <div
        key={notification.id}
        className="flex flex-col gap-3 p-4 border rounded-lg bg-card transition-colors hover:bg-muted/50"
      >
        <div className="flex gap-4">
          <div className={cn("size-10 rounded-md flex items-center justify-center shrink-0", details.bg)}>
            {details.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1 gap-2">
              <h4 className="text-sm font-semibold truncate text-foreground">
                {notification.title}
              </h4>
              <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                {formatTimeAgoSafe(notification.createdAt)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {notification.type === "NEW_MISSION_ASSIGNED" && (
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                toast.success("Đã tiếp nhận nhiệm vụ!", {
                  description: "Đang tải dữ liệu bản đồ...",
                });
                setIsNotiOpen(false);
                setTimeout(() => setActiveTab("navigate"), 800);
              }}
            >
              Tiếp nhận
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() =>
                toast.error("Đã từ chối nhiệm vụ", {
                  description: "Đã báo cáo về Trung tâm điều phối.",
                })
              }
            >
              Từ chối
            </Button>
          </div>
        )}
        {(notification.type === "MISSION_CANCELED" || notification.type === "SYSTEM_ALERT") && (
          <div className="flex mt-2">
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={() => toast.success("Đã xác nhận.")}
            >
              Xác nhận đã đọc
            </Button>
          </div>
        )}
      </div>
    );
  };

  const teamName = (data as any).team?.name || "Đội Cứu Hộ Hạt Nhân";
  const leaderName = (data as any).team?.leaderName || "Trưởng Nhóm";
  const missionId = data.activeMission?.id
    ? data.activeMission.id.split("-")[0].toUpperCase()
    : "MIS-001";

  const navigation = [
    { id: "missions", label: "Tổng quan", icon: Zap },
    { id: "navigate", label: "Bản đồ", icon: Navigation },
    { id: "chat", label: "Trao đổi", icon: MessageSquare },
    { id: "duty", label: "Lịch trực", icon: ClipboardList },
  ] as const;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background md:flex-row">
      {/* Sidebar */}
      <aside className="hidden border-r bg-card md:flex md:w-[260px] flex-col">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px]">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <ShieldAlert className="size-5" />
            <span className="truncate">Rescue Portal</span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-6 p-4">
            {/* Profile Section */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {avatarInitials}
                </div>
                <span className={cn(
                  "absolute bottom-0 right-0 size-3 rounded-full border-2 border-background",
                  isOnline ? "bg-emerald-500" : "bg-muted-foreground"
                )}></span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate">{data.profile.fullName}</span>
                <span className="text-xs text-muted-foreground truncate">{data.profile.specialty}</span>
              </div>
            </div>

            {/* Status Toggle */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái trực</span>
              <div className="flex p-1 bg-muted/50 rounded-lg border">
                <button
                  onClick={() => setIsOnline(true)}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                    isOnline ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Online
                </button>
                <button
                  onClick={() => setIsOnline(false)}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                    !isOnline ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Offline
                </button>
              </div>
            </div>

            <Separator />

            {/* Main Navigation */}
            <nav className="flex flex-col gap-1">
              {navigation.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </ScrollArea>

        {/* Footer Sidebar */}
        <div className="p-4 border-t mt-auto">
          <button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Settings className="size-4" />
            Cài đặt
          </button>
          <button className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-1">
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            {navigation.find((n) => n.id === activeTab)?.label}
          </h1>

          <div className="flex items-center gap-4">
            <Sheet open={isNotiOpen} onOpenChange={setIsNotiOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="size-4" />
                  {visibleNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 size-2.5 bg-destructive rounded-full border-2 border-background"></span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
                <SheetHeader className="p-6 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <BellRing className="size-5 text-primary" />
                    Thông báo
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 p-6">
                  <div className="flex flex-col gap-4">
                    {visibleNotifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                        <CheckCircle2 className="size-12 mb-4 opacity-20" />
                        <p className="text-sm">Không có thông báo mới.</p>
                      </div>
                    ) : (
                      visibleNotifications.map(renderNotificationItem)
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto">
          {activeTab === "missions" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Mission or Empty State */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {data.activeMission ? (
                  <Card className="border-destructive/20 shadow-sm overflow-hidden flex flex-col h-full">
                    <CardHeader className="bg-destructive/5 pb-6 border-b border-destructive/10">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-2">
                          <Badge variant="destructive" className="w-fit animate-pulse">
                            Nhiệm vụ khẩn cấp
                          </Badge>
                          <CardTitle className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                            {data.activeMission.title}
                          </CardTitle>
                        </div>
                        <div className="flex flex-col items-end text-right">
                          <span className="text-xs font-medium text-muted-foreground uppercase">Mã Phiếu</span>
                          <span className="font-mono text-lg font-bold">#{missionId}</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0 flex-1 flex flex-col md:flex-row">
                      <div className="flex-1 flex flex-col gap-6 p-6 border-b md:border-b-0 md:border-r border-border">
                        {/* Victim Info */}
                        {mainVictim && (
                          <div className="flex flex-col gap-3">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Người cần hỗ trợ
                            </h4>
                            <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-lg border">
                              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <UserCircle className="size-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold truncate text-foreground">
                                  {mainVictim.fullName} {mainVictim.age && `(${mainVictim.age}T)`}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {mainVictim.condition}
                                </p>
                              </div>
                              <Button variant="secondary" size="icon" className="shrink-0 rounded-full">
                                <Phone className="size-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Location Details */}
                        <div className="flex flex-col gap-3 mt-auto">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Định vị
                          </h4>
                          <div className="flex items-start gap-3 p-4 rounded-lg border bg-card shadow-sm">
                            <MapPin className="size-5 text-primary mt-0.5 shrink-0" />
                            <div className="flex flex-col gap-1 flex-1">
                              <p className="text-sm font-medium leading-snug">{data.activeMission.location.address}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="font-mono">
                                  {data.activeMission.location.distanceKm} km
                                </Badge>
                                <span className="text-xs text-muted-foreground">Ước tính khoảng cách</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Map View */}
                      <div className="flex-1 relative min-h-[250px] bg-muted/30">
                        <div className="absolute inset-0 z-10 opacity-90 hover:opacity-100 transition-opacity">
                          <MiniMap
                            lat={data.activeMission.location.latitude}
                            lng={data.activeMission.location.longitude}
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <MapPin className="size-8 text-muted-foreground/30 animate-pulse" />
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="p-4 border-t bg-muted/10 flex justify-end">
                      <Button onClick={() => setActiveTab("navigate")}>
                        <Navigation className="size-4 mr-2" />
                        Mở bản đồ điều phối
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card className="flex flex-col items-center justify-center h-full min-h-[400px] border-dashed shadow-none">
                    <CardContent className="flex flex-col items-center text-center p-6">
                      <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Zap className="size-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Sẵn sàng nhận lệnh</h3>
                      <p className="text-sm text-muted-foreground max-w-[300px]">
                        Hệ thống đang theo dõi. Đảm bảo trạng thái <strong className="text-emerald-500 font-medium">Online</strong> để nhận nhiệm vụ.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar Info & Notifications */}
              <div className="flex flex-col gap-6">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      <ShieldAlert className="size-4" /> Đơn vị trực thuộc
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <h3 className="text-2xl font-bold tracking-tight">{teamName}</h3>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                      <div className="size-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                        {leaderName.charAt(0)}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-semibold truncate">{leaderName}</span>
                        <span className="text-xs text-muted-foreground">Đội trưởng</span>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MessageSquare className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="flex-1 flex flex-col min-h-[300px]">
                  <CardHeader className="pb-3 border-b px-4 py-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-semibold">Hoạt động mới</CardTitle>
                    {visibleNotifications.length > 4 && (
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setIsNotiOpen(true)}>
                        Xem tất cả <ChevronRight className="size-3 ml-1" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="p-0 flex-1 flex flex-col">
                    <ScrollArea className="flex-1 h-[300px]">
                      <div className="flex flex-col">
                        {visibleNotifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <CheckCircle2 className="size-8 mb-2 opacity-50" />
                            <span className="text-xs font-medium uppercase">Trống</span>
                          </div>
                        ) : (
                          visibleNotifications.slice(0, 4).map((noti) => (
                            <div key={noti.id} className="p-4 border-b last:border-0 hover:bg-muted/50 transition-colors flex gap-3">
                              <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0", getNotificationDetails(noti.type).bg)}>
                                {getNotificationDetails(noti.type).icon}
                              </div>
                              <div className="flex flex-col flex-1 min-w-0 gap-1">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-sm font-medium truncate">{noti.title}</span>
                                </div>
                                <span className="text-xs text-muted-foreground line-clamp-1">{noti.message}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "navigate" && (
            <Card className="flex-1 flex flex-col overflow-hidden border shadow-sm">
              <div className="flex-1 relative min-h-[600px] bg-muted/20">
                <NavigateMap mission={data.activeMission} />
              </div>
            </Card>
          )}

          {(activeTab === "chat" || activeTab === "duty") && (
            <Card className="flex-1 flex flex-col items-center justify-center min-h-[500px] border-dashed shadow-none">
              <CardContent className="flex flex-col items-center text-center p-6 gap-4">
                <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                  {activeTab === "chat" ? <MessageSquare className="size-8 text-muted-foreground" /> : <ClipboardList className="size-8 text-muted-foreground" />}
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-semibold text-foreground">Tính năng đang phát triển</h3>
                  <p className="text-sm text-muted-foreground">
                    Mô đun <Badge variant="secondary" className="mx-1">{activeTab}</Badge> sẽ được cập nhật trong phiên bản tiếp theo.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
