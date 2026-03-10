import { BaseCarrier } from "./base";
import { CarrierShipmentResponse, CreateShipmentInput, TrackingResponse } from "@/types";

export class SMSACarrier extends BaseCarrier {
  code = "SMSA";
  name = "SMSA Express";
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    super();
    this.apiKey = process.env.SMSA_API_KEY || "";
    this.baseUrl = process.env.SMSA_BASE_URL || "https://api.smsaexpress.com";
  }

  async createShipment(input: CreateShipmentInput): Promise<CarrierShipmentResponse> {
    try {
      const payload = {
        passKey: this.apiKey,
        refNo: `SHP-${Date.now()}`,
        sentDate: new Date().toISOString(),
        idNo: "",
        cName: input.receiverName,
        cntry: "SA",
        cCity: input.receiverCity,
        cZip: "",
        cPOBox: "",
        cMobile: input.receiverPhone,
        cTel1: input.receiverPhone,
        cTel2: "",
        cAddr1: input.receiverAddress,
        cAddr2: "",
        shipType: "DLV",
        PCs: input.pieces,
        cWeight: input.weight,
        cEmail: "",
        carrValue: "",
        carrCurr: "",
        codAmt: input.codAmount || 0,
        custVal: "",
        custCurr: "",
        insrAmt: "",
        insrCurr: "",
        itemDesc: input.description || "Package",
        sName: input.senderName,
        sContact: input.senderPhone,
        sAddr1: input.senderAddress,
        sCity: input.senderCity,
        sPhone: input.senderPhone,
        sCntry: "SA",
        prefDelvDate: "",
        gpsPoints: "",
      };

      const response = await this.httpRequest(`${this.baseUrl}/api/addShipment`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { apikey: this.apiKey },
      });

      const data = await response.json();

      if (data.sawb) {
        return {
          success: true,
          trackingNumber: data.sawb,
          labelUrl: `${this.baseUrl}/api/getPDF?passKey=${this.apiKey}&awbNo=${data.sawb}`,
          rawResponse: data,
        };
      }

      return { success: false, error: data.errorMsg || "Failed to create SMSA shipment", rawResponse: data };
    } catch (error) {
      return { success: false, error: `SMSA API error: ${(error as Error).message}` };
    }
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
    try {
      const response = await this.httpRequest(
        `${this.baseUrl}/api/getTracking?passKey=${this.apiKey}&awbNo=${trackingNumber}`,
        { method: "GET", headers: { apikey: this.apiKey } }
      );

      const data = await response.json();

      if (data.sawpieces) {
        const events = (data.sawpieces || []).map((event: Record<string, string>) => ({
          status: event.Activity || "",
          description: event.Details || "",
          location: event.Location || "",
          timestamp: new Date(event.Date || Date.now()),
          rawData: event,
        }));

        return {
          success: true,
          events,
          currentStatus: events[0]?.status || "UNKNOWN",
        };
      }

      return { success: false, events: [], error: "No tracking data found" };
    } catch (error) {
      return { success: false, events: [], error: `SMSA tracking error: ${(error as Error).message}` };
    }
  }

  async cancelShipment(trackingNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.httpRequest(`${this.baseUrl}/api/cancelShipment`, {
        method: "POST",
        body: JSON.stringify({ passKey: this.apiKey, awbNo: trackingNumber }),
        headers: { apikey: this.apiKey },
      });

      const data = await response.json();
      return { success: !!data.success };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async printLabel(trackingNumber: string): Promise<{ success: boolean; url?: string; error?: string }> {
    return {
      success: true,
      url: `${this.baseUrl}/api/getPDF?passKey=${this.apiKey}&awbNo=${trackingNumber}`,
    };
  }
}
