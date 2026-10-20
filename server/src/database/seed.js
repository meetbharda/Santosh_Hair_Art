import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Santosh Hair Art Database Seed ---');

  // 1. Business Settings
  await prisma.businessSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      businessName: 'Santosh Hair Art',
      tagline: 'Master Barbering & Grooming Studio',
      phoneNumber: '+91 95378 51649',
      whatsappNumber: '+91 95378 51649',
      email: 'contact@santoshhairart.in',
      address: 'Near ST Bus Station, Chock, Gaffar Belim, Mangrol, Gujarat 362225, India',
      googleMapsUrl: 'https://maps.app.goo.gl/1NHaQgexgWuvfmq16',
      latitude: 21.1889284,
      longitude: 70.0476545,
      timezone: 'Asia/Kolkata',
      slotIntervalMinutes: 30,
      leadTimeHours: 1,
      maxAdvanceDays: 30,
      cancellationCutoffHrs: 2,
      bufferTimeMinutes: 5,
      currency: 'INR',
      isAutoConfirm: true
    }
  });
  console.log('✔ Business settings seeded');

  // 2. Business Hours (0=Sunday to 6=Saturday)
  for (let day = 0; day <= 6; day++) {
    const bh = await prisma.businessHour.upsert({
      where: { dayOfWeek: day },
      update: {},
      create: {
        dayOfWeek: day,
        isClosed: false,
        openTime: '09:00',
        closeTime: '21:00'
      }
    });

    // Seed lunch break if not existing
    const existingBreak = await prisma.businessBreak.findFirst({
      where: { businessHourId: bh.id }
    });

    if (!existingBreak) {
      await prisma.businessBreak.create({
        data: {
          businessHourId: bh.id,
          name: 'Afternoon Break',
          startTime: '13:30',
          endTime: '14:30'
        }
      });
    }
  }
  console.log('✔ Business hours and breaks seeded (Mon-Sun 9:00 - 21:00, Break 13:30-14:30)');

  // 3. Service Categories
  const categories = [
    { name: 'Hair & Styling', description: 'Precision cuts, fades, and traditional artisanal styling', displayOrder: 1 },
    { name: 'Beard & Shave', description: 'Hot towel straight-razor shaves, beard trimming and sculpting', displayOrder: 2 },
    { name: 'Color & Hair Care', description: 'Scalp treatments, premium hair coloring, and keratin care', displayOrder: 3 },
    { name: 'Facial & Relaxation', description: 'De-tanning, deep cleanse herbal facials, and head massage', displayOrder: 4 },
    { name: 'Signature Packages', description: 'Curated grooming rituals for weddings and special occasions', displayOrder: 5 }
  ];

  const catMap = {};
  for (const cat of categories) {
    const createdCat = await prisma.serviceCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat
    });
    catMap[cat.name] = createdCat.id;
  }
  console.log('✔ Service categories seeded');

  // 4. Services
  const services = [
    {
      category: 'Hair & Styling',
      name: 'Signature Precision Haircut',
      description: 'Consultation, master scissor & clipper cut, neck shave, and clean blow-dry style.',
      pricePaise: 15000, // ₹150
      durationMinutes: 30,
      bufferMinutes: 5,
      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      displayOrder: 1
    },
    {
      category: 'Hair & Styling',
      name: 'Classic Scissor Cut & Wash',
      description: 'Traditional scissor work tailored to your head shape, followed by deep hair wash.',
      pricePaise: 20000, // ₹200
      durationMinutes: 40,
      bufferMinutes: 5,
      imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
      displayOrder: 2
    },
    {
      category: 'Beard & Shave',
      name: 'Royal Hot Towel Shave',
      description: 'Hot towel pre-treatment, soothing lather, straight razor finish, and cold towel post-shave balm.',
      pricePaise: 12000, // ₹120
      durationMinutes: 25,
      bufferMinutes: 5,
      imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80',
      displayOrder: 3
    },
    {
      category: 'Beard & Shave',
      name: 'Beard Sculpting & Line-up',
      description: 'Detailed beard trimming, razor cheek outline, mustache shaping, and nourishing beard oil.',
      pricePaise: 10000, // ₹100
      durationMinutes: 20,
      bufferMinutes: 5,
      imageUrl: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=600&q=80',
      displayOrder: 4
    },
    {
      category: 'Color & Hair Care',
      name: 'Classic Black / Natural Hair Color',
      description: 'Ammonia-free gentle coverage for grey hair with conditioning hair wash.',
      pricePaise: 25000, // ₹250
      durationMinutes: 45,
      bufferMinutes: 5,
      imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
      displayOrder: 5
    },
    {
      category: 'Color & Hair Care',
      name: 'Scalp Detox & Hair Spa Treatment',
      description: 'Deep cleansing cream scalp massage, steam treatment, and restorative serum application.',
      pricePaise: 40000, // ₹400
      durationMinutes: 45,
      bufferMinutes: 5,
      imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80',
      displayOrder: 6
    },
    {
      category: 'Facial & Relaxation',
      name: 'Herbal De-Tan & Glow Facial',
      description: 'Deep pore exfoliation, de-tanning mask, cooling pack, and revitalizing face massage.',
      pricePaise: 45000, // ₹450
      durationMinutes: 45,
      bufferMinutes: 5,
      imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
      displayOrder: 7
    },
    {
      category: 'Facial & Relaxation',
      name: 'Revitalizing Herbal Head Massage',
      description: 'Authentic warm oil pressure-point head and shoulder massage relieving mental fatigue.',
      pricePaise: 15000, // ₹150
      durationMinutes: 25,
      bufferMinutes: 5,
      imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80',
      displayOrder: 8
    },
    {
      category: 'Signature Packages',
      name: 'Santosh VIP Complete Grooming',
      description: 'Full hair styling, beard sculpt, deep cleanse facial, and rejuvenating head massage.',
      pricePaise: 80000, // ₹800
      durationMinutes: 90,
      bufferMinutes: 10,
      imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
      displayOrder: 9
    }
  ];

  for (const s of services) {
    const categoryId = catMap[s.category];
    const existing = await prisma.service.findFirst({
      where: { name: s.name }
    });

    if (!existing) {
      await prisma.service.create({
        data: {
          categoryId,
          name: s.name,
          description: s.description,
          pricePaise: s.pricePaise,
          durationMinutes: s.durationMinutes,
          bufferMinutes: s.bufferMinutes,
          imageUrl: s.imageUrl,
          displayOrder: s.displayOrder,
          isActive: true
        }
      });
    }
  }
  console.log('✔ Salon services seeded');

  // 5. Admin & Demo Customer Users
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL || 'admin@santoshhairart.in';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@Santosh2026!';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      profile: {
        create: {
          fullName: 'Santosh Barber (Owner)',
          phoneNumber: '+91 95378 51649',
          notes: 'Salon owner & master stylist'
        }
      }
    }
  });
  console.log(`✔ Admin user ready (${adminEmail})`);

  const demoCustomerEmail = 'customer@example.com';
  const customerPasswordHash = await bcrypt.hash('Customer@1234', 10);

  const customer = await prisma.user.upsert({
    where: { email: demoCustomerEmail },
    update: {},
    create: {
      email: demoCustomerEmail,
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      profile: {
        create: {
          fullName: 'Bhavik Patel',
          phoneNumber: '+91 98765 43210',
          notes: 'Prefers classic fade and medium beard length'
        }
      }
    }
  });
  console.log('✔ Demo customer seeded (customer@example.com / Customer@1234)');

  console.log('--- Database seeding completed successfully! ---');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
