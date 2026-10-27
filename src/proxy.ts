import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // `v1` is the Website v1 preview (src/app/v1); it has no locale routing.
  // `guide-community` has its own root layout (Japanese only), also no locale routing.
  matcher: ["/((?!api|admin|v1(?:/|$)|guide-community|_next|_vercel|.*\\..*).*)"],
};
