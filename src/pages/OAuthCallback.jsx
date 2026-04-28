import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = params.get("token");
  const oauthError = params.get("error");

  useEffect(() => {
    if (oauthError) {
      setError("OAuth sign-in failed. Please try again.");
      return;
    }

    if (!token) {
      setError("Missing token from OAuth sign-in.");
      return;
    }

    localStorage.setItem("token", token);

    // Fetch user profile so Navbar/admin checks work immediately
    API.get("/user/me")
      .then((res) => {
        if (res.data) {
          localStorage.setItem("user", JSON.stringify(res.data));
        }
      })
      .catch(() => {
        // If profile fails, still allow token-only login
      })
      .finally(() => {
        navigate("/");
        window.location.reload();
      });
  }, [navigate, oauthError, token]);

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Signing you in…</h2>
        <p>{error ? error : "Please wait while we complete Google/GitHub login."}</p>
      </div>
    </div>
  );
}

export default OAuthCallback;

