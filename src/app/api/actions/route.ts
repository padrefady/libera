import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const USER_ID = "user-1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const actions = await db.dailyAction.findMany({
      where: {
        userId: USER_ID,
        ...(date && { date }),
      },
      orderBy: [{ date: "desc" }, { actionType: "asc" }],
    });

    return NextResponse.json(actions);
  } catch (error) {
    console.error("Error fetching actions:", error);
    return NextResponse.json({ error: "Failed to fetch actions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const action = await db.dailyAction.upsert({
      where: {
        // Use a composite approach - first check if one exists
        id: body.id || "",
      },
      update: {
        ...(body.completed !== undefined && { completed: body.completed }),
        ...(body.duration !== undefined && { duration: body.duration }),
      },
      create: {
        userId: USER_ID,
        date: body.date,
        actionType: body.actionType || "EXERCISE",
        completed: body.completed ?? false,
        duration: body.duration,
      },
    });

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error("Error creating action:", error);
    return NextResponse.json({ error: "Failed to create action" }, { status: 500 });
  }
}
