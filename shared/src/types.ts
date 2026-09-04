// Enums
export type Role = 'CUSTOMER' | 'ADMIN';

export type OrderStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELLED';

export type PaymentStatus = 
  | 'PENDING' 
  | 'PAID' 
  | 'FAILED' 
  | 'REFUNDED';

export type PaymentMethod = 
  | 'CREDIT_CARD' 
  | 'PAYPAL' 
  | 'STRIPE' 
  | 'CASH_ON_DELIVERY'
  | 'RAZORPAY';

export type OtpPurpose = 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';

// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  emailVerified?: boolean;
  location?: string | null;
  crops?: string | null;
  status?: string;
  avatarUrl?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  email?: string;
  expiresInSeconds?: number;
  cooldownSeconds?: number;
}

export interface VerifyResetOtpResponse {
  resetToken: string;
  email: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string | Date;
  usedAt?: string | Date | null;
  createdAt: string | Date;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  verifiedCustomers: number;
}

// Category
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  subcategories?: Subcategory[];
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    products?: number;
    subcategories?: number;
  };
}

export interface Subcategory {
  id: string;
  categoryId: string;
  category?: Category;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: { products?: number };
}

// Product
export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  rating: number;
  numReviews: number;
  featured: boolean;
  images: string[];
  attributes?: Record<string, any> | null;
  categoryId: string;
  category?: Category;
  subcategoryId?: string | null;
  subcategory?: Subcategory | null;
  reviews?: Review[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Review
export interface Review {
  id: string;
  rating: number;
  comment: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  productId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Cart
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedAttributes?: Record<string, string> | null;
  cartId?: string;
}

export interface Cart {
  id: string;
  userId?: string | null;
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Shipping Address
export interface ShippingAddress {
  id?: string;
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

// Order & Order Item
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  title: string;
  price: number;
  quantity: number;
  variantId?: string | null;
  selectedAttributes?: Record<string, string> | null;
  imageUrl?: string | null;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Order {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  discountPrice?: number;
  couponCode?: string | null;
  payment?: Payment | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Analytics / Admin Dashboard
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: Order[];
  monthlySales: { month: string; sales: number }[];
  lowStockProducts: Product[];
}

// API Responses
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string | Record<string, any>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  categoryId?: string;
  subcategoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
  featured?: boolean;
}

// Service Bookings
export type BookingStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type HeroPage = 'HOME' | 'ABOUT' | 'SERVICES' | 'PRODUCTS';

export interface HeroBanner {
  id: string;
  page: HeroPage;
  title: string;
  highlightedText?: string | null;
  eyebrow?: string | null;
  description?: string | null;
  desktopImage: string;
  mobileImage?: string | null;
  imageAlt?: string | null;
  primaryButtonText?: string | null;
  primaryButtonLink?: string | null;
  secondaryButtonText?: string | null;
  secondaryButtonLink?: string | null;
  textAlignment: string;
  overlayColor: string;
  overlayOpacity: number;
  isActive: boolean;
  sortOrder: number;
  autoplayDuration: number;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ServiceBooking {
  id: string;
  bookingReference: string;
  serviceSlug: string;
  serviceName: string;
  name: string;
  phone: string;
  email?: string | null;
  location: string;
  farmSize?: string | null;
  cropType?: string | null;
  preferredDate?: string | Date | null;
  message?: string | null;
  adminNotes?: string | null;
  status: BookingStatus;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ServiceBookingStats {
  totalBookings: number;
  newBookings: number;
  contactedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  recentBookings: ServiceBooking[];
  serviceBreakdown: { serviceName: string; serviceSlug: string; count: number }[];
}

export interface ServiceBookingQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  serviceSlug?: string;
  status?: BookingStatus | string;
  sortBy?: 'newest' | 'oldest';
}
