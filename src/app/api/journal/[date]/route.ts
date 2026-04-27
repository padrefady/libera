import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const USER_ID = "user-1";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    const entry = await db.journalEntry.findUnique({
      where: {
        userId_date: {
          userId: USER_ID,
          date,
        },
      },
    });

    if (!entry) {
      return NextResponse.json(null);
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    return NextResponse.json({ error: "Failed to fetch journal entry" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const body = await request.json();

    const entry = await db.journalEntry.upsert({
      where: {
        userId_date: {
          userId: USER_ID,
          date,
        },
      },
      update: {
        ...(body.mood !== undefined && { mood: body.mood }),
        ...(body.energyLevel !== undefined && { energyLevel: body.energyLevel }),
        ...(body.stressLevel !== undefined && { stressLevel: body.stressLevel }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.cravings !== undefined && { cravings: body.cravings }),
      },
      create: {
        userId: USER_ID,
        date,
        mood: body.mood || "OKAY",
        energyLevel: body.energyLevel ?? 3,
        stressLevel: body.stressLevel ?? 3,
        notes: body.notes,
        cravings: body.cravings ?? 0,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error updating journal entry:", error);
    return NextResponse.json({ error: "Failed to update journal entry" }, { status: 500 });
  }
}
