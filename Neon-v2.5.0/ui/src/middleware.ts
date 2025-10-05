export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agents/:path*",
    "/campaigns/:path*",
    "/content/:path*",
    "/email/:path*",
    "/social-media/:path*",
    "/settings/:path*",
    "/team/:path*",
    "/billing/:path*",
  ],
};
