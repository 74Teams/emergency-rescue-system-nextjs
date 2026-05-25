# API Documentation - RescueSystem

## Tổng quan
- **Base URL**: `https://localhost:5001`
- **Prefix API**: `/api`
- **Swagger UI (Development)**: `/`
- **Auth**: JWT Bearer (`Authorization: Bearer <token>`)

## Chuẩn phản hồi
Hầu hết endpoints trả về `ApiResponse<T>` (xem `RescueSystem.Application.Common.Response.ApiResponse`):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {}
}
```

Một số endpoints (đặc biệt trong `AuthController`, `ChecklistController`) trả về object dạng:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "..."
}
```

## Auth API (`/api/auth`)
| Method | Path | Auth | Ghi chú |
|---|---|---|---|
| POST | `/api/auth/register` | No | Đăng ký |
| POST | `/api/auth/login` | No | Đăng nhập |
| POST | `/api/auth/refresh` | No | Làm mới access token |
| GET | `/api/auth/profile` | Yes | Lấy profile |
| PUT | `/api/auth/profile` | Yes | Cập nhật profile |
| POST | `/api/auth/avatar` | Yes | Upload avatar (multipart/form-data) |
| POST | `/api/auth/forgot-password` | No | Gửi email đặt lại mật khẩu |
| POST | `/api/auth/reset-password` | No | Đặt lại mật khẩu |
| POST | `/api/auth/contact` | Yes | Tạo contact |
| PUT | `/api/auth/contact/{id}` | Yes | Cập nhật contact |
| DELETE | `/api/auth/contact/{id}` | Yes | Xóa contact |
| GET | `/api/auth/contact/{id}` | Yes | Lấy contact theo id |
| GET | `/api/auth/contact` | Yes | Lấy tất cả contact |

## Requests API (`/api/requests`)
| Method | Path | Auth | Ghi chú |
|---|---|---|---|
| POST | `/api/requests` | No | Tạo yêu cầu cứu hộ (FromForm) |
| GET | `/api/requests` | No | Danh sách + lọc (query) |
| GET | `/api/requests/{id}` | No | Chi tiết yêu cầu |
| PUT | `/api/requests/{id}` | No | Cập nhật yêu cầu (FromForm) |
| DELETE | `/api/requests/{id}` | No | Xóa yêu cầu |
| PUT | `/api/requests/{id}/status` | Yes | **Roles**: Dispatcher, Commander |

## Missions API (`/api/missions`)
| Method | Path | Auth | Ghi chú |
|---|---|---|---|
| POST | `/api/missions` | No | Tạo nhiệm vụ |
| GET | `/api/missions` | No | Danh sách + phân trang |
| GET | `/api/missions/{id}` | No | Chi tiết nhiệm vụ |
| PUT | `/api/missions/{id}/status` | No | Cập nhật trạng thái |
| PUT | `/api/missions/{id}/finish` | Yes | **Roles**: Rescuer, Dispatcher |
| PUT | `/api/missions/{id}/abort` | No | Hủy nhiệm vụ |
| GET | `/api/missions/{id}/history` | No | Lịch sử trạng thái |

## Rescue Teams API (`/api/RescueTeam`)
| Method | Path | Auth | Ghi chú |
|---|---|---|---|
| GET | `/api/RescueTeam` | No | Danh sách đội |
| GET | `/api/RescueTeam/{teamId}` | No | Chi tiết đội |
| POST | `/api/RescueTeam` | No | Tạo đội |
| PUT | `/api/RescueTeam/{teamId}/status/{newStatus}` | No | Cập nhật trạng thái đội |
| DELETE | `/api/RescueTeam/{teamId}` | No | Xóa đội |
| GET | `/api/RescueTeam/{teamId}/members` | No | Danh sách thành viên |
| POST | `/api/RescueTeam/{teamId}/member/{memberId}` | No | Thêm thành viên |
| DELETE | `/api/RescueTeam/{teamId}/member/{memberId}` | No | Xóa thành viên |
| GET | `/api/RescueTeam/{teamId}/missions` | No | Nhiệm vụ của đội |

## Locations API (`/api/Location`)
| Method | Path | Auth | Ghi chú |
|---|---|---|---|
| GET | `/api/Location` | No | Danh sách vị trí |
| GET | `/api/Location/{id}` | No | Chi tiết vị trí |
| POST | `/api/Location` | No | Tạo vị trí |
| PUT | `/api/Location/{id}` | No | Cập nhật vị trí |
| DELETE | `/api/Location/{id}` | No | Xóa vị trí |

## Roles API (`/api/Roles`)
| Method | Path | Auth | Ghi chú |
|---|---|---|---|
| POST | `/api/Roles` | No | Tạo role |
| GET | `/api/Roles` | No | Danh sách role |
| GET | `/api/Roles/{id}` | No | Chi tiết role |
| PUT | `/api/Roles/{id}` | No | Cập nhật role |
| DELETE | `/api/Roles/{id}` | No | Xóa role |

## Users API (`/api/Users`)
| Method | Path | Auth | Ghi chú |
|---|---|---|---|
| POST | `/api/Users` | No | Tạo user |
| GET | `/api/Users` | No | Danh sách user |
| GET | `/api/Users/{id}` | No | Chi tiết user |
| PUT | `/api/Users/{id}` | No | Cập nhật user |
| DELETE | `/api/Users/{id}` | No | Xóa user |

## Commander API (`/api/Commander`)
| Method | Path | Auth | Ghi chú |
|---|---|---|---|
| GET | `/api/Commander/approvals/pending` | No | Danh sách chờ duyệt |
| GET | `/api/Commander/approvals/rejected` | No | Danh sách bị từ chối |
| GET | `/api/Commander/users` | No | Danh sách hệ thống (query: `search`, `role`) |
| POST | `/api/Commander/approvals/{userId}` | No | Duyệt tài khoản |
| POST | `/api/Commander/approvals/{userId}/reject` | No | Từ chối tài khoản |
| PUT | `/api/Commander/users/{userId}/status` | No | Bật/tắt trạng thái (`{ "isActive": true }`) |

## Checklist API (`/api/checklist`)
| Method | Path | Auth | Ghi chú |
|---|---|---|---|
| POST | `/api/checklist` | Yes | **Roles**: Dispatcher, Admin |
| GET | `/api/checklist` | Yes | **Roles**: Dispatcher, Rescuer, Admin |
| GET | `/api/checklist/{id}` | Yes | **Roles**: Dispatcher, Rescuer, Admin |
| PUT | `/api/checklist/{id}` | Yes | **Roles**: Dispatcher, Admin |
| DELETE | `/api/checklist/{id}` | Yes | **Roles**: Dispatcher, Admin |
| POST | `/api/checklist/{checklistId}/items` | Yes | **Roles**: Dispatcher, Admin |
| GET | `/api/checklist/{id}/items` | Yes | **Roles**: Dispatcher, Rescuer, Admin |
| GET | `/api/checklist/items/{id}` | Yes | **Roles**: Dispatcher, Rescuer, Admin |
| PUT | `/api/checklist/items/{id}` | Yes | **Roles**: Dispatcher, Rescuer, Admin |
| DELETE | `/api/checklist/items/{id}` | Yes | **Roles**: Dispatcher, Admin |
