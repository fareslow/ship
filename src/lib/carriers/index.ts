import { BaseCarrier } from "./base";
import { SMSACarrier } from "./smsa";
import { AramexCarrier } from "./aramex";
import { DHLCarrier } from "./dhl";
import { SPLCarrier } from "./spl";

const carriers: Record<string, BaseCarrier> = {
  SMSA: new SMSACarrier(),
  ARAMEX: new AramexCarrier(),
  DHL: new DHLCarrier(),
  SPL: new SPLCarrier(),
};

export function getCarrier(code: string): BaseCarrier | null {
  return carriers[code.toUpperCase()] || null;
}

export function getAllCarriers(): BaseCarrier[] {
  return Object.values(carriers);
}

export { BaseCarrier, SMSACarrier, AramexCarrier, DHLCarrier, SPLCarrier };
