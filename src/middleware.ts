import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/shipments/:path*", "/api/carriers/:path*", "/api/orders/:path*", "/api/waybills/:path*", "/api/integrations/:path*", "/api/dashboard/:path*"],
};
