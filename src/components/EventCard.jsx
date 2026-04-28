import { Link } from "react-router-dom";
import { getEventStatus } from "../utils/eventStatus";

function EventCard({ event, isLoggedIn = false }) {
  const status = getEventStatus(event?.date);
  const isClosed = status === "CLOSED";

  const badge =
    status === "LIVE"
      ? { label: "Live", background: "#dbeafe", color: "#1d4ed8" }
      : status === "UPCOMING"
        ? { label: "Upcoming", background: "#dcfce7", color: "#166534" }
        : { label: "Closed", background: "#f1f5f9", color: "#475569" };

  return (
    <div style={{
      background: "white",
      borderRadius: "15px",
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
      overflow: "hidden",
      transition: "all 0.3s ease",
      opacity: isClosed ? 0.75 : 1
    }}>
      <div style={{
        background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "20px"
      }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "1.4rem" }}>
          {event.title}
        </h3>
        <p style={{ margin: "0", opacity: "0.9" }}>
          📅 {new Date(event.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <div style={{ padding: "20px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px"
        }}>
          <span style={{ fontWeight: "600", color: "#0f172a" }}>
            🏢 Company Booths Available
          </span>
          <span style={{
            background: badge.background,
            color: badge.color,
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "0.8rem",
            fontWeight: "600"
          }}>
            {badge.label}
          </span>
        </div>

        {isClosed ? (
          <div
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              background: "#e2e8f0",
              color: "#64748b",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "700",
            }}
          >
            Event Closed
          </div>
        ) : isLoggedIn ? (
          <Link
            to={`/event/${event.id}`}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "600",
              transition: "all 0.3s ease"
            }}
          >
            View Booths & Apply
          </Link>
        ) : (
          <div
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              background: "#e2e8f0",
              color: "#64748b",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "700",
            }}
          >
            Login to view booths & apply
          </div>
        )}
      </div>
    </div>
  );
}

export default EventCard;