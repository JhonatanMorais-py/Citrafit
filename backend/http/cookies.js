export function readCookies(request) {
  const header = request.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separator = item.indexOf("=");
        const name = separator >= 0 ? item.slice(0, separator) : item;
        const value = separator >= 0 ? item.slice(separator + 1) : "";
        return [name, decodeURIComponent(value)];
      }),
  );
}
