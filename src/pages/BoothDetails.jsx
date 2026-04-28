import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getBooths } from "../services/boothService";
import { getCurrentUserProfile } from "../services/userService";

function BoothDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booth, setBooth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");
  const [resumeFileName, setResumeFileName] = useState(null);

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

    getBooths()
      .then((booths) => {
        const foundBooth = booths.find(b => b.id == id);
        if (foundBooth) {
          setBooth(foundBooth);
        } else {
          setError("Booth not found");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load booth details");
        setLoading(false);
      });
  }, [id, navigate]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setResumeFileName(null);
      return;
    }
    getCurrentUserProfile()
      .then((profile) => {
        setResumeFileName(profile.resumeOriginalFileName || null);
        try {
          const raw = localStorage.getItem("user");
          if (raw && raw !== "undefined") {
            const prev = JSON.parse(raw);
            localStorage.setItem(
              "user",
              JSON.stringify({ ...prev, ...profile })
            );
          }
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* session expired */
      });
  }, []);

  if (loading) {
    return (
      <div className="page-shell">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "20px" }}>⏳</div>
          <p>Loading booth details...</p>
        </div>
      </div>
    );
  }

  if (error && !booth) {
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
          <h3>{error}</h3>
          <button
            onClick={() => navigate("/events")}
            style={{
              padding: "12px 25px",
              background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "20px"
            }}
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-title">
          <h2>🏢 {booth.companyName}</h2>
          <p>Booth ID: {id} · Virtual Career Fair Booth</p>
        </div>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate(`/booth/${id}/apply`)}
            disabled={applied}
            style={{
              padding: "12px 25px",
              background: applied
                ? "#dcfce7"
                : "linear-gradient(90deg, #10b981 0%, #059669 100%)",
              color: applied ? "#166534" : "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: applied ? "not-allowed" : "pointer",
              transition: "all 0.3s ease"
            }}
          >
            {applied ? "✅ Applied" : "📄 Apply Now"}
          </button>
          <button
            style={{
              padding: "12px 25px",
              background: "transparent",
              color: "#667eea",
              border: "2px solid #667eea",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onClick={() => navigate("/chat?tab=personal&target=admin")}
          >
            💬 Start Chat
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: "15px",
          marginBottom: "20px",
          background: "#fee2e2",
          color: "#991b1b",
          borderRadius: "8px",
          fontSize: "0.9rem"
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: "30px"
      }}>
        {/* Company Information */}
        <div style={{
          background: "white",
          borderRadius: "15px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
          padding: "30px"
        }}>
          <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
            🏢 Company Details
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "600", color: "#374151" }}>Company Name:</span>
              <span style={{ color: "#0f172a" }}>{booth.companyName}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontWeight: "600", color: "#374151" }}>Description:</span>
              <span style={{ color: "#0f172a", textAlign: "right", maxWidth: "60%" }}>
                {booth.description || "No description available"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "600", color: "#374151" }}>Status:</span>
              <span style={{
                background: "#dcfce7",
                color: "#166534",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "0.8rem",
                fontWeight: "600"
              }}>
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Application Information */}
        <div style={{
          background: "white",
          borderRadius: "15px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
          padding: "30px"
        }}>
          <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
            📋 Application Info
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{
              background: "#f0f9ff",
              padding: "15px",
              borderRadius: "10px",
              borderLeft: "4px solid #3b82f6"
            }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#1e40af" }}>How to Apply</h4>
              <ol style={{ margin: "0", paddingLeft: "20px", color: "#374151" }}>
                <li>Click &quot;Apply Now&quot; to open the application form</li>
                <li>Fill in your details and upload your resume on the next page</li>
                <li>Submit your application for recruiter review</li>
              </ol>
            </div>

            <div style={{
              background: "#fef9f3",
              padding: "15px",
              borderRadius: "10px",
              borderLeft: "4px solid #f97316"
            }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#c2410c" }}>What Happens Next?</h4>
              <ul style={{ margin: "0", paddingLeft: "20px", color: "#374151" }}>
                <li>Company reviews your application</li>
                <li>You may receive interview invitations</li>
                <li>Check your email regularly</li>
                <li>Prepare for virtual interviews</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: "white",
          borderRadius: "15px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
          padding: "30px"
        }}>
          <h3 style={{ color: "#0f172a", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
            ⚡ Quick Actions
          </h3>

          {resumeFileName && (
            <p style={{
              margin: "0 0 16px 0",
              fontSize: "0.9rem",
              color: "#166534",
              background: "#f0fdf4",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #bbf7d0"
            }}>
              <strong>Resume on file:</strong> {resumeFileName}
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              style={{
                padding: "12px 20px",
                background: "linear-gradient(90deg, #ec4899 0%, #db2777 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}
              onClick={() => navigate("/events")}
            >
              🔙 Back to Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoothDetails;