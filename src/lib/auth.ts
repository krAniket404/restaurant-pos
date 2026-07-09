export function getAuthSessionFromCookie() {
  if (typeof document === "undefined") {
    return null;
  }

  const authCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("auth_session="));

  if (!authCookie) {
    return null;
  }

  try {
    const cookieValue = authCookie.split("=").slice(1).join("=");
    const parsedSession = JSON.parse(decodeURIComponent(cookieValue));

    if (
      parsedSession &&
      typeof parsedSession === "object" &&
      typeof parsedSession.role === "string"
    ) {
      return parsedSession;
    }
  } catch {
    return null;
  }

  return null;
}
