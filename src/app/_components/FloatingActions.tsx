"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAppPreferences } from "./AppPreferencesProvider";
import { siteCopy } from "@/lib/siteCopy";

type Message = {
  role: "user" | "bot";
  text: string;
  timestamp: Date;
  id: string;
};

const MAX_INPUT_LENGTH = 400;

// Info-only quick replies — no order-taking flavour
const QUICK_REPLIES = [
  "What do you print?",
  "How does pricing work?",
  "What's the turnaround time?",
  "How do I place an order?",
];

// Client-side order-intent guard
// Matches the same patterns as the server, giving instant feedback without
// waiting for a round-trip.

const ORDER_INTENT_PATTERNS = [
  /\b(place|make|create|submit|send|start)\s+(an?\s+)?order\b/i,
  /\bi\s+want\s+to\s+order\b/i,
  /\bcan\s+i\s+order\b/i,
  /\border\s+(shirt|tshirt|t-shirt|jersey|hoodie|cap|hat|uniform|item|product)/i,
  /\bcancel\s+(my\s+)?order\b/i,
  /\bchange\s+my\s+order\b/i,
  /\bmodify\s+my\s+order\b/i,
  /\bwhere\s+is\s+my\s+order\b/i,
  /\bstatus\s+of\s+my\s+order\b/i,
  /\btrack\s+(my\s+)?order\b/i,
];

const ORDER_REDIRECT =
  "I can only answer general questions here. To place an order or check a specific order, please contact our team directly or visit our order page — they'll take care of you!";

function hasOrderIntent(text: string): boolean {
  return ORDER_INTENT_PATTERNS.some((p) => p.test(text));
}

// ─── Common FAQ answers (instant, no API call) ───────────────────────────────

