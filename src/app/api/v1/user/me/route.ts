import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ user });
}
