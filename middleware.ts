import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/login", "/api/auth"];

export default async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (publicRoutes.some((route) => pathname.startsWith(route))) return NextResponse.next();
  if (!token && !pathname.startsWith("/_next")) {
    const login = new URL("/login", url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
