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

  // Event Management
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [events, setEvents] = useState([]);

  // Booth Management
  const [boothCompanyName, setBoothCompanyName] = useState("");
  const [boothDescription, setBoothDescription] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [booths, setBooths] = useState([]);

  // Registrations
  const [registrations, setRegistrations] = useState([]);
  const [boothApplicants, setBoothApplicants] = useState({});

  // UI States
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [resumeBusyId, setResumeBusyId] = useState(null);
  const [approvalBusyId, setApprovalBusyId] = useState(null);
  const [registrationsLoadError, setRegistrationsLoadError] = useState("");
  const [modifyDecisionUserId, setModifyDecisionUserId] = useState(null);
  const [detailsUser, setDetailsUser] = useState(null);

  const selectableEvents = events.filter((event) => getEventStatus(event?.date) !== "CLOSED");

  useEffect(() => {
    if (!selectedEventId) return;
    const stillSelectable = selectableEvents.some((e) => String(e.id) === String(selectedEventId));
    if (!stillSelectable) setSelectedEventId("");
  }, [selectedEventId, selectableEvents]);

  useEffect(() => {
    // Check if user is admin
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

    // Redirect to home if not admin
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
    if (value === undefined || value === null) return "—";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
    if (typeof value === "string") return value.trim() ? value : "—";
    return String(value);
  };

  const statusBadgeStyle = (status) => {
    const s = status || "PENDING";
    if (s === "PENDING") return { background: "#fef3c7", color: "#b45309" };
    if (s === "REJECTED") return { background: "#fee2e2", color: "#b91c1c" };
    return { background: "#d1fae5", color: "#047857" };
  };

  const handleApproveUser = async (userId) => {
    setApprovalBusyId(userId);
    try {
      await approveUser(userId);
      showSuccess("User approved. They can sign in now (email sent if mail is configured).");
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

  const resumeButtonStyle = (disabled) => ({
    padding: "6px 10px",
    background: disabled ? "#e5e7eb" : "#0ea5e9",
    color: disabled ? "#9ca3af" : "white",
    border: "none",
    borderRadius: "6px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "0.75rem",
    fontWeight: "600",
  });

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
      showSuccess("✅ Event Created Successfully!");
      loadDashboardData();
    } catch (err) {
      showError("❌ Error creating event: " + (err.response?.data?.message || err.message));
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
      showSuccess("✅ Booth Created Successfully!");
      loadDashboardData();
    } catch (err) {
      showError("❌ Error creating booth: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await deleteEvent(eventId);
      showSuccess("✅ Event deleted successfully!");
      loadDashboardData();
    } catch (err) {
      showError("❌ Error deleting event: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteBooth = async (boothId) => {
    if (!window.confirm("Are you sure you want to delete this booth?")) return;

    try {
      await deleteBooth(boothId);
      showSuccess("✅ Booth deleted successfully!");
      loadDashboardData();
    } catch (err) {
      showError("❌ Error deleting booth: " + (err.response?.data?.message || err.message));
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

  const renderOverview = () => (
    <div className="dashboard-grid">
      <div className="dashboard-card">
        <h3>📊 Statistics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginTop: "20px" }}>
          <div style={{ textAlign: "center", padding: "20px", background: "#f0f9ff", borderRadius: "10px" }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1e40af" }}>{events.length}</div>
            <div style={{ color: "#64748b", marginTop: "5px" }}>Total Events</div>
          </div>
          <div style={{ textAlign: "center", padding: "20px", background: "#f0fdf4", borderRadius: "10px" }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#166534" }}>{booths.length}</div>
            <div style={{ color: "#64748b", marginTop: "5px" }}>Total Booths</div>
          </div>
          <div style={{ textAlign: "center", padding: "20px", background: "#fef9f3", borderRadius: "10px" }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#c2410c" }}>{registrations.length}</div>
            <div style={{ color: "#64748b", marginTop: "5px" }}>Registrations</div>
          </div>
          <div style={{ textAlign: "center", padding: "20px", background: "#faf5ff", borderRadius: "10px" }}>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#7c3aed" }}>
              {booths.reduce((total, booth) => total + (booth.applicantIds?.length || 0), 0)}
            </div>
            <div style={{ color: "#64748b", marginTop: "5px" }}>Applications</div>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h3>📅 Recent Events</h3>
        <div style={{ marginTop: "15px" }}>
          {events.slice(0, 3).map(event => (
            <div key={event.id} style={{
              padding: "12px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              marginBottom: "10px"
            }}>
              <div style={{ fontWeight: "600", color: "#0f172a" }}>{event.title}</div>
              <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                📅 {new Date(event.date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="dashboard-grid">
      <div className="dashboard-card create-event">
        <h3>🎪 Create New Event</h3>

        {success && (
          <div style={{
            padding: "12px",
            marginBottom: "15px",
            background: "#dcfce7",
            color: "#166534",
            borderRadius: "8px",
            fontSize: "0.9rem",
            fontWeight: "500"
          }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{
            padding: "12px",
            marginBottom: "15px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
            fontSize: "0.9rem"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreateEvent}>
          <input
            type="text"
            placeholder="Event Title (e.g., Tech Career Fair 2026)"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            required
          />

          <input
            type="datetime-local"
            placeholder="Event Date & Time"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />

          <textarea
            placeholder="Event Description (optional)"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            rows="3"
            style={{ resize: "none" }}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "🚀 Create Event"}
          </button>
        </form>
      </div>

      <div className="dashboard-card">
        <h3>📋 Manage Events</h3>
        <div style={{ marginTop: "15px" }}>
          {events.map(event => (
            <div key={event.id} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "15px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              marginBottom: "10px"
            }}>
              <div>
                <div style={{ fontWeight: "600", color: "#0f172a" }}>{event.title}</div>
                <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                  📅 {new Date(event.date).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => handleDeleteEvent(event.id)}
                style={{
                  padding: "8px 15px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.8rem"
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBooths = () => (
    <div className="dashboard-grid">
      <div className="dashboard-card create-event">
        <h3>🏢 Create New Booth</h3>

        {success && (
          <div style={{
            padding: "12px",
            marginBottom: "15px",
            background: "#dcfce7",
            color: "#166534",
            borderRadius: "8px",
            fontSize: "0.9rem",
            fontWeight: "500"
          }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{
            padding: "12px",
            marginBottom: "15px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
            fontSize: "0.9rem"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreateBooth}>
          <input
            type="text"
            placeholder="Company Name"
            value={boothCompanyName}
            onChange={(e) => setBoothCompanyName(e.target.value)}
            required
          />

          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px 15px",
              marginBottom: "12px",
              border: "2px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "0.95rem"
            }}
          >
            <option value="">Select Event</option>
            {selectableEvents.map(event => (
              <option key={event.id} value={event.id}>{event.title}</option>
            ))}
          </select>

          <textarea
            placeholder="Booth Description"
            value={boothDescription}
            onChange={(e) => setBoothDescription(e.target.value)}
            rows="3"
            style={{ resize: "none" }}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "🏢 Create Booth"}
          </button>
        </form>
      </div>

      <div className="dashboard-card">
        <h3>📋 Manage Booths</h3>
        <div style={{ marginTop: "15px" }}>
          {booths.map(booth => (
            <div key={booth.id} style={{
              padding: "15px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              marginBottom: "10px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", color: "#0f172a" }}>{booth.companyName}</div>
                  <div style={{ fontSize: "0.9rem", color: "#64748b", marginTop: "5px" }}>
                    {booth.description}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "5px" }}>
                    👥 {booth.applicantIds?.length || 0} applicants
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => loadBoothApplicants(booth.id)}
                    style={{
                      padding: "6px 12px",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.8rem"
                    }}
                  >
                    View Applicants
                  </button>
                  <button
                    onClick={() => handleDeleteBooth(booth.id)}
                    style={{
                      padding: "6px 12px",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.8rem"
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {boothApplicants[booth.id] && (
                <div style={{
                  marginTop: "15px",
                  padding: "10px",
                  background: "#f9fafb",
                  borderRadius: "6px"
                }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "8px" }}>
                    Applicants:
                  </div>
                  {boothApplicants[booth.id].map(applicant => (
                    <div
                      key={applicant.id}
                      style={{
                        fontSize: "0.8rem",
                        color: "#374151",
                        marginBottom: "10px",
                        paddingBottom: "10px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                        {applicant.name}{" "}
                        <span style={{ fontWeight: "400", color: "#6b7280" }}>
                          ({applicant.email})
                        </span>
                      </div>
                      {applicant.resumeOriginalFileName ? (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ fontSize: "0.75rem", color: "#059669" }}>
                            📎 {applicant.resumeOriginalFileName}
                          </span>
                          <button
                            type="button"
                            disabled={resumeBusyId === applicant.id}
                            style={resumeButtonStyle(resumeBusyId === applicant.id)}
                            onClick={() => handleViewResume(applicant.id)}
                          >
                            {resumeBusyId === applicant.id ? "…" : "View"}
                          </button>
                          <button
                            type="button"
                            disabled={resumeBusyId === applicant.id}
                            style={{
                              ...resumeButtonStyle(resumeBusyId === applicant.id),
                              background: resumeBusyId === applicant.id ? "#e5e7eb" : "#6366f1",
                            }}
                            onClick={() =>
                              handleDownloadResume(
                                applicant.id,
                                applicant.resumeOriginalFileName
                              )
                            }
                          >
                            Download
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          No resume uploaded
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRegistrations = () => {
    const usersWithResume = registrations.filter((user) => userHasApplied(user) && userHasResume(user));
    const usersWithoutResume = registrations.filter((user) => userHasApplied(user) && !userHasResume(user));

    return (
      <div className="dashboard-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <h3 style={{ margin: 0 }}>👥 User Registrations</h3>
          <button
            type="button"
            onClick={() => loadDashboardData()}
            style={{
              padding: "8px 14px",
              background: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.85rem",
            }}
          >
            Refresh list
          </button>
        </div>

        {registrationsLoadError && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px 14px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "8px",
              fontSize: "0.9rem",
            }}
          >
            <strong>Could not load users.</strong> {registrationsLoadError} Check that the backend is running on port 2026 and you are logged in as admin, then click Refresh list.
          </div>
        )}

        {success && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px 14px",
              background: "#dcfce7",
              color: "#166534",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          >
            {success}
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px 14px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginTop: "15px" }}>
          {!registrationsLoadError && registrations.length === 0 && (
            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>No registered users yet.</p>
          )}
          {usersWithResume.length === 0 && usersWithoutResume.length === 0 && (
            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>No applicants with booth/event registration found.</p>
          )}

          {usersWithResume.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 10px", color: "#1f2937" }}>Applicants with resume</h4>
              {usersWithResume.map((user) => (
                <div key={user.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                  padding: "15px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  marginBottom: "10px"
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "600", color: "#0f172a" }}>{user.name}</div>
                    <div style={{ fontSize: "0.9rem", color: "#64748b" }}>{user.email}</div>
                    <div style={{
                      fontSize: "0.8rem",
                      color: user.role === "ADMIN" ? "#dc2626" : "#059669",
                      fontWeight: "600",
                      marginTop: "4px"
                    }}>
                      {user.role}
                    </div>
                    {user.role === "USER" && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          marginTop: "6px",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          display: "inline-block",
                          ...statusBadgeStyle(user.accountStatus),
                        }}
                      >
                        {(user.accountStatus || "PENDING").replace("_", " ")}
                      </div>
                    )}
                    {user.resumeOriginalFileName && (
                      <div style={{ fontSize: "0.75rem", color: "#059669", marginTop: "6px" }}>
                        📎 Certificate on file: {user.resumeOriginalFileName}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px", minWidth: "200px" }}>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                      ID: {user.id}
                    </div>
                    <div style={{ width: "100%", textAlign: "right" }}>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Certificate
                      </div>
                      {user.resumeOriginalFileName ? (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            disabled={resumeBusyId === user.id}
                            style={resumeButtonStyle(resumeBusyId === user.id)}
                            onClick={() => handleViewResume(user.id)}
                          >
                            {resumeBusyId === user.id ? "…" : "View certificate"}
                          </button>
                          <button
                            type="button"
                            disabled={resumeBusyId === user.id}
                            style={{
                              ...resumeButtonStyle(resumeBusyId === user.id),
                              background: resumeBusyId === user.id ? "#e5e7eb" : "#6366f1",
                            }}
                            onClick={() => handleDownloadResume(user.id, user.resumeOriginalFileName)}
                          >
                            Download
                          </button>
                          <button
                            type="button"
                            style={{
                              ...resumeButtonStyle(false),
                              background: "#111827",
                            }}
                            onClick={() => openUserDetails(user)}
                          >
                            View details
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>No certificate uploaded</span>
                      )}
                    </div>

                    {user.role === "USER" && (
                      <div style={{ width: "100%", borderTop: "1px solid #e2e8f0", paddingTop: "10px", textAlign: "right" }}>
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Application decision
                        </div>
                        {(() => {
                          const status = user.accountStatus || "PENDING";
                          const decided = status === "APPROVED" || status === "REJECTED";
                          const isModifying = modifyDecisionUserId === user.id;
                          const showChoices = !decided || isModifying;

                          if (!showChoices) {
                            return (
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                <button
                                  type="button"
                                  disabled={approvalBusyId === user.id}
                                  style={{
                                    padding: "8px 14px",
                                    background: approvalBusyId === user.id ? "#e5e7eb" : "#0ea5e9",
                                    color: approvalBusyId === user.id ? "#9ca3af" : "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: approvalBusyId === user.id ? "not-allowed" : "pointer",
                                    fontWeight: "600",
                                    fontSize: "0.8rem",
                                  }}
                                  onClick={() => setModifyDecisionUserId(user.id)}
                                >
                                  Modify
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                disabled={approvalBusyId === user.id}
                                style={{
                                  padding: "8px 14px",
                                  background: approvalBusyId === user.id ? "#e5e7eb" : "#059669",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: approvalBusyId === user.id ? "not-allowed" : "pointer",
                                  fontWeight: "600",
                                  fontSize: "0.8rem",
                                }}
                                onClick={() => handleApproveUser(user.id)}
                              >
                                {approvalBusyId === user.id ? "…" : "Approve"}
                              </button>
                              <button
                                type="button"
                                disabled={approvalBusyId === user.id}
                                style={{
                                  padding: "8px 14px",
                                  background: approvalBusyId === user.id ? "#e5e7eb" : "#dc2626",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: approvalBusyId === user.id ? "not-allowed" : "pointer",
                                  fontWeight: "600",
                                  fontSize: "0.8rem",
                                }}
                                onClick={() => handleRejectUser(user.id)}
                              >
                                Reject
                              </button>

                              {isModifying && (
                                <button
                                  type="button"
                                  disabled={approvalBusyId === user.id}
                                  style={{
                                    padding: "8px 14px",
                                    background: approvalBusyId === user.id ? "#e5e7eb" : "#64748b",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: approvalBusyId === user.id ? "not-allowed" : "pointer",
                                    fontWeight: "600",
                                    fontSize: "0.8rem",
                                  }}
                                  onClick={() => setModifyDecisionUserId(null)}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {usersWithoutResume.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h4 style={{ margin: "0 0 10px", color: "#1f2937" }}>Applicants without resume</h4>
              {usersWithoutResume.map((user) => (
                <div key={user.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                  padding: "15px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  marginBottom: "10px",
                  background: "#f8fafc"
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "600", color: "#0f172a" }}>{user.name}</div>
                    <div style={{ fontSize: "0.9rem", color: "#64748b" }}>{user.email}</div>
                    <div style={{
                      fontSize: "0.8rem",
                      color: "#059669",
                      fontWeight: "600",
                      marginTop: "4px"
                    }}>
                      {user.role}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#c2410c", marginTop: "8px" }}>
                      No resume uploaded yet.
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "6px" }}>
                      {pendingResumeMessage}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px", minWidth: "200px" }}>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>ID: {user.id}</div>
                    <div style={{ width: "100%", textAlign: "right" }}>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Application status
                      </div>
                      <span style={{
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        color: "#7c3aed"
                      }}>
                        {(user.accountStatus || "PENDING").replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🎯 Admin Dashboard</h1>
        <p>Manage your Career Fair events, booths, and registrations</p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: "flex",
        gap: "0",
        marginBottom: "30px",
        background: "white",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)"
      }}>
        {[
          { id: "overview", label: "Overview", icon: "📊" },
          { id: "events", label: "Events", icon: "🎪" },
          { id: "booths", label: "Booths", icon: "🏢" },
          { id: "registrations", label: "Registrations", icon: "👥" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "15px",
              background: activeTab === tab.id ? "#667eea" : "transparent",
              color: activeTab === tab.id ? "white" : "#64748b",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.3s ease"
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && renderOverview()}
      {activeTab === "events" && renderEvents()}
      {activeTab === "booths" && renderBooths()}
      {activeTab === "registrations" && renderRegistrations()}

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
                ×
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
    </div>
  );
}

export default AdminDashboard;