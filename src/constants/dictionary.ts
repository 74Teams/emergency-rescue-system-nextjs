export const dictPriority: Record<string, string> = {
  CRITICAL: "Cấp bách",
  HIGH: "Nguy hiểm",
  MEDIUM: "Trung bình",
  LOW: "Thấp",
};
export const dictType: Record<string, string> = {
  FIRE: "Hỏa hoạn",
  FLOOD: "Ngập lụt",
  MEDICAL: "Y tế",
  LANDSLIDE: "Sạt lở",
  EARTHQUAKE: "Động đất",
  TRAFFIC: "Tai nạn GT",
  COLLAPSE: "Sập công trình",
  OTHER: "Khác",
};

export const dictStatus: Record<string, string> = {
  PENDING: "Chờ xử lý",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã giải quyết",
  ON_MISSION: "Đang làm nhiệm vụ",
  COMPLETED: "Hoàn thành",
  CLOSED: "Đã đóng",
};
