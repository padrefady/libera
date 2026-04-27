import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const addiction = await db.addiction.findUnique({
      where: { id },
      include: {
        consumptions: {
          orderBy: { date: "desc" },
          take: 30,
        },
        challenges: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!addiction) {
      return NextResponse.json({ error: "Addiction not found" }, { status: 404 });
    }

    return NextResponse.json(addiction);
  } catch (error) {
    console.error("Error fetching addiction:", error);
    return NextResponse.json({ error: "Failed to fetch addiction" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const addiction = await db.addiction.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.level !== undefined && { level: body.level }),
        ...(body.goalType !== undefined && { goalType: body.goalType }),
        ...(body.targetQuantity !== undefined && { targetQuantity: body.targetQuantity }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.costPerUnit !== undefined && { costPerUnit: body.costPerUnit }),
        ...(body.startQuantity !== undefined && { startQuantity: body.startQuantity }),
      },
    });

    return NextResponse.json(addiction);
  } catch (error) {
    console.error("Error updating addiction:", error);
    return NextResponse.json({ error: "Failed to update addiction" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.addiction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting addiction:", error);
    return NextResponse.json({ error: "Failed to delete addiction" }, { status: 500 });
  }
}
