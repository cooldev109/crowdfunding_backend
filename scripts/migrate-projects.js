/**
 * Migration script to add new fields to existing projects
 * Run with: node scripts/migrate-projects.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdfunding_platform';

async function migrateProjects() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');

    // Count existing projects
    const totalProjects = await projectsCollection.countDocuments();
    console.log(`Found ${totalProjects} projects to migrate`);

    if (totalProjects === 0) {
      console.log('No projects to migrate');
      return;
    }

    // Update all projects with new fields (only if they don't exist)
    const result = await projectsCollection.updateMany(
      {}, // Match all documents
      [
        {
          $set: {
            // Add totalUnits if not exists (default: 100)
            totalUnits: { $ifNull: ['$totalUnits', 100] },

            // Add featured if not exists (default: false)
            featured: { $ifNull: ['$featured', false] },

            // Calculate unitPrice if not exists
            unitPrice: {
              $ifNull: [
                '$unitPrice',
                { $floor: { $divide: ['$targetAmount', { $ifNull: ['$totalUnits', 100] }] } }
              ]
            },

            // Set roiMin and roiMax from roiPercent if not exists
            roiMin: {
              $ifNull: [
                '$roiMin',
                { $max: [0, { $subtract: ['$roiPercent', 2] }] }
              ]
            },
            roiMax: {
              $ifNull: [
                '$roiMax',
                { $add: ['$roiPercent', 2] }
              ]
            },

            // Set investment period range from durationMonths if not exists
            investmentPeriodMin: { $ifNull: ['$investmentPeriodMin', '$durationMonths'] },
            investmentPeriodMax: { $ifNull: ['$investmentPeriodMax', '$durationMonths'] },

            // Set deadline from endDate or calculate from createdAt + durationMonths
            deadline: {
              $ifNull: [
                '$deadline',
                {
                  $ifNull: [
                    '$endDate',
                    {
                      $add: [
                        '$createdAt',
                        { $multiply: ['$durationMonths', 30, 24, 60, 60, 1000] }
                      ]
                    }
                  ]
                }
              ]
            },

            // Initialize empty arrays if not exists
            galleryImages: { $ifNull: ['$galleryImages', []] },
            keyFeatures: { $ifNull: ['$keyFeatures', []] },
            milestones: { $ifNull: ['$milestones', []] }
          }
        }
      ]
    );

    console.log(`Migration complete!`);
    console.log(`  - Matched: ${result.matchedCount} documents`);
    console.log(`  - Modified: ${result.modifiedCount} documents`);

    // Show a sample of the migrated data
    const sampleProject = await projectsCollection.findOne();
    if (sampleProject) {
      console.log('\nSample migrated project fields:');
      console.log(`  - totalUnits: ${sampleProject.totalUnits}`);
      console.log(`  - unitPrice: ${sampleProject.unitPrice}`);
      console.log(`  - featured: ${sampleProject.featured}`);
      console.log(`  - roiMin: ${sampleProject.roiMin}`);
      console.log(`  - roiMax: ${sampleProject.roiMax}`);
      console.log(`  - investmentPeriodMin: ${sampleProject.investmentPeriodMin}`);
      console.log(`  - investmentPeriodMax: ${sampleProject.investmentPeriodMax}`);
      console.log(`  - deadline: ${sampleProject.deadline}`);
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

migrateProjects();
