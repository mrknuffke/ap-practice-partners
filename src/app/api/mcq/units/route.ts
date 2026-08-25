import { type NextRequest } from "next/server";
import { COURSE_BY_SLUG } from '@/constants/courses';
import { loadCedData } from "@/lib/ced";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  const examParam = req.nextUrl.searchParams.get("examParam");

  const entry = COURSE_BY_SLUG[slug];
  if (!entry) return new Response(`Unknown course slug: ${slug}`, { status: 400 });

  const cedData = loadCedData(entry, examParam);
  const units = (cedData?.units ?? []).map(u => ({ unitNumber: u.unitNumber, unitTitle: u.unitTitle }));

  return Response.json({ units });
}
