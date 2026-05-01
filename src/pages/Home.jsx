import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../services/eventService";
import { getMyApplications } from "../services/boothService";
import { isEventVisibleToUsers } from "../utils/eventStatus";
import heroImage from "../assets/hero.png";

function Home() {
  const [events, setEvents] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [isLoggedIn] = useState(() => !!localStorage.getItem("token"));
  const [user] = useState(() => {
    const userData = localStorage.getItem("user");
    if (!userData || userData === "undefined" || userData === "null") return null;
    try {
      return JSON.parse(userData);
    } catch (e) {
      console.warn("Failed to parse user data:", e);
      return null;
    }
  });

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      getEvents().then(setEvents).catch(console.error);
    }

    if (isLoggedIn && user?.role !== "ADMIN") {
      getMyApplications().then(setMyApplications).catch(console.error);
    }
  }, [isLoggedIn, user?.role]);

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

  const heroTitle =
    isLoggedIn && user?.name
      ? `Welcome back, ${user.name}`
      : "Virtual Career Fair";

  const heroDescription =
    "Meet companies, explore live opportunities, and move from curiosity to application without leaving the platform.";

  const steps = [
    {
      marker: "01",
      title: "Discover events",
      text: "Find upcoming career fairs that match your field, goals, and timeline.",
    },
    {
      marker: "02",
      title: "Visit company booths",
      text: "Explore roles, requirements, recruiter details, and the companies hiring now.",
    },
    {
      marker: "03",
      title: "Apply in minutes",
      text: "Submit your resume and keep track of your applications from one place.",
    },
  ];

  const features = [
    {
      label: "Live",
      title: "Virtual Events",
      text: "Join career fairs from anywhere and stay close to hiring activity as it happens.",
    },
    {
      label: "Booths",
      title: "Company Booths",
      text: "Compare companies, review opportunities, and choose where to spend your time.",
    },
    {
      label: "Apply",
      title: "Resume Submission",
      text: "Move quickly from interest to application with a focused resume workflow.",
    },
  ];

  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-hero-title">
        <div className="hero-background" aria-hidden="true">
          <img src={heroImage} alt="" />
        </div>
        <div className="hero-overlay" aria-hidden="true" />

        <div className="hero-content">
          <div className="hero-copy">
            <span className="hero-kicker">Talent meets opportunity</span>
            <h1 id="landing-hero-title">{heroTitle}</h1>
            <p>{heroDescription}</p>

            {!isLoggedIn ? (
              <div className="hero-actions" aria-label="Get started actions">
                <Link className="landing-button landing-button-primary" to="/register">
                  Get Started
                </Link>
                <Link className="landing-button landing-button-ghost" to="/login">
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="hero-actions" aria-label="Dashboard actions">
                {user?.role !== "ADMIN" && (
                  <Link className="landing-button landing-button-primary" to="/events">
                    Browse Events
                  </Link>
                )}
                {user?.role === "ADMIN" && (
                  <Link className="landing-button landing-button-primary" to="/admin">
                    Admin Panel
                  </Link>
                )}
              </div>
            )}

            {isLoggedIn && user?.role !== "ADMIN" && (
              <div className="hero-status">
                {visibleEvents.length > 0 ? (
                  <span>
                    Next up: <strong>{visibleEvents[0]?.title}</strong> on{" "}
                    {visibleEvents[0]?.date
                      ? new Date(visibleEvents[0].date).toLocaleDateString()
                      : "soon"}
                  </span>
                ) : (
                  <span>
                    No upcoming events right now. Check back soon or ask the admin to publish new events.
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="hero-dashboard" aria-label="Career fair highlights">
            <div className="hero-dashboard-top">
              <span>Career activity</span>
              <strong>{isLoggedIn ? "Live" : "Open"}</strong>
            </div>
            <div className="hero-metric hero-metric-large">
              <span>Upcoming Events</span>
              <strong>{visibleEvents.length}</strong>
            </div>
            <div className="hero-metric-grid">
              <div className="hero-metric">
                <span>Company Booths</span>
                <strong>{boothsCount}</strong>
              </div>
              <div className="hero-metric">
                <span>Applications</span>
                <strong>{myApplications.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showStats && (
        <section className="landing-stats" aria-label="Your career fair summary">
          {visibleEvents.length > 0 && (
            <article className="stat-card stat-card-indigo">
              <span>Upcoming Events</span>
              <strong>{visibleEvents.length}</strong>
            </article>
          )}

          {myApplications.length > 0 && (
            <article className="stat-card stat-card-emerald">
              <span>My Applications</span>
              <strong>{myApplications.length}</strong>
            </article>
          )}

          {boothsCount > 0 && (
            <article className="stat-card stat-card-amber">
              <span>Company Booths</span>
              <strong>{boothsCount}</strong>
            </article>
          )}
        </section>
      )}

      <section className="landing-section">
        <div className="section-heading">
          <span>Simple flow</span>
          <h2>How it works</h2>
        </div>
        <div className="process-grid">
          {steps.map((step) => (
            <article className="process-card" key={step.title}>
              <div className="process-marker">{step.marker}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-feature-band">
        <div className="section-heading">
          <span>Built for momentum</span>
          <h2>Everything you need for a focused career fair</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <span>{feature.label}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      {user?.role !== "ADMIN" && visibleEvents.length > 0 && (
        <section className="landing-section events-preview">
          <div className="section-heading">
            <span>Coming up</span>
            <h2>Upcoming Events</h2>
          </div>
          <div className="preview-grid">
            {visibleEvents.slice(0, 3).map((event) => (
              <article className="preview-card" key={event.id}>
                <span className="preview-date">
                  {new Date(event.date).toLocaleDateString()}
                </span>
                <h3>{event.title}</h3>
                <Link to="/events">View Details</Link>
              </article>
            ))}
          </div>
          <div className="preview-action">
            <Link className="landing-button landing-button-primary" to="/events">
              View All Events
            </Link>
          </div>
        </section>
      )}

      {isLoggedIn && user?.role !== "ADMIN" && visibleEvents.length === 0 && (
        <section className="landing-section empty-events">
          <span className="empty-icon">No events</span>
          <h2>No upcoming events yet</h2>
          <p>When new events are published, they will appear here automatically.</p>
          <Link className="landing-button landing-button-primary" to="/events">
            Refresh Events
          </Link>
        </section>
      )}
    </main>
  );
}

export default Home;
