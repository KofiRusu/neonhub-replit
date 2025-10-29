#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log('🔍 Verifying database seeding...\n');
  
  try {
    const counts = await Promise.all([
      prisma.organization.count(),
      prisma.brand.count(),
      prisma.agent.count(),
      prisma.persona.count(),
      prisma.keyword.count(),
      prisma.editorialCalendar.count()
    ]);

    const tables = ['organizations', 'brands', 'agents', 'personas', 'keywords', 'editorial_calendar'];
    
    console.log('Table                  | Count');
    console.log('---------------------- | -----');
    tables.forEach((table, i) => {
      console.log(`${table.padEnd(22)} | ${counts[i]}`);
    });
    
    console.log('\n✅ Database verification complete!');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifyDatabase();

