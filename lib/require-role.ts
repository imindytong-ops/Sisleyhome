import { NextResponse } from "next/server";
import { getSession, Role } from "@/lib/auth";

export async function requireRole(allowed: Role[]) {
  const session = await getSession();
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }
  if (!allowed.includes(session.role)) {
    return {
      session: null,
      error: NextResponse.json({ error: "无权限执行此操作" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
