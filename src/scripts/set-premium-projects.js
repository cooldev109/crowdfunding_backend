const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/investment-platform';

// Project schema (simplified for this script)
const projectSchema = new mongoose.Schema({
  title: String,
  isPremium: Boolean,
}, { collection: 'projects' });

const Project = mongoose.model('Project', projectSchema);

async function setPremiumProjects() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all projects
    const allProjects = await Project.find({}).sort({ createdAt: 1 });
    console.log(`Found ${allProjects.length} total projects`);

    if (allProjects.length === 0) {
      console.log('No projects found in database');
      return;
    }

    // First, set all projects to premium
    await Project.updateMany({}, { $set: { isPremium: true } });
    console.log('Set all projects to premium');

    // Then, set only the first 5 to free (isPremium: false)
    const freeProjectIds = allProjects.slice(0, 5).map(p => p._id);
    await Project.updateMany(
      { _id: { $in: freeProjectIds } },
      { $set: { isPremium: false } }
    );
    console.log('Set first 5 projects to free (isPremium: false)');

    // Verify the changes
    const freeProjects = await Project.find({ isPremium: false });
    const premiumProjects = await Project.find({ isPremium: true });

    console.log('\n--- Results ---');
    console.log(`Free projects (isPremium: false): ${freeProjects.length}`);
    freeProjects.forEach(p => console.log(`  - ${p.title}`));

    console.log(`\nPremium projects (isPremium: true): ${premiumProjects.length}`);
    premiumProjects.forEach(p => console.log(`  - ${p.title}`));

    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

setPremiumProjects();
