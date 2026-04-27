import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const USER_ID = "user-1";

export async function GET() {
  try {
    const badges = await db.badge.findMany({
      where: { userId: USER_ID },
      orderBy: { earnedAt: "desc" },
    });

    return NextResponse.json(badges);
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const badge = await db.badge.upsert({
      where: {
        userId_type: {
          userId: USER_ID,
          type: body.type,
        },
      },
      update: {
        name: body.name,
        description: body.description,
        icon: body.icon || "🏆",
        earnedAt: new Date(),
      },
      create: {
        userId: USER_ID,
        type: body.type,
        name: body.name,
        description: body.description,
        icon: body.icon || "🏆",
      },
    });

    // Award points to user
    await db.user.update({
      where: { id: USER_ID },
      data: { points: { increment: body.points || 10 } },
    });

    return NextResponse.json(badge, { status: 201 });
  } catch (error) {
    console.error("Error awarding badge:", error);
    return NextResponse.json({ error: "Failed to award badge" }, { status: 500 });
  }
}
