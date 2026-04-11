"use client";
import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

export default function Mermaid({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState("");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "default",
      securityLevel: "loose",
      fontFamily: "inherit",
    });
    
    let isMounted = true;
    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) setSvg(svg);
      } catch (e) {
        console.error("Mermaid rendering failed", e);
        if (isMounted) setSvg(`<div class='text-red-500 text-sm mb-2 font-semibold flex items-center gap-2'><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Diagram failed to render</div><pre class='text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-background p-2 border border-border/50 rounded'>${chart.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`);
      }
    };
    if (chart) renderChart();
    return () => { isMounted = false; };
  }, [chart]);

  return (
    <div 
      ref={containerRef} 
      dangerouslySetInnerHTML={{ __html: svg }} 
      className="my-6 w-full rounded-xl bg-card border border-border p-4 flex justify-center items-center overflow-x-auto shadow-inner" 
    />
  );
}
