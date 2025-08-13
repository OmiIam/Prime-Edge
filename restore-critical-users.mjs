import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function restoreCriticalUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Creating critical users for business continuity...\n');
    
    // Add your key users here - REPLACE WITH ACTUAL USER DATA
    const criticalUsers = [
      // Example - replace with actual user emails/info you remember
      {
        name: 'Main Admin',
        email: 'admin@yourdomain.com', // CHANGE THIS
        password: 'TempPass123!',
        role: 'ADMIN',
        balance: 0
      },
      {
        name: 'Support User',
        email: 'support@yourdomain.com', // CHANGE THIS  
        password: 'TempPass123!',
        role: 'ADMIN',
        balance: 0
      }
      // Add more users you remember here
    ];
    
    for (const userData of criticalUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          balance: userData.balance,
          isActive: true,
          emailVerified: true,
          kycStatus: 'APPROVED'
        }
      });
      
      console.log(`✅ Created: ${userData.email} (${userData.role})`);
    }
    
    console.log(`\n📊 Total users created: ${criticalUsers.length}`);
    console.log('\n🔐 NEXT STEPS:');
    console.log('1. Update the emails above with your actual admin emails');
    console.log('2. Test login with these accounts');
    console.log('3. Change passwords immediately');
    console.log('4. Enable user registration for customers to re-register');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

restoreCriticalUsers();