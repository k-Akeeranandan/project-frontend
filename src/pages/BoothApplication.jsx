import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBooths, getMyBoothApplication, submitBoothApplication } from "../services/boothService";
import { getCurrentUserProfile, uploadResume } from "../services/userService";

function BoothApplication() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [booth, setBooth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeMessage, setResumeMessage] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    currentProfession: "",
    educationLevel: "",
    collegeName: "",
    graduationYear: currentYear,
    skills: "",
    coverLetter: "",
  });

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    async function loadData() {
      try {
        const [booths, profile] = await Promise.all([getBooths(), getCurrentUserProfile()]);
        const foundBooth = booths.find((item) => String(item.id) === String(id));
        if (!foundBooth) {
          setError("Booth not found.");
          setLoading(false);
          return;
        }

        setBooth(foundBooth);
        setResumeFileName(profile.resumeOriginalFileName || "");
        setFormData((prev) => ({
          ...prev,
          fullName: profile.name || "",
          email: profile.email || "",
        }));

        try {
          const existing = await getMyBoothApplication(id);
          if (existing) {
            setAlreadySubmitted(true);
            setFormData({
              fullName: existing.fullName || profile.name || "",
              email: existing.email || profile.email || "",
              phoneNumber: existing.phoneNumber || "",
              currentProfession: existing.currentProfession || "",
              educationLevel: existing.educationLevel || "",
              collegeName: existing.collegeName || "",
              graduationYear: existing.graduationYear || currentYear,
              skills: existing.skills || "",
              coverLetter: existing.coverLetter || "",
            });
            setSuccessMessage("You have already submitted an application for this booth.");
          }
        } catch {
          /* no previous application */
        }
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load application page.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentYear, id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetailsContinue = (e) => {
    e.preventDefault();
    setError("");
    setStep(2);
  };

  const handleUploadClick = () => {
    setResumeMessage("");
    setError("");
    fileInputRef.current?.click();
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext || "")) {
      setError("Please choose a PDF or Word file (.pdf, .doc, .docx).");
      return;
    }

    setResumeUploading(true);
    setError("");
    setResumeMessage("");
    try {
      await uploadResume(file);
      const profile = await getCurrentUserProfile();
      setResumeFileName(profile.resumeOriginalFileName || file.name);
      setResumeMessage("Resume uploaded successfully. You can submit your application now.");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Resume upload failed.");
    } finally {
      setResumeUploading(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!resumeFileName) {
      setError("Please upload your resume before submitting the application.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await submitBoothApplication(id, {
        ...formData,
        graduationYear: Number(formData.graduationYear),
      });
      window.alert("Your application has been saved successfully.");
      navigate(`/booth/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Could not save your application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <div style={{ textAlign: "center", padding: "50px" }}>Loading application form...</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-title">
          <h2>📝 Apply to {booth?.companyName || "Booth"}</h2>
          <p>Complete your details first, then upload your resume and submit the application.</p>
        </div>
      </div>

      {error && (
        <div style={{
          padding: "14px",
          marginBottom: "20px",
          background: "#fee2e2",
          color: "#991b1b",
          borderRadius: "10px"
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          padding: "14px",
          marginBottom: "20px",
          background: "#ecfdf5",
          color: "#166534",
          borderRadius: "10px"
        }}>
          {successMessage}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
        gap: "24px",
        alignItems: "start"
      }}>
        <div style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
          padding: "28px"
        }}>
          {!alreadySubmitted && (
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
              {[1, 2].map((currentStep) => (
                <div
                  key={currentStep}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: step === currentStep ? "linear-gradient(90deg, #667eea 0%, #764ba2 100%)" : "#e2e8f0",
                    color: step === currentStep ? "white" : "#334155",
                    fontWeight: "700",
                    textAlign: "center"
                  }}
                >
                  {currentStep === 1 ? "1. Applicant Details" : "2. Resume Upload"}
                </div>
              ))}
            </div>
          )}

          {alreadySubmitted ? (
            <div style={{
              background: "#f8fafc",
              borderRadius: "14px",
              padding: "20px",
              border: "1px solid #e2e8f0"
            }}>
              <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Submitted Application Preview</h3>
              <p style={{ margin: "0 0 18px", color: "#64748b" }}>
                This application has already been submitted and cannot be modified again.
              </p>
              <div style={{ display: "grid", gap: "12px", color: "#334155" }}>
                <div><strong>Full Name:</strong> {formData.fullName}</div>
                <div><strong>Email:</strong> {formData.email}</div>
                <div><strong>Phone Number:</strong> {formData.phoneNumber}</div>
                <div><strong>Current Profession:</strong> {formData.currentProfession}</div>
                <div><strong>Education Level:</strong> {formData.educationLevel}</div>
                <div><strong>College / University:</strong> {formData.collegeName}</div>
                <div><strong>Graduation Year:</strong> {formData.graduationYear}</div>
                <div><strong>Skills:</strong> {formData.skills}</div>
                <div><strong>Cover Letter:</strong> {formData.coverLetter || "Not provided"}</div>
                <div><strong>Resume on file:</strong> {resumeFileName || "Resume already submitted"}</div>
              </div>
              <div style={{ marginTop: "20px" }}>
                <button type="button" onClick={() => navigate(`/booth/${id}`)} style={secondaryButtonStyle}>
                  Back to Booth
                </button>
              </div>
            </div>
          ) : step === 1 && (
            <form onSubmit={handleDetailsContinue} style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Field label="Full Name">
                  <input style={fieldInputStyle} name="fullName" value={formData.fullName} onChange={handleChange} required />
                </Field>
                <Field label="Email Address">
                  <input style={fieldInputStyle} type="email" name="email" value={formData.email} onChange={handleChange} required />
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Field label="Phone Number">
                  <input style={fieldInputStyle} name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
                </Field>
                <Field label="Current Profession">
                  <select style={fieldInputStyle} name="currentProfession" value={formData.currentProfession} onChange={handleChange} required>
                    <option value="">Select profession</option>
                    <option value="Student">Student</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Fresher">Fresher</option>
                    <option value="Intern">Intern</option>
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Designer">Designer</option>
                    <option value="Data Analyst">Data Analyst</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Field label="Education Level">
                  <select style={fieldInputStyle} name="educationLevel" value={formData.educationLevel} onChange={handleChange} required>
                    <option value="">Select education</option>
                    <option value="High School">High School</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Doctorate">Doctorate</option>
                  </select>
                </Field>
                <Field label="Graduation Year">
                  <input
                    style={fieldInputStyle}
                    type="number"
                    name="graduationYear"
                    min="2000"
                    max={currentYear + 10}
                    value={formData.graduationYear}
                    onChange={handleChange}
                    required
                  />
                </Field>
              </div>

              <Field label="College / University">
                <input style={fieldInputStyle} name="collegeName" value={formData.collegeName} onChange={handleChange} required />
              </Field>

              <Field label="Skills">
                <input
                  style={fieldInputStyle}
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="Example: Java, React, SQL, Communication"
                  required
                />
              </Field>

              <Field label="Short Cover Letter">
                <textarea
                  style={{ ...fieldInputStyle, resize: "vertical", minHeight: "120px" }}
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Tell the recruiter why you are a good fit."
                />
              </Field>

              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <button type="button" onClick={() => navigate(`/booth/${id}`)} style={secondaryButtonStyle}>
                  Back
                </button>
                <button type="submit" style={primaryButtonStyle}>
                  Continue to Resume
                </button>
              </div>
            </form>
          )}

          {!alreadySubmitted && step === 2 && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                style={{ display: "none" }}
                onChange={handleResumeChange}
              />

              <div style={{
                background: "#f8fafc",
                borderRadius: "14px",
                padding: "20px",
                border: "1px solid #e2e8f0",
                marginBottom: "18px"
              }}>
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Upload Resume</h3>
                <p style={{ margin: "0 0 14px", color: "#64748b" }}>
                  Upload your latest resume in PDF or Word format. This will be available to recruiters.
                </p>
                {resumeFileName && (
                  <p style={{ margin: "0 0 10px", color: "#166534", fontWeight: "600" }}>
                    Resume on file: {resumeFileName}
                  </p>
                )}
                {resumeMessage && (
                  <p style={{ margin: "0 0 10px", color: "#166534" }}>{resumeMessage}</p>
                )}
                <button type="button" onClick={handleUploadClick} disabled={resumeUploading} style={primaryButtonStyle}>
                  {resumeUploading ? "Uploading..." : "Upload Resume"}
                </button>
              </div>

              <div style={{
                background: "#fef9f3",
                borderRadius: "14px",
                padding: "18px",
                border: "1px solid #fed7aa",
                marginBottom: "18px"
              }}>
                <h4 style={{ margin: "0 0 10px", color: "#c2410c" }}>Before you submit</h4>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#7c2d12" }}>
                  <li>Check that your details are correct</li>
                  <li>Upload the latest version of your resume</li>
                  <li>Submit once to save your application</li>
                </ul>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <button type="button" onClick={() => setStep(1)} style={secondaryButtonStyle}>
                  Back to Details
                </button>
                <button type="button" onClick={handleSubmitApplication} disabled={submitting} style={primaryButtonStyle}>
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
          padding: "24px"
        }}>
          <h3 style={{ margin: "0 0 12px", color: "#0f172a" }}>Application Summary</h3>
          <p style={{ margin: "0 0 18px", color: "#64748b" }}>
            Company: <strong style={{ color: "#0f172a" }}>{booth?.companyName}</strong>
          </p>
          <div style={{ display: "grid", gap: "10px", color: "#334155", fontSize: "0.95rem" }}>
            <div><strong>Name:</strong> {formData.fullName || "Not filled yet"}</div>
            <div><strong>Email:</strong> {formData.email || "Not filled yet"}</div>
            <div><strong>Phone:</strong> {formData.phoneNumber || "Not filled yet"}</div>
            <div><strong>Profession:</strong> {formData.currentProfession || "Not filled yet"}</div>
            <div><strong>Education:</strong> {formData.educationLevel || "Not filled yet"}</div>
            <div><strong>College:</strong> {formData.collegeName || "Not filled yet"}</div>
            <div><strong>Graduation Year:</strong> {formData.graduationYear || "Not filled yet"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: "8px", color: "#334155", fontWeight: "600" }}>
      <span>{label}</span>
      {children}
    </label>
  );
}

const primaryButtonStyle = {
  padding: "12px 20px",
  background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontWeight: "700",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  padding: "12px 20px",
  background: "white",
  color: "#475569",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  fontWeight: "700",
  cursor: "pointer",
};

const fieldInputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  fontSize: "0.95rem",
  color: "#0f172a",
  background: "white",
  boxSizing: "border-box",
};

export default BoothApplication;
