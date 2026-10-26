import { prisma } from "../db";
import { revalidatePath } from "next/cache";
import { getWeeksInYear } from "../utils/weeks";
export { getWeeksInYear };

export interface CreatePricePeriodInput {
  objectId: string;
  name?: string;
  startYear: number;
  startWeek: number;
  endYear: number;
  endWeek: number;
  allowCustomDays?: boolean;
  priceDay?: number | null;
  price2Days?: number | null;
  price3Days?: number | null;
  price4Days?: number | null;
  price5Days?: number | null;
  price6Days?: number | null;
  priceWeek?: number | null;
  priceSunThu?: number | null;
  priceThuSun?: number | null;
}

export interface UpdatePricePeriodInput extends Partial<CreatePricePeriodInput> {}

export interface MissingWeekRange {
  startWeek: number;
  endWeek: number;
}

function weekScore(year: number, week: number): number {
  return year * 100 + week;
}

function checkPeriodOverlap(
  startYear: number,
  startWeek: number,
  endYear: number,
  endWeek: number,
  existingPeriods: Array<{
    id: string;
    name: string | null;
    start_year: number;
    start_week: number;
    end_year: number;
    end_week: number;
  }>,
  excludeId?: string
) {
  const maxStartWeeks = getWeeksInYear(startYear);
  const maxEndWeeks = getWeeksInYear(endYear);

  if (startWeek < 1 || startWeek > maxStartWeeks) {
    throw new Error(`Startvecka måste vara mellan 1 och ${maxStartWeeks} för år ${startYear}.`);
  }
  if (endWeek < 1 || endWeek > maxEndWeeks) {
    throw new Error(`Slutvecka måste vara mellan 1 och ${maxEndWeeks} för år ${endYear}.`);
  }

  const newStart = weekScore(startYear, startWeek);
  const newEnd = weekScore(endYear, endWeek);

  if (newStart > newEnd) {
    throw new Error("Startvecka kan inte vara senare än slutvecka.");
  }

  for (const existing of existingPeriods) {
    if (excludeId && existing.id === excludeId) continue;

    const existStart = weekScore(existing.start_year, existing.start_week);
    const existEnd = weekScore(existing.end_year, existing.end_week);

    // Overlap condition: max(start) <= min(end)
    if (Math.max(newStart, existStart) <= Math.min(newEnd, existEnd)) {
      const label = existing.name ? `"${existing.name}"` : "befintlig period";
      throw new Error(
        `Veckospannet (v.${startWeek}–${endWeek}, ${startYear}) överlappar med ${label} (v.${existing.start_week}–${existing.end_week}, ${existing.start_year}).`
      );
    }
  }
}

export async function getPricePeriodsAction(params?: {
  objectId?: string;
  year?: number;
}) {
  try {
    const where: any = {};
    if (params?.objectId) {
      where.object_id = params.objectId;
    }
    if (params?.year) {
      // Return periods that cover or intersect this year
      where.OR = [
        { start_year: params.year },
        { end_year: params.year },
        {
          AND: [
            { start_year: { lte: params.year } },
            { end_year: { gte: params.year } },
          ],
        },
      ];
    }

    const periods = await prisma.objectPricePeriod.findMany({
      where,
      include: {
        object: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { start_year: "asc" },
        { start_week: "asc" },
      ],
    });

    return periods;
  } catch (error) {
    console.error("[cms-core] Failed to fetch price periods:", error);
    return [];
  }
}

export async function getMissingWeeksAction(objectId: string, year: number): Promise<MissingWeekRange[]> {
  const maxWeeks = getWeeksInYear(year);
  try {
    if (!prisma.objectPricePeriod) {
      console.warn("[cms-core] prisma.objectPricePeriod is not initialized yet");
      return [{ startWeek: 1, endWeek: maxWeeks }];
    }

    const periods = await prisma.objectPricePeriod.findMany({
      where: {
        object_id: objectId,
        OR: [
          { start_year: year },
          { end_year: year },
        ],
      },
      orderBy: { start_week: "asc" },
    });

    const coveredWeeks = new Set<number>();
    for (const p of periods) {
      const sWeek = p.start_year < year ? 1 : p.start_week;
      const eWeek = p.end_year > year ? maxWeeks : p.end_week;
      for (let w = sWeek; w <= eWeek; w++) {
        coveredWeeks.add(w);
      }
    }

    const missingRanges: MissingWeekRange[] = [];
    let currentStart: number | null = null;

    for (let w = 1; w <= maxWeeks; w++) {
      if (!coveredWeeks.has(w)) {
        if (currentStart === null) currentStart = w;
      } else {
        if (currentStart !== null) {
          missingRanges.push({ startWeek: currentStart, endWeek: w - 1 });
          currentStart = null;
        }
      }
    }

    if (currentStart !== null) {
      missingRanges.push({ startWeek: currentStart, endWeek: maxWeeks });
    }

    return missingRanges;
  } catch (error) {
    console.error("[cms-core] Failed to calculate missing weeks:", error);
    return [{ startWeek: 1, endWeek: maxWeeks }];
  }
}

