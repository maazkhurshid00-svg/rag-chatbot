import { useState, useRef, useEffect } from "react"
import axios from "axios"

const API = "http://127.0.0.1:8000"

export default function App() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hello! Upload a PDF and I'll answer any questions about it.", sources: [] }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileNames, setFileNames] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const bottomRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleFile(file) {
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a PDF file.")
      return
    }
    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    try {
      await axios.post(`${API}/upload`, form)
      setFileNames(f => [...new Set([...f, file.name])])
      setMessages(m => [...m, {
        role: "ai",
        text: `✓ "${file.name}" indexed successfully. Ask me anything about it.`,
        sources: []
      }])
    } catch {
      setMessages(m => [...m, {
        role: "ai",
        text: "Upload failed. Is the backend running?",
        sources: []
      }])
    }
    setUploading(false)
  }

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    setMessages(m => [...m, { role: "user", text: q, sources: [] }])
    setInput("")
    setLoading(true)
    try {
      const { data } = await axios.post(`${API}/query`, { question: q })
      setMessages(m => [...m, {
        role: "ai",
        text: data.answer,
        sources: data.sources || []
      }])
    } catch {
      setMessages(m => [...m, {
        role: "ai",
        text: "Something went wrong. Try again.",
        sources: []
      }])
    }
    setLoading(false)
  }

  function clearChat() {
    setMessages([{
      role: "ai",
      text: "Chat cleared. Ask me anything about your PDF.",
      sources: []
    }])
  }

  const Avatar = ({ role }) => (
    <div style={{
      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
      background: role === "user"
        ? "linear-gradient(135deg, #6c63ff, #3ecfcf)"
        : "#1e1e26",
      border: "1px solid #2a2a35",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 700,
      color: role === "user" ? "#fff" : "#6c63ff",
      letterSpacing: "0.5px"
    }}>
      {role === "user" ? "U" : "AI"}
    </div>
  )

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "#0a0a0f", color: "#e8e8e8",
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 28px",
        borderBottom: "1px solid #16161e",
        background: "rgba(10,10,15,0.95)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: "linear-gradient(135deg, #6c63ff 0%, #3ecfcf 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 0 20px rgba(108,99,255,0.4)"
          }}>📄</div>
          <div>
            <div style={{
              fontWeight: 700, fontSize: 15, color: "#fff",
              letterSpacing: "-0.4px"
            }}>PDF Chat</div>
            <div style={{ fontSize: 11, color: "#444", marginTop: 1 }}>
              Groq · LangChain · FAISS
            </div>
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center",
          gap: 8, flexWrap: "wrap", justifyContent: "flex-end"
        }}>
          {fileNames.map((name, i) => (
            <span key={i} style={{
              fontSize: 11, padding: "4px 12px", borderRadius: 20,
              background: "rgba(108,99,255,0.1)",
              color: "#8b83ff",
              border: "1px solid rgba(108,99,255,0.25)",
              fontWeight: 500
            }}>📎 {name}</span>
          ))}
          {fileNames.length > 0 && (
            <button
              onClick={clearChat}
              style={{
                fontSize: 11, padding: "4px 12px", borderRadius: 20,
                background: "transparent", color: "#444",
                border: "1px solid #222", cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => {
                e.target.style.color = "#ff6b6b"
                e.target.style.borderColor = "rgba(255,107,107,0.4)"
              }}
              onMouseLeave={e => {
                e.target.style.color = "#444"
                e.target.style.borderColor = "#222"
              }}
            >✕ Clear</button>
          )}
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          handleFile(e.dataTransfer.files[0])
        }}
        style={{
          margin: "16px 28px 0",
          border: `1.5px dashed ${dragOver ? "#6c63ff" : "#1e1e26"}`,
          borderRadius: 14, padding: "18px 24px",
          textAlign: "center", cursor: "pointer",
          transition: "all 0.25s",
          background: dragOver
            ? "rgba(108,99,255,0.08)"
            : "rgba(255,255,255,0.015)",
          boxShadow: dragOver ? "0 0 30px rgba(108,99,255,0.1)" : "none"
        }}
      >
        <input
          ref={fileRef} type="file" accept=".pdf"
          style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])}
        />
        {uploading ? (
          <div style={{
            color: "#6c63ff", fontSize: 13, fontWeight: 500,
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8
          }}>
            <div style={{
              width: 14, height: 14, border: "2px solid #6c63ff",
              borderTopColor: "transparent", borderRadius: "50%",
              animation: "spin 0.8s linear infinite"
            }} />
            Indexing your PDF...
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: "#555" }}>
              Drop a PDF here or{" "}
              <span style={{ color: "#6c63ff", fontWeight: 600 }}>
                click to browse
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#333", marginTop: 4 }}>
              {fileNames.length > 0
                ? `${fileNames.length} file(s) indexed · add more anytime`
                : "PDF files only · powered by semantic search"}
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "20px 28px",
        display: "flex", flexDirection: "column", gap: 20
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            flexDirection: "column",
            alignItems: m.role === "user" ? "flex-end" : "flex-start"
          }}>
            <div style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              flexDirection: m.role === "user" ? "row-reverse" : "row"
            }}>
              <Avatar role={m.role} />

              <div style={{
                maxWidth: "68%",
                padding: "13px 17px",
                borderRadius: 18,
                borderBottomRightRadius: m.role === "user" ? 4 : 18,
                borderBottomLeftRadius: m.role === "ai" ? 4 : 18,
                background: m.role === "user"
                  ? "linear-gradient(135deg, #6c63ff 0%, #5a54e8 100%)"
                  : "#13131a",
                border: m.role === "ai" ? "1px solid #1e1e28" : "none",
                fontSize: 13.5, lineHeight: 1.75,
                color: m.role === "user" ? "#fff" : "#c8c8d8",
                boxShadow: m.role === "user"
                  ? "0 6px 24px rgba(108,99,255,0.3)"
                  : "0 2px 12px rgba(0,0,0,0.3)"
              }}>
                {m.text}
              </div>
            </div>

            {/* Citations */}
            {m.sources && m.sources.length > 0 && (
              <div style={{
                display: "flex", gap: 6, marginTop: 8,
                flexWrap: "wrap",
                paddingLeft: m.role === "ai" ? 40 : 0,
                paddingRight: m.role === "user" ? 40 : 0
              }}>
                {m.sources.map((s, j) => (
                  <span key={j} style={{
                    fontSize: 10.5, padding: "3px 10px", borderRadius: 20,
                    background: "rgba(180,150,50,0.08)",
                    color: "#c8a84b",
                    border: "1px solid rgba(180,150,50,0.2)",
                    fontWeight: 500
                  }}>
                    📄 {s.file} · p.{s.page}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 10
          }}>
            <Avatar role="ai" />
            <div style={{
              padding: "14px 18px", borderRadius: 18,
              borderBottomLeftRadius: 4,
              background: "#13131a",
              border: "1px solid #1e1e28",
              display: "flex", gap: 5, alignItems: "center"
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#6c63ff",
                  animation: "bounce 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div style={{
        padding: "14px 28px 20px",
        borderTop: "1px solid #16161e",
        background: "rgba(10,10,15,0.98)",
        backdropFilter: "blur(12px)"
      }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            disabled={loading}
            placeholder="Ask anything about your PDF..."
            style={{
              flex: 1, padding: "13px 18px",
              borderRadius: 14,
              border: "1px solid #1e1e28",
              background: "#13131a",
              color: "#e8e8e8",
              fontSize: 13.5, outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s"
            }}
            onFocus={e => {
              e.target.style.borderColor = "#6c63ff"
              e.target.style.boxShadow = "0 0 0 3px rgba(108,99,255,0.1)"
            }}
            onBlur={e => {
              e.target.style.borderColor = "#1e1e28"
              e.target.style.boxShadow = "none"
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              padding: "13px 22px", borderRadius: 14,
              border: "none",
              background: loading || !input.trim()
                ? "#16161e"
                : "linear-gradient(135deg, #6c63ff 0%, #3ecfcf 100%)",
              color: loading || !input.trim() ? "#333" : "#fff",
              fontSize: 13, fontWeight: 600,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              transition: "all 0.2s", whiteSpace: "nowrap",
              boxShadow: loading || !input.trim()
                ? "none"
                : "0 4px 16px rgba(108,99,255,0.35)"
            }}
          >
            {loading ? "···" : "Send ↑"}
          </button>
        </div>
        <div style={{
          fontSize: 11, color: "#2a2a35",
          textAlign: "center", marginTop: 10
        }}>
          Semantic search · Source citations · Powered by LLaMA 3.3 · 70B
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a35; border-radius: 4px; }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
          30% { transform: translateY(-7px); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}