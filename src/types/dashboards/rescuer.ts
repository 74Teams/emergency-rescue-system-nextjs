import { LocationInfo, MissionStatus, RequestPriority } from '../request'
import { VictimInfo } from '../type'

export type NotificationType =
    | 'NEW_MISSION_ASSIGNED'
    | 'SYSTEM_ALERT'
    | 'LEAVE_APPROVED'
    | 'LEAVE_REJECTED'
    | 'MISSION_CANCELED'

export interface RescuerProfile {
    id: string
    userId: string
    fullName: string
    specialty: string
    avatarUrl?: string
}

export interface RescuerDutyStatus {
    isOnline: boolean
    statusCode: 'READY' | 'ON_MISSION' | 'OFFLINE' | 'ON_LEAVE'
    lastUpdated: string
}

export interface RescuerNotification {
    id: string
    type: NotificationType
    title: string
    message: string
    createdAt: string
    isRead: boolean
    actionUrl?: string
}

export interface ActiveMissionLocation extends LocationInfo {
    distanceKm?: number
}

export interface RescuerActiveMission {
    id: string
    title: string
    status: MissionStatus
    priority: RequestPriority
    victims: VictimInfo[]
    location: ActiveMissionLocation
}

export interface RescuerDashboardData {
    profile: RescuerProfile
    dutyStatus: RescuerDutyStatus
    notifications: RescuerNotification[]
    activeMission: RescuerActiveMission | null
    team?: {
        name: string
        leaderName?: string
    }
}

/** @deprecated Use `RescuerDashboardData` */
export type MemberDashboardData = RescuerDashboardData
