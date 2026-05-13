// ==========================================
// 1. UNION TYPES (Các trường Enum cố định)
// ==========================================
// Dùng Union Types thay vì string để VS Code báo lỗi ngay nếu gõ sai chính tả
export type EmergencyCategory =
  | "FLOOD"
  | "FIRE"
  | "MEDICAL"
  | "LANDSLIDE"
  | "EARTHQUAKE"
  | "TRAFFIC"
  | "COLLAPSE"
  | "OTHER";
export type RequestPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type RequestStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type MissionStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
export type TeamStatus = "AVAILABLE" | "ON_MISSION" | "OFFLINE";
export type MemberStatus = "ONLINE" | "OFFLINE";

// ==========================================
// 2. INTERFACE THÀNH PHẦN (Tái sử dụng nhiều nơi)
// ==========================================

/** Thông tin người gửi yêu cầu cứu trợ */
export interface RequesterInfo {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
}

/** Tọa độ và địa chỉ chi tiết của sự cố */

export interface OsmAddressResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  //class?: string;
  //type?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationInfo extends Coordinates {
  id: string;
  address: string;
  landmark?: string;
}

/** Thông tin tóm tắt của Đội cứu hộ (Dùng khi đính kèm vào Mission) */
export interface RescueTeamShort {
  id: string;
  teamName: string;
  status: TeamStatus;
}

/** Lịch sử/Quá trình điều động đội cứu hộ cho yêu cầu này */
export interface MissionDetail {
  id: string;
  status: MissionStatus;
  startTime: string;
  endTime?: string;
  rescueTeam: RescueTeamShort;
}

// ==========================================
// 3. INTERFACE CHÍNH (Đại diện cho 1 Request)
// ==========================================

/** Cấu trúc chuẩn của 1 Yêu cầu cứu trợ hoàn chỉnh */
export interface RequestDetail {
  id: string;
  userId: string;
  requestedBy: RequesterInfo;
  emergencyType: EmergencyCategory;
  priority: RequestPriority;
  status: RequestStatus;
  description: string;
  location: LocationInfo;
  mediaUrl?: string[]; //TODO: Sau nay co the la thanh mang media luon
  submittedTime: string;
  missions: MissionDetail[]; // Một yêu cầu có thể điều nhiều đội (mảng)
  //DispatcherID?
  //VictimInfo:?
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 4. API WRAPPERS (Cho Homepage / Lấy danh sách)
// ==========================================

/** * Format trả về khi gọi API lấy danh sách ở Homepage.
 * Hỗ trợ sẵn phân trang (Pagination) để web không bị sập khi có 10.000 requests.
 */
export interface PaginatedRequestsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    items: RequestDetail[]; // Danh sách các request hiển thị trên bảng
    totalCount: number; // Tổng số request đang có
    page: number; // Trang hiện tại
    totalPages: number; // Tổng số trang
  };
}
