import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents } from "../services/eventService";
import EventCard from "../components/EventCard";
import { isEventVisibleToUsers } from "../utils/eventStatus";

function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn] = useState(() => !!localStorage.getItem("token"));

  useEffect(() => {
    const userData = localStorage.getItem("user");
    try {
      const u = userData && userData !== "undefined" && userData !== "null"
        ? JSON.parse(userData)
        : null;
      if (u?.role === "ADMIN") {
        navigate("/admin", { replace: true });
        return;
      }
    } catch {
      /* ignore */
    }

    getEvents()
      .then((eventsData) => {
        setEvents(eventsData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading events:", error);
        setLoading(false);
      });
  }, [navigate]);

  const upcomingEvents = useMemo(() => {
    const all = Array.isArray(events) ? events : [];
    return all
      .filter((e) => isEventVisibleToUsers(e?.date))
      .slice()
      .sort((a, b) => new Date(a?.date).getTime() - new Date(b?.date).getTime());
  }, [events]);

  if (loading) {
    return (
      <div className="page-shell">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "20px" }}>⏳</div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-title">
          <h2>📅 Career Fair Events</h2>
          <p>Discover upcoming virtual career fairs and connect with top companies</p>
        </div>
      </div>

      {/* Upcoming / Live */}
      {upcomingEvents.length > 0 && (
        <>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "18px"
          }}>
            <h3 style={{ margin: 0, color: "#0f172a" }}>Live & Upcoming</h3>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "30px"
          }}>
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {upcomingEvents.length === 0 && (
        <div style={{
          background: "white",
          borderRadius: "15px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
          padding: "28px"
        }}>
          <div style={{ textAlign: "center", padding: "18px 0 6px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "10px" }}>📅</div>
            <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>No live or upcoming events right now</h3>
            <p style={{ margin: 0, color: "#64748b" }}>
              New events will appear here as soon as they are published.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;