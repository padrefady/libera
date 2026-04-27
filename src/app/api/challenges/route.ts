import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const USER_ID = "user-1";

export async function GET() {
  try {
    const challenges = await db.challenge.findMany({
      where: { userId: USER_ID },
      include: {
        addiction: {
          select: { name: true, icon: true, color: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(challenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate addiction belongs to user if provided
    if (body.addictionId) {
      const addiction = await db.addiction.findFirst({
        where: { id: body.addictionId, userId: USER_ID },
      });
      if (!addiction) {
        return NextResponse.json({ error: "Addiction not found" }, { status: 404 });
      }
    }

    const challenge = await db.challenge.create({
      data: {
        userId: USER_ID,
        addictionId: body.addictionId || null,
        type: body.type,
        title: body.title,
        description: body.description || "",
        targetDays: body.targetDays ?? 7,
        targetReduction: body.targetReduction ?? null,
        startDate: new Date(),
      },
      include: {
        addiction: {
          select: { name: true, icon: true, color: true },
        },
      },
    });

    return NextResponse.json(challenge, { status: 201 });
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 });
  }
}