const COMMON_ANSWERS = [
  {
    keywords: ["what do you print", "what do you offer", "what products", "what items", "what can you make"],
    answer:
      "We specialise in custom-printed garments and merchandise — t-shirts, jerseys, hoodies, caps, tote bags, and more. Got something specific in mind? Feel free to ask!",
  },
  {
    keywords: ["how does pricing work", "how is pricing", "how much does it cost", "price", "pricing", "cost", "how much", "rate"],
    answer:
      "Pricing depends on the item type, quantity, number of print colours, and design complexity. Generally, bigger quantities mean a lower unit cost. Contact our team for a custom quote!",
  },
  {
    keywords: ["turnaround", "how long", "delivery time", "when will", "how many days", "lead time"],
    answer:
      "Standard turnaround is around 5–7 business days after artwork approval, but rush options may be available. Exact timelines depend on order size.",
  },
  {
    keywords: ["how do i place", "how to order", "ordering process", "how to buy", "steps to order"],
    answer:
      "You can start an order by contacting our team through the order page or by reaching out directly. They'll guide you through design, size selection, and payment.",
  },
  {
    keywords: ["file format", "design format", "what format", "what file", "artwork", "design spec"],
    answer:
      "We accept AI, PDF, PNG, and high-res JPG files. Vector formats (AI/PDF) give the best print quality. Our team can also help with simple design adjustments.",
  },
  {
    keywords: ["contact", "support", "help", "agent", "talk to someone", "reach you"],
    answer:
      "You can reach our team through the contact page or leave your name and number here — we'll get back to you as soon as possible!",
  },
  {
    keywords: ["minimum order", "minimum quantity", "how many pieces", "bulk", "moq"],
    answer:
      "Minimum order quantities vary by product. Some items can be done as a single piece, while others have a minimum run. Ask our team for specifics on the item you need.",
  },
  {
    keywords: ["payment", "how to pay", "gcash", "bank transfer", "payment method"],
    answer:
      "We accept various payment methods. Our team will provide payment details once your order details are confirmed.",
  },
  {
    keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"],
    answer:
      "Hi there! 👋 I can answer general questions about JNJ Printing — like what we offer, pricing, turnaround times, and more. What would you like to know?",
  },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getCommonAnswer(text: string) {
  const lower = text.toLowerCase();
  return COMMON_ANSWERS.find((item) =>
    item.keywords.some((keyword) => {
      const pattern = new RegExp(`${escapeRegExp(keyword.toLowerCase())}`);
      return pattern.test(lower);
    })
  )?.answer;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function createBotMessage(text: string): Message {
  return {
    role: "bot",
    text,
    timestamp: new Date(),
    id: generateId(),
  };
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-[var(--surface-soft)] px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export default function FloatingActions() {
  const { language, theme, toggleLanguage, toggleTheme } = useAppPreferences();
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    createBotMessage(
      "Hi! 👋 I can answer general questions about JNJ Printing — what we offer, pricing, turnaround times, and more. For placing or tracking orders, please contact our team directly."
    ),
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatOpenRef = useRef(chatOpen);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  const copy = siteCopy.navbar[language];
  const isDark = theme === "dark";
  const themeLabel = isDark
    ? language === "fil"
      ? "Liwanag"
      : "Light mode"
    : language === "fil"
    ? "Madilim"
    : "Dark mode";

  const charsLeft = MAX_INPUT_LENGTH - input.length;
  const isOverLimit = charsLeft < 0;
  const isNearLimit = charsLeft <= 40 && !isOverLimit;

  useEffect(() => {
    if (!chatOpen) return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [chatOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  function handleChatbot() {
    setChatOpen((prev) => !prev);
    if (open) setOpen(false);
    setUnreadCount(0);
  }

  const addBotMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, createBotMessage(text)]);

    if (!chatOpenRef.current) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending || trimmed.length > MAX_INPUT_LENGTH) return;

      setHasError(false);

      const userMessage: Message = {
        role: "user",
        text: trimmed,
        timestamp: new Date(),
        id: generateId(),
      };
      const nextHistory = [...messages, userMessage];

      setMessages(nextHistory);
      setInput("");
      setIsSending(true);

      // ── Client-side order-intent guard (instant response) ──
      if (hasOrderIntent(trimmed)) {
        await new Promise((r) => setTimeout(r, 400));
        addBotMessage(ORDER_REDIRECT);
        setIsSending(false);
        return;
      }

      // ── Local FAQ shortcut ──
      const commonAnswer = getCommonAnswer(trimmed);
      if (commonAnswer) {
        await new Promise((r) => setTimeout(r, 600));
        addBotMessage(commonAnswer);
        setIsSending(false);
        return;
      }

      // ── Hit the API for everything else ──
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: nextHistory.slice(-8),
          }),
        });

        if (!res.ok) {
          if (res.status === 429) throw new Error("rate_limit");
          throw new Error("api_error");
        }

        const data = await res.json();

        addBotMessage(
          data.reply ||
            "Thanks for your question! Our team will get back to you shortly."
        );
      } catch (error: unknown) {
        setHasError(true);
        const isRateLimit =
          error instanceof Error && error.message === "rate_limit";
        addBotMessage(
          isRateLimit
            ? "You're sending messages too quickly. Please wait a moment before trying again."
            : "Sorry, I couldn't connect right now. Please try again or contact our team directly."
        );
      } finally {
        setIsSending(false);
      }
    },
    [messages, isSending, addBotMessage]
  );

  function handleRetry() {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      setMessages((prev) => prev.slice(0, -1));
      sendMessage(lastUserMsg.text);
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Chat window */}
      {chatOpen && (
        <div
          className="fixed bottom-28 right-6 z-50 flex w-[340px] flex-col rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(13,13,20,0.22)]"
          style={{ maxHeight: "520px" }}
        >
          {/* Chat header */}
          <div className="flex items-center gap-3 rounded-t-[24px] border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--purple2)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--text)]">JNJ Support</p>
              <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                General inquiries only
              </p>
            </div>

            {/* Clear chat */}
            <button
              type="button"
              onClick={() => {
                setMessages([
                  createBotMessage(
                    "Hi! 👋 I can answer general questions about JNJ Printing — what we offer, pricing, turnaround times, and more. For placing or tracking orders, please contact our team directly."
                  ),
                ]);
                setHasError(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--cream)] text-[var(--muted)] transition hover:bg-[var(--border)] hover:text-[var(--text)]"
              aria-label="Clear chat history"
              title="Clear chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--cream)] text-[var(--muted)] transition hover:bg-[var(--border)] hover:text-[var(--text)]"
              aria-label="Close chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            style={{ maxHeight: "300px" }}
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {messages.map((msg, i) => {
              const showTimestamp =
                i === 0 ||
                Math.abs(
                  msg.timestamp.getTime() - messages[i - 1].timestamp.getTime()
                ) > 60_000;

              return (
                <div key={msg.id}>
                  {showTimestamp && (
                    <p className="mb-1 text-center text-[10px] text-[var(--muted)]">
                      {formatTime(msg.timestamp)}
                    </p>
                  )}
                  <div
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <p
                      className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "rounded-br-sm bg-[var(--purple2)] text-white"
                          : "rounded-bl-sm bg-[var(--surface-soft)] text-[var(--text)]"
                      }`}
                    >
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })}

            {isSending && <TypingIndicator />}

            {hasError && !isSending && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--cream)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--purple)] hover:text-[var(--purple)]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Retry
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick replies — shown only before the user has sent anything */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2 pt-1">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => sendMessage(reply)}
                  disabled={isSending}
                  className="rounded-full border border-[var(--border)] bg-[var(--cream)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--purple)] hover:text-[var(--purple)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSending && !isOverLimit) {
                    sendMessage(input);
                  }
                }}
                placeholder={isSending ? "Bot is replying…" : "Ask a question…"}
                maxLength={MAX_INPUT_LENGTH + 10}
                disabled={isSending}
                className="flex-1 rounded-full border border-[var(--border)] bg-[var(--cream)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--purple)] focus:ring-2 focus:ring-[var(--purple)]/20 disabled:opacity-60"
                aria-label="Chat input"
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isSending || isOverLimit}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--purple2)] text-white transition hover:bg-[var(--purple)] disabled:opacity-40"
                aria-label="Send message"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </div>
            {(isNearLimit || isOverLimit) && (
              <p
                className={`mt-1.5 text-right text-[11px] font-medium ${
                  isOverLimit ? "text-red-500" : "text-[var(--muted)]"
                }`}
              >
                {isOverLimit ? `${Math.abs(charsLeft)} over limit` : `${charsLeft} left`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* FAB stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <div
          className={`flex flex-col items-end gap-3 transition-all duration-200 ${
            open
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          }`}
          aria-hidden={!open}
        >
          {/* Dark / Light mode */}
          <ActionItem
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isDark ? (
                  <>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </>
                ) : (
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                )}
              </svg>
            }
            label={themeLabel}
            onClick={toggleTheme}
          />

          {/* Translate */}
          <ActionItem
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            }
            label={copy.translate}
            onClick={toggleLanguage}
          />

          {/* Chat */}
          <ActionItem
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
            label="Ask a question"
            onClick={handleChatbot}
            active={chatOpen}
          />
        </div>

        {/* Main FAB */}
        <button
          type="button"
          onClick={() => {
            setOpen((prev) => !prev);
            if (chatOpen) setChatOpen(false);
          }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--purple2)] text-white shadow-[0_8px_32px_rgba(75,0,110,0.35)] transition hover:scale-110 hover:bg-[var(--purple)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--purple)] focus-visible:ring-offset-2"
          aria-label={open ? "Close menu" : "Open quick actions"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${
              open ? "rotate-90" : "rotate-0"
            }`}
          >
            <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82V22a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.82-.33H2a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1.82V2a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.35.35.67.6 1a1.65 1.65 0 0 0 1.82.33H22a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z" />
          </svg>

          {unreadCount > 0 && !chatOpen && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
}

function ActionItem({
  icon,
  label,
  onClick,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-md transition hover:scale-[1.03] ${
        active
          ? "border-[var(--purple)] bg-[var(--purple2)] text-white"
          : "bg-[var(--surface)] text-[var(--text)] hover:border-[var(--purple)] hover:text-[var(--purple)]"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
          active
            ? "bg-white/20"
            : "bg-[var(--cream)] group-hover:bg-[var(--purple2)]/10"
        }`}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}