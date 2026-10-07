import { PrismaClient, Role, OrderStatus, ItemStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Demo Users for each role
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@apparelflow.com' },
    update: {},
    create: {
      email: 'supervisor@apparelflow.com',
      fullName: 'Marcus Vance',
      role: Role.cutting_supervisor,
    },
  });

  const verifier = await prisma.user.upsert({
    where: { email: 'verifier@apparelflow.com' },
    update: {},
    create: {
      email: 'verifier@apparelflow.com',
      fullName: 'Elena Rostova',
      role: Role.cutting_verifier,
    },
  });

  const sewing = await prisma.user.upsert({
    where: { email: 'sewing@apparelflow.com' },
    update: {},
    create: {
      email: 'sewing@apparelflow.com',
      fullName: 'Kenji Sato',
      role: Role.sewing_supervisor,
    },
  });

  console.log('👤 Users seeded:', { supervisor: supervisor.fullName, verifier: verifier.fullName, sewing: sewing.fullName });

  // 2. Seed Apparel Recipes
  const rcpDenim = await prisma.recipe.upsert({
    where: { recipeCode: 'RCP-DNM-001' },
    update: {},
    create: {
      recipeCode: 'RCP-DNM-001',
      name: "Men's Slim Fit Denim Jeans",
      category: 'Denim',
      stdFabricYards: 1.45,
      wastageCap: 4.5,
      components: {
        create: [
          { componentName: 'Front Leg Panels', piecesPerGarment: 2 },
          { componentName: 'Back Leg Panels', piecesPerGarment: 2 },
          { componentName: 'Waistband', piecesPerGarment: 1 },
          { componentName: 'Coin Pocket', piecesPerGarment: 1 },
          { componentName: 'Back Pockets', piecesPerGarment: 2 },
          { componentName: 'Belt Loops', piecesPerGarment: 5 },
          { componentName: 'Fly Facing', piecesPerGarment: 1 },
        ],
      },
    },
    include: { components: true },
  });

  const rcpTshirt = await prisma.recipe.upsert({
    where: { recipeCode: 'RCP-KNT-002' },
    update: {},
    create: {
      recipeCode: 'RCP-KNT-002',
      name: 'Organic Cotton Crewneck T-Shirt',
      category: 'Knitwear',
      stdFabricYards: 0.85,
      wastageCap: 3.0,
      components: {
        create: [
          { componentName: 'Front Body Panel', piecesPerGarment: 1 },
          { componentName: 'Back Body Panel', piecesPerGarment: 1 },
          { componentName: 'Short Sleeves', piecesPerGarment: 2 },
          { componentName: 'Ribbed Neck Collar', piecesPerGarment: 1 },
        ],
      },
    },
    include: { components: true },
  });

  const rcpShirt = await prisma.recipe.upsert({
    where: { recipeCode: 'RCP-WVN-003' },
    update: {},
    create: {
      recipeCode: 'RCP-WVN-003',
      name: 'Oxford Button-Down Dress Shirt',
      category: 'Woven',
      stdFabricYards: 1.60,
      wastageCap: 3.8,
      components: {
        create: [
          { componentName: 'Front Plackets (L/R)', piecesPerGarment: 2 },
          { componentName: 'Back Body & Yoke', piecesPerGarment: 2 },
          { componentName: 'Sleeves', piecesPerGarment: 2 },
          { componentName: 'Button Cuffs', piecesPerGarment: 2 },
          { componentName: 'Collar Stand & Band', piecesPerGarment: 2 },
          { componentName: 'Chest Pocket', piecesPerGarment: 1 },
        ],
      },
    },
    include: { components: true },
  });

  const rcpChino = await prisma.recipe.upsert({
    where: { recipeCode: 'RCP-BTM-004' },
    update: {},
    create: {
      recipeCode: 'RCP-BTM-004',
      name: 'High-Rise Chino Trousers',
      category: 'Bottoms',
      stdFabricYards: 1.35,
      wastageCap: 4.0,
      components: {
        create: [
          { componentName: 'Front Legs', piecesPerGarment: 2 },
          { componentName: 'Back Legs', piecesPerGarment: 2 },
          { componentName: 'Contoured Waistband', piecesPerGarment: 2 },
          { componentName: 'Slash Pocket Bags', piecesPerGarment: 2 },
          { componentName: 'Rear Welt Pockets', piecesPerGarment: 2 },
        ],
      },
    },
    include: { components: true },
  });

  console.log('👗 Recipes seeded with components:', [rcpDenim.recipeCode, rcpTshirt.recipeCode, rcpShirt.recipeCode, rcpChino.recipeCode]);

  // 3. Seed Cutting Orders across various stages
  // Order 1: PENDING_VERIFICATION (Ready for Verifier Workbench)
  const order1 = await prisma.cuttingOrder.upsert({
    where: { orderNo: 'CO-2026-001' },
    update: {},
    create: {
      orderNo: 'CO-2026-001',
      recipeId: rcpDenim.id,
      targetQty: 100,
      fabricRollId: 'ROLL-INDIGO-882',
      actualFabricYds: 148.5,
      status: OrderStatus.PENDING_VERIFICATION,
      createdBy: supervisor.id,
      items: {
        create: rcpDenim.components.map((comp) => ({
          componentId: comp.id,
          expectedQty: comp.piecesPerGarment * 100,
          actualQty: comp.piecesPerGarment * 100,
          status: ItemStatus.GREEN,
        })),
      },
    },
  });

  // Order 2: VERIFIED (Ready for Sewing Supervisor floor)
  const order2 = await prisma.cuttingOrder.upsert({
    where: { orderNo: 'CO-2026-002' },
    update: {},
    create: {
      orderNo: 'CO-2026-002',
      recipeId: rcpTshirt.id,
      targetQty: 250,
      fabricRollId: 'ROLL-COT-104',
      actualFabricYds: 216.0,
      status: OrderStatus.VERIFIED,
      createdBy: supervisor.id,
      items: {
        create: rcpTshirt.components.map((comp) => ({
          componentId: comp.id,
          expectedQty: comp.piecesPerGarment * 250,
          actualQty: comp.piecesPerGarment * 250,
          status: ItemStatus.GREEN,
        })),
      },
      verificationLog: {
        create: {
          verifierId: verifier.id,
          decision: 'APPROVED',
          wastagePct: 1.65,
          rejectionNote: null,
        },
      },
    },
  });

  // Order 3: REJECTED (With rejection remarks and high wastage)
  const order3 = await prisma.cuttingOrder.upsert({
    where: { orderNo: 'CO-2026-003' },
    update: {},
    create: {
      orderNo: 'CO-2026-003',
      recipeId: rcpShirt.id,
      targetQty: 80,
      fabricRollId: 'ROLL-WHT-519',
      actualFabricYds: 139.2, // standard is 80 * 1.6 = 128 yds -> wastage 8.75% > 3.8% cap
      status: OrderStatus.REJECTED,
      createdBy: supervisor.id,
      items: {
        create: rcpShirt.components.map((comp, idx) => ({
          componentId: comp.id,
          expectedQty: comp.piecesPerGarment * 80,
          actualQty: idx === 2 ? comp.piecesPerGarment * 80 - 16 : comp.piecesPerGarment * 80, // missing 16 sleeve pieces
          status: idx === 2 ? ItemStatus.RED : ItemStatus.GREEN,
        })),
      },
      verificationLog: {
        create: {
          verifierId: verifier.id,
          decision: 'REJECTED',
          wastagePct: 8.75,
          rejectionNote: 'Severe component count deficit on Sleeves (-16 pieces). Fabric consumption exceeds 3.8% allowance (actual wastage 8.75%). Rejecting for recount and roll inspection.',
        },
      },
    },
  });

  // Order 4: CUTTING_IN_PROGRESS (Currently being cut)
  const order4 = await prisma.cuttingOrder.upsert({
    where: { orderNo: 'CO-2026-004' },
    update: {},
    create: {
      orderNo: 'CO-2026-004',
      recipeId: rcpChino.id,
      targetQty: 150,
      fabricRollId: 'ROLL-KHK-302',
      actualFabricYds: 206.5,
      status: OrderStatus.CUTTING_IN_PROGRESS,
      createdBy: supervisor.id,
      items: {
        create: rcpChino.components.map((comp) => ({
          componentId: comp.id,
          expectedQty: comp.piecesPerGarment * 150,
          actualQty: comp.piecesPerGarment * 150,
          status: ItemStatus.GREEN,
        })),
      },
    },
  });

  console.log('📦 Cutting orders seeded:', [order1.orderNo, order2.orderNo, order3.orderNo, order4.orderNo]);
  console.log('✨ Seed complete!');
}

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
