export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
export type PlanType = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE'
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING'

export interface JwtPayload {
  id: string
  email: string
  role: Role
  schoolId: string | null
  name: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}