export interface ShippingAddress {
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  district?: string;
  buildingNo?: string;
  additionalInfo?: string;
}

export interface OrderItem {
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  weight?: number;
}

export interface CreateShipmentInput {
  carrierId: string;
  storeId?: string;
  orderId?: string;
  senderName: string;
  senderPhone: string;
  senderCity: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverCity: string;
  receiverAddress: string;
  weight: number;
  pieces: number;
  codAmount?: number;
  description?: string;
}

export interface CarrierShipmentResponse {
  success: boolean;
  trackingNumber?: string;
  labelUrl?: string;
  rawResponse?: unknown;
  error?: string;
}

export interface TrackingResponse {
  success: boolean;
  events: TrackingEventData[];
  currentStatus?: string;
  error?: string;
}

export interface TrackingEventData {
  status: string;
  description: string;
  location?: string;
  timestamp: Date;
  rawData?: unknown;
}

export interface CarrierRateQuote {
  carrierId: string;
  carrierName: string;
  carrierCode: string;
  price: number;
  discountPrice: number;
  currency: string;
  estimatedDays: number;
}

export interface DashboardStats {
  totalShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  activeStores: number;
  availableWaybills: number;
}

export interface PlatformOrder {
  platformOrderId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status: string;
  notes?: string;
}

export interface PlatformWebhookPayload {
  event: string;
  data: Record<string, unknown>;
}
