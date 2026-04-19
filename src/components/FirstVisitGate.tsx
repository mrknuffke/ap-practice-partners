"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { storageGet } from "@/lib/utils";

const BYPASS_PATHS = [
  "/welcome",
  "/educator-training",
  "/student-orientation",
  "/educator-guide",
  "/tutorial",
  "/about",
  "/feedback",
  "/settings",
  "/progress",
];

export function FirstVisitGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);

  // Routing check — runs on every pathname change
  useEffect(() => {
    const role = storageGet("app:role");
    const educatorDone = storageGet("app:educator-training-complete");
    const studentDone = storageGet("app:student-orientation-complete");

    const isBypass = BYPASS_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (!role) {
      if (!isBypass) router.replace("/welcome");
    } else if (role === "educator" && educatorDone !== "true") {
      if (!isBypass) router.replace("/educator-training");
    } else if (role === "student" && studentDone !== "true") {
      if (!isBypass) router.replace("/student-orientation");
    }
  }, [pathname, router]);

  // Hydration flag — runs once on mount to prevent SSR flash
  useEffect(() => {
    const timer = setTimeout(() => setHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!hydrated) return null;

  return <>{children}</>;
}
