"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "./ui/button";

interface SpeechResultAlternative { transcript: string }
interface SpeechResult {
  [index: number]: SpeechResultAlternative;
  isFinal: boolean;
  length: number;
}
interface SpeechRecognitionEvent {
  results: { [index: number]: SpeechResult; length: number };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
  variant?: "chat" | "icon";
}

export function VoiceInput({ onTranscript, className }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const manuallyStoppedRef = useRef(false);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const w = window as WindowWithSpeech;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Emit only newly-finalized chunks from this event.
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalChunk += result[0].transcript;
      }
      if (finalChunk.trim()) onTranscriptRef.current(finalChunk.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" and "aborted" are normal during pauses; don't spam console.
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech recognition error", event.error);
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        manuallyStoppedRef.current = true;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart while the user is still in "listening" mode (they haven't clicked stop).
      if (!manuallyStoppedRef.current) {
        try { recognition.start(); } catch { /* already started */ }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      manuallyStoppedRef.current = true;
      try { recognition.stop(); } catch { /* ignore */ }
    };
  }, []);

  const isSupported = typeof window !== "undefined" && !!(
    (window as WindowWithSpeech).SpeechRecognition ?? (window as WindowWithSpeech).webkitSpeechRecognition
  );

  if (!isSupported) return null;

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      manuallyStoppedRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      manuallyStoppedRef.current = false;
      setIsListening(true);
      try { recognitionRef.current.start(); } catch { /* already started */ }
    }
  };

  return (
    <Button
      type="button"
      onClick={toggleListening}
      variant="ghost"
      className={`${className} ${isListening ? "text-red-500 animate-pulse" : "text-muted-foreground"} hover:bg-secondary/50 rounded-full transition-all`}
      size="icon"
      title={isListening ? "Listening… click to stop" : "Click to dictate"}
    >
      {isListening ? (
        <Mic className="w-5 h-5" />
      ) : (
        <MicOff className="w-5 h-5" />
      )}
    </Button>
  );
}
