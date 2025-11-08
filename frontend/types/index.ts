// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

// URL Types
export interface ShortUrl {
  id: string;
  originalUrl: string;
  shortUrl: string;
  shortCode: string;
  title?: string;
  description?: string;
  favicon?: string;
  expiresAt?: string;
  isActive: boolean;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUrlRequest {
  originalUrl: string;
  customAlias?: string;
  expiresAt?: string;
}

export interface CreateUrlResponse {
  shortUrl: ShortUrl;
}

// Analytics Types
export interface AnalyticsOverview {
  totalClicks: number;
  totalUrls: number;
  activeUrls: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
}

export interface ClickData {
  date: string;
  clicks: number;
}

export interface DeviceStats {
  device: string;
  count: number;
}

export interface BrowserStats {
  browser: string;
  count: number;
}

export interface LocationStats {
  country: string;
  count: number;
}

export interface UrlAnalytics {
  shortUrlId: string;
  totalClicks: number;
  clicksByDate: ClickData[];
  deviceStats: DeviceStats[];
  browserStats: BrowserStats[];
  locationStats: LocationStats[];
}

// API Response Types
export interface ApiError {
  msg: string;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  msg?: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
