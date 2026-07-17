import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getUser } from "@/lib/auth";

export async function GET() {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = JSON.stringify({ id: me.id, name: me.name, email: me.email });
  const qr = await QRCode.toDataURL(data, { width: 300, margin: 2 });

  return NextResponse.json({ qr, user: { id: me.id, name: me.name } });
}
