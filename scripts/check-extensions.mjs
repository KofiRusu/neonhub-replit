#!/usr/bin/env node
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function checkExtensions() {
  try {
    const extensions = await prisma.$queryRaw`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'vector') 
      ORDER BY extname;
    `;
    
    console.log('\n🔍 Database Extensions Check\n');
    console.log('Extensions found:');
    
    if (extensions.length === 0) {
      console.log('⚠️  No extensions found. Required: uuid-ossp, vector');
    } else {
      extensions.forEach(ext => {
        console.log(`✅ ${ext.extname.padEnd(15)} v${ext.extversion}`);
      });
    }
    
    // Check for missing extensions
    const foundExtensions = extensions.map(e => e.extname);
    const requiredExtensions = ['uuid-ossp', 'vector'];
    const missingExtensions = requiredExtensions.filter(e => !foundExtensions.includes(e));
    
    if (missingExtensions.length > 0) {
      console.log('\n⚠️  Missing extensions:');
      missingExtensions.forEach(ext => {
        console.log(`   - ${ext}`);
      });
      console.log('\nTo install:');
      missingExtensions.forEach(ext => {
        console.log(`   CREATE EXTENSION IF NOT EXISTS "${ext}";`);
      });
    }
    
    console.log('');
  } catch (error) {
    console.error('❌ Error checking extensions:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkExtensions();

