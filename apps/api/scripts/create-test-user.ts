import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const email = 'test@prahok.dev';
    const password = 'password123';
    const username = 'testprahok';
    
    // Check if user already exists by email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log('Test user already exists, updating password...');
      // Update password for existing user
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      console.log('Password updated successfully!');
    } else {
      // Check if username is taken
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      });
      
      let finalUsername = username;
      if (existingUsername) {
        finalUsername = `${username}_${Date.now()}`;
        console.log(`Username taken, using: ${finalUsername}`);
      }
      
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email,
          username: finalUsername,
          password: hashedPassword
        }
      });
      console.log('Test user created successfully!');
    }
    
    console.log('\n✅ Test Credentials:');
    console.log('Email: test@prahok.dev');
    console.log('Password: password123');
    console.log('\nYou can now login with these credentials!');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();