"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, BookOpen } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [courseQuery, setCourseQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (courseQuery.trim()) {
      // In a real implementation, we'd fuzzy match this to an actual course ID 
      // For now, simple slugification
      const slug = courseQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      router.push(`/tutor/${slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center relative overflow-hidden font-sans text-neutral-100">
      
      {/* Background ambient gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />

      <main className="z-10 w-full max-w-2xl px-6 flex flex-col items-center text-center">
        
        <div className="mb-4 inline-flex items-center justify-center p-3 bg-neutral-900/50 border border-neutral-800 rounded-2xl shadow-2xl backdrop-blur-md">
          <BookOpen className="w-8 h-8 text-blue-400" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-400">
          AP Review Tutors
        </h1>
        <p className="text-lg md:text-xl text-neutral-400 mb-12 max-w-lg">
          Master any AP course with a highly-capable AI tutor, strictly aligned with official College Board frameworks.
        </p>

        <form onSubmit={handleSubmit} className="w-full relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-500 group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input
            type="text"
            value={courseQuery}
            onChange={(e) => setCourseQuery(e.target.value)}
            placeholder="What are we studying today? (e.g., Biology)"
            className="w-full bg-neutral-900/60 border border-neutral-800 rounded-full py-4 pl-12 pr-12 text-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-xl transition-all shadow-xl"
            autoFocus
          />
          <button
            type="submit"
            disabled={!courseQuery.trim()}
            className="absolute inset-y-2 right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {["AP Biology", "AP Chemistry", "AP Physics 1", "AP US History", "AP Calculus AB"].map(course => (
            <button 
              key={course}
              onClick={() => {
                setCourseQuery(course);
                const slug = course.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                router.push(`/tutor/${slug}`);
              }}
              className="px-4 py-2 rounded-full border border-neutral-800 bg-neutral-900/30 text-sm text-neutral-400 hover:text-white hover:border-neutral-600 transition-all backdrop-blur-sm"
            >
              {course}
            </button>
          ))}
        </div>

      </main>
    </div>
  );
}
