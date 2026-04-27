import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const USER_ID = "user-1";
const MAX_STREAK_DAYS = 10000;

function getDaysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toDateOnly(dateStr: string): string {
  // Normalize date strings to YYYY-MM-DD
  return dateStr.split("T")[0].split(" ")[0];
}

export async function GET() {
  try {
    const user = await db.user.findUnique({ where: { id: USER_ID } });
    const addictions = await db.addiction.findMany({
      where: { userId: USER_ID },
      include: { consumptions: { orderBy: { date: "asc" } } },
    });

    const today = formatDate(new Date());
    const consumptionDateSet = new Set<string>();

    // --- Per-addiction stats ---
    const addictionStats = addictions.map((addiction) => {
      const consumptions = addiction.consumptions;
      consumptionDateSet.clear();
      for (const c of consumptions) {
        consumptionDateSet.add(toDateOnly(c.date));
      }

      // Total days tracked
      let totalDaysTracked = 0;
      if (consumptions.length > 0) {
        const firstDate = toDateOnly(consumptions[0].date);
        totalDaysTracked = Math.min(getDaysBetween(firstDate, today) + 1, MAX_STREAK_DAYS);
      }

      // Current streak: consecutive days WITHOUT consumption, counting back from today
      let currentStreak = 0;
      if (consumptions.length === 0) {
        currentStreak = 0; // No consumption data yet
      } else if (!consumptionDateSet.has(today)) {
        currentStreak = 1;
        for (let i = 1; i < MAX_STREAK_DAYS; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          if (!consumptionDateSet.has(formatDate(d))) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Longest streak without consumption
      let longestStreak = 0;
      if (consumptions.length > 0) {
        const firstDate = toDateOnly(consumptions[0].date);
        const startDate = new Date(firstDate);
        const endDate = new Date(today);
        const totalSpan = getDaysBetween(firstDate, today);
        const daysToCheck = Math.min(totalSpan + 1, 365); // Limit to 1 year for performance

        let streak = 0;
        for (let i = daysToCheck - 1; i >= 0; i--) {
          const d = new Date(endDate);
          d.setDate(d.getDate() - i);
          if (!consumptionDateSet.has(formatDate(d))) {
            streak++;
            if (streak > longestStreak) longestStreak = streak;
          } else {
            streak = 0;
          }
        }
      }

      // Average daily quantity (last 14 days)
      const last14Days = new Set<string>();
      for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last14Days.add(formatDate(d));
      }

      const last14Consumptions = consumptions.filter((c) =>
        last14Days.has(toDateOnly(c.date))
      );
      const daysWithConsumptionInLast14 = new Set(
        last14Consumptions.map((c) => toDateOnly(c.date))
      ).size;
      const totalQuantityLast14 = last14Consumptions.reduce(
        (sum, c) => sum + c.quantity,
        0
      );
      const avgDailyLast14 = totalQuantityLast14 / 14;

      // Reduction percentage
      let reductionPercentage = 0;
      if (addiction.startQuantity > 0) {
        reductionPercentage = Math.max(
          0,
          ((addiction.startQuantity - avgDailyLast14) / addiction.startQuantity) * 100
        );
        reductionPercentage = Math.min(100, reductionPercentage);
      }

      // Money saved
      const totalConsumedQuantity = consumptions.reduce(
        (sum, c) => sum + c.quantity,
        0
      );
      const expectedCost = addiction.startQuantity * totalDaysTracked * addiction.costPerUnit;
      const actualCost = totalConsumedQuantity * addiction.costPerUnit;
      const moneySaved = Math.max(0, expectedCost - actualCost);

      // Today's consumption
      const todayConsumption = consumptions
        .filter((c) => toDateOnly(c.date) === today)
        .reduce((sum, c) => sum + c.quantity, 0);

      // Weekly average (last 7 days)
      const last7Days = new Set<string>();
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.add(formatDate(d));
      }
      const weeklyConsumptions = consumptions.filter((c) =>
        last7Days.has(toDateOnly(c.date))
      );
      const weeklyAverage = weeklyConsumptions.reduce((sum, c) => sum + c.quantity, 0) / 7;

      // Monthly average (last 30 days)
      const last30Days = new Set<string>();
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last30Days.add(formatDate(d));
      }
      const monthlyConsumptions = consumptions.filter((c) =>
        last30Days.has(toDateOnly(c.date))
      );
      const monthlyAverage = monthlyConsumptions.reduce((sum, c) => sum + c.quantity, 0) / 30;

      return {
        addictionId: addiction.id,
        name: addiction.name,
        type: addiction.type,
        icon: addiction.icon,
        color: addiction.color,
        unit: addiction.unit,
        totalDaysTracked,
        currentStreak,
        longestStreak,
        avgDailyLast14: Math.round(avgDailyLast14 * 100) / 100,
        reductionPercentage: Math.round(reductionPercentage * 10) / 10,
        moneySaved: Math.round(moneySaved * 100) / 100,
        totalConsumptions: consumptions.length,
        startQuantity: addiction.startQuantity,
        targetQuantity: addiction.targetQuantity,
        daysWithConsumptionInLast14,
        todayConsumption: Math.round(todayConsumption * 100) / 100,
        weeklyAverage: Math.round(weeklyAverage * 100) / 100,
        monthlyAverage: Math.round(monthlyAverage * 100) / 100,
        totalSpent: Math.round(actualCost * 100) / 100,
      };
    });

    // --- Overall stats ---
    const totalDaysTracked =
      addictionStats.length > 0
        ? Math.max(...addictionStats.map((a) => a.totalDaysTracked))
        : 0;

    const overallCurrentStreak =
      addictionStats.length > 0
        ? Math.min(...addictionStats.map((a) => a.currentStreak))
        : 0;

    const overallLongestStreak =
      addictionStats.length > 0
        ? Math.max(...addictionStats.map((a) => a.longestStreak))
        : 0;

    const totalMoneySaved = addictionStats.reduce(
      (sum, a) => sum + a.moneySaved,
      0
    );

    const totalMoneySpent = addictionStats.reduce(
      (sum, a) => sum + (a.totalSpent || 0),
      0
    );

    const overallTodayConsumption = addictionStats.reduce(
      (sum, a) => sum + (a.todayConsumption || 0),
      0
    );

    const overallWeeklyAvg = addictionStats.reduce(
      (sum, a) => sum + (a.weeklyAverage || 0),
      0
    );

    const overallMonthlyAvg = addictionStats.reduce(
      (sum, a) => sum + (a.monthlyAverage || 0),
      0
    );

    const avgReduction =
      addictionStats.length > 0
        ? addictionStats.reduce((sum, a) => sum + a.reductionPercentage, 0) /
          addictionStats.length
        : 0;

    // Badges count
    const badgesCount = await db.badge.count({
      where: { userId: USER_ID },
    });

    // Active challenges
    const activeChallenges = await db.challenge.count({
      where: { userId: USER_ID, status: "ACTIVE" },
    });

    // Completed challenges
    const completedChallenges = await db.challenge.count({
      where: { userId: USER_ID, status: "COMPLETED" },
    });

    // Journal entries count
    const journalCount = await db.journalEntry.count({
      where: { userId: USER_ID },
    });

    // Today's actions completed
    const todayActions = await db.dailyAction.findMany({
      where: { userId: USER_ID, date: today },
    });
    const actionsCompletedToday = todayActions.filter((a) => a.completed).length;
    const actionsTotalToday = todayActions.length;

    return NextResponse.json({
      user: {
        id: USER_ID,
        name: user?.name,
        level: user?.level,
        points: user?.points,
        streakDays: overallCurrentStreak,
        longestStreak: overallLongestStreak,
        isOnboarded: user?.isOnboarded,
      },
      overview: {
        totalDaysTracked,
        currentStreak: overallCurrentStreak,
        longestStreak: overallLongestStreak,
        totalMoneySaved: Math.round(totalMoneySaved * 100) / 100,
        totalMoneySpent: Math.round(totalMoneySpent * 100) / 100,
        avgReductionPercentage: Math.round(avgReduction * 10) / 10,
        addictionsCount: addictions.length,
        badgesCount,
        activeChallenges,
        completedChallenges,
        journalCount,
        actionsCompletedToday,
        actionsTotalToday,
        todayConsumption: overallTodayConsumption,
        weeklyAverage: overallWeeklyAvg,
        monthlyAverage: overallMonthlyAvg,
      },
      addictions: addictionStats,
    });
  } catch (error) {
    console.error("Error computing stats:", error);
    return NextResponse.json({ error: "Failed to compute stats" }, { status: 500 });
  }
}
