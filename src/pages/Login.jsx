import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  loginUser,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgotPassword
} from "../services/authService";

function createCaptcha() {
  const first = Math.floor(Math.random() * 9) + 1;
  const second = Math.floor(Math.random() * 9) + 1;
  return {
    question: `${first} + ${second}`,
    answer: String(first + second)
  };
}

function Login() {
  const forgotStepDetails = {
    1: {
      label: "Step 1 of 3",
      title: "Send OTP",
      description: "Enter your registered email address and we will send a one-time password."
    },
    2: {
      label: "Step 2 of 3",
      title: "Verify OTP",
      description: "Enter the OTP sent to your email to continue resetting your password."
    },
    3: {
      label: "Step 3 of 3",
      title: "Create New Password",
      description: "Choose a strong new password and confirm it to complete the reset."
    }
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captcha, setCaptcha] = useState(() => createCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [forgotStep, setForgotStep] = useState(0);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const closeForgotPassword = () => {
    setForgotStep(0);
    setForgotLoading(false);
    setForgotError("");
    setForgotSuccess("");
    setForgotOtp("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (captchaInput.trim() !== captcha.answer) {
      setError("Captcha is incorrect. Please try again.");
      setCaptcha(createCaptcha());
      setCaptchaInput("");
      return;
    }

    setLoading(true);

    try {
      await loginUser(email, password);
      navigate("/");
      window.location.reload();
    } catch (err) {
      console.error("Login error:", err);
      const errorData = err.response?.data;
      let errorMessage = "Login failed. Please try again.";

      if (errorData) {
        if (typeof errorData === "string") {
          errorMessage = errorData;
        } else if (typeof errorData.error === "string") {
          errorMessage = errorData.error;
        } else if (typeof errorData.message === "string") {
          errorMessage = errorData.message;
        }
      } else if (err.response?.status === 401) {
        errorMessage = "Invalid email or password.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setCaptcha(createCaptcha());
      setCaptchaInput("");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");
    try {
      await sendForgotPasswordOtp(forgotEmail);
      setForgotSuccess("OTP sent to your email.");
      setForgotStep(2);
    } catch (err) {
      const errorData = err.response?.data;
      const message = (typeof errorData === "string" && errorData)
        || errorData?.error
        || errorData?.message
        || "Failed to send OTP.";
      setForgotError(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");
    try {
      await verifyForgotPasswordOtp(forgotEmail, forgotOtp);
      setForgotSuccess("OTP verified. You can now set a new password.");
      setForgotStep(3);
    } catch (err) {
      const errorData = err.response?.data;
      const message = (typeof errorData === "string" && errorData)
        || errorData?.error
        || errorData?.message
        || "Failed to verify OTP.";
      setForgotError(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (newPassword !== confirmPassword) {
      setForgotError("New password and confirm password do not match.");
      return;
    }

    setForgotLoading(true);
    try {
      await resetForgotPassword(forgotEmail, forgotOtp, newPassword);
      setForgotSuccess("Password updated successfully. Please login.");
      setPassword("");
      setForgotOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        closeForgotPassword();
      }, 1200);
    } catch (err) {
      const errorData = err.response?.data;
      const message = (typeof errorData === "string" && errorData)
        || errorData?.error
        || errorData?.message
        || "Failed to reset password.";
      setForgotError(message);
    } finally {
      setForgotLoading(false);
    }
  };

  const startForgotPassword = () => {
    setForgotError("");
    setForgotSuccess("");
    setForgotEmail(email || "");
    setForgotOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotStep(1);
  };

  return (
    <div className="auth-container">
      <div className="auth-box login-box">
        <div className="auth-header">
          <span className="auth-badge">Welcome back</span>
          <h2>Login</h2>
          <p>Sign in to continue exploring events, booths, and applications.</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error" role="alert" aria-live="polite">
            <strong>Login failed</strong>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <label className="auth-field">
            <span>Email Address</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <div className="captcha-card">
            <div className="captcha-row">
              <div>
                <div className="captcha-label">Captcha Verification</div>
                <div className="captcha-question">Solve: {captcha.question}</div>
              </div>
              <button
                type="button"
                className="captcha-refresh-button"
                onClick={() => {
                  setCaptcha(createCaptcha());
                  setCaptchaInput("");
                }}
              >
                Refresh
              </button>
            </div>

            <input
              type="text"
              placeholder="Enter captcha answer"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-submit-button">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {forgotStep === 0 && (
          <div className="link-text login-link-text">
            <button
              type="button"
              onClick={startForgotPassword}
              className="forgot-link-button"
            >
              Forgot Password?
            </button>
          </div>
        )}

        <div className="link-text">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>

      {forgotStep > 0 && (
        <div
          onClick={closeForgotPassword}
          className="forgot-modal-overlay"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="forgot-modal"
          >
            <div className="forgot-modal-header">
              <div className="forgot-modal-top">
                <div>
                  <div className="forgot-step-chip">
                    {forgotStepDetails[forgotStep].label}
                  </div>
                  <h3 className="forgot-modal-title">
                    {forgotStepDetails[forgotStep].title}
                  </h3>
                  <p className="forgot-modal-description">
                    {forgotStepDetails[forgotStep].description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForgotPassword}
                  className="forgot-close-button"
                  aria-label="Close forgot password dialog"
                >
                  x
                </button>
              </div>

              <div className="forgot-progress">
                {[1, 2, 3].map((step) => {
                  const isActive = forgotStep === step;
                  const isCompleted = forgotStep > step;
                  return (
                    <div
                      key={step}
                      className={`forgot-progress-segment${isCompleted ? " is-complete" : ""}${isActive ? " is-active" : ""}`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="forgot-modal-body">
              {forgotError && (
                <div className="forgot-alert forgot-alert-error" role="alert">
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div className="forgot-alert forgot-alert-success">
                  {forgotSuccess}
                </div>
              )}

              {forgotStep === 1 && (
                <form onSubmit={handleSendOtp} className="forgot-form">
                  <label className="forgot-field-label">
                    Email Address
                  </label>
                  <input
                    className="forgot-input"
                    type="email"
                    placeholder="Enter your account email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                  <div className="forgot-help-text">
                    We will send a 6-digit OTP to this email address.
                  </div>
                  <button type="submit" disabled={forgotLoading} className="forgot-primary-button">
                    {forgotLoading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="forgot-form">
                  <label className="forgot-field-label">
                    Email Address
                  </label>
                  <input
                    className="forgot-input"
                    type="email"
                    placeholder="Enter your account email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                  <label className="forgot-field-label">
                    One-Time Password
                  </label>
                  <input
                    className="forgot-input"
                    type="text"
                    placeholder="Enter OTP"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    required
                  />
                  <div className="forgot-help-text">
                    Enter the OTP exactly as received in your email.
                  </div>
                  <button type="submit" disabled={forgotLoading} className="forgot-primary-button">
                    {forgotLoading ? "Verifying..." : "Verify OTP"}
                  </button>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="forgot-form">
                  <label className="forgot-field-label">
                    New Password
                  </label>
                  <input
                    className="forgot-input"
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <label className="forgot-field-label">
                    Confirm Password
                  </label>
                  <input
                    className="forgot-input"
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <div className="forgot-help-text">
                    Use at least 6 characters and make sure both passwords match.
                  </div>
                  <button type="submit" disabled={forgotLoading} className="forgot-primary-button">
                    {forgotLoading ? "Updating..." : "Change Password"}
                  </button>
                </form>
              )}

              <div className="forgot-modal-footer">
                <div>
                  {forgotStep > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep(forgotStep - 1);
                        setForgotError("");
                        setForgotSuccess("");
                      }}
                      className="forgot-secondary-link"
                    >
                      Back
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={closeForgotPassword}
                  className="forgot-cancel-link"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
