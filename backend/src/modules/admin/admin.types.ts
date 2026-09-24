import { UserRole } from '../users/user.types.js';

export interface AdminUsersQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  isActive?: boolean;
  facilityId?: string;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  facilityId?: string;
  preferredLanguage?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaginatedAdminUsersResponse {
  users: AdminUserItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminDashboardMetrics {
  openCases: number;
  inReviewCases: number;
  escalatedCases: number;
  referredCases: number;
  overdueCases: number;
  unreadNotifications: number;
  activeReviewers: number;
  activeFacilities: number;
}
