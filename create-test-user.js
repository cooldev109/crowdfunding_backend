const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdfunding');
    console.log('Connected to MongoDB');

    const usersCollection = mongoose.connection.db.collection('users');

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);

    // Create or update test user
    const result = await usersCollection.updateOne(
      { email: 'premium@test.com' },
      {
        $set: {
          fullName: 'Premium Test User',
          email: 'premium@test.com',
          password: hashedPassword,
          role: 'investor',
          isPremium: true,
          planKey: 'premium',
          planStatus: 'active',
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log('\nCreated new premium test user:');
    } else {
      console.log('\nUpdated existing user:');
    }

    console.log('Email: premium@test.com');
    console.log('Password: test123');
    console.log('isPremium: true');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser();
