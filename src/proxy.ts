import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // `v1` is the Website v1 preview (src/app/v1); it has no locale routing.
  matcher: ["/((?!api|admin|v1(?:/|$)|_next|_vercel|.*\\..*).*)"],
};
