const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/crowdfunding_platform';

// Premium projects with auction data
const premiumProjects = [
  {
    title: "Apartamento en Chapinero - Remate Judicial",
    description: "Excelente apartamento de 85m2 en zona residencial de Chapinero. Incluye 2 habitaciones, 2 baños, estudio y parqueadero. Ideal para inversión o vivienda.",
    category: "Bienes Raíces",
    location: "Bogotá",
    minInvestment: 50000000,
    roiPercent: 18.5,
    targetAmount: 280000000,
    fundedAmount: 0,
    totalInvestors: 0,
    durationMonths: 6,
    status: "active",
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
    code: "BRA-2024-001",
    city: "Bogotá",
    auctionDate: new Date("2024-11-15"),
    propertyType: "Apartamento",
    judicialAppraisal: 350000000,
    commercialValue: 420000000,
    basePrice: 280000000
  },
  {
    title: "Casa Familiar El Poblado - Oportunidad Única",
    description: "Casa de 3 pisos en El Poblado con 250m2 construidos. 4 habitaciones, sala de estar, jardín privado y 2 parqueaderos. Zona de alta valorización.",
    category: "Bienes Raíces",
    location: "Medellín",
    minInvestment: 80000000,
    roiPercent: 22.3,
    targetAmount: 460000000,
    fundedAmount: 0,
    totalInvestors: 0,
    durationMonths: 8,
    status: "active",
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    code: "BRA-2024-002",
    city: "Medellín",
    auctionDate: new Date("2024-11-18"),
    propertyType: "Casa",
    judicialAppraisal: 580000000,
    commercialValue: 680000000,
    basePrice: 460000000
  },
  {
    title: "Local Comercial Centro - Alta Rentabilidad",
    description: "Local comercial de 120m2 en zona céntrica con alto flujo peatonal. Ideal para retail o servicios. Incluye bodega y baño.",
    category: "Comercial",
    location: "Cali",
    minInvestment: 60000000,
    roiPercent: 25.0,
    targetAmount: 340000000,
    fundedAmount: 0,
    totalInvestors: 0,
    durationMonths: 6,
    status: "active",
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
    code: "BRA-2024-003",
    city: "Cali",
    auctionDate: new Date("2024-11-22"),
    propertyType: "Local Comercial",
    judicialAppraisal: 420000000,
    commercialValue: 510000000,
    basePrice: 340000000
  },
  {
    title: "Oficina Empresarial Zona Norte",
    description: "Oficina de 95m2 en edificio empresarial de Barranquilla. Piso 8 con vista al río. Incluye recepción, 3 oficinas y sala de reuniones.",
    category: "Oficinas",
    location: "Barranquilla",
    minInvestment: 40000000,
    roiPercent: 19.8,
    targetAmount: 230000000,
    fundedAmount: 0,
    totalInvestors: 0,
    durationMonths: 6,
    status: "active",
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    code: "BRA-2024-004",
    city: "Barranquilla",
    auctionDate: new Date("2024-11-25"),
    propertyType: "Oficina",
    judicialAppraisal: 290000000,
    commercialValue: 350000000,
    basePrice: 230000000
  },
  {
    title: "Apartamento Frente al Mar - Premium",
    description: "Espectacular apartamento de 150m2 con vista directa al mar. 3 habitaciones, terraza amplia y acceso a playa privada. Zona turística de alto valor.",
    category: "Bienes Raíces",
    location: "Cartagena",
    minInvestment: 100000000,
    roiPercent: 28.5,
    targetAmount: 520000000,
    fundedAmount: 0,
    totalInvestors: 0,
    durationMonths: 10,
    status: "active",
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    code: "BRA-2024-005",
    city: "Cartagena",
    auctionDate: new Date("2024-11-28"),
    propertyType: "Apartamento",
    judicialAppraisal: 650000000,
    commercialValue: 780000000,
    basePrice: 520000000
  },
  {
    title: "Bodega Industrial Zona Franca",
    description: "Bodega de 800m2 en zona industrial con acceso directo a vía principal. Altura de 8m, portería 24h y sistema contra incendios. Ideal para logística.",
    category: "Industrial",
    location: "Bogotá",
    minInvestment: 150000000,
    roiPercent: 21.0,
    targetAmount: 960000000,
    fundedAmount: 0,
    totalInvestors: 0,
    durationMonths: 12,
    status: "active",
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800",
    code: "BRA-2024-006",
    city: "Bogotá",
    auctionDate: new Date("2024-12-02"),
    propertyType: "Bodega",
    judicialAppraisal: 1200000000,
    commercialValue: 1450000000,
    basePrice: 960000000
  },
  {
    title: "Casa Campestre con Terreno",
    description: "Hermosa casa campestre de 180m2 con 2000m2 de terreno. 3 habitaciones, piscina, zona BBQ y huerta. A 30 minutos del centro de Bucaramanga.",
    category: "Bienes Raíces",
    location: "Bucaramanga",
    minInvestment: 65000000,
    roiPercent: 20.5,
    targetAmount: 380000000,
    fundedAmount: 0,
    totalInvestors: 0,
    durationMonths: 8,
    status: "active",
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    code: "BRA-2024-007",
    city: "Bucaramanga",
    auctionDate: new Date("2024-12-05"),
    propertyType: "Casa",
    judicialAppraisal: 480000000,
    commercialValue: 560000000,
    basePrice: 380000000
  },
  {
    title: "Apartamento Nuevo Sector Exclusivo",
    description: "Apartamento moderno de 75m2 en conjunto residencial con gimnasio, piscina y zonas verdes. 2 habitaciones y estudio. Excelente acabados.",
    category: "Bienes Raíces",
    location: "Pereira",
    minInvestment: 45000000,
    roiPercent: 17.8,
    targetAmount: 260000000,
    fundedAmount: 0,
    totalInvestors: 0,
    durationMonths: 6,
    status: "active",
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    code: "BRA-2024-008",
    city: "Pereira",
    auctionDate: new Date("2024-12-08"),
    propertyType: "Apartamento",
    judicialAppraisal: 320000000,
    commercialValue: 390000000,
    basePrice: 260000000
  },
  {
    title: "Local en Centro Comercial Turístico",
    description: "Local de 85m2 en centro comercial de zona turística. Alto tráfico de visitantes, ideal para comercio de souvenirs, ropa o gastronomía.",
    category: "Comercial",
    location: "Santa Marta",
    minInvestment: 75000000,
    roiPercent: 26.2,
    targetAmount: 440000000,
    fundedAmount: 0,
    totalInvestors: 0,
    durationMonths: 8,
    status: "active",
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800",
    code: "BRA-2024-009",
    city: "Santa Marta",
    auctionDate: new Date("2024-12-12"),
    propertyType: "Local Comercial",
    judicialAppraisal: 550000000,
    commercialValue: 650000000,
    basePrice: 440000000
  },
  {
    title: "Oficina Corporativa Centro Financiero",
    description: "Oficina ejecutiva de 110m2 en torre de oficinas clase A. Incluye 4 oficinas privadas, sala de juntas y kitchenette. Estacionamiento incluido.",
    category: "Oficinas",
    location: "Manizales",
    minInvestment: 55000000,
    roiPercent: 18.9,
    targetAmount: 300000000,
    fundedAmount: 0,
    totalInvestors: 0,
    durationMonths: 6,
    status: "active",
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800",
    code: "BRA-2024-010",
    city: "Manizales",
    auctionDate: new Date("2024-12-15"),
    propertyType: "Oficina",
    judicialAppraisal: 380000000,
    commercialValue: 450000000,
    basePrice: 300000000
  },
  {
    title: "Bodega Logística con Muelles",
    description: "Bodega de 600m2 con 2 muelles de carga y descarga. Oficinas administrativas de 80m2, sistema de vigilancia y amplio parqueadero.",
    category: "Industrial",
    location: "Cúcuta",
    minInvestment: 120000000,
    roiPercent: 23.5,
    targetAmount: 680000000,
    fundedAmount: 0,
    totalInvestors: 0,
    durationMonths: 10,
    status: "active",
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800",
    code: "BRA-2024-011",
    city: "Cúcuta",
    auctionDate: new Date("2024-12-18"),
    propertyType: "Bodega",
    judicialAppraisal: 850000000,
    commercialValue: 980000000,
    basePrice: 680000000
  },
  {
    title: "Casa Esquinera Sector Residencial",
    description: "Casa esquinera de 200m2 en barrio tradicional. 4 habitaciones, patio amplio y local comercial en primer piso. Ideal para uso mixto.",
    category: "Bienes Raíces",
    location: "Ibagué",
    minInvestment: 58000000,
    roiPercent: 19.2,
    targetAmount: 340000000,
    fundedAmount: 0,
    totalInvestors: 0,
    durationMonths: 6,
    status: "active",
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
    code: "BRA-2024-012",
    city: "Ibagué",
    auctionDate: new Date("2024-12-20"),
    propertyType: "Casa",
    judicialAppraisal: 420000000,
    commercialValue: 500000000,
    basePrice: 340000000
  },
  {
    title: "Apartaestudio Zona Universitaria",
    description: "Apartaestudio de 45m2 cerca a universidades principales. Ideal para renta estudiantil con alta demanda. Incluye cocina integral y closet.",
    category: "Bienes Raíces",
    location: "Villavicencio",
    minInvestment: 35000000,
    roiPercent: 24.0,
    targetAmount: 220000000,
    fundedAmount: 0,
    totalInvestors: 0,
    durationMonths: 4,
    status: "active",
    isPremium: true,
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    code: "BRA-2024-013",
    city: "Villavicencio",
    auctionDate: new Date("2024-12-22"),
    propertyType: "Apartamento",
    judicialAppraisal: 280000000,
    commercialValue: 340000000,
    basePrice: 220000000
  }
];

