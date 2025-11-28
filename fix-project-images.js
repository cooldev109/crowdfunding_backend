const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/crowdfunding_platform')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));

async function fixProjectImages() {
  try {
    const updates = [
      {
        title: 'Tech Startup Series A',
        imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800' // Tech/startup office
      },
      {
        title: 'the new style',
        imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800' // Music/audio equipment
      }
    ];

    for (const update of updates) {
      const result = await Project.updateOne(
        { title: update.title },
        { $set: { imageUrl: update.imageUrl } }
      );
      console.log(`Updated "${update.title}" -> ${update.imageUrl} (matched: ${result.matchedCount}, modified: ${result.modifiedCount})`);
    }

    console.log('\nAll project images updated successfully!');

    // Verify all projects have images
    const projectsWithoutImages = await Project.find({
      $or: [
        { imageUrl: { $exists: false } },
        { imageUrl: null },
        { imageUrl: '' }
      ]
    });

    if (projectsWithoutImages.length > 0) {
      console.log('\n⚠️  Projects still missing images:');
      projectsWithoutImages.forEach(p => console.log(`  - ${p.title}`));
    } else {
      console.log('\n✅ All projects have valid image URLs!');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error updating projects:', error);
    process.exit(1);
  }
}

fixProjectImages();
