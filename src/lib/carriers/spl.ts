import { BaseCarrier } from "./base";
import { CarrierShipmentResponse, CreateShipmentInput, TrackingResponse } from "@/types";

export class SPLCarrier extends BaseCarrier {
  code = "SPL";
  name = "Saudi Post (SPL)";
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    super();
    this.apiKey = process.env.SPL_API_KEY || "";
    this.baseUrl = process.env.SPL_BASE_URL || "https://api.spl.com.sa";
  }

  async createShipment(input: CreateShipmentInput): Promise<CarrierShipmentResponse> {
    try {
      const payload = {
        shipment: {
          sender: {
            name: input.senderName,
            phone: input.senderPhone,
            city: input.senderCity,
            address: input.senderAddress,
            country: "SA",
          },
          receiver: {
            name: input.receiverName,
            phone: input.receiverPhone,
            city: input.receiverCity,
            address: input.receiverAddress,
            country: "SA",
          },
          weight: input.weight,
          pieces: input.pieces,
          codAmount: input.codAmount || 0,
          description: input.description || "Package",
          serviceType: input.codAmount ? "COD" : "NORMAL",
        },
      };

      const response = await this.httpRequest(`${this.baseUrl}/v1/shipments`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      const data = await response.json();

      if (data.trackingNumber) {
        return {
          success: true,
          trackingNumber: data.trackingNumber,
          labelUrl: data.labelUrl,
          rawResponse: data,
        };
      }

      return { success: false, error: data.message || "Failed to create SPL shipment" };
    } catch (error) {
      return { success: false, error: `SPL API error: ${(error as Error).message}` };
    }
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
    try {
      const response = await this.httpRequest(
        `${this.baseUrl}/v1/tracking/${trackingNumber}`,
        { headers: { Authorization: `Bearer ${this.apiKey}` } }
      );

      const data = await response.json();

      if (data.events) {
        const events = data.events.map((event: Record<string, string>) => ({
          status: event.status || "",
          description: event.description || "",
          location: event.location || "",
          timestamp: new Date(event.timestamp || Date.now()),
        }));
        return { success: true, events, currentStatus: events[0]?.status };
      }

      return { success: false, events: [], error: "No tracking data" };
    } catch (error) {
      return { success: false, events: [], error: (error as Error).message };
    }
  }

  async cancelShipment(trackingNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.httpRequest(`${this.baseUrl}/v1/shipments/${trackingNumber}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      const data = await response.json();
      return { success: data.success };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async printLabel(trackingNumber: string): Promise<{ success: boolean; url?: string; error?: string }> {
    return {
      success: true,
      url: `${this.baseUrl}/v1/shipments/${trackingNumber}/label`,
    };
  }
}
