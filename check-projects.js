const mongoose = require('mongoose');
require('dotenv').config();

async function checkProjects() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdfunding');

  const allProjects = await mongoose.connection.db.collection('projects').find({}).toArray();
  console.log('Total projects:', allProjects.length);

  const premiumProjects = allProjects.filter(p => p.isPremium === true);
  const nonPremiumProjects = allProjects.filter(p => p.isPremium !== true);

  console.log('\nisPremium=true:', premiumProjects.length);
  console.log('isPremium not true:', nonPremiumProjects.length);

  console.log('\n--- NON-PREMIUM Projects (first 5) ---');
  nonPremiumProjects.slice(0, 5).forEach(p => {
    console.log('- ' + p._id + ': ' + p.title + ' (isPremium: ' + p.isPremium + ')');
  });

  console.log('\n--- PREMIUM Projects ---');
  premiumProjects.forEach(p => {
    console.log('- ' + (p.code || 'NO-CODE') + ': ' + p.title);
  });

  await mongoose.disconnect();
}

checkProjects();
