import mongoose from 'mongoose';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { AuthService } from '../services/authService';
import { ENV } from '../config/env';
import { logger } from '../config/logger';

/**
 * Database Seeder Script
 * Creates test users (admin + investor) and sample projects
 */

async function seed() {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(ENV.MONGO_URI);
    logger.info('MongoDB connected');

    // Clear existing data
    logger.info('Clearing existing data...');
    await User.deleteMany({});
    await Project.deleteMany({});
    logger.info('Data cleared');

    // Create Admin User
    logger.info('Creating admin user...');
    const adminPassword = await AuthService.hashPassword('admin123');
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@investflow.com',
      passwordHash: adminPassword,
      phone: '+55 11 98765-4321',
      role: 'admin',
      planKey: 'premium',
      planStatus: 'active',
      isVerified: true,
      lastLogin: new Date(),
    });
    logger.info(`Admin created: ${admin.email}`);

    // Create Investor User
    logger.info('Creating investor user...');
    const investorPassword = await AuthService.hashPassword('investor123');
    const investor = await User.create({
      name: 'Test Investor',
      email: 'investor@test.com',
      passwordHash: investorPassword,
      phone: '+55 11 91234-5678',
      role: 'investor',
      planKey: 'free',
      planStatus: 'active',
      isVerified: true,
      lastLogin: new Date(),
    });
    logger.info(`Investor created: ${investor.email}`);

    // Create Sample Projects
    logger.info('Creating sample projects...');

    const projects = [
      {
        title: 'Green Energy Solar Farm',
        description:
          'Large-scale solar energy farm project in the state of Bahia, Brazil. This project aims to provide clean, renewable energy to over 5,000 homes while reducing carbon emissions by 10,000 tons annually. The solar farm will span 50 hectares and include state-of-the-art photovoltaic panels with a 25-year warranty.',
        category: 'Energy',
        minInvestment: 5000,
        roiPercent: 18,
        targetAmount: 2500000,
        fundedAmount: 875000,
        durationMonths: 36,
        status: 'active' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Tech Startup Series A Funding',
        description:
          'Series A funding round for an innovative fintech startup developing AI-powered personal finance management tools. The company has already acquired 50,000 active users and generated $500K in revenue in the first year. Funds will be used for product development, marketing expansion, and hiring key team members.',
        category: 'Technology',
        minInvestment: 10000,
        roiPercent: 35,
        targetAmount: 5000000,
        fundedAmount: 3250000,
        durationMonths: 24,
        status: 'active' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Organic Coffee Plantation Expansion',
        description:
          'Expansion project for an established organic coffee plantation in Minas Gerais. The investment will fund the acquisition of 100 additional hectares, new processing equipment, and direct trade relationships with international buyers. The plantation is certified organic and fair trade.',
        category: 'Agriculture',
        minInvestment: 2000,
        roiPercent: 22,
        targetAmount: 800000,
        fundedAmount: 640000,
        durationMonths: 48,
        status: 'active' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Luxury Beachfront Resort Development',
        description:
          'Development of a 5-star eco-resort on the coast of Bahia featuring 50 luxury suites, spa facilities, three restaurants, and sustainable architecture. The resort will cater to high-end tourism while maintaining environmental sustainability through solar power, rainwater harvesting, and local sourcing.',
        category: 'Real Estate',
        minInvestment: 25000,
        roiPercent: 28,
        targetAmount: 15000000,
        fundedAmount: 4500000,
        durationMonths: 60,
        status: 'active' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
        createdBy: admin._id,
      },
      {
        title: 'E-Commerce Platform for Local Artisans',
        description:
          'Building a dedicated e-commerce platform connecting Brazilian artisans with international markets. The platform will feature integrated payment processing, logistics support, and marketing tools. Currently serving 200 artisans with plans to expand to 2,000 in the next 18 months.',
        category: 'Technology',
        minInvestment: 1000,
        roiPercent: 30,
        targetAmount: 1200000,
        fundedAmount: 960000,
        durationMonths: 30,
        status: 'active' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Urban Vertical Farm',
        description:
          'Innovative vertical farming facility in São Paulo producing fresh vegetables and herbs using hydroponic systems. The facility uses 95% less water than traditional farming and can produce year-round harvests. Targeting local restaurants, grocery stores, and direct-to-consumer delivery.',
        category: 'Agriculture',
        minInvestment: 3000,
        roiPercent: 20,
        targetAmount: 1500000,
        fundedAmount: 900000,
        durationMonths: 36,
        status: 'active' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Electric Vehicle Charging Network',
        description:
          'Deployment of 500 fast-charging stations for electric vehicles across major Brazilian cities. Strategic locations include shopping centers, gas stations, and highway rest stops. Partnership agreements already secured with major retailers and property owners.',
        category: 'Energy',
        minInvestment: 15000,
        roiPercent: 25,
        targetAmount: 10000000,
        fundedAmount: 2500000,
        durationMonths: 42,
        status: 'active' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Medical Equipment Manufacturing Plant',
        description:
          'Construction of a modern manufacturing facility for medical equipment and supplies in Rio de Janeiro. The plant will produce high-quality, affordable medical devices for the Latin American market, creating 300 jobs and reducing dependence on imports.',
        category: 'Healthcare',
        minInvestment: 20000,
        roiPercent: 24,
        targetAmount: 8000000,
        fundedAmount: 8000000,
        durationMonths: 48,
        status: 'completed' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Sustainable Fashion Brand Launch',
        description:
          'Launch of an eco-friendly fashion brand using organic cotton and recycled materials. The brand focuses on timeless designs, ethical production, and transparent supply chains. Initial product line includes basics, accessories, and a limited capsule collection.',
        category: 'Fashion',
        minInvestment: 2500,
        roiPercent: 32,
        targetAmount: 600000,
        fundedAmount: 420000,
        durationMonths: 24,
        status: 'active' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Educational Technology Platform',
        description:
          'Development of an AI-powered educational platform providing personalized learning paths for K-12 students. The platform adapts to each student\'s learning style and pace, includes gamification elements, and provides detailed analytics for teachers and parents.',
        category: 'Education',
        minInvestment: 5000,
        roiPercent: 27,
        targetAmount: 3000000,
        fundedAmount: 1500000,
        durationMonths: 36,
        status: 'active' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800',
        createdBy: admin._id,
      },
    ];

    await Project.insertMany(projects);
    logger.info(`Created ${projects.length} sample projects`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📋 Test Accounts Created:\n');

    console.log('👨‍💼 ADMIN ACCOUNT:');
    console.log('   Email:    admin@investflow.com');
    console.log('   Password: admin123');
    console.log('   Role:     admin');
    console.log('   Plan:     premium\n');

    console.log('👤 INVESTOR ACCOUNT:');
    console.log('   Email:    investor@test.com');
    console.log('   Password: investor123');
    console.log('   Role:     investor');
    console.log('   Plan:     free\n');

    console.log(`📊 Sample Data Created:`);
    console.log(`   - ${projects.length} Projects`);
    console.log(`   - ${projects.filter(p => p.status === 'active').length} Active Projects`);
    console.log(`   - ${projects.filter(p => p.status === 'completed').length} Completed Projects`);
    console.log(`   - 8 Different Categories\n`);

    console.log('🚀 You can now:');
    console.log('   1. Start the backend: npm run dev');
    console.log('   2. Login with either account');
    console.log('   3. Browse and test all features\n');
    console.log('='.repeat(60) + '\n');

    // Disconnect
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');

    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Seed failed');
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seed
seed();
