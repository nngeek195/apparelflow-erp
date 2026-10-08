import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin if environment variables are set
if (!getApps().length && process.env.FIREBASE_ADMIN_PROJECT_ID) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const prisma = new PrismaClient();
const adminAuth = getApps().length ? getAuth() : null;

async function main() {
  const args = process.argv.slice(2);
  const email = args[0] || process.env.ADMIN_EMAIL || 'nngeek195@gmail.com';
  const fullName = args[1] || email.split('@')[0];
  const roleInput = (args[2] || 'cutting_supervisor') as Role;

  if (!Object.values(Role).includes(roleInput)) {
    console.error(`❌ Invalid role: "${roleInput}". Valid roles are: ${Object.values(Role).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🚀 Initiating Admin User in ApparelFlow ERP...`);
  console.log(`   Email:     ${email}`);
  console.log(`   Full Name: ${fullName}`);
  console.log(`   Role:      ${roleInput}`);

  // 1. Upsert into Google Cloud SQL PostgreSQL via Prisma
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      role: roleInput,
    },
    create: {
      email,
      fullName,
      role: roleInput,
    },
  });

  console.log(`\n✅ PostgreSQL Database Record Synchronized:`);
  console.log(`   User ID:   ${user.id}`);
  console.log(`   Role:      ${user.role}`);
  console.log(`   DB Host:   Google Cloud SQL (us-east4)`);

  // 2. Inject Custom Claims into Firebase Auth (if user exists in Firebase)
  if (adminAuth) {
    try {
      const fbUser = await adminAuth.getUserByEmail(email);
      await adminAuth.setCustomUserClaims(fbUser.uid, { role: roleInput });
      console.log(`\n✅ Firebase Admin SDK Custom Claims Injected:`);
      console.log(`   Firebase UID:  ${fbUser.uid}`);
      console.log(`   Custom Claim:  { role: "${roleInput}" }`);
    } catch (fbErr: any) {
      if (fbErr.code === 'auth/user-not-found') {
        console.log(`\nℹ️  User not yet registered in Firebase Auth.`);
        console.log(`   When this user logs in with Google OAuth at /login, the backend`);
        console.log(`   will automatically link to this pre-configured PostgreSQL role.`);
      } else {
        console.warn(`\n⚠️  Firebase Claims Notice:`, fbErr.message);
      }
    }
  }

  console.log(`\n✨ Admin Initiation Complete!`);
  console.log(`   You can now sign in at http://localhost:3000/login or use`);
  console.log(`   the 1-Click Role Switcher on the top bar to inspect operations.\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error initiating admin:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
