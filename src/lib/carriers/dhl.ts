import { BaseCarrier } from "./base";
import { CarrierShipmentResponse, CreateShipmentInput, TrackingResponse } from "@/types";

export class DHLCarrier extends BaseCarrier {
  code = "DHL";
  name = "DHL Express";
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    super();
    this.apiKey = process.env.DHL_API_KEY || "";
    this.baseUrl = process.env.DHL_BASE_URL || "https://express.api.dhl.com";
  }

  async createShipment(input: CreateShipmentInput): Promise<CarrierShipmentResponse> {
    try {
      const payload = {
        plannedShippingDateAndTime: new Date().toISOString(),
        pickup: { isRequested: false },
        productCode: "N",
        accounts: [{ typeCode: "shipper", number: this.apiKey }],
        customerDetails: {
          shipperDetails: {
            postalAddress: {
              addressLine1: input.senderAddress,
              cityName: input.senderCity,
              countryCode: "SA",
            },
            contactInformation: {
              phone: input.senderPhone,
              companyName: input.senderName,
              fullName: input.senderName,
            },
          },
          receiverDetails: {
            postalAddress: {
              addressLine1: input.receiverAddress,
              cityName: input.receiverCity,
              countryCode: "SA",
            },
            contactInformation: {
              phone: input.receiverPhone,
              companyName: input.receiverName,
              fullName: input.receiverName,
            },
          },
        },
        content: {
          packages: [
            {
              weight: input.weight,
              dimensions: { length: 30, width: 20, height: 15 },
            },
          ],
          isCustomsDeclarable: false,
          declaredValue: input.codAmount || 0,
          declaredValueCurrency: "SAR",
          description: input.description || "Package",
        },
      };

      const response = await this.httpRequest(`${this.baseUrl}/mydhlapi/shipments`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { Authorization: `Basic ${this.apiKey}` },
      });

      const data = await response.json();

      if (data.shipmentTrackingNumber) {
        return {
          success: true,
          trackingNumber: data.shipmentTrackingNumber,
          labelUrl: data.documents?.[0]?.url,
          rawResponse: data,
        };
      }

      return { success: false, error: data.detail || "Failed to create DHL shipment", rawResponse: data };
    } catch (error) {
      return { success: false, error: `DHL API error: ${(error as Error).message}` };
    }
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
    try {
      const response = await this.httpRequest(
        `${this.baseUrl}/mydhlapi/shipments/${trackingNumber}/tracking`,
        { headers: { Authorization: `Basic ${this.apiKey}` } }
      );

      const data = await response.json();

      if (data.shipments?.[0]?.events) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const events = data.shipments[0].events.map((event: any) => ({
          status: event.typeCode || "",
          description: event.description || "",
          location: event.serviceArea?.[0]?.description || "",
          timestamp: new Date(event.date || Date.now()),
          rawData: event,
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
      await this.httpRequest(`${this.baseUrl}/mydhlapi/shipments/${trackingNumber}`, {
        method: "DELETE",
        headers: { Authorization: `Basic ${this.apiKey}` },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async printLabel(trackingNumber: string): Promise<{ success: boolean; url?: string; error?: string }> {
    return {
      success: true,
      url: `${this.baseUrl}/mydhlapi/shipments/${trackingNumber}/get-image`,
    };
  }
}
