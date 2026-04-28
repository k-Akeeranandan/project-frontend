import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getChatContacts,
  getGlobalMessages,
  getPrivateMessages,
  sendGlobalMessage,
  sendPrivateMessage,
} from "../services/chatService";

function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw && raw !== "undefined" && raw !== "null" ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "personal" ? "personal" : "global");
  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const selectedContact = contacts.find((contact) => String(contact.id) === String(selectedContactId));

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    async function loadContacts() {
      try {
        const data = await getChatContacts();
        if (cancelled) return;
        const allContacts = Array.isArray(data) ? data : [];
        setContacts(allContacts);

        const requestedUserId = searchParams.get("userId");
        const requestedAdmin = searchParams.get("target") === "admin";
        const initialContact =
          allContacts.find((contact) => String(contact.id) === String(requestedUserId)) ||
          (requestedAdmin ? allContacts.find((contact) => contact.role === "ADMIN") : null) ||
          allContacts[0] ||
          null;

        if (initialContact) {
          setSelectedContactId(String(initialContact.id));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || "Could not load chat contacts.");
        }
      }
    }

    loadContacts();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      setLoading(true);
      setError("");
      try {
        const data =
          activeTab === "global"
            ? await getGlobalMessages()
            : selectedContactId
              ? await getPrivateMessages(selectedContactId)
              : [];
        if (!cancelled) {
          setMessages(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || "Could not load chat messages.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMessages();
    if ((activeTab === "global") || selectedContactId) {
      const interval = setInterval(loadMessages, 4000);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [activeTab, selectedContactId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed) return;
    if (activeTab === "personal" && !selectedContactId) {
      setError("Select a contact first.");
      return;
    }

    setSending(true);
    setError("");
    try {
      const newMessage =
        activeTab === "global"
          ? await sendGlobalMessage(trimmed)
          : await sendPrivateMessage(selectedContactId, trimmed);
      setMessages((prev) => [...prev, newMessage]);
      setMessageText("");
    } catch (err) {
      setError(err.response?.data?.error || "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  const pageTitle =
    activeTab === "global"
      ? "Global Chat"
      : selectedContact
        ? `Chat with ${selectedContact.name}`
        : "Personal Chat";

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-title">
          <h2>💬 Chat Center</h2>
          <p>Use global chat for everyone, or personal chat for one-to-one conversations.</p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: "24px",
        alignItems: "start"
      }}>
        <div style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
          padding: "20px"
        }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("global")}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: "10px",
                border: "none",
                background: activeTab === "global" ? "linear-gradient(90deg, #667eea 0%, #764ba2 100%)" : "#e2e8f0",
                color: activeTab === "global" ? "white" : "#334155",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              Global
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: "10px",
                border: "none",
                background: activeTab === "personal" ? "linear-gradient(90deg, #667eea 0%, #764ba2 100%)" : "#e2e8f0",
                color: activeTab === "personal" ? "white" : "#334155",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              Personal
            </button>
          </div>

          <div style={{ color: "#64748b", fontSize: "0.92rem", marginBottom: "14px" }}>
            {activeTab === "global"
              ? "Everyone can read and send messages here."
              : "Choose a person to start a private chat."}
          </div>

          {activeTab === "personal" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {contacts.length === 0 && (
                <div style={{ color: "#64748b", fontSize: "0.92rem" }}>No contacts available.</div>
              )}
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => setSelectedContactId(String(contact.id))}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: String(contact.id) === String(selectedContactId) ? "2px solid #667eea" : "1px solid #e2e8f0",
                    background: String(contact.id) === String(selectedContactId) ? "#eef2ff" : "white",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ fontWeight: "700", color: "#0f172a" }}>{contact.name}</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    {contact.role} · {contact.email}
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === "global" && (
            <div style={{
              padding: "14px",
              borderRadius: "12px",
              background: "#f8fafc",
              color: "#475569",
              fontSize: "0.92rem",
              lineHeight: 1.5
            }}>
              Post announcements, ask questions, or talk with everyone attending the fair.
            </div>
          )}
        </div>

        <div style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
          minHeight: "600px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "18px 22px",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc"
          }}>
            <h3 style={{ margin: 0, color: "#0f172a" }}>{pageTitle}</h3>
            <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "0.92rem" }}>
              Logged in as {currentUser?.name || currentUser?.email || "User"}
            </p>
          </div>

          {error && (
            <div style={{
              margin: "16px 16px 0",
              padding: "12px 14px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "10px",
              fontSize: "0.92rem"
            }}>
              {error}
            </div>
          )}

          <div style={{
            flex: 1,
            padding: "18px",
            overflowY: "auto",
            background: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            {loading ? (
              <div style={{ color: "#64748b" }}>Loading messages...</div>
            ) : messages.length === 0 ? (
              <div style={{ color: "#64748b" }}>
                {activeTab === "global"
                  ? "No global messages yet."
                  : selectedContact
                    ? "No personal messages yet."
                    : "Select a contact to start chatting."}
              </div>
            ) : (
              messages.map((message) => {
                const mine = String(message.senderId) === String(currentUser?.id);
                return (
                  <div
                    key={message.id}
                    style={{
                      alignSelf: mine ? "flex-end" : "flex-start",
                      maxWidth: "75%",
                      background: mine
                        ? "linear-gradient(90deg, #667eea 0%, #764ba2 100%)"
                        : "white",
                      color: mine ? "white" : "#0f172a",
                      borderRadius: "16px",
                      padding: "12px 14px",
                      boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)"
                    }}
                  >
                    <div style={{
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      marginBottom: "6px",
                      opacity: mine ? 0.9 : 0.75
                    }}>
                      {mine ? "You" : `${message.senderName} (${message.senderRole})`}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{message.content}</div>
                    <div style={{
                      marginTop: "6px",
                      fontSize: "0.75rem",
                      opacity: mine ? 0.8 : 0.6,
                      textAlign: "right"
                    }}>
                      {message.createdAt ? new Date(message.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={{
            padding: "16px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            gap: "12px",
            background: "white"
          }}>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={activeTab === "global" ? "Type a message for everyone..." : "Type a private message..."}
              disabled={activeTab === "personal" && !selectedContactId}
              style={{
                flex: 1,
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                fontSize: "0.95rem"
              }}
            />
            <button
              type="submit"
              disabled={sending || (activeTab === "personal" && !selectedContactId)}
              style={{
                padding: "12px 18px",
                border: "none",
                borderRadius: "12px",
                background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chat;
