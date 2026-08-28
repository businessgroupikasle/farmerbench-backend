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
  | 'CASH_ON_DELIVERY';

// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// Category
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    products?: number;
  };
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
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
  featured?: boolean;
}
