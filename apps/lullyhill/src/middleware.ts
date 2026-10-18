import middleware from "@next-booking/cms-core/middleware";
export default middleware;

export const config = {
  matcher: [
    "/admin",
    "/admin/((?!login).*)"
  ]
};
