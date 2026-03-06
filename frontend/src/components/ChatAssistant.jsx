import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { useSelector } from "react-redux";

export default function ChatAssistant({ orderId, onClose }) {
  const { socket, userData } = useSelector((state) => state.user);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Join room + fetch history + suggestions
  useEffect(() => {
    if (!orderId || !socket) return;

    socket.emit("chat:joinRoom", { orderId });

    // Fetch history
    axios.get(`${serverUrl}/api/chat/history/${orderId}`, { withCredentials: true })
      .then((res) => { if (res.data.success) setMessages(res.data.chats); });

    // Fetch suggestions
    axios.get(`${serverUrl}/api/chat/suggestions?role=${userData.role}`, { withCredentials: true })
      .then((res) => { if (res.data.success) setSuggestions(res.data.suggestions); });

    // Listen for new messages
    socket.on("chat:newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.emit("chat:leaveRoom", { orderId });
      socket.off("chat:newMessage");
    };
  }, [orderId, socket]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setInput("");
    setLoading(true);
    try {
      await axios.post(`${serverUrl}/api/chat/send`, 
        { orderId, message: text }, 
        { withCredentials: true }
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBubbleStyle = (role) => {
    if (role === "ai") return "bg-orange-50 border border-orange-200 text-gray-700 self-center max-w-[85%] text-xs italic";
    if (role === userData.role) return "bg-[#ff4d2d] text-white self-end";
    return "bg-gray-100 text-gray-800 self-start";
  };

  return (
    <div className="fixed bottom-5 right-5 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-orange-100 flex flex-col z-50">
      {/* Header */}
      <div className="bg-[#ff4d2d] text-white px-4 py-3 rounded-t-2xl flex justify-between items-center">
        <div>
          <p className="font-semibold text-sm">🤖 Order Assistant</p>
          <p className="text-xs opacity-80">AI-powered support</p>
        </div>
        <button onClick={onClose} className="text-white text-lg font-bold">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-xs mt-4">
            Ask anything about your order!
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`rounded-xl px-3 py-2 text-sm max-w-[80%] ${getBubbleStyle(msg.senderRole)}`}>
            {msg.senderRole === "ai" && (
              <p className="text-[10px] text-orange-400 font-semibold mb-1">
                🤖 AI Assistant {msg.needsHandoff ? "(Connecting you...)" : ""}
              </p>
            )}
            {msg.message}
          </div>
        ))}
        {loading && (
          <div className="self-center text-xs text-gray-400 italic">AI is thinking...</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && messages.length < 2 && (
        <div className="px-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {suggestions.slice(0, 3).map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              className="shrink-0 bg-orange-50 border border-orange-200 text-orange-600 text-xs px-3 py-1 rounded-full hover:bg-orange-100 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        <button
          onClick={() => sendMessage(input)}
          className="bg-[#ff4d2d] text-white px-4 rounded-full text-sm hover:bg-[#e64528]"
        >
          Send
        </button>
      </div>
    </div>
  );
}