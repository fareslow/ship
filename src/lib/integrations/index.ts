import { ZidIntegration } from "./zid";
import { SallaIntegration } from "./salla";
import { ShopifyIntegration } from "./shopify";

export const zidIntegration = new ZidIntegration();
export const sallaIntegration = new SallaIntegration();
export const shopifyIntegration = new ShopifyIntegration();

export { ZidIntegration, SallaIntegration, ShopifyIntegration };
