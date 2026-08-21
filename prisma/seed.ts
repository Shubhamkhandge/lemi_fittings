import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('Seeding LEMI database with regular customers and sample orders...');

  const passwordHash = await bcrypt.hash('admin123', 10);

  // Single admin login user
  await db.user.upsert({
    where: { email: 'admin@lemi.com' },
    update: { password: passwordHash },
    create: {
      email: 'admin@lemi.com',
      password: passwordHash,
      name: 'LEMI Admin',
      role: 'ADMIN',
    },
  });

  // LEMI Sample Regular Customers
  const sampleCustomers = [
    { name: 'Rahul Interior Works', mobile: '9820012345', address: 'Shop 12, Andheri West, Mumbai' },
    { name: 'Suresh Architect & Co', mobile: '9833344555', address: 'Studio 4B, BKC, Mumbai' },
    { name: 'Priya Furniture Designs', mobile: '9811122233', address: 'Sector 17, Vashi, Navi Mumbai' },
  ];

  for (const c of sampleCustomers) {
    const existing = await db.customer.findFirst({ where: { mobile: c.mobile } });
    if (!existing) {
      await db.customer.create({ data: c });
    }
  }

  // LEMI Interior Products sample list
  const sampleProducts = [
    { name: 'Soft-Close Hydraulic Hinge 35mm', price: 200, unit: 'Pair', stock: 200 },
    { name: 'Aluminium LED Profile Channel 2m', price: 300, unit: 'Meter', stock: 150 },
    { name: 'Matte Black Designer Cabinet Handle 200mm', price: 160, unit: 'Pcs', stock: 300 },
    { name: 'Tandem Drawer Box System 500mm', price: 2400, unit: 'Set', stock: 50 },
    { name: 'Modulized Kitchen Basket Stainless Steel', price: 1800, unit: 'Pcs', stock: 80 },
  ];

  for (const p of sampleProducts) {
    const existing = await db.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await db.product.create({ data: p });
    }
  }

  // Sample Multi-Item Order
  const count = await db.orderRecord.count();
  if (count === 0) {
    const item1 = { productName: 'Soft-Close Hydraulic Hinge 35mm', quantity: 30, unitPrice: 200, totalPrice: 6000 };
    const item2 = { productName: 'Aluminium LED Profile Channel 2m', quantity: 5, unitPrice: 300, totalPrice: 1500 };

    const totalAmount = item1.totalPrice + item2.totalPrice; // 7500
    const paidAmount = 3750; // 50% advance paid
    const remainingAmount = totalAmount - paidAmount; // 3750 due

    const sampleOrder = await db.orderRecord.create({
      data: {
        orderNumber: 'LEMI-ORD-00001',
        customerName: 'Rahul Interior Works',
        customerMobile: '9820012345',
        productName: 'Soft-Close Hinge 35mm (+1 item)',
        quantity: 35,
        unitPrice: 200,
        totalAmount,
        paidAmount,
        remainingAmount,
        status: 'PENDING',
        notes: '50% Advance Paid. 50% Pending upon delivery.',
        items: {
          create: [item1, item2],
        },
      },
    });

    await db.paymentHistory.create({
      data: {
        orderId: sampleOrder.id,
        amount: paidAmount,
      },
    });
  }

  console.log('Seed finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
