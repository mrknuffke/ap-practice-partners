import { signOut } from "next-auth/react";
import { storageClear } from "@/lib/utils";

// The preferred name is per person, not per device: clearing it means the next
// student on a shared computer gets the name prompt instead of the last name.
// Role, orientation progress and session history stay.
export function signOutAndForgetName() {
  storageClear("student_name");
  return signOut({ callbackUrl: "/" });
}
