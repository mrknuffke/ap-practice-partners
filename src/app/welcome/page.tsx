"use client";

import { useRouter } from "next/navigation";
import { GraduationCap, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { storageSet } from "@/lib/utils";

export default function WelcomePage() {
  const router = useRouter();

  const choose = (role: "educator" | "student") => {
    storageSet("app:role", role);
    if (role === "educator") {
      router.push("/educator-training");
    } else {
      router.push("/student-orientation");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center justify-center px-4 relative">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[160px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[160px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-xl"
      >
        <div className="text-center mb-10">
          <p className="font-heading italic text-primary text-lg font-semibold mb-2">AP Practice Partners</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Welcome. Who are you?</h1>
          <p className="text-muted-foreground leading-relaxed">
            We&rsquo;ll give you the right introduction based on how you plan to use this tool.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            onClick={() => choose("educator")}
            className="group text-left border border-border rounded-2xl p-6 bg-card/50 hover:bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl border border-primary/20 bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <p className="font-semibold text-foreground text-lg mb-2">I&rsquo;m an Educator</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Teacher, department head, or administrator. You&rsquo;ll go through a short training on how the tool works and how to deploy it responsibly with students.
            </p>
            <p className="text-xs text-primary font-medium mt-4">Training module → ~5 min</p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            onClick={() => choose("student")}
            className="group text-left border border-border rounded-2xl p-6 bg-card/50 hover:bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl border border-primary/20 bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <p className="font-semibold text-foreground text-lg mb-2">I&rsquo;m a Student</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AP student here to practice. You&rsquo;ll get a quick orientation on how to use the tool well before reaching your courses.
            </p>
            <p className="text-xs text-primary font-medium mt-4">Orientation → ~90 sec</p>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
