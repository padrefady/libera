import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const USER_ID = "user-1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const addictionId = searchParams.get("addictionId");

    const userAddictions = await db.addiction.findMany({
      where: { userId: USER_ID },
      select: { id: true },
    });
    const addictionIds = userAddictions.map((a) => a.id);

    const consumptions = await db.consumption.findMany({
      where: {
        addictionId: addictionId
          ? addictionId
          : { in: addictionIds },
        ...(startDate && { date: { gte: startDate } }),
        ...(endDate && { date: { lte: endDate } }),
      },
      orderBy: [{ date: "desc" }, { time: "desc" }],
      include: {
        addiction: {
          select: { name: true, icon: true, color: true, unit: true },
        },
      },
    });

    return NextResponse.json(consumptions);
  } catch (error) {
    console.error("Error fetching consumptions:", error);
    return NextResponse.json({ error: "Failed to fetch consumptions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify the addiction belongs to the user
    const addiction = await db.addiction.findFirst({
      where: { id: body.addictionId, userId: USER_ID },
    });

    if (!addiction) {
      return NextResponse.json({ error: "Addiction not found" }, { status: 404 });
    }

    const consumption = await db.consumption.create({
      data: {
        addictionId: body.addictionId,
        date: body.date,
        quantity: body.quantity,
        time: body.time || "00:00",
        context: body.context || "OTHER",
        notes: body.notes,
      },
      include: {
        addiction: {
          select: { name: true, icon: true, color: true, unit: true },
        },
      },
    });

    return NextResponse.json(consumption, { status: 201 });
  } catch (error) {
    console.error("Error creating consumption:", error);
    return NextResponse.json({ error: "Failed to create consumption" }, { status: 500 });
  }
}
