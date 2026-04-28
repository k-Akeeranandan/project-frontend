import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/authService";
import API from "../api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const startOAuth = (provider) => {
    const baseURL = API?.defaults?.baseURL;
    if (!baseURL) {
      setError("OAuth is not configured. Missing API base URL.");
      return;
    }

    window.location.assign(`${baseURL}/auth/${provider}`);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters!");
      return;
    }

    setLoading(true);

    try {
      await registerUser({ name, email, password });
      navigate("/login");
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>📝 Register</h2>
        <p>Create a new account</p>

        {error && (
          <div style={{
            padding: "10px",
            marginBottom: "15px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
            fontSize: "0.9rem"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="👤 Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="📧 Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="🔑 Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="🔐 Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="oauth-buttons">
          <button
            type="button"
            className="oauth-button oauth-google"
            onClick={() => startOAuth("google")}
            disabled={loading}
          >
            <span className="oauth-icon" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303C33.659 32.657 29.194 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.987 6.053 29.744 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.65-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.655 16.108 19.01 12 24 12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.987 6.053 29.744 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.063 0 9.993-1.943 13.57-5.1l-6.263-5.302C29.23 35.242 26.715 36 24 36c-5.174 0-9.626-3.32-11.29-7.946l-6.52 5.024C9.505 39.556 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303c-.792 2.204-2.275 4.082-4.0 5.319l.003-.002 6.263 5.302C36.77 39.355 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>
            </span>
            Continue with Google
          </button>

          <button
            type="button"
            className="oauth-button oauth-github"
            onClick={() => startOAuth("github")}
            disabled={loading}
          >
            <span className="oauth-icon" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
              >
                <path d="M12 .5C5.73.5.75 5.64.75 12c0 5.09 3.29 9.4 7.86 10.93.58.11.79-.26.79-.57v-2.2c-3.2.71-3.87-1.39-3.87-1.39-.53-1.38-1.29-1.75-1.29-1.75-1.06-.74.08-.73.08-.73 1.17.08 1.79 1.23 1.79 1.23 1.04 1.83 2.74 1.3 3.41.99.11-.77.41-1.3.74-1.6-2.55-.3-5.23-1.31-5.23-5.84 0-1.29.45-2.34 1.19-3.16-.12-.3-.52-1.53.11-3.19 0 0 .97-.32 3.18 1.21.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.53 3.17-1.21 3.17-1.21.64 1.66.24 2.89.12 3.19.74.82 1.19 1.87 1.19 3.16 0 4.54-2.69 5.54-5.25 5.83.42.37.79 1.1.79 2.22v3.29c0 .32.21.69.8.57 4.56-1.53 7.85-5.84 7.85-10.93C23.25 5.64 18.27.5 12 .5z" />
              </svg>
            </span>
            Continue with GitHub
          </button>
        </div>

        <div className="link-text">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;