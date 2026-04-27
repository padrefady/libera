import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const consumption = await db.consumption.update({
      where: { id },
      data: {
        ...(body.quantity !== undefined && { quantity: body.quantity }),
        ...(body.time !== undefined && { time: body.time }),
        ...(body.context !== undefined && { context: body.context }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.date !== undefined && { date: body.date }),
      },
    });

    return NextResponse.json(consumption);
  } catch (error) {
    console.error("Error updating consumption:", error);
    return NextResponse.json({ error: "Failed to update consumption" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.consumption.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting consumption:", error);
    return NextResponse.json({ error: "Failed to delete consumption" }, { status: 500 });
  }
}
