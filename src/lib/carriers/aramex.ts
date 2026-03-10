import { BaseCarrier } from "./base";
import { CarrierShipmentResponse, CreateShipmentInput, TrackingResponse } from "@/types";

export class AramexCarrier extends BaseCarrier {
  code = "ARAMEX";
  name = "Aramex";
  private baseUrl: string;
  private clientInfo: {
    UserName: string;
    Password: string;
    AccountNumber: string;
    AccountPin: string;
    AccountEntity: string;
    AccountCountryCode: string;
    Version: string;
  };

  constructor() {
    super();
    this.baseUrl = process.env.ARAMEX_BASE_URL || "https://ws.aramex.net";
    this.clientInfo = {
      UserName: process.env.ARAMEX_USERNAME || "",
      Password: process.env.ARAMEX_PASSWORD || "",
      AccountNumber: process.env.ARAMEX_ACCOUNT_NUMBER || "",
      AccountPin: process.env.ARAMEX_ACCOUNT_PIN || "",
      AccountEntity: process.env.ARAMEX_ACCOUNT_ENTITY || "",
      AccountCountryCode: process.env.ARAMEX_ACCOUNT_COUNTRY_CODE || "SA",
      Version: "v1.0",
    };
  }

  async createShipment(input: CreateShipmentInput): Promise<CarrierShipmentResponse> {
    try {
      const payload = {
        ClientInfo: this.clientInfo,
        LabelInfo: { ReportID: 9201, ReportType: "URL" },
        Shipments: [
          {
            Reference1: `SHP-${Date.now()}`,
            Shipper: {
              Reference1: `SHP-${Date.now()}`,
              AccountNumber: this.clientInfo.AccountNumber,
              PartyAddress: {
                Line1: input.senderAddress,
                City: input.senderCity,
                CountryCode: "SA",
              },
              Contact: {
                Department: "",
                PersonName: input.senderName,
                Title: "",
                CompanyName: input.senderName,
                PhoneNumber1: input.senderPhone,
                CellPhone: input.senderPhone,
                EmailAddress: "",
                Type: "",
              },
            },
            Consignee: {
              Reference1: "",
              AccountNumber: "",
              PartyAddress: {
                Line1: input.receiverAddress,
                City: input.receiverCity,
                CountryCode: "SA",
              },
              Contact: {
                Department: "",
                PersonName: input.receiverName,
                Title: "",
                CompanyName: input.receiverName,
                PhoneNumber1: input.receiverPhone,
                CellPhone: input.receiverPhone,
                EmailAddress: "",
                Type: "",
              },
            },
            TransportType: 0,
            ShippingDateTime: `/Date(${Date.now()})/`,
            DueDate: `/Date(${Date.now() + 3 * 86400000})/`,
            Details: {
              Dimensions: null,
              ActualWeight: { Unit: "KG", Value: input.weight },
              ChargeableWeight: null,
              DescriptionOfGoods: input.description || "Package",
              NumberOfPieces: input.pieces,
              ProductGroup: "DOM",
              ProductType: input.codAmount ? "CDA" : "ONP",
              PaymentType: "P",
              CashOnDeliveryAmount: input.codAmount
                ? { CurrencyCode: "SAR", Value: input.codAmount }
                : null,
            },
          },
        ],
      };

      const response = await this.httpRequest(
        `${this.baseUrl}/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments`,
        { method: "POST", body: JSON.stringify(payload) }
      );

      const data = await response.json();

      if (data.Shipments && data.Shipments.length > 0) {
        const shipment = data.Shipments[0];
        return {
          success: true,
          trackingNumber: shipment.ID,
          labelUrl: shipment.ShipmentLabel?.LabelURL,
          rawResponse: data,
        };
      }

      const errorMsg = data.Notifications?.map((n: { Message: string }) => n.Message).join(", ");
      return { success: false, error: errorMsg || "Failed to create Aramex shipment", rawResponse: data };
    } catch (error) {
      return { success: false, error: `Aramex API error: ${(error as Error).message}` };
    }
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
    try {
      const payload = {
        ClientInfo: this.clientInfo,
        GetLastTrackingUpdateOnly: false,
        Shipments: [trackingNumber],
      };

      const response = await this.httpRequest(
        `${this.baseUrl}/ShippingAPI.V2/Tracking/Service_1_0.svc/json/TrackShipments`,
        { method: "POST", body: JSON.stringify(payload) }
      );

      const data = await response.json();

      if (data.TrackingResults && data.TrackingResults.length > 0) {
        const result = data.TrackingResults[0];
        const events = (result.Value || []).map((event: Record<string, string>) => ({
          status: event.UpdateCode || "",
          description: event.UpdateDescription || "",
          location: event.UpdateLocation || "",
          timestamp: new Date(parseInt(event.UpdateDateTime?.replace(/[^0-9]/g, "") || "0")),
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
      const response = await this.httpRequest(
        `${this.baseUrl}/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CancelPickup`,
        {
          method: "POST",
          body: JSON.stringify({
            ClientInfo: this.clientInfo,
            ShipmentNumber: trackingNumber,
          }),
        }
      );
      const data = await response.json();
      return { success: !data.HasErrors };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async printLabel(trackingNumber: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const payload = {
        ClientInfo: this.clientInfo,
        LabelInfo: { ReportID: 9201, ReportType: "URL" },
        ShipmentNumber: trackingNumber,
      };

      const response = await this.httpRequest(
        `${this.baseUrl}/ShippingAPI.V2/Shipping/Service_1_0.svc/json/PrintLabel`,
        { method: "POST", body: JSON.stringify(payload) }
      );

      const data = await response.json();
      return { success: true, url: data.ShipmentLabel?.LabelURL };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
