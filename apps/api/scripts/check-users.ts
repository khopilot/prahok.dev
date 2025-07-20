import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true
      }
    });
    
    console.log('Existing users in database:');
    console.log('============================');
    
    if (users.length === 0) {
      console.log('No users found in database.');
      console.log('\nYou can create a new user by signing up with any email.');
    } else {
      users.forEach(user => {
        console.log(`Email: ${user.email}`);
        console.log(`Username: ${user.username}`);
        console.log(`Created: ${user.createdAt}`);
        console.log('---');
      });
      console.log(`\nTotal users: ${users.length}`);
    }
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();