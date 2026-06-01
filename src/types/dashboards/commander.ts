export type TeamStatus =
  | "AVAILABLE"
  | "ON_MISSION"
  | "UNAVAILABLE"
  | "MAINTENANCE";

type BadgeConfig = {
  text: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  color: string;
};

export const TEAM_STATUS_BADGES: Record<TeamStatus, BadgeConfig> = {
  AVAILABLE: {
    text: "Sẵn sàng",
    variant: "default",
    color:
      "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200 font-medium",
  },
  ON_MISSION: {
    text: "Đang làm nhiệm vụ",
    variant: "default",
    color:
      "bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200 font-medium",
  },
  MAINTENANCE: {
    text: "Bảo trì",
    variant: "secondary",
    color:
      "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200 font-medium",
  },
  UNAVAILABLE: {
    text: "Không khả dụng",
    variant: "destructive",
    color:
      "bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-200 font-medium",
  },
};

type RoleConfig = {
  text: string;
  color: string;
};

export const ROLE_BADGES: Record<string, RoleConfig> = {
  Commander: {
    text: "Chỉ Huy",
    // Đen chì/Premium - Thể hiện cấp cao nhất, quyền lực tối cao tại Trung tâm chỉ huy
    color:
      "bg-slate-900 text-white font-black shadow-md shadow-slate-900/20 border-none",
  },
  RescuerLeader: {
    text: "Đội Trưởng",
    // Đỏ phản quang/Cứu hỏa - Chỉ huy thực địa, cực kỳ nổi bật để nhận diện trong đám đông
    color:
      "bg-red-600 text-white font-bold shadow-md shadow-red-600/20 border-none",
  },
  Dispatcher: {
    text: "Điều Phối Viên",
    // Xanh dương tín hiệu - Đại diện cho thông tin liên lạc, kỹ thuật mạng lưới và tổng đài
    color:
      "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 border-none",
  },
  Rescuer: {
    text: "Cứu Hộ Viên",
    // Xanh lá cây/An toàn - Lực lượng nòng cốt xông pha cứu nạn, mang lại cảm giác an tâm
    color:
      "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20 border-none",
  },
  Citizen: {
    text: "Người Dân",
    // Xám xi măng/Trung tính - Người dân dùng app, hạ tone thấp xuống hẳn để nhường chỗ cho các lực lượng chức năng
    color: "bg-zinc-400 text-white font-medium border-none",
  },
};
