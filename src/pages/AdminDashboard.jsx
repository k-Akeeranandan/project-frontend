import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent, deleteEvent, getAllEventsAdmin } from "../services/eventService";
import { createBooth, deleteBooth, getBoothApplicants } from "../services/boothService";
import { getEventStatus } from "../utils/eventStatus";
import {
  getAllRegistrations,
  getAllBoothsAdmin,
  viewUserResume,
  downloadUserResume,
  approveUser,
  rejectUser,
} from "../services/adminService";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [events, setEvents] = useState([]);

  const [boothCompanyName, setBoothCompanyName] = useState("");
  const [boothDescription, setBoothDescription] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [booths, setBooths] = useState([]);

  const [registrations, setRegistrations] = useState([]);
  const [boothApplicants, setBoothApplicants] = useState({});

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [resumeBusyId, setResumeBusyId] = useState(null);
  const [approvalBusyId, setApprovalBusyId] = useState(null);
  const [registrationsLoadError, setRegistrationsLoadError] = useState("");
  const [modifyDecisionUserId, setModifyDecisionUserId] = useState(null);
  const [detailsUser, setDetailsUser] = useState(null);

  const selectableEvents = events.filter((event) => getEventStatus(event?.date) !== "CLOSED");
  const totalApplications = booths.reduce((total, booth) => total + (booth.applicantIds?.length || 0), 0);

  useEffect(() => {
    if (!selectedEventId) return;
    const stillSelectable = selectableEvents.some((e) => String(e.id) === String(selectedEventId));
    if (!stillSelectable) setSelectedEventId("");
  }, [selectedEventId, selectableEvents]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    let isAdmin = false;

    if (userData && userData !== "undefined" && userData !== "null") {
      try {
        const user = JSON.parse(userData);
        isAdmin = user.role === "ADMIN";
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }

    if (!isAdmin) {
      navigate("/");
      return;
    }

    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      const eventsData = await getAllEventsAdmin();
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (err) {
      console.error("Error loading events:", err);
      setEvents([]);
    }
    try {
      const boothsData = await getAllBoothsAdmin();
      setBooths(Array.isArray(boothsData) ? boothsData : []);
    } catch (err) {
      console.error("Error loading booths:", err);
      setBooths([]);
    }
    try {
      const registrationsData = await getAllRegistrations();
      setRegistrations(Array.isArray(registrationsData) ? registrationsData : []);
      setRegistrationsLoadError("");
    } catch (err) {
      console.error("Error loading registrations:", err);
      const msg =
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        err.message ||
        "Could not load registrations.";
      setRegistrationsLoadError(msg);
      setRegistrations([]);
    }
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(""), 5000);
  };

  const handleViewResume = async (userId) => {
    setResumeBusyId(userId);
    try {
      await viewUserResume(userId);
    } catch (e) {
      showError(e.message || "Could not open resume.");
    } finally {
      setResumeBusyId(null);
    }
  };

  const handleDownloadResume = async (userId, filename) => {
    setResumeBusyId(userId);
    try {
      await downloadUserResume(userId, filename);
    } catch (e) {
      showError(e.message || "Could not download resume.");
    } finally {
      setResumeBusyId(null);
    }
  };

  const openUserDetails = (user) => setDetailsUser(user || null);
  const closeUserDetails = () => setDetailsUser(null);

  const formatValue = (value) => {
    if (value === undefined || value === null) return "-";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
    if (typeof value === "string") return value.trim() ? value : "-";
    return String(value);
  };

  const statusBadgeClass = (status) => {
    const s = status || "PENDING";
    if (s === "REJECTED") return "admin-status-rejected";
    if (s === "APPROVED") return "admin-status-approved";
    return "admin-status-pending";
  };

  const handleApproveUser = async (userId) => {
    setApprovalBusyId(userId);
    try {
      await approveUser(userId);
      showSuccess("User approved. They can sign in now.");
      window.alert("Applicant approved successfully.");
      await loadDashboardData();
      setModifyDecisionUserId(null);
    } catch (e) {
      const msg =
        e.response?.data?.error ||
        e.message ||
        "Could not approve user.";
      showError(msg);
    } finally {
      setApprovalBusyId(null);
    }
  };

  const handleRejectUser = async (userId) => {
    if (!window.confirm("Reject this applicant? They will be notified by email if mail is enabled.")) {
      return;
    }
    setApprovalBusyId(userId);
    try {
      await rejectUser(userId);
      showSuccess("User rejected.");
      window.alert("Applicant rejected successfully.");
      await loadDashboardData();
      setModifyDecisionUserId(null);
    } catch (e) {
      const msg =
        e.response?.data?.error ||
        e.message ||
        "Could not reject user.";
      showError(msg);
    } finally {
      setApprovalBusyId(null);
    }
  };

  const pendingResumeMessage = "Resume not uploaded yet. Please ask the applicant to upload their resume before approving their application.";

  const userHasResume = (user) => Boolean(user?.resumeOriginalFileName);
  const userHasApplied = (user) => Boolean(user?.appliedBoothIds?.length);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError("");

    if (!eventTitle || !eventDate) {
      showError("Please fill in Event Title and Date");
      return;
    }

    setLoading(true);

    try {
      await createEvent({
        title: eventTitle,
        date: eventDate,
        description: eventDescription
      });
      setEventTitle("");
      setEventDate("");
      setEventDescription("");
      showSuccess("Event created successfully.");
      loadDashboardData();
    } catch (err) {
      showError("Error creating event: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooth = async (e) => {
    e.preventDefault();
    setError("");

    if (!boothCompanyName || !selectedEventId) {
      showError("Please fill in Company Name and select an Event");
      return;
    }

    setLoading(true);

    try {
      await createBooth({
        companyName: boothCompanyName,
        description: boothDescription,
        eventId: parseInt(selectedEventId)
      });
      setBoothCompanyName("");
      setBoothDescription("");
      setSelectedEventId("");
      showSuccess("Booth created successfully.");
      loadDashboardData();
    } catch (err) {
      showError("Error creating booth: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await deleteEvent(eventId);
      showSuccess("Event deleted successfully.");
      loadDashboardData();
    } catch (err) {
      showError("Error deleting event: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteBooth = async (boothId) => {
    if (!window.confirm("Are you sure you want to delete this booth?")) return;

    try {
      await deleteBooth(boothId);
      showSuccess("Booth deleted successfully.");
      loadDashboardData();
    } catch (err) {
      showError("Error deleting booth: " + (err.response?.data?.message || err.message));
    }
  };

  const loadBoothApplicants = async (boothId) => {
    try {
      const applicants = await getBoothApplicants(boothId);
      setBoothApplicants(prev => ({ ...prev, [boothId]: applicants }));
    } catch (err) {
      console.error("Error loading applicants:", err);
    }
  };

  const renderAlertStack = () => (
    <>
      {success && <div className="admin-alert admin-alert-success">{success}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}
    </>
  );

  const renderOverview = () => {
    const stats = [
      { label: "Total Events", value: events.length, tone: "blue" },
      { label: "Total Booths", value: booths.length, tone: "emerald" },
      { label: "Registrations", value: registrations.length, tone: "amber" },
      { label: "Applications", value: totalApplications, tone: "violet" },
    ];

    return (
      <div className="admin-grid">
        <section className="admin-card admin-card-wide">
          <div className="admin-card-heading">
            <span>Snapshot</span>
            <h2>Statistics</h2>
          </div>
          <div className="admin-stat-grid">
            {stats.map((stat) => (
              <article className={`admin-stat admin-stat-${stat.tone}`} key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card-heading">
            <span>Recent</span>
            <h2>Events</h2>
          </div>
          <div className="admin-list">
            {events.slice(0, 3).map(event => (
              <article className="admin-list-item" key={event.id}>
                <strong>{event.title}</strong>
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </article>
            ))}
            {events.length === 0 && <div className="admin-empty-small">No events created yet.</div>}
          </div>
        </section>
      </div>
    );
  };

  const renderEvents = () => (
    <div className="admin-grid">
      <section className="admin-card admin-create-card">
        <div className="admin-card-heading">
          <span>Create</span>
          <h2>New Event</h2>
        </div>
        {renderAlertStack()}
        <form onSubmit={handleCreateEvent} className="admin-form">
          <label>
            <span>Event Title</span>
            <input
              type="text"
              placeholder="Tech Career Fair 2026"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Date & Time</span>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Description</span>
            <textarea
              placeholder="Optional event description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              rows="4"
            />
          </label>
          <button type="submit" disabled={loading} className="admin-primary-action">
            {loading ? "Creating..." : "Create Event"}
          </button>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <span>Manage</span>
          <h2>Events</h2>
        </div>
        <div className="admin-list">
          {events.map(event => (
            <article className="admin-list-item admin-list-action" key={event.id}>
              <div>
                <strong>{event.title}</strong>
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>
              <button type="button" className="admin-danger-action" onClick={() => handleDeleteEvent(event.id)}>
                Delete
              </button>
            </article>
          ))}
          {events.length === 0 && <div className="admin-empty-small">No events to manage.</div>}
        </div>
      </section>
    </div>
  );

  const renderBooths = () => (
    <div className="admin-grid">
      <section className="admin-card admin-create-card">
        <div className="admin-card-heading">
          <span>Create</span>
          <h2>New Booth</h2>
        </div>
        {renderAlertStack()}
        <form onSubmit={handleCreateBooth} className="admin-form">
          <label>
            <span>Company Name</span>
            <input
              type="text"
              placeholder="Company Name"
              value={boothCompanyName}
              onChange={(e) => setBoothCompanyName(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Event</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              required
            >
              <option value="">Select Event</option>
              {selectableEvents.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </label>
          {events.length > 0 && selectableEvents.length === 0 && (
            <div className="admin-alert admin-alert-warning">
              All existing events are closed. Create a new upcoming event before adding a booth.
            </div>
          )}
          <label>
            <span>Description</span>
            <textarea
              placeholder="Booth Description"
              value={boothDescription}
              onChange={(e) => setBoothDescription(e.target.value)}
              rows="4"
            />
          </label>
          <button type="submit" disabled={loading} className="admin-primary-action">
            {loading ? "Creating..." : "Create Booth"}
          </button>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading">
          <span>Manage</span>
          <h2>Booths</h2>
        </div>
        <div className="admin-list">
          {booths.map(booth => (
            <article className="admin-booth-item" key={booth.id}>
              <div className="admin-booth-top">
                <div>
                  <strong>{booth.companyName}</strong>
                  <p>{booth.description || "No description provided."}</p>
                  <span>{booth.applicantIds?.length || 0} applicants</span>
                </div>
                <div className="admin-row-actions">
                  <button type="button" className="admin-secondary-action" onClick={() => loadBoothApplicants(booth.id)}>
                    View Applicants
                  </button>
                  <button type="button" className="admin-danger-action" onClick={() => handleDeleteBooth(booth.id)}>
                    Delete
                  </button>
                </div>
              </div>

              {boothApplicants[booth.id] && (
                <div className="admin-applicant-panel">
                  <h3>Applicants</h3>
                  {boothApplicants[booth.id].map(applicant => (
                    <div className="admin-applicant-compact" key={applicant.id}>
                      <div>
                        <strong>{applicant.name}</strong>
                        <span>{applicant.email}</span>
                        {applicant.resumeOriginalFileName ? (
                          <small>{applicant.resumeOriginalFileName}</small>
                        ) : (
                          <small>No resume uploaded</small>
                        )}
                      </div>
                      {applicant.resumeOriginalFileName && (
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            disabled={resumeBusyId === applicant.id}
                            className="admin-secondary-action"
                            onClick={() => handleViewResume(applicant.id)}
                          >
                            {resumeBusyId === applicant.id ? "..." : "View"}
                          </button>
                          <button
                            type="button"
                            disabled={resumeBusyId === applicant.id}
                            className="admin-secondary-action admin-secondary-violet"
                            onClick={() => handleDownloadResume(applicant.id, applicant.resumeOriginalFileName)}
                          >
                            Download
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
          {booths.length === 0 && <div className="admin-empty-small">No booths created yet.</div>}
        </div>
      </section>
    </div>
  );

  const renderDecisionActions = (user) => {
    const status = user.accountStatus || "PENDING";
    const decided = status === "APPROVED" || status === "REJECTED";
    const isModifying = modifyDecisionUserId === user.id;
    const showChoices = !decided || isModifying;

    if (!showChoices) {
      return (
        <button
          type="button"
          disabled={approvalBusyId === user.id}
          className="admin-secondary-action"
          onClick={() => setModifyDecisionUserId(user.id)}
        >
          Modify
        </button>
      );
    }

    return (
      <>
        <button
          type="button"
          disabled={approvalBusyId === user.id}
          className="admin-approve-action"
          onClick={() => handleApproveUser(user.id)}
        >
          {approvalBusyId === user.id ? "..." : "Approve"}
        </button>
        <button
          type="button"
          disabled={approvalBusyId === user.id}
          className="admin-danger-action"
          onClick={() => handleRejectUser(user.id)}
        >
          Reject
        </button>
        {isModifying && (
          <button
            type="button"
            disabled={approvalBusyId === user.id}
            className="admin-muted-action"
            onClick={() => setModifyDecisionUserId(null)}
          >
            Cancel
          </button>
        )}
      </>
    );
  };

  const renderApplicantCard = (user, missingResume = false) => (
    <article className={`admin-user-card${missingResume ? " admin-user-warning" : ""}`} key={user.id}>
      <div className="admin-user-main">
        <strong>{user.name}</strong>
        <span>{user.email}</span>
        <div className="admin-user-tags">
          <small className={user.role === "ADMIN" ? "admin-role-admin" : "admin-role-user"}>{user.role}</small>
          {user.role === "USER" && (
            <small className={`admin-status ${statusBadgeClass(user.accountStatus)}`}>
              {(user.accountStatus || "PENDING").replace("_", " ")}
            </small>
          )}
        </div>
        {missingResume ? (
          <div className="admin-alert admin-alert-warning">
            <strong>No resume uploaded yet.</strong> {pendingResumeMessage}
          </div>
        ) : (
          <div className="admin-file-note">Resume on file: {user.resumeOriginalFileName}</div>
        )}
      </div>

      <div className="admin-user-actions">
        <span className="admin-user-id">ID: {user.id}</span>
        {!missingResume && user.resumeOriginalFileName && (
          <div className="admin-action-group">
            <button
              type="button"
              disabled={resumeBusyId === user.id}
              className="admin-secondary-action"
              onClick={() => handleViewResume(user.id)}
            >
              {resumeBusyId === user.id ? "..." : "View resume"}
            </button>
            <button
              type="button"
              disabled={resumeBusyId === user.id}
              className="admin-secondary-action admin-secondary-violet"
              onClick={() => handleDownloadResume(user.id, user.resumeOriginalFileName)}
            >
              Download
            </button>
            <button type="button" className="admin-dark-action" onClick={() => openUserDetails(user)}>
              Details
            </button>
          </div>
        )}
        {user.role === "USER" && !missingResume && (
          <div className="admin-action-group admin-decision-group">
            {renderDecisionActions(user)}
          </div>
        )}
      </div>
    </article>
  );

  const renderRegistrations = () => {
    const usersWithResume = registrations.filter((user) => userHasApplied(user) && userHasResume(user));
    const usersWithoutResume = registrations.filter((user) => userHasApplied(user) && !userHasResume(user));

    return (
      <section className="admin-card admin-card-full">
        <div className="admin-section-top">
          <div className="admin-card-heading">
            <span>Applicants</span>
            <h2>User Registrations</h2>
          </div>
          <button type="button" onClick={() => loadDashboardData()} className="admin-secondary-action">
            Refresh list
          </button>
        </div>

        {registrationsLoadError && (
          <div className="admin-alert admin-alert-error">
            <strong>Could not load users.</strong> {registrationsLoadError} Check that the backend is running and you are logged in as admin, then refresh.
          </div>
        )}
        {renderAlertStack()}

        <div className="admin-registration-list">
          {!registrationsLoadError && registrations.length === 0 && (
            <div className="admin-empty-small">No registered users yet.</div>
          )}
          {usersWithResume.length === 0 && usersWithoutResume.length === 0 && (
            <div className="admin-empty-small">No applicants with booth/event registration found.</div>
          )}

          {usersWithResume.length > 0 && (
            <section>
              <h3 className="admin-list-title">Applicants with resume</h3>
              {usersWithResume.map((user) => renderApplicantCard(user))}
            </section>
          )}

          {usersWithoutResume.length > 0 && (
            <section>
              <h3 className="admin-list-title">Applicants without resume</h3>
              {usersWithoutResume.map((user) => renderApplicantCard(user, true))}
            </section>
          )}
        </div>
      </section>
    );
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "events", label: "Events" },
    { id: "booths", label: "Booths" },
    { id: "registrations", label: "Registrations" },
  ];

  return (
    <main className="admin-container">
      <section className="admin-hero">
        <div>
          <span className="admin-kicker">Control room</span>
          <h1>Admin Dashboard</h1>
          <p>Manage career fair events, booths, registrations, and application decisions.</p>
        </div>
        <div className="admin-hero-metric">
          <span>Total Applications</span>
          <strong>{totalApplications}</strong>
        </div>
      </section>

      <nav className="admin-tabs" aria-label="Admin dashboard sections">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`admin-tab${activeTab === tab.id ? " is-active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="admin-tab-panel" key={activeTab}>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "events" && renderEvents()}
        {activeTab === "booths" && renderBooths()}
        {activeTab === "registrations" && renderRegistrations()}
      </div>

      {detailsUser && (
        <div
          className="details-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeUserDetails();
          }}
          role="presentation"
        >
          <div className="details-modal" role="dialog" aria-modal="true" aria-label="User details">
            <div className="details-modal-header">
              <div>
                <div className="details-step-chip">User details</div>
                <h3 className="details-modal-title">{formatValue(detailsUser?.name)}</h3>
                <p className="details-modal-description">
                  {formatValue(detailsUser?.email)}
                </p>
              </div>
              <button
                type="button"
                className="details-close-button"
                onClick={closeUserDetails}
                aria-label="Close"
              >
                x
              </button>
            </div>

            <div className="details-modal-body">
              <div className="details-grid">
                <div className="details-panel">
                  <h4 className="details-panel-title">Submitted Application Preview</h4>
                  <div className="details-row">
                    <span className="details-label">Full Name</span>
                    <span className="details-value">{formatValue(detailsUser?.name)}</span>
                  </div>
                  <div className="details-row">
                    <span className="details-label">Email</span>
                    <span className="details-value">{formatValue(detailsUser?.email)}</span>
                  </div>
                  <div className="details-row">
                    <span className="details-label">Phone Number</span>
                    <span className="details-value">
                      {formatValue(detailsUser?.phoneNumber ?? detailsUser?.phone ?? detailsUser?.mobile)}
                    </span>
                  </div>
                  <div className="details-row">
                    <span className="details-label">Current Profession</span>
                    <span className="details-value">{formatValue(detailsUser?.profession ?? detailsUser?.currentProfession)}</span>
                  </div>
                  <div className="details-row">
                    <span className="details-label">Education Level</span>
                    <span className="details-value">{formatValue(detailsUser?.educationLevel ?? detailsUser?.education)}</span>
                  </div>
                  <div className="details-row">
                    <span className="details-label">College / University</span>
                    <span className="details-value">
                      {formatValue(
                        detailsUser?.collegeName ??
                          detailsUser?.college ??
                          detailsUser?.university ??
                          detailsUser?.collegeOrUniversity
                      )}
                    </span>
                  </div>
                  <div className="details-row">
                    <span className="details-label">Graduation Year</span>
                    <span className="details-value">{formatValue(detailsUser?.graduationYear ?? detailsUser?.gradYear)}</span>
                  </div>
                  <div className="details-row">
                    <span className="details-label">Skills</span>
                    <span className="details-value">{formatValue(detailsUser?.skills)}</span>
                  </div>
                  <div className="details-row">
                    <span className="details-label">Cover Letter</span>
                    <span className="details-value">{formatValue(detailsUser?.coverLetter)}</span>
                  </div>
                  <div className="details-row">
                    <span className="details-label">Resume on file</span>
                    <span className="details-value">{formatValue(detailsUser?.resumeOriginalFileName)}</span>
                  </div>
                </div>

                <div className="details-panel">
                  <h4 className="details-panel-title">Application Summary</h4>
                  <div className="details-row">
                    <span className="details-label">ID</span>
                    <span className="details-value">{formatValue(detailsUser?.id)}</span>
                  </div>
                  <div className="details-row">
                    <span className="details-label">Role</span>
                    <span className="details-value">{formatValue(detailsUser?.role)}</span>
                  </div>
                  <div className="details-row">
                    <span className="details-label">Account Status</span>
                    <span className="details-value">{formatValue(detailsUser?.accountStatus)}</span>
                  </div>
                  <div className="details-row">
                    <span className="details-label">Applied Booth IDs</span>
                    <span className="details-value">{formatValue(detailsUser?.appliedBoothIds)}</span>
                  </div>
                </div>
              </div>

              <div className="details-modal-footer">
                <button type="button" className="details-primary-button" onClick={closeUserDetails}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminDashboard;
