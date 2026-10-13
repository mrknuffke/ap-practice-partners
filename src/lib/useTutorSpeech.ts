"use client";

import { useState, useEffect, useCallback } from "react";
import {
  speechController,
  getAvailableVoices,
  getStoredAutoSpeak,
  setStoredAutoSpeak,
  getStoredVoiceURI,
  setStoredVoiceURI,
  getStoredRate,
  setStoredRate,
} from "./speechSynthesis";

export function useTutorSpeech() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeakState] = useState(() => getStoredAutoSpeak());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURIState] = useState<string | null>(() => getStoredVoiceURI());
  const [rate, setRateState] = useState(() => getStoredRate());

  useEffect(() => {
    // Sync speech controller state
    const unsubscribe = speechController.subscribe((id, speaking) => {
      setActiveId(id);
      setIsSpeaking(speaking);
    });

    // Load voices
    const loadVoices = () => {
      const v = getAvailableVoices();
      setVoices(v);
    };

    loadVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const speak = useCallback((id: string, text: string) => {
    speechController.speak(id, text, {
      voiceURI: selectedVoiceURI || undefined,
      rate,
    });
  }, [selectedVoiceURI, rate]);

  const stop = useCallback(() => {
    speechController.stop();
  }, []);

  const toggleAutoSpeak = useCallback(() => {
    setAutoSpeakState(prev => {
      const next = !prev;
      setStoredAutoSpeak(next);
      return next;
    });
  }, []);

  const selectVoice = useCallback((uri: string) => {
    setSelectedVoiceURIState(uri);
    setStoredVoiceURI(uri);
  }, []);

  const changeRate = useCallback((newRate: number) => {
    setRateState(newRate);
    setStoredRate(newRate);
  }, []);

  return {
    activeId,
    isSpeaking,
    autoSpeak,
    toggleAutoSpeak,
    voices,
    selectedVoiceURI,
    selectVoice,
    rate,
    changeRate,
    speak,
    stop,
  };
}
