const mongoose = require('mongoose');
require('dotenv').config();

async function makePremium() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdfunding');
    console.log('Connected to MongoDB');

    // Find all users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('\nUsers in database:');
    users.forEach(u => console.log('- ' + u.email + ' (isPremium: ' + u.isPremium + ')'));

    if (users.length > 0) {
      // Make the first user premium
      const result = await mongoose.connection.db.collection('users').updateOne(
        { _id: users[0]._id },
        { $set: { isPremium: true, planKey: 'premium' } }
      );
      console.log('\nUpdated user "' + users[0].email + '" to premium');
      console.log('Modified count:', result.modifiedCount);
    } else {
      console.log('\nNo users found in database');
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

makePremium();