export async function createPricePeriodAction(data: CreatePricePeriodInput) {
  // Validate overlap with existing periods for this object
  const existing = await prisma.objectPricePeriod.findMany({
    where: { object_id: data.objectId },
    select: {
      id: true,
      name: true,
      start_year: true,
      start_week: true,
      end_year: true,
      end_week: true,
    },
  });

  checkPeriodOverlap(
    data.startYear,
    data.startWeek,
    data.endYear,
    data.endWeek,
    existing
  );

  const created = await prisma.objectPricePeriod.create({
    data: {
      object_id: data.objectId,
      name: data.name || null,
      start_year: data.startYear,
      start_week: data.startWeek,
      end_year: data.endYear,
      end_week: data.endWeek,
      allow_custom_days: data.allowCustomDays ?? true,
      price_day: data.priceDay !== undefined ? data.priceDay : null,
      price_2_days: data.price2Days !== undefined ? data.price2Days : null,
      price_3_days: data.price3Days !== undefined ? data.price3Days : null,
      price_4_days: data.price4Days !== undefined ? data.price4Days : null,
      price_5_days: data.price5Days !== undefined ? data.price5Days : null,
      price_6_days: data.price6Days !== undefined ? data.price6Days : null,
      price_week: data.priceWeek !== undefined ? data.priceWeek : null,
      price_sun_thu: data.priceSunThu !== undefined ? data.priceSunThu : null,
      price_thu_sun: data.priceThuSun !== undefined ? data.priceThuSun : null,
    },
  });

  try {
    revalidatePath("/admin");
    revalidatePath("/admin", "layout");
  } catch {}

  return created;
}

export async function updatePricePeriodAction(
  id: string,
  data: UpdatePricePeriodInput
) {
  const current = await prisma.objectPricePeriod.findUnique({
    where: { id },
  });

  if (!current) {
    throw new Error("Prisperiod hittades inte.");
  }

  const objectId = data.objectId || current.object_id;
  const startYear = data.startYear ?? current.start_year;
  const startWeek = data.startWeek ?? current.start_week;
  const endYear = data.endYear ?? current.end_year;
  const endWeek = data.endWeek ?? current.end_week;

  // Validate overlap with existing periods
  const existing = await prisma.objectPricePeriod.findMany({
    where: { object_id: objectId },
    select: {
      id: true,
      name: true,
      start_year: true,
      start_week: true,
      end_year: true,
      end_week: true,
    },
  });

  checkPeriodOverlap(startYear, startWeek, endYear, endWeek, existing, id);

  const updated = await prisma.objectPricePeriod.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.startYear !== undefined ? { start_year: data.startYear } : {}),
      ...(data.startWeek !== undefined ? { start_week: data.startWeek } : {}),
      ...(data.endYear !== undefined ? { end_year: data.endYear } : {}),
      ...(data.endWeek !== undefined ? { end_week: data.endWeek } : {}),
      ...(data.allowCustomDays !== undefined ? { allow_custom_days: data.allowCustomDays } : {}),
      ...(data.priceDay !== undefined ? { price_day: data.priceDay } : {}),
      ...(data.price2Days !== undefined ? { price_2_days: data.price2Days } : {}),
      ...(data.price3Days !== undefined ? { price_3_days: data.price3Days } : {}),
      ...(data.price4Days !== undefined ? { price_4_days: data.price4Days } : {}),
      ...(data.price5Days !== undefined ? { price_5_days: data.price5Days } : {}),
      ...(data.price6Days !== undefined ? { price_6_days: data.price6Days } : {}),
      ...(data.priceWeek !== undefined ? { price_week: data.priceWeek } : {}),
      ...(data.priceSunThu !== undefined ? { price_sun_thu: data.priceSunThu } : {}),
      ...(data.priceThuSun !== undefined ? { price_thu_sun: data.priceThuSun } : {}),
    },
  });

  try {
    revalidatePath("/admin");
    revalidatePath("/admin", "layout");
  } catch {}

  return updated;
}

export async function deletePricePeriodAction(id: string) {
  const deleted = await prisma.objectPricePeriod.delete({
    where: { id },
  });

  try {
    revalidatePath("/admin");
    revalidatePath("/admin", "layout");
  } catch {}

  return deleted;
}

