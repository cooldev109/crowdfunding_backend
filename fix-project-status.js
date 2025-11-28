/**
 * Database migration script to fix project statuses
 * Updates any projects with invalid 'pending' status to 'active'
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/investflow')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Define Project schema (minimal version)
const projectSchema = new mongoose.Schema({
  title: String,
  status: String,
  targetAmount: Number,
  fundedAmount: Number,
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

async function fixProjectStatuses() {
  try {
    console.log('\n🔍 Checking for projects with invalid status...\n');

    // Find all projects
    const allProjects = await Project.find({});
    console.log(`Found ${allProjects.length} total projects\n`);

    // Find projects with 'pending' status
    const pendingProjects = allProjects.filter(p => p.status === 'pending');

    if (pendingProjects.length === 0) {
      console.log('✅ No projects with "pending" status found. All good!');
    } else {
      console.log(`⚠️  Found ${pendingProjects.length} projects with "pending" status:\n`);

      for (const project of pendingProjects) {
        console.log(`   - ${project.title} (${project._id})`);
        console.log(`     Current status: "${project.status}"`);

        // Determine correct status based on funding
        let newStatus = 'active';
        if (project.fundedAmount >= project.targetAmount) {
          newStatus = 'funded';
        }

        // Update to active
        project.status = newStatus;
        await project.save();
        console.log(`     ✅ Updated to: "${newStatus}"\n`);
      }

      console.log(`✅ Successfully updated ${pendingProjects.length} projects!`);
    }

    // Show summary of all project statuses
    console.log('\n📊 Current project status summary:');
    const statusCounts = {};
    allProjects.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });

    Object.keys(statusCounts).forEach(status => {
      console.log(`   ${status}: ${statusCounts[status]}`);
    });

    console.log('\n✅ Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Error fixing project statuses:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

// Run the migration
fixProjectStatuses();
