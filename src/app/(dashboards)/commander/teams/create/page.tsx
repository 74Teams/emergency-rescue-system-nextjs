"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  ShieldHalf,
  Users,
  Crown,
  Mail,
  Search,
  Check,
  ChevronsUpDown,
  Loader2,
  UserPlus,
  X,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// === SHADCN COMPONENTS ===
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// === API HOOKS & TYPES ===
import {
  useSystemUsers,
  useCreateRescueTeam,
} from "@/lib/api/features/commander/commander-dashboard.queries";
import { ProfileResponse } from "@/lib/api/types";
import { ROLE_BADGES } from "@/types/dashboards/commander";

export default function CreateTeamPage() {
  const router = useRouter();

  // === DATA ===
  const { data: allUsers } = useSystemUsers();
  const createTeamMutation = useCreateRescueTeam();

  // === FORM STATES ===
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [baseLocationId] = useState("FB3BE536-D174-4D0C-A2D2-0008D7B42DA6");

  const [selectedLeader, setSelectedLeader] = useState<ProfileResponse | null>(
    null,
  );
  const [selectedMembers, setSelectedMembers] = useState<ProfileResponse[]>([]);

  const [openLeaderCombo, setOpenLeaderCombo] = useState(false);
  const [openMemberCombo, setOpenMemberCombo] = useState(false);

  // === LỌC NHÂN SỰ ===
  const eligibleLeaders = useMemo(() => {
    return allUsers?.filter(
      (u) =>
        u.isActive &&
        u.roles?.includes("Rescuer") &&
        !u.roles?.includes("RescuerLeader") &&
        !u.rescueTeamId, // Lọc những người chưa có team
    );
  }, [allUsers]);

  const eligibleMembers = useMemo(() => {
    return allUsers?.filter(
      (u) =>
        u.isActive &&
        u.roles?.includes("Rescuer") &&
        !u.roles?.includes("RescuerLeader") &&
        !u.rescueTeamId && // Không thuộc về bất kỳ team nào
        u.id !== selectedLeader?.id && // Không cho Đội trưởng làm thành viên
        !selectedMembers.some((m) => m.id === u.id), // Ẩn những người đã được chọn
    );
  }, [allUsers, selectedLeader, selectedMembers]);

  // === HANDLERS ===
  const handleCreateTeam = async () => {
    if (!teamName || !selectedLeader) {
      toast.error("Vui lòng nhập Tên đội và chọn Sĩ quan chỉ huy!");
      return;
    }

    try {
      await createTeamMutation.mutateAsync({
        teamName,
        description,
        teamLeaderId: selectedLeader.id,
        baseLocationId,
        memberIds: selectedMembers.map((m) => m.id), // Truyền thẳng 1 cục lên BE
      });

      toast.success("Khởi tạo Đội cứu hộ thành công!");
      router.push("/commander"); // Chuyển hướng về trang Dashboard
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Lỗi khi khởi tạo đội.");
    }
  };

  const getAvatarText = (name?: string) => {
    if (!name) return "U";
    const p = name.trim().split(" ");
    return p.length > 1
      ? `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase()
      : p[0][0].toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800">
      {/* === TOP APP BAR === */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 h-20 px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-slate-100"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Thành lập Đội Cứu Hộ Mới
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Thiết lập bộ khung lực lượng và biên chế nhân sự
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="font-bold border-slate-200 h-11 px-6 shadow-sm"
            onClick={() => router.back()}
          >
            Hủy bỏ
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 font-bold h-11 px-8 shadow-md shadow-blue-600/20"
            onClick={handleCreateTeam}
            disabled={createTeamMutation.isPending}
          >
            {createTeamMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ShieldCheck className="w-4 h-4 mr-2" />
            )}
            Phê chuẩn & Thành lập
          </Button>
        </div>
      </header>

      {/* === MAIN CONTENT (LAYOUT 2 CỘT) === */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* ========================================================= */}
        {/* CỘT TRÁI: FORM NHẬP LIỆU                                  */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Section 1: Thông tin cơ bản */}
          <section className="space-y-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
              <ShieldHalf className="text-blue-600" /> Hồ sơ Đội Cứu Hộ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Box Upload Logo */}
              <div className="col-span-1">
                <div className="w-full aspect-square bg-white border-2 border-dashed border-slate-300 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer group shadow-sm">
                  <div className="w-14 h-14 bg-slate-50 group-hover:bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-sm">Tải Logo lên</span>
                  <span className="text-[10px] mt-1 font-medium text-slate-400">
                    JPG, PNG (Tối đa 2MB)
                  </span>
                </div>
              </div>

              {/* Tên & Mô tả */}
              <div className="col-span-2 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Tên Đội / Mã Hiệu <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    className="h-14 bg-white border-slate-200 shadow-sm font-black text-lg text-slate-800 focus:ring-blue-500/20"
                    placeholder="VD: Đội Phản Ứng Nhanh Alpha"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Nhiệm vụ chuyên trách / Mô tả
                  </label>
                  <Input
                    className="h-12 bg-white border-slate-200 shadow-sm font-medium"
                    placeholder="VD: Chuyên cứu hộ trên sông ngòi..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Chọn Đội Trưởng */}
          <section className="space-y-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Crown className="text-amber-500" /> Đội trưởng Đội Cứu Hộ {" "}
              <span className="text-rose-500">*</span>
            </h3>
            <div className="space-y-2">
              <Popover open={openLeaderCombo} onOpenChange={setOpenLeaderCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-white border-slate-200 h-16 hover:bg-slate-50 px-5 shadow-sm"
                  >
                    {selectedLeader ? (
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10 border border-slate-200 shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 font-black">
                            {getAvatarText(selectedLeader.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <span className="font-bold text-slate-800 text-sm leading-none mb-1.5">
                            {selectedLeader.fullName}
                          </span>
                          <span className="text-xs text-slate-500 font-medium leading-none">
                            {selectedLeader.email}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Search size={18} />{" "}
                        <span className="font-medium">
                          Tìm & Lựa chọn Đội trưởng..
                        </span>
                      </div>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0 rounded-2xl shadow-xl border-slate-100"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder="Gõ tên hoặc email để tìm..."
                      className="h-12"
                    />
                    <CommandList className="max-h-[250px] scroll-smooth">
                      <CommandEmpty className="py-6 text-center text-slate-500 font-medium">
                        Không có người nào khả dụng.
                      </CommandEmpty>
                      <CommandGroup>
                        {eligibleLeaders?.map((user) => {
                          const roleStyle =
                            ROLE_BADGES[user.roles?.[0] || "Citizen"] ||
                            ROLE_BADGES["Citizen"];
                          return (
                            <CommandItem
                              key={user.id}
                              value={`${user.fullName} ${user.email}`}
                              onSelect={() => {
                                setSelectedLeader(user);
                                setOpenLeaderCombo(false);
                              }}
                              className="cursor-pointer py-3 px-4 aria-selected:bg-blue-50 group transition-all"
                            >
                              <Check
                                className={cn(
                                  "mr-3 h-4 w-4 text-blue-600 transition-all",
                                  selectedLeader?.id === user.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <Avatar className="w-8 h-8 border border-slate-200 mr-3">
                                <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold">
                                  {getAvatarText(user.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col flex-1">
                                <span className="font-bold text-slate-800">
                                  {user.fullName}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {user.email}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] uppercase tracking-widest ml-auto border-none",
                                  roleStyle.color,
                                )}
                              >
                                {roleStyle.text}
                              </Badge>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-[11px] text-slate-500 font-medium mt-2">
                * Nhân sự được chọn sẽ tự động nâng cấp quyền hạn lên{" "}
                <strong className="text-blue-600">Rescuer Leader</strong>.
              </p>
            </div>
          </section>

          {/* Section 3: Thêm Thành viên dự kiến */}
          <section className="space-y-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Users className="text-emerald-500" /> Biên chế dự kiến
            </h3>
            <div className="space-y-4">
              <Popover open={openMemberCombo} onOpenChange={setOpenMemberCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-start bg-white border-slate-200 border-dashed h-14 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 text-slate-400 shadow-sm"
                  >
                    <UserPlus size={18} className="mr-3" />{" "}
                    <span className="font-bold">
                      Nhấn để tìm & bổ sung thành viên...
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0 rounded-2xl shadow-xl border-slate-100"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder="Gõ tên hoặc email để tìm..."
                      className="h-12 text-sm"
                    />
                    <CommandList className="max-h-[250px] scroll-smooth">
                      <CommandEmpty className="py-6 text-center text-slate-500 font-medium">
                        Không tìm thấy nhân sự phù hợp.
                      </CommandEmpty>
                      <CommandGroup>
                        {eligibleMembers?.map((user) => {
                          const roleStyle =
                            ROLE_BADGES[user.roles?.[0] || "Citizen"] ||
                            ROLE_BADGES["Citizen"];
                          return (
                            <CommandItem
                              key={user.id}
                              value={`${user.fullName} ${user.email}`}
                              onSelect={() => {
                                setSelectedMembers([...selectedMembers, user]);
                                setOpenMemberCombo(false);
                              }}
                              className="cursor-pointer py-3 px-4 aria-selected:bg-blue-50 group"
                            >
                              <Avatar className="w-8 h-8 border border-slate-200 mr-3">
                                <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold">
                                  {getAvatarText(user.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col flex-1">
                                <span className="font-bold text-slate-800">
                                  {user.fullName}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {user.email}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] uppercase tracking-widest ml-auto border-none",
                                  roleStyle.color,
                                )}
                              >
                                {roleStyle.text}
                              </Badge>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Danh sách Members đã được pick */}
              {selectedMembers.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <Badge
                      key={member.id}
                      variant="secondary"
                      className="h-10 px-3 pl-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 flex items-center gap-2"
                    >
                      <Avatar className="w-7 h-7 border border-white shadow-sm">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px]">
                          {getAvatarText(member.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      {member.fullName}
                      <button
                        onClick={() =>
                          setSelectedMembers((prev) =>
                            prev.filter((m) => m.id !== member.id),
                          )
                        }
                        className="w-5 h-5 rounded-full hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors ml-1 text-slate-400"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ========================================================= */}
        {/* CỘT PHẢI: LIVE PREVIEW CARD                               */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-28 space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              Xem trước thẻ hiển thị
            </h3>

            <Card className="rounded-[2rem] border-slate-200 bg-white shadow-xl shadow-blue-900/5 overflow-hidden ring-1 ring-slate-100 transition-all duration-300">
              {/* Header Card Preview */}
              <div className="relative p-6 pb-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f00a_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f00a_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-50"></div>
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <h4 className="text-2xl font-black text-white tracking-tight line-clamp-2">
                      {teamName || "Tên Đội / Mã Hiệu"}
                    </h4>
                    <p className="text-sm text-slate-400 font-medium line-clamp-2">
                      {description || "Chưa có mô tả nhiệm vụ."}
                    </p>
                  </div>
                  <Badge
                    variant="default"
                    className="bg-slate-600/80 text-slate-200 border-none shrink-0 font-black tracking-widest uppercase"
                  >
                    BẢN NHÁP
                  </Badge>
                </div>
              </div>

              {/* Body Card Preview */}
              <CardContent className="relative flex-1 p-6 pt-0">
                <div className="flex items-end justify-between -mt-8 mb-6 relative z-20">
                  <div className="relative">
                    <Avatar className="w-16 h-16 border-[4px] border-white shadow-md bg-white">
                      <AvatarFallback className="bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 font-black text-xl">
                        {selectedLeader
                          ? getAvatarText(selectedLeader.fullName)
                          : "LD"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-white shadow-sm">
                      <Crown size={12} strokeWidth={3} />
                    </div>
                  </div>
                  <div className="mb-2 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Chỉ huy trưởng
                    </p>
                    <p className="text-base font-black text-slate-800">
                      {selectedLeader?.fullName || "Chưa bổ nhiệm"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                  <div className="flex items-center gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm border border-slate-100">
                      <Users size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-3xl font-black text-slate-800 leading-none">
                        {selectedMembers.length}
                      </p>
                      <p className="text-[11px] font-bold text-slate-500 mt-2 uppercase tracking-widest">
                        Nhân sự dự kiến
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Footer Preview */}
              <CardFooter className="p-6 pt-0 bg-slate-50 border-t border-slate-100 mt-auto flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>Căn cứ: ID {baseLocationId.split("-")[0]}...</span>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
