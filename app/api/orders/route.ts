// Example: Server-side check inside app/api/orders/route.ts
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Missing authorization token" }, { status: 401 });
  }

  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(token);

  // Enforce server-side role security
  if (decodedToken.role !== "cutting_supervisor") {
    return Response.json({ error: "Forbidden: Incorrect role" }, { status: 403 }); //
  }

  // Proceed with authorized operation...
}