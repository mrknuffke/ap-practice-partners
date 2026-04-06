"use client";
import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

export default function Mermaid({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState("");

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
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
        if (isMounted) setSvg("<div class='text-red-400 text-sm'>Failed to render diagram</div>");
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
