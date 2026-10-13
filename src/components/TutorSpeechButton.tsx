"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";
import { useTutorSpeech } from "@/lib/useTutorSpeech";

interface TutorSpeechButtonProps {
  messageId: string;
  text: string;
  className?: string;
}

export function TutorSpeechButton({ messageId, text, className = "" }: TutorSpeechButtonProps) {
  const { activeId, isSpeaking, speak, stop } = useTutorSpeech();

  const isCurrentMessageSpeaking = isSpeaking && activeId === messageId;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentMessageSpeaking) {
      stop();
    } else {
      speak(messageId, text);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      aria-label={isCurrentMessageSpeaking ? "Stop reading aloud" : "Read response aloud"}
      title={isCurrentMessageSpeaking ? "Stop reading response" : "Read response aloud"}
      className={`h-7 px-2 text-xs gap-1.5 rounded-lg transition-all ${
        isCurrentMessageSpeaking
          ? "bg-primary/15 text-primary font-medium hover:bg-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-surface-high"
      } ${className}`}
    >
      {isCurrentMessageSpeaking ? (
        <>
          <div className="flex items-center gap-0.5 h-3">
            <span className="w-0.5 h-3 bg-primary rounded-full animate-[bounce_0.8s_infinite_100ms]" />
            <span className="w-0.5 h-2 bg-primary rounded-full animate-[bounce_0.8s_infinite_250ms]" />
            <span className="w-0.5 h-3.5 bg-primary rounded-full animate-[bounce_0.8s_infinite_400ms]" />
          </div>
          <VolumeX className="w-3.5 h-3.5 ml-0.5 opacity-70" />
        </>
      ) : (
        <Volume2 className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline text-[11px]">
        {isCurrentMessageSpeaking ? "Stop" : "Listen"}
      </span>
    </Button>
  );
}
