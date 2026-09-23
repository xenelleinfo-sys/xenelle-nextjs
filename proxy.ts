import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

// Optimistic route guard. Real authorization happens in tRPC
// authProcedure / adminProcedure on every request.
export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_JWT_SECRET });
  const { pathname, search } = request.nextUrl;

  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout", "/account/:path*", "/admin/:path*"],
};
