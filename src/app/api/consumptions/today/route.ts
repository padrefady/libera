import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const USER_ID = "user-1";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const userAddictions = await db.addiction.findMany({
      where: { userId: USER_ID },
      select: { id: true },
    });
    const addictionIds = userAddictions.map((a) => a.id);

    const consumptions = await db.consumption.findMany({
      where: {
        addictionId: { in: addictionIds },
        date: today,
      },
      orderBy: { time: "desc" },
      include: {
        addiction: {
          select: { name: true, icon: true, color: true, unit: true },
        },
      },
    });

    return NextResponse.json({
      date: today,
      consumptions,
      totalConsumptions: consumptions.length,
    });
  } catch (error) {
    console.error("Error fetching today's consumptions:", error);
    return NextResponse.json({ error: "Failed to fetch today's consumptions" }, { status: 500 });
  }
}
