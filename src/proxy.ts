import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|admin|guide-community|guide-interview|interview|_next|_vercel|.*\\..*).*)"],
};
