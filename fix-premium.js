const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/crowdfunding_platform').then(async () => {
  // Update all non-active projects to active
  const result = await mongoose.connection.db.collection('projects').updateMany(
    { status: { $ne: 'active' } },
    { $set: { status: 'active' } }
  );
  console.log('Updated', result.modifiedCount, 'projects to active');

  // Also ensure none are premium
  const result2 = await mongoose.connection.db.collection('projects').updateMany(
    { isPremium: true },
    { $set: { isPremium: false } }
  );
  console.log('Updated', result2.modifiedCount, 'projects to non-premium');

  // Fix minInvestment - set to a reasonable amount (100,000 COP = ~$25 USD)
  const result3 = await mongoose.connection.db.collection('projects').updateMany(
    { minInvestment: { $gt: 1000000 } },
    { $set: { minInvestment: 100000 } }
  );
  console.log('Updated', result3.modifiedCount, 'projects minInvestment to 100,000 COP');

  // Show all projects
  const projects = await mongoose.connection.db.collection('projects').find({}).toArray();
  console.log('All projects:');
  projects.forEach(p => console.log(p._id.toString(), '-', p.title, '- status:', p.status, '- premium:', p.isPremium));

  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
