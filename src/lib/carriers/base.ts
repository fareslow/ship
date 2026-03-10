import { CarrierShipmentResponse, CreateShipmentInput, TrackingResponse } from "@/types";

export abstract class BaseCarrier {
  abstract code: string;
  abstract name: string;

  abstract createShipment(input: CreateShipmentInput): Promise<CarrierShipmentResponse>;
  abstract trackShipment(trackingNumber: string): Promise<TrackingResponse>;
  abstract cancelShipment(trackingNumber: string): Promise<{ success: boolean; error?: string }>;
  abstract printLabel(trackingNumber: string): Promise<{ success: boolean; url?: string; error?: string }>;

  protected async httpRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    return response;
  }
}
