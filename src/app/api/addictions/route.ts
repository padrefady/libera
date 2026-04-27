import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const USER_ID = "user-1";

export async function GET() {
  try {
    const addictions = await db.addiction.findMany({
      where: { userId: USER_ID },
      include: {
        _count: {
          select: { consumptions: true, challenges: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(addictions);
  } catch (error) {
    console.error("Error fetching addictions:", error);
    return NextResponse.json({ error: "Failed to fetch addictions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const addiction = await db.addiction.create({
      data: {
        userId: USER_ID,
        name: body.name,
        type: body.type || "OTHER",
        icon: body.icon || "🎯",
        color: body.color || "#6366f1",
        level: body.level || "LIGHT",
        goalType: body.goalType || "REDUCE",
        targetQuantity: body.targetQuantity ?? 0,
        unit: body.unit || "units",
        costPerUnit: body.costPerUnit ?? 0,
        startQuantity: body.startQuantity ?? 0,
      },
    });

    return NextResponse.json(addiction, { status: 201 });
  } catch (error) {
    console.error("Error creating addiction:", error);
    return NextResponse.json({ error: "Failed to create addiction" }, { status: 500 });
  }
}
