import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../services/eventService";
import { getMyApplications } from "../services/boothService";
import { isEventVisibleToUsers } from "../utils/eventStatus";

function Home() {
  const [events, setEvents] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    setIsLoggedIn(!!token);

    let parsed = null;
    if (userData && userData !== "undefined" && userData !== "null") {
      try {
        parsed = JSON.parse(userData);
        setUser(parsed);
      } catch (e) {
        console.warn("Failed to parse user data:", e);
      }
    }

    if (token && parsed?.role !== "ADMIN") {
      getEvents().then(setEvents).catch(console.error);
      getMyApplications().then(setMyApplications).catch(console.error);
    }
  }, []);

  const visibleEvents = (Array.isArray(events) ? events : []).filter((e) =>
    isEventVisibleToUsers(e?.date)
  );

  const boothsCount = visibleEvents.reduce(
    (total, event) => total + (event.booths?.length || 0),
    0
  );

  const showStats =
    isLoggedIn &&
    user?.role !== "ADMIN" &&
    (visibleEvents.length > 0 || myApplications.length > 0 || boothsCount > 0);

  return (
    <div className="page-shell">
      {/* Hero Section */}
      <div style={{
        textAlign: "center",
        padding: "60px 20px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        borderRadius: "20px",
        marginBottom: "40px"
      }}>
        <h1 style={{ fontSize: "3rem", margin: "0 0 14px 0" }}>
          {isLoggedIn && user?.name ? `Welcome back, ${user.name}` : "Welcome to Virtual Career Fair"}
        </h1>
        <p style={{ fontSize: "1.2rem", margin: "0 0 30px 0", opacity: "0.9" }}>
          Connect with top companies, explore job opportunities, and advance your career
        </p>

        {!isLoggedIn ? (
          <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register" style={{
              padding: "15px 30px",
              background: "white",
              color: "#667eea",
              textDecoration: "none",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "1.1rem",
              transition: "all 0.3s ease"
            }}>
              Get Started
            </Link>
            <Link to="/login" style={{
              padding: "15px 30px",
              background: "transparent",
              color: "white",
              textDecoration: "none",
              border: "2px solid white",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "1.1rem",
              transition: "all 0.3s ease"
            }}>
              Sign In
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
            {user?.role !== "ADMIN" && (
              <Link to="/events" style={{
                padding: "15px 30px",
                background: "white",
                color: "#667eea",
                textDecoration: "none",
                borderRadius: "10px",
                fontWeight: "600",
                fontSize: "1.1rem",
                transition: "all 0.3s ease"
              }}>
                Browse Events
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <Link to="/admin" style={{
                padding: "15px 30px",
                background: "white",
                color: "#667eea",
                textDecoration: "none",
                borderRadius: "10px",
                fontWeight: "600",
                fontSize: "1.1rem",
                transition: "all 0.3s ease"
              }}>
                Admin Panel
              </Link>
            )}
          </div>
        )}

        {isLoggedIn && user?.role !== "ADMIN" && (
          <div style={{ marginTop: "22px", opacity: 0.92, fontSize: "0.98rem" }}>
            {visibleEvents.length > 0 ? (
              <span>
                Next up: <strong>{visibleEvents[0]?.title}</strong> on{" "}
                {visibleEvents[0]?.date ? new Date(visibleEvents[0].date).toLocaleDateString() : "soon"}.
              </span>
            ) : (
              <span>
                No upcoming events right now. Check back soon or ask the admin to publish new events.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick stats & applications — regular users only */}
      {showStats && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "40px"
        }}>
          {visibleEvents.length > 0 && (
            <div style={{
              background: "white",
              padding: "25px",
              borderRadius: "15px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
              textAlign: "center"
            }}>
              <h3 style={{ color: "#667eea", margin: "0 0 10px 0" }}>📅 Upcoming Events</h3>
              <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#0f172a", margin: "0" }}>
                {visibleEvents.length}
              </p>
            </div>
          )}

          {myApplications.length > 0 && (
            <div style={{
              background: "white",
              padding: "25px",
              borderRadius: "15px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
              textAlign: "center"
            }}>
              <h3 style={{ color: "#10b981", margin: "0 0 10px 0" }}>📋 My Applications</h3>
              <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#0f172a", margin: "0" }}>
                {myApplications.length}
              </p>
            </div>
          )}

          {boothsCount > 0 && (
            <div style={{
              background: "white",
              padding: "25px",
              borderRadius: "15px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
              textAlign: "center"
            }}>
              <h3 style={{ color: "#f59e0b", margin: "0 0 10px 0" }}>🏢 Company Booths</h3>
              <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#0f172a", margin: "0" }}>
                {boothsCount}
              </p>
            </div>
          )}
        </div>
      )}

      {/* “How it works” */}
      <div style={{
        background: "white",
        padding: "30px",
        borderRadius: "15px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
        marginBottom: "40px"
      }}>
        <h2 style={{ color: "#0f172a", margin: "0 0 18px 0", textAlign: "center" }}>
          How it works
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "18px"
        }}>
          {[
            { icon: "🔎", title: "Discover events", text: "Browse upcoming career fairs and pick what matches your goals." },
            { icon: "🏢", title: "Visit company booths", text: "Explore roles, requirements, and chat with recruiters." },
            { icon: "📨", title: "Apply in minutes", text: "Submit your resume once and track your applications easily." },
          ].map((step) => (
            <div key={step.title} style={{
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "18px",
            }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>{step.icon}</div>
              <div style={{ fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>{step.title}</div>
              <div style={{ color: "#64748b", lineHeight: 1.5 }}>{step.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "30px",
        marginBottom: "40px"
      }}>
        <div style={{
          background: "white",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🎪</div>
          <h3 style={{ color: "#0f172a", margin: "0 0 15px 0" }}>Virtual Events</h3>
          <p style={{ color: "#64748b", margin: "0" }}>
            Participate in career fairs from anywhere in the world. Connect with recruiters virtually.
          </p>
        </div>

        <div style={{
          background: "white",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🏢</div>
          <h3 style={{ color: "#0f172a", margin: "0 0 15px 0" }}>Company Booths</h3>
          <p style={{ color: "#64748b", margin: "0" }}>
            Visit company booths, learn about opportunities, and submit your resume directly.
          </p>
        </div>

        <div style={{
          background: "white",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>📄</div>
          <h3 style={{ color: "#0f172a", margin: "0 0 15px 0" }}>Resume Submission</h3>
          <p style={{ color: "#64748b", margin: "0" }}>
            Apply to multiple positions with a single click. Track your applications easily.
          </p>
        </div>
      </div>

      {/* Recent events preview — regular users only */}
      {user?.role !== "ADMIN" && visibleEvents.length > 0 && (
        <div style={{
          background: "white",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)"
        }}>
          <h2 style={{ color: "#0f172a", margin: "0 0 25px 0", textAlign: "center" }}>
            📅 Upcoming Events
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px"
          }}>
            {visibleEvents.slice(0, 3).map((event) => (
              <div key={event.id} style={{
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "20px",
                transition: "all 0.3s ease"
              }}>
                <h3 style={{ color: "#0f172a", margin: "0 0 10px 0" }}>{event.title}</h3>
                <p style={{ color: "#64748b", margin: "0 0 15px 0" }}>
                  📅 {new Date(event.date).toLocaleDateString()}
                </p>
                <Link to="/events" style={{
                  color: "#667eea",
                  textDecoration: "none",
                  fontWeight: "600"
                }}>
                  View Details →
                </Link>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "25px" }}>
            <Link to="/events" style={{
              padding: "12px 25px",
              background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "600",
              display: "inline-block"
            }}>
              View All Events
            </Link>
          </div>
        </div>
      )}

      {/* Logged-in empty state (no events) */}
      {isLoggedIn && user?.role !== "ADMIN" && visibleEvents.length === 0 && (
        <div style={{
          background: "white",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📅</div>
          <h2 style={{ color: "#0f172a", margin: "0 0 10px 0" }}>No upcoming events yet</h2>
          <p style={{ color: "#64748b", margin: "0 0 16px 0" }}>
            When new events are published, they’ll appear here automatically.
          </p>
          <Link to="/events" style={{
            padding: "12px 22px",
            background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            textDecoration: "none",
            borderRadius: "10px",
            fontWeight: "700",
            display: "inline-block"
          }}>
            Refresh Events
          </Link>
        </div>
      )}
    </div>
  );
}

export default Home;