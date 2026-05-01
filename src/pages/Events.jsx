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
      <div className="events-page page-shell">
        <div className="events-loading">
          <div className="events-loading-ring" aria-hidden="true" />
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="events-page page-shell">
      <section className="events-hero">
        <div className="events-hero-copy">
          <span className="events-kicker">Live opportunities</span>
          <h1>Career Fair Events</h1>
          <p>Discover upcoming virtual career fairs and connect with top companies.</p>
        </div>
        <div className="events-hero-stat" aria-label="Visible events count">
          <span>Live & Upcoming</span>
          <strong>{upcomingEvents.length}</strong>
        </div>
      </section>

      {upcomingEvents.length > 0 && (
        <>
          <div className="events-section-heading">
            <div>
              <span>Available now</span>
              <h2>Live & Upcoming</h2>
            </div>
            <p>{upcomingEvents.length} event{upcomingEvents.length === 1 ? "" : "s"} ready to explore</p>
          </div>

          <div className="events-grid">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        </>
      )}

      {upcomingEvents.length === 0 && (
        <section className="events-empty">
          <span>No events</span>
          <h2>No live or upcoming events right now</h2>
          <p>New events will appear here as soon as they are published.</p>
        </section>
      )}
    </main>
  );
}

export default Events;
