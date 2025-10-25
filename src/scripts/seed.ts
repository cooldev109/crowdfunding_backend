import mongoose from 'mongoose';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Investment } from '../models/Investment';
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
    await Investment.deleteMany({});
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
        isPremium: false,
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
        isPremium: true,
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
        isPremium: false,
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
        isPremium: true,
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
        isPremium: false,
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
        isPremium: false,
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
        isPremium: true,
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
        isPremium: true,
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
        isPremium: false,
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
        isPremium: true,
        imageUrl:
          'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800',
        createdBy: admin._id,
      },
      {
        title: 'AI-Powered Healthcare Diagnostics System',
        description:
          'Revolutionary AI system for early disease detection using machine learning and medical imaging. The platform integrates with existing hospital infrastructure and has shown 95% accuracy in clinical trials. Targeting hospitals and diagnostic centers across Latin America.',
        category: 'Healthcare',
        minInvestment: 30000,
        roiPercent: 42,
        targetAmount: 12000000,
        fundedAmount: 6500000,
        durationMonths: 48,
        status: 'active' as const,
        isPremium: true,
        imageUrl:
          'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Blockchain-Based Supply Chain Platform',
        description:
          'Enterprise blockchain solution for transparent supply chain management. Provides real-time tracking, authenticity verification, and automated smart contracts. Already partnered with 50+ global manufacturers and distributors.',
        category: 'Technology',
        minInvestment: 20000,
        roiPercent: 38,
        targetAmount: 8500000,
        fundedAmount: 4250000,
        durationMonths: 36,
        status: 'active' as const,
        isPremium: true,
        imageUrl:
          'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Premium Wine Estate and Vineyard',
        description:
          'Acquisition and modernization of a historic wine estate in Southern Brazil. Includes 200 hectares of vineyards, state-of-the-art wine production facilities, and luxury tasting room. Targeting premium wine export markets in Europe and Asia.',
        category: 'Agriculture',
        minInvestment: 50000,
        roiPercent: 26,
        targetAmount: 18000000,
        fundedAmount: 9000000,
        durationMonths: 72,
        status: 'active' as const,
        isPremium: true,
        imageUrl:
          'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Space Technology Satellite Network',
        description:
          'Development and deployment of low-orbit satellite constellation for global internet coverage. Focused on providing high-speed connectivity to underserved regions. First phase includes 20 satellites with plans to scale to 200.',
        category: 'Technology',
        minInvestment: 100000,
        roiPercent: 55,
        targetAmount: 50000000,
        fundedAmount: 25000000,
        durationMonths: 60,
        status: 'active' as const,
        isPremium: true,
        imageUrl:
          'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Luxury Smart City Development',
        description:
          'Construction of a sustainable smart city district with 5,000 residential units, commercial spaces, and green areas. Features include IoT infrastructure, renewable energy, automated waste management, and autonomous transportation.',
        category: 'Real Estate',
        minInvestment: 75000,
        roiPercent: 32,
        targetAmount: 100000000,
        fundedAmount: 45000000,
        durationMonths: 96,
        status: 'active' as const,
        isPremium: true,
        imageUrl:
          'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Advanced Robotics Manufacturing',
        description:
          'Production facility for industrial and service robots powered by AI. Robots designed for warehouse automation, healthcare assistance, and manufacturing. Pre-orders from 30+ enterprise clients worth $15M.',
        category: 'Technology',
        minInvestment: 40000,
        roiPercent: 45,
        targetAmount: 20000000,
        fundedAmount: 12000000,
        durationMonths: 48,
        status: 'active' as const,
        isPremium: true,
        imageUrl:
          'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Quantum Computing Research Center',
        description:
          'Establishment of Latin America\'s first quantum computing research and development center. Partnerships with leading universities and tech companies. Focus on cryptography, drug discovery, and financial modeling applications.',
        category: 'Technology',
        minInvestment: 80000,
        roiPercent: 50,
        targetAmount: 35000000,
        fundedAmount: 18000000,
        durationMonths: 60,
        status: 'active' as const,
        isPremium: true,
        imageUrl:
          'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Offshore Wind Energy Farm',
        description:
          'Large-scale offshore wind farm project off the coast of Rio Grande do Sul. 100 wind turbines generating 500MW of clean energy. Long-term power purchase agreements with major industrial consumers already secured.',
        category: 'Energy',
        minInvestment: 60000,
        roiPercent: 29,
        targetAmount: 75000000,
        fundedAmount: 30000000,
        durationMonths: 72,
        status: 'active' as const,
        isPremium: true,
        imageUrl:
          'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=800',
        createdBy: admin._id,
      },
      {
        title: 'Biotechnology Gene Therapy Research',
        description:
          'Cutting-edge gene therapy research facility focused on treating genetic disorders. FDA Fast Track designation received for lead drug candidate. Clinical trials showing promising results for rare diseases affecting 100,000+ patients globally.',
        category: 'Healthcare',
        minInvestment: 90000,
        roiPercent: 65,
        targetAmount: 45000000,
        fundedAmount: 22500000,
        durationMonths: 84,
        status: 'active' as const,
        isPremium: true,
        imageUrl:
          'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800',
        createdBy: admin._id,
      },
      {
        title: 'International Film Production Studio',
        description:
          'State-of-the-art film and TV production complex with sound stages, post-production facilities, and VFX studios. Attracting major international productions with competitive tax incentives and world-class infrastructure.',
        category: 'Entertainment',
        minInvestment: 35000,
        roiPercent: 36,
        targetAmount: 25000000,
        fundedAmount: 15000000,
        durationMonths: 54,
        status: 'active' as const,
        isPremium: true,
        imageUrl:
          'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800',
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
    console.log(`   - ${projects.filter(p => p.isPremium).length} Premium Projects`);
    console.log(`   - ${projects.filter(p => !p.isPremium).length} Regular Projects`);
    console.log(`   - Multiple Categories\n`);

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
