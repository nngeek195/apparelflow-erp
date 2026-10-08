import { prisma } from './prisma';

/**
 * Computes the next ascending unique Order Number (e.g. ORD-0001, ORD-0002, ...)
 * Guarantees that order numbers are strictly ascending and never duplicate.
 */
export async function getNextOrderNo(): Promise<string> {
  const orders = await prisma.cuttingOrder.findMany({
    select: { orderNo: true },
  });

  let maxNum = 0;
  for (const o of orders) {
    // Match numeric sequences at the end of order strings, e.g. ORD-0001, CUT-2026-0005, CO-12
    const match = o.orderNo.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `ORD-${String(nextNum).padStart(4, '0')}`;
}

/**
 * Computes the next ascending unique Recipe Code (e.g. RCP-0001, RCP-0002, ...)
 * Guarantees that recipe codes are strictly ascending and never duplicate.
 */
export async function getNextRecipeCode(): Promise<string> {
  const recipes = await prisma.recipe.findMany({
    select: { recipeCode: true },
  });

  let maxNum = 0;
  for (const r of recipes) {
    const match = r.recipeCode.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `RCP-${String(nextNum).padStart(4, '0')}`;
}

/**
 * Computes the next ascending unique Fabric Roll ID (e.g. LOT-0001, LOT-0002, ...)
 * Guarantees that fabric roll numbers are strictly ascending and never duplicate.
 */
export async function getNextFabricRollId(): Promise<string> {
  const orders = await prisma.cuttingOrder.findMany({
    select: { fabricRollId: true },
  });

  let maxNum = 0;
  for (const o of orders) {
    const match = o.fabricRollId.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `LOT-${String(nextNum).padStart(4, '0')}`;
}
