export function getEventStatus(eventDateLike) {
  const d = new Date(eventDateLike);
  if (Number.isNaN(d.getTime())) return "UPCOMING";

  const now = new Date();
  if (d.getTime() < now.getTime()) return "CLOSED";

  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  return sameDay ? "LIVE" : "UPCOMING";
}

export function isEventVisibleToUsers(eventDateLike) {
  return getEventStatus(eventDateLike) !== "CLOSED";
}

