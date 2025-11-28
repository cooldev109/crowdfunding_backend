const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdfunding';

// Auction data to assign to premium projects
const auctionDataList = [
  {
    code: "BRA-2024-001",
    city: "Bogotá",
    auctionDate: new Date("2024-11-15"),
    propertyType: "Apartamento",
    judicialAppraisal: 350000000,
    commercialValue: 420000000,
    basePrice: 280000000
  },
  {
    code: "BRA-2024-002",
    city: "Medellín",
    auctionDate: new Date("2024-11-18"),
    propertyType: "Casa",
    judicialAppraisal: 580000000,
    commercialValue: 680000000,
    basePrice: 460000000
  },
  {
    code: "BRA-2024-003",
    city: "Cali",
    auctionDate: new Date("2024-11-22"),
    propertyType: "Local Comercial",
    judicialAppraisal: 420000000,
    commercialValue: 510000000,
    basePrice: 340000000
  },
  {
    code: "BRA-2024-004",
    city: "Barranquilla",
    auctionDate: new Date("2024-11-25"),
    propertyType: "Oficina",
    judicialAppraisal: 290000000,
    commercialValue: 350000000,
    basePrice: 230000000
  },
  {
    code: "BRA-2024-005",
    city: "Cartagena",
    auctionDate: new Date("2024-11-28"),
    propertyType: "Apartamento",
    judicialAppraisal: 650000000,
    commercialValue: 780000000,
    basePrice: 520000000
  },
  {
    code: "BRA-2024-006",
    city: "Bogotá",
    auctionDate: new Date("2024-12-02"),
    propertyType: "Bodega",
    judicialAppraisal: 1200000000,
    commercialValue: 1450000000,
    basePrice: 960000000
  },
  {
    code: "BRA-2024-007",
    city: "Bucaramanga",
    auctionDate: new Date("2024-12-05"),
    propertyType: "Casa",
    judicialAppraisal: 480000000,
    commercialValue: 560000000,
    basePrice: 380000000
  },
  {
    code: "BRA-2024-008",
    city: "Pereira",
    auctionDate: new Date("2024-12-08"),
    propertyType: "Apartamento",
    judicialAppraisal: 320000000,
    commercialValue: 390000000,
    basePrice: 260000000
  },
  {
    code: "BRA-2024-009",
    city: "Santa Marta",
    auctionDate: new Date("2024-12-12"),
    propertyType: "Local Comercial",
    judicialAppraisal: 550000000,
    commercialValue: 650000000,
    basePrice: 440000000
  },
  {
    code: "BRA-2024-010",
    city: "Manizales",
    auctionDate: new Date("2024-12-15"),
    propertyType: "Oficina",
    judicialAppraisal: 380000000,
    commercialValue: 450000000,
    basePrice: 300000000
  },
  {
    code: "BRA-2024-011",
    city: "Cúcuta",
    auctionDate: new Date("2024-12-18"),
    propertyType: "Bodega",
    judicialAppraisal: 850000000,
    commercialValue: 980000000,
    basePrice: 680000000
  },
  {
    code: "BRA-2024-012",
    city: "Ibagué",
    auctionDate: new Date("2024-12-20"),
    propertyType: "Casa",
    judicialAppraisal: 420000000,
    commercialValue: 500000000,
    basePrice: 340000000
  },
  {
    code: "BRA-2024-013",
    city: "Villavicencio",
    auctionDate: new Date("2024-12-22"),
    propertyType: "Apartamento",
    judicialAppraisal: 280000000,
    commercialValue: 340000000,
    basePrice: 220000000
  }
];

async function updatePremiumProjects() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');

    // Find all premium projects
    const premiumProjects = await projectsCollection.find({ isPremium: true }).toArray();
    console.log(`Found ${premiumProjects.length} premium projects`);

    // Update each premium project with auction data
    for (let i = 0; i < premiumProjects.length; i++) {
      const project = premiumProjects[i];
      const auctionData = auctionDataList[i % auctionDataList.length]; // Cycle through if more projects than data

      await projectsCollection.updateOne(
        { _id: project._id },
        {
          $set: {
            code: auctionData.code,
            city: auctionData.city,
            auctionDate: auctionData.auctionDate,
            propertyType: auctionData.propertyType,
            judicialAppraisal: auctionData.judicialAppraisal,
            commercialValue: auctionData.commercialValue,
            basePrice: auctionData.basePrice
          }
        }
      );

      console.log(`Updated project "${project.title}" with code ${auctionData.code}`);
    }

    console.log('\nAll premium projects updated successfully!');

    // Verify the update
    const updatedProjects = await projectsCollection.find({ isPremium: true }).toArray();
    console.log('\nUpdated premium projects:');
    updatedProjects.forEach(p => {
      console.log(`- ${p.title}: Code=${p.code}, City=${p.city}, Type=${p.propertyType}`);
    });

  } catch (error) {
    console.error('Error updating projects:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

updatePremiumProjects();
