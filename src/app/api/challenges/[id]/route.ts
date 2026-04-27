import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const challenge = await db.challenge.update({
      where: { id },
      data: {
        ...(body.progressDays !== undefined && { progressDays: body.progressDays }),
        ...(body.currentReduction !== undefined && { currentReduction: body.currentReduction }),
        ...(body.status !== undefined && {
          status: body.status,
          ...(body.status === "COMPLETED" && { endDate: new Date() }),
          ...(body.status === "FAILED" && { endDate: new Date() }),
        }),
      },
      include: {
        addiction: {
          select: { name: true, icon: true, color: true },
        },
      },
    });

    return NextResponse.json(challenge);
  } catch (error) {
    console.error("Error updating challenge:", error);
    return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 });
  }
}
