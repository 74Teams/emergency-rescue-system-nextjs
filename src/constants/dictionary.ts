export const dictPriority: Record<string, string> = {
  "1": "Cấp bách",
  CRITICAL: "Cấp bách",
  "2": "Nguy hiểm",
  HIGH: "Nguy hiểm",
  "3": "Trung bình",
  MEDIUM: "Trung bình",
  "4": "Thấp",
  LOW: "Thấp",
};
export const dictType: Record<string, string> = {
  "1": "Hỏa hoạn",
  FIRE: "Hỏa hoạn",
  "2": "Ngập lụt",
  FLOOD: "Ngập lụt",
  "3": "Động đất",
  EARTHQUAKE: "Động đất",
  "4": "Y tế khẩn cấp",
  MEDICAL: "Y tế",
  MEDICAL_EMERGENCY: "Y tế khẩn cấp",
  "5": "Tai nạn GT",
  TRAFFIC: "Tai nạn GT",
  TRAFFIC_EMERGENCY: "Tai nạn GT",
  "6": "Sập công trình",
  COLLAPSE: "Sập công trình",
  BUILDING_COLLAPSE: "Sập công trình",
  "7": "Thiên tai",
  NATURAL_DISASTER: "Thiên tai",
  "8": "Khác",
  OTHER: "Khác",
};

export const dictStatus: Record<string, string> = {
  PENDING: "Chờ xử lý",
  ACCEPTED: "Đã tiếp nhận",
  ASSIGNED: "Đã phân công",
  EN_ROUTE: "Đang di chuyển",
  ON_SITE: "Đã đến hiện trường",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã giải quyết",
  COMPLETED: "Hoàn thành",
  ABORTED: "Đã hủy bỏ",
  CANCELED: "Đã hủy",
  CLOSED: "Đã đóng",
};

export const dictTeamStatus: Record<string, string> = {
  AVAILABLE: "Sẵn sàng",
  ON_MISSION: "Đang làm nhiệm vụ",
  UNAVAILABLE: "Không sẵn sàng",
  MAINTENANCE: "Bảo trì",
};