async function seedPremiumProjects() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');
    const usersCollection = db.collection('users');

    // Find an admin user to set as creator
    let adminUser = await usersCollection.findOne({ role: 'admin' });

    if (!adminUser) {
      // Find any user
      adminUser = await usersCollection.findOne({});
    }

    if (!adminUser) {
      console.log('No users found. Creating a default admin user...');
      const result = await usersCollection.insertOne({
        fullName: 'Admin User',
        email: 'admin@example.com',
        password: '$2a$10$dummy', // This won't be used for login
        role: 'admin',
        isPremium: true,
        planKey: 'premium',
        planStatus: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      adminUser = { _id: result.insertedId };
    }

    console.log('Using creator ID:', adminUser._id);

    // Delete existing premium projects
    const deleteResult = await projectsCollection.deleteMany({ isPremium: true });
    console.log(`Deleted ${deleteResult.deletedCount} existing premium projects`);

    // Insert new premium projects
    const projectsWithCreator = premiumProjects.map(p => ({
      ...p,
      createdBy: adminUser._id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const insertResult = await projectsCollection.insertMany(projectsWithCreator);
    console.log(`Inserted ${insertResult.insertedCount} premium projects`);

    // Verify
    const count = await projectsCollection.countDocuments({ isPremium: true });
    console.log(`\nTotal premium projects in database: ${count}`);

    const projects = await projectsCollection.find({ isPremium: true }).toArray();
    console.log('\nPremium projects:');
    projects.forEach(p => {
      console.log(`- ${p.code}: ${p.title} (${p.city}, ${p.propertyType})`);
    });

  } catch (error) {
    console.error('Error seeding projects:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seedPremiumProjects();
