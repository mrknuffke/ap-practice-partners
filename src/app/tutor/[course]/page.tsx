"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Send, ArrowLeft, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { COURSE_BY_SLUG } from "@/constants/courses";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function TutorPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const courseSlug = typeof params?.course === "string" ? params.course : "";
  const physicsCExam = searchParams?.get("exam") ?? null; // "mechanics" | "em" | null

  const entry = COURSE_BY_SLUG[courseSlug];

  // Resolve display name
  let courseName: string;
  if (entry?.isPhysicsC && physicsCExam === 'em') {
    courseName = 'AP Physics C: Electricity & Magnetism';
  } else if (entry?.isPhysicsC && physicsCExam === 'mechanics') {
    courseName = 'AP Physics C: Mechanics';
  } else if (entry?.isPhysicsC) {
    courseName = 'AP Physics C';
  } else {
    courseName = entry?.displayName ?? courseSlug;
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const greetingFired = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (
    currentMessages: Message[],
    newMessage?: { id: string; role: "user" | "assistant"; content: string }
  ) => {
    const allMessages = newMessage ? [...currentMessages, newMessage] : currentMessages;
    if (newMessage) setMessages(allMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-classroom-code": localStorage.getItem("classroom_code") || "",
        },
        body: JSON.stringify({
          slug: courseSlug,
          physicsCExam: physicsCExam,
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      const assistantMsg: Message = { id: Date.now().toString(), role: "assistant", content: "" };
      setMessages(prev => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
        });
      }
    } catch (err: unknown) {
      console.error(err);
      const errorText = err instanceof Error ? err.message : "Unknown error";
      const isUnauth = errorText === "Unauthorized";
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: isUnauth
            ? "❌ Invalid classroom code. Please refresh and try again."
            : "Sorry, I ran into an error connecting to the AI. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [courseSlug, physicsCExam]);

  // Fire initial AI greeting on mount (ref guards against React Strict Mode double-invoke)
  useEffect(() => {
    if (greetingFired.current) return;
    greetingFired.current = true;
    sendMessage([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setInput("");
    await sendMessage(messages, userMsg);
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 font-sans text-neutral-100 overflow-hidden relative">
      <div className="absolute top-0 left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/8 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="flex-none p-4 z-10 bg-neutral-900/50 backdrop-blur-md border-b border-neutral-800 flex items-center shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/")}
          className="text-neutral-400 hover:text-white mr-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-lg text-white drop-shadow-md">{courseName} Tutor</h1>
          <p className="text-xs text-neutral-400 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            Strictly aligned with official College Board CED
          </p>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 z-10 w-full max-w-4xl mx-auto">
        <div className="flex flex-col gap-6 pb-24">
          <AnimatePresence initial={false}>
            {/* Initial loading state before first AI message */}
            {messages.length === 0 && isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500/20 animate-pulse" />
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin relative z-10" />
                </div>
                <div className="px-5 py-3 rounded-2xl bg-neutral-800/80 backdrop-blur-sm border border-neutral-700/50 text-neutral-400 rounded-bl-sm flex items-center shadow-md">
                  <span className="flex gap-1">
                    <span className="animate-bounce inline-block">.</span>
                    <span className="animate-bounce inline-block" style={{ animationDelay: "0.2s" }}>.</span>
                    <span className="animate-bounce inline-block" style={{ animationDelay: "0.4s" }}>.</span>
                  </span>
                </div>
              </motion.div>
            )}

            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={"flex gap-4 " + (message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 mt-1 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/20 animate-pulse" />
                    <Bot className="w-4 h-4 text-blue-400 relative z-10" />
                  </div>
                )}

                <div className={"px-5 py-4 rounded-2xl max-w-[85%] shadow-xl " + (
                  message.role === "user"
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm border border-blue-500/50"
                    : "bg-neutral-800/80 backdrop-blur-md border border-neutral-700/50 text-neutral-200 rounded-bl-sm"
                )}>
                  <div className={"prose prose-invert prose-p:leading-relaxed prose-pre:bg-neutral-900/50 prose-pre:border prose-pre:border-neutral-800 max-w-none " + (message.role === "user" ? "prose-p:text-white" : "")}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content || (isLoading && message.role === "assistant" ? "▋" : "")}
                    </ReactMarkdown>
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 mt-1 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 shadow-lg border border-neutral-600">
                    <User className="w-4 h-4 text-neutral-300" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Loading indicator while waiting for response (after initial greeting) */}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500/20 animate-pulse" />
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin relative z-10" />
                </div>
                <div className="px-5 py-3 rounded-2xl max-w-[85%] bg-neutral-800/80 backdrop-blur-sm border border-neutral-700/50 text-neutral-400 rounded-bl-sm flex items-center shadow-md">
                  <span className="flex gap-1">
                    <span className="animate-bounce inline-block">.</span>
                    <span className="animate-bounce inline-block" style={{ animationDelay: "0.2s" }}>.</span>
                    <span className="animate-bounce inline-block" style={{ animationDelay: "0.4s" }}>.</span>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex-none p-4 z-10 bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-800 w-full relative">
        <div className="absolute inset-x-0 top-[-20px] h-5 bg-gradient-to-t from-neutral-900/80 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative group">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Ask about ${courseName}...`}
              disabled={isLoading && messages.length === 0}
              className="flex-1 bg-neutral-950/80 border-neutral-700 h-14 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 text-base px-6 shadow-inner transition-all hover:border-neutral-600"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-14 w-14 rounded-2xl bg-blue-600 hover:bg-blue-500 shadow-xl disabled:bg-neutral-800 disabled:text-neutral-500 group-focus-within:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-6 h-6" />
            </Button>
          </form>
          <div className="text-center mt-3">
            <span className="text-xs text-neutral-500 font-medium tracking-wide">
              AI can make mistakes. Verify critical concepts with the official CED.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Suspense wrapper required for useSearchParams in Next.js App Router
export default function TutorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-neutral-950 text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    }>
      <TutorPageInner />
    </Suspense>
  );
}
