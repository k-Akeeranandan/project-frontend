import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBooths } from "../services/boothService";
import { getEvents } from "../services/eventService";
import BoothCard from "../components/BoothCard";
import { getEventStatus } from "../utils/eventStatus";

function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [booths, setBooths] = useState([]);
  const [loading, setLoading] = useState(true);

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

    Promise.all([getEvents(), getBooths()])
      .then(([eventsData, boothsData]) => {
        const foundEvent = eventsData.find(e => e.id === parseInt(eventId));
        const eventBooths = boothsData.filter(booth => booth.eventId === parseInt(eventId));

        setEvent(foundEvent);
        setBooths(eventBooths);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading event details:", error);
        setLoading(false);
      });
  }, [eventId, navigate]);

  if (loading) {
    return (
      <div className="page-shell">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "20px" }}>⏳</div>
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page-shell">
        <div style={{
          textAlign: "center",
          padding: "50px",
          background: "white",
          borderRadius: "15px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>❌</div>
          <h3>Event not found</h3>
          <p>The event you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/events')}
            style={{
              marginTop: "20px",
              padding: "12px 24px",
              background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const status = getEventStatus(event?.date);
  const isClosed = status === "CLOSED";

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-title">
          <h2>🏢 {event.title} - Company Booths</h2>
          <p>
            📅 {new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          {isClosed && (
            <p style={{ marginTop: "8px", fontWeight: "700", color: "#475569" }}>
              Status: Closed
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/events')}
          style={{
            padding: "10px 20px",
            background: "transparent",
            color: "#667eea",
            border: "2px solid #667eea",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s ease"
          }}
        >
          ← Back to Events
        </button>
      </div>

      {booths.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "50px",
          background: "white",
          borderRadius: "15px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🏢</div>
          <h3>No booths available</h3>
          <p>This event doesn't have any company booths yet.</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "30px"
        }}>
          {booths.map((booth) => (
            <BoothCard key={booth.id} booth={booth} />
          ))}
        </div>
      )}
    </div>
  );
}

export default EventDetails;