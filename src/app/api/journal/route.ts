import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const USER_ID = "user-1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "30");

    const entries = await db.journalEntry.findMany({
      where: {
        userId: USER_ID,
        ...(startDate && { date: { gte: startDate } }),
        ...(endDate && { date: { lte: endDate } }),
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const entry = await db.journalEntry.upsert({
      where: {
        userId_date: {
          userId: USER_ID,
          date: body.date,
        },
      },
      update: {
        mood: body.mood || "OKAY",
        energyLevel: body.energyLevel ?? 3,
        stressLevel: body.stressLevel ?? 3,
        notes: body.notes,
        cravings: body.cravings ?? 0,
      },
      create: {
        userId: USER_ID,
        date: body.date,
        mood: body.mood || "OKAY",
        energyLevel: body.energyLevel ?? 3,
        stressLevel: body.stressLevel ?? 3,
        notes: body.notes,
        cravings: body.cravings ?? 0,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating journal entry:", error);
    return NextResponse.json({ error: "Failed to create journal entry" }, { status: 500 });
  }
}
