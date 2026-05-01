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
    <main className="chat-page page-shell">
      <section className="chat-hero">
        <div>
          <span className="chat-kicker">Messages</span>
          <h1>Chat Center</h1>
          <p>Use global chat for everyone, or personal chat for one-to-one conversations.</p>
        </div>
        <div className="chat-hero-user">
          <span>Signed in as</span>
          <strong>{currentUser?.name || currentUser?.email || "User"}</strong>
        </div>
      </section>

      <section className="chat-layout">
        <aside className="chat-sidebar" aria-label="Chat navigation">
          <div className="chat-tabs" role="tablist" aria-label="Chat type">
            <button
              type="button"
              onClick={() => setActiveTab("global")}
              className={`chat-tab${activeTab === "global" ? " is-active" : ""}`}
            >
              Global
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className={`chat-tab${activeTab === "personal" ? " is-active" : ""}`}
            >
              Personal
            </button>
          </div>

          <p className="chat-sidebar-note">
            {activeTab === "global"
              ? "Everyone can read and send messages here."
              : "Choose a person to start a private chat."}
          </p>

          {activeTab === "personal" && (
            <div className="chat-contacts">
              {contacts.length === 0 && (
                <div className="chat-empty-mini">No contacts available.</div>
              )}
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => setSelectedContactId(String(contact.id))}
                  className={`chat-contact${String(contact.id) === String(selectedContactId) ? " is-selected" : ""}`}
                >
                  <span className="chat-contact-avatar">
                    {(contact.name || contact.email || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="chat-contact-main">
                    <strong>{contact.name}</strong>
                    <small>{contact.role} · {contact.email}</small>
                  </span>
                </button>
              ))}
            </div>
          )}

          {activeTab === "global" && (
            <div className="chat-info-card">
              <strong>Global room</strong>
              <span>Post announcements, ask questions, or talk with everyone attending the fair.</span>
            </div>
          )}
        </aside>

        <section className="chat-panel" aria-label={pageTitle}>
          <header className="chat-panel-header">
            <div>
              <h2>{pageTitle}</h2>
              <p>
                {activeTab === "global"
                  ? "Shared room for all fair participants"
                  : selectedContact
                    ? `${selectedContact.role} · ${selectedContact.email}`
                    : "Select a contact to start chatting"}
              </p>
            </div>
            <span className="chat-status-pill">{activeTab === "global" ? "Public" : "Private"}</span>
          </header>

          {error && (
            <div className="chat-alert" role="alert">
              {error}
            </div>
          )}

          <div className="chat-messages" aria-live="polite">
            {loading ? (
              <div className="chat-state">
                <div className="chat-loader" aria-hidden="true" />
                <span>Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="chat-state">
                <strong>
                  {activeTab === "global"
                    ? "No global messages yet"
                    : selectedContact
                      ? "No personal messages yet"
                      : "Select a contact to start chatting"}
                </strong>
                <span>
                  {activeTab === "global"
                    ? "Start the conversation with a helpful update or question."
                    : selectedContact
                      ? "Send the first private message when you are ready."
                      : "Your private conversation will appear here."}
                </span>
              </div>
            ) : (
              messages.map((message) => {
                const mine = String(message.senderId) === String(currentUser?.id);
                return (
                  <article
                    key={message.id}
                    className={`chat-message${mine ? " is-mine" : ""}`}
                  >
                    <div className="chat-message-meta">
                      {mine ? "You" : `${message.senderName} (${message.senderRole})`}
                    </div>
                    <div className="chat-message-content">{message.content}</div>
                    <time className="chat-message-time">
                      {message.createdAt ? new Date(message.createdAt).toLocaleString() : ""}
                    </time>
                  </article>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="chat-composer">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={activeTab === "global" ? "Type a message for everyone..." : "Type a private message..."}
              disabled={activeTab === "personal" && !selectedContactId}
            />
            <button
              type="submit"
              disabled={sending || (activeTab === "personal" && !selectedContactId)}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

export default Chat;
