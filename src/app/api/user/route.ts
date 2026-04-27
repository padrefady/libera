import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const USER_ID = "user-1";

export async function GET() {
  try {
    const user = await db.user.upsert({
      where: { id: USER_ID },
      update: {},
      create: {
        id: USER_ID,
        email: "user@example.com",
        name: "User",
      },
      include: {
        badges: true,
        _count: {
          select: {
            addictions: true,
            challenges: true,
            journalEntries: true,
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const user = await db.user.upsert({
      where: { id: body.id || USER_ID },
      update: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.isOnboarded !== undefined && { isOnboarded: body.isOnboarded }),
        ...(body.motivations !== undefined && { motivations: body.motivations }),
      },
      create: {
        id: body.id || USER_ID,
        email: body.email || "user@example.com",
        name: body.name || "Utilisateur",
        isOnboarded: body.isOnboarded ?? false,
        motivations: body.motivations || "",
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const user = await db.user.update({
      where: { id: USER_ID },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.avatar !== undefined && { avatar: body.avatar }),
        ...(body.isOnboarded !== undefined && { isOnboarded: body.isOnboarded }),
        ...(body.motivations !== undefined && { motivations: body.motivations }),
        ...(body.dailyReminderEnabled !== undefined && { dailyReminderEnabled: body.dailyReminderEnabled }),
        ...(body.dailyReminderTime !== undefined && { dailyReminderTime: body.dailyReminderTime }),
        ...(body.emergencyModeEnabled !== undefined && { emergencyModeEnabled: body.emergencyModeEnabled }),
        ...(body.pin !== undefined && { pin: body.pin }),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
