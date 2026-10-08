// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Production Recipes...');

  // Recipe A: Casual Blouse
  const blouse = await prisma.recipe.upsert({
    where: { recipeCode: 'REC-BL01' },
    update: {},
    create: {
      recipeCode: 'REC-BL01',
      name: 'Casual Blouse',
      category: 'Blouse',
      stdFabricYards: 1.8,
      wastageCap: 5.0,
      components: {
        create: [
          { componentName: 'Front Body Panel', piecesPerGarment: 1 },
          { componentName: 'Back Body Panel', piecesPerGarment: 1 },
          { componentName: 'Sleeves (Left & Right)', piecesPerGarment: 2 },
          { componentName: 'Collar & Stand', piecesPerGarment: 1 },
          { componentName: 'Sleeve Cuffs', piecesPerGarment: 2 },
        ],
      },
    },
  });

  // Recipe B: Crop Top
  const cropTop = await prisma.recipe.upsert({
    where: { recipeCode: 'REC-CT02' },
    update: {},
    create: {
      recipeCode: 'REC-CT02',
      name: 'Crop Top',
      category: 'Crop Top',
      stdFabricYards: 1.1,
      wastageCap: 8.0,
      components: {
        create: [
          { componentName: 'Front Chest Panel', piecesPerGarment: 1 },
          { componentName: 'Back Support Panel', piecesPerGarment: 1 },
          { componentName: 'Neck Binding Strip', piecesPerGarment: 1 },
          { componentName: 'Hem Elastic Casing', piecesPerGarment: 1 },
          { componentName: 'Side Strap Accents', piecesPerGarment: 2 },
        ],
      },
    },
  });

  console.log('Database seeded successfully:');
  console.log(`- ${blouse.name} (${blouse.recipeCode})`);
  console.log(`- ${cropTop.name} (${cropTop.recipeCode})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });