import { withAuth } from "next-auth/middleware";

export const cmsAuthMiddleware = withAuth({
  pages: {
    signIn: "/admin/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "development-secret-change-in-production",
});

export const cmsMiddlewareConfig = {
  matcher: [
    "/admin",
    "/admin/((?!login).*)",
  ],
};

export default cmsAuthMiddleware;
export { cmsMiddlewareConfig as config };
