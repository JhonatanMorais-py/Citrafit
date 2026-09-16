import { readCookies } from "./cookies.js";

export const isNativeRequest = (request) => request.headers["x-runlife-client"] === "native";
export const accessToken = (request) => {
  if (isNativeRequest(request)) {
    const match = /^Bearer ([^\s]+)$/.exec(request.headers.authorization || "");
    return match?.[1];
  }
  return readCookies(request).rl_access_token;
};
export function sessionCookies(response, session = null) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const suffix = `; HttpOnly; SameSite=Strict${secure}`;
  response.setHeader("Set-Cookie", [
    `rl_access_token=${encodeURIComponent(session?.accessToken || "")}; Path=/; Max-Age=${session ? session.expiresIn : 0}${suffix}`,
    `rl_refresh_token=${encodeURIComponent(session?.refreshToken || "")}; Path=/api; Max-Age=${session ? 2592000 : 0}${suffix}`,
  ]);
}
export function deliverSession(request, response, result) {
  if (isNativeRequest(request)) return result;
  sessionCookies(response, result.session);
  return { user: result.user };
}
