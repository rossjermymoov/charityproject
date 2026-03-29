import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Add pathname to headers so server components can read it
  const response = NextResponse.next();
  response.headers.set("x-next-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  // Run on all dashboard routes, skip static files and API routes
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|register|login|public).*)",
  ],
};
