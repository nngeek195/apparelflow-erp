import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export async function cleanupDummyData() {
  console.log('🧹 Purging all hardcoded dummy data from the database...');

  // 1. Delete all verification logs, items, and cutting orders
  const deletedLogs = await prisma.verificationLog.deleteMany();
  console.log(`   Removed ${deletedLogs.count} verification logs.`);

  const deletedItems = await prisma.verificationItem.deleteMany();
  console.log(`   Removed ${deletedItems.count} verification items.`);

  const deletedOrders = await prisma.cuttingOrder.deleteMany();
  console.log(`   Removed ${deletedOrders.count} cutting orders.`);

  // 2. Delete all recipe components and recipes
  const deletedComponents = await prisma.recipeComponent.deleteMany();
  console.log(`   Removed ${deletedComponents.count} recipe components.`);

  const deletedRecipes = await prisma.recipe.deleteMany();
  console.log(`   Removed ${deletedRecipes.count} apparel recipes.`);

  // 3. Purge all dummy users, preserving only the real primary administrator
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: {
        not: 'nngeek195@gmail.com',
      },
    },
  });
  console.log(`   Removed ${deletedUsers.count} dummy user records.`);

  // 4. Ensure real administrator exists in database
  const admin = await prisma.user.upsert({
    where: { email: 'nngeek195@gmail.com' },
    update: {
      fullName: 'Niranga Nayanajith',
      role: Role.cutting_supervisor,
    },
    create: {
      email: 'nngeek195@gmail.com',
      fullName: 'Niranga Nayanajith',
      role: Role.cutting_supervisor,
    },
  });
  console.log(`👤 Active User: ${admin.fullName} (${admin.email}) [${admin.role}]`);

  console.log('✨ All hardcoded dummy data removed. Database is now clean.');
}

if (require.main === module) {
  cleanupDummyData()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error('❌ Error cleaning database:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
