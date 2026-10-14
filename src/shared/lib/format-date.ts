// Fixed locale and time zone so server and browser render the same string.
const dateTimeFormat = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

export function formatDateTime(iso: string) {
  return dateTimeFormat.format(new Date(iso));
}
