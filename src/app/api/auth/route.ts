import { type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const validCodes = (process.env.CLASSROOM_CODE || "").split(",").map(c => c.trim());

  if (!code || !validCodes.includes(code.trim())) {
    return Response.json({ valid: false }, { status: 401 });
  }

  return Response.json({ valid: true });
}
