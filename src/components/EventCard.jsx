import { Link } from "react-router-dom";
import { getEventStatus } from "../utils/eventStatus";

function EventCard({ event, isLoggedIn = false }) {
  const status = getEventStatus(event?.date);
  const isClosed = status === "CLOSED";

  const badge =
    status === "LIVE"
      ? { label: "Live", className: "event-status-live" }
      : status === "UPCOMING"
        ? { label: "Upcoming", className: "event-status-upcoming" }
        : { label: "Closed", className: "event-status-closed" };

  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className={`event-card event-card-modern${isClosed ? " is-closed" : ""}`}>
      <div className="event-card-header">
        <div>
          <span className="event-card-eyebrow">Virtual fair</span>
          <h3>{event.title}</h3>
        </div>
        <span className={`event-status ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <div className="event-card-body">
        <div className="event-date-panel">
          <span>Date</span>
          <strong>{formattedDate}</strong>
        </div>

        <div className="event-card-meta">
          <span>Company Booths Available</span>
          <small>{isLoggedIn ? "Ready to explore" : "Login required to apply"}</small>
        </div>

        {isClosed ? (
          <div className="event-action event-action-disabled">
            Event Closed
          </div>
        ) : isLoggedIn ? (
          <Link
            to={`/event/${event.id}`}
            className="event-action event-action-primary"
          >
            View Booths & Apply
          </Link>
        ) : (
          <div className="event-action event-action-disabled">
            Login to view booths & apply
          </div>
        )}
      </div>
    </article>
  );
}

export default EventCard;
