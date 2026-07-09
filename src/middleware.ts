import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const authSessionCookie = request.cookies.get("auth_session")?.value;
  const pathname = request.nextUrl.pathname;
  const isPublicRoute =
    pathname === "/" || pathname === "/login" || pathname.startsWith("/login/");

  if (!authSessionCookie) {
    if (isPublicRoute) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const session = JSON.parse(decodeURIComponent(authSessionCookie));

    if (!session || !session.role) {
      throw new Error("Invalid session");
    }

    if (isPublicRoute) {
      console.log("HEY");
      return NextResponse.redirect(new URL(`/${session.role}`, request.url));
    }

    if (!pathname.startsWith(`/${session.role}`)) {
      return NextResponse.redirect(new URL(`/${session.role}`, request.url));
    }

    return NextResponse.next();
  } catch {
    const response = isPublicRoute
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("auth_session");
    return response;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
