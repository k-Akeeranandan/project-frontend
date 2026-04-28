import { Link } from "react-router-dom";

function BoothCard({ booth }) {
  if (!booth) return null;

  return (
    <div
      style={{
        background: "white",
        borderRadius: "15px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
        padding: "24px",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        transition: "transform 0.2s ease, box-shadow 0.2s ease"
      }}
    >
      <div>
        <h3 style={{ color: "#0f172a", margin: "0 0 8px 0", fontSize: "1.25rem" }}>
          🏢 {booth.companyName}
        </h3>
        <p style={{ color: "#64748b", margin: "0", lineHeight: 1.5 }}>
          {booth.description || "No description provided."}
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "auto" }}>
        <Link
          to={`/booth/${booth.id}`}
          style={{
            padding: "10px 18px",
            background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "0.9rem",
            display: "inline-block",
            textAlign: "center"
          }}
        >
          View booth & apply
        </Link>
      </div>
    </div>
  );
}

export default BoothCard;
