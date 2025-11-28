const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/crowdfunding_platform')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));

async function updateLocations() {
  try {
    const updates = [
      { title: 'Tech Startup Series A', location: 'San Francisco, USA' },
      { title: 'the new style', location: 'Global' },
      { title: 'Urban Vertical Farm', location: 'São Paulo, Brazil' },
      { title: 'Sustainable Fashion Brand Launch', location: 'Rio de Janeiro, Brazil' },
      { title: 'Organic Coffee Plantation Expansion', location: 'Minas Gerais, Brazil' },
      { title: 'Green Energy Solar Farm', location: 'Bahia, Brazil' },
      { title: 'E-Commerce Platform for Local Artisans', location: 'São Paulo, Brazil' },
    ];

    for (const update of updates) {
      const result = await Project.updateOne(
        { title: update.title },
        { $set: { location: update.location } }
      );
      console.log(`Updated "${update.title}" -> ${update.location} (matched: ${result.matchedCount}, modified: ${result.modifiedCount})`);
    }

    console.log('\nAll projects updated successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error updating projects:', error);
    process.exit(1);
  }
}

updateLocations();
