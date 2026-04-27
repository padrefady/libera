import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Toggle completed status
    const action = await db.dailyAction.findUnique({
      where: { id },
    });

    if (!action) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    const updated = await db.dailyAction.update({
      where: { id },
      data: {
        completed: !action.completed,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error toggling action:", error);
    return NextResponse.json({ error: "Failed to toggle action" }, { status: 500 });
  }
}
