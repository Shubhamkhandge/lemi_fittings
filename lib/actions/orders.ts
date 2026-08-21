'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export type OrderItemInput = {
  productName: string;
  quantity: number;
  unitPrice: number;
};

async function generateUniqueOrderNumber() {
  const latestOrder = await db.orderRecord.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { orderNumber: true },
  });

  let nextNum = 1;
  if (latestOrder && latestOrder.orderNumber) {
    const match = latestOrder.orderNumber.match(/\d+/);
    if (match) {
      nextNum = parseInt(match[0], 10) + 1;
    }
  }

  let orderNumber = `LEMI-ORD-${String(nextNum).padStart(5, '0')}`;
  let exists = await db.orderRecord.findUnique({ where: { orderNumber } });

  while (exists) {
    nextNum++;
    orderNumber = `LEMI-ORD-${String(nextNum).padStart(5, '0')}`;
    exists = await db.orderRecord.findUnique({ where: { orderNumber } });
  }

  return orderNumber;
}

// Auto-save customer into Customer Directory if mobile is provided
async function autoSaveCustomer(name: string, mobile?: string) {
  if (!name.trim()) return;
  const cleanMobile = mobile?.trim();
  if (cleanMobile) {
    const existing = await db.customer.findFirst({
      where: { OR: [{ mobile: cleanMobile }, { name: name.trim() }] },
    });
    if (!existing) {
      await db.customer.create({
        data: {
          name: name.trim(),
          mobile: cleanMobile,
        },
      });
    }
  }
}

export async function createOrder(formData: {
  customerName: string;
  customerMobile?: string;
  items: OrderItemInput[];
  paidAmount: number;
  notes?: string;
}) {
  const orderNumber = await generateUniqueOrderNumber();

  // Validate items
  const validItems = (formData.items || []).filter(
    (item) => item.productName && item.productName.trim().length > 0
  );

  if (validItems.length === 0) {
    throw new Error('Please select at least one product item');
  }

  // Auto save customer into directory
  await autoSaveCustomer(formData.customerName, formData.customerMobile);

  // Calculate totals across all items
  const preparedItems = validItems.map((item) => {
    const qty = Math.max(1, item.quantity || 1);
    const price = Math.max(0, item.unitPrice || 0);
    return {
      productName: item.productName.trim(),
      quantity: qty,
      unitPrice: price,
      totalPrice: qty * price,
    };
  });

  const totalAmount = preparedItems.reduce((sum, i) => sum + i.totalPrice, 0);
  const totalQuantity = preparedItems.reduce((sum, i) => sum + i.quantity, 0);
  const paidAmount = Math.max(0, formData.paidAmount || 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const status = remainingAmount <= 0 ? 'COMPLETED' : 'PENDING';

  // Summary product string
  const primaryProductName =
    preparedItems.length === 1
      ? preparedItems[0].productName
      : `${preparedItems[0].productName} (+${preparedItems.length - 1} more items)`;

  const order = await db.orderRecord.create({
    data: {
      orderNumber,
      customerName: formData.customerName,
      customerMobile: formData.customerMobile || null,
      productName: primaryProductName,
      quantity: totalQuantity,
      unitPrice: preparedItems[0].unitPrice,
      totalAmount,
      paidAmount,
      remainingAmount,
      status,
      notes: formData.notes || null,
      items: {
        create: preparedItems,
      },
    },
  });

  if (paidAmount > 0) {
    await db.paymentHistory.create({
      data: {
        orderId: order.id,
        amount: paidAmount,
      },
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/customers');
  return order;
}

export async function updateOrder(
  orderId: string,
  formData: {
    customerName: string;
    customerMobile?: string;
    items: OrderItemInput[];
    paidAmount: number;
    notes?: string;
  }
) {
  const validItems = (formData.items || []).filter(
    (item) => item.productName && item.productName.trim().length > 0
  );

  if (validItems.length === 0) {
    throw new Error('Please select at least one product item');
  }

  await autoSaveCustomer(formData.customerName, formData.customerMobile);

  const preparedItems = validItems.map((item) => {
    const qty = Math.max(1, item.quantity || 1);
    const price = Math.max(0, item.unitPrice || 0);
    return {
      productName: item.productName.trim(),
      quantity: qty,
      unitPrice: price,
      totalPrice: qty * price,
    };
  });

  const totalAmount = preparedItems.reduce((sum, i) => sum + i.totalPrice, 0);
  const totalQuantity = preparedItems.reduce((sum, i) => sum + i.quantity, 0);
  const paidAmount = Math.max(0, formData.paidAmount || 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const status = remainingAmount <= 0 ? 'COMPLETED' : 'PENDING';

  const primaryProductName =
    preparedItems.length === 1
      ? preparedItems[0].productName
      : `${preparedItems[0].productName} (+${preparedItems.length - 1} more items)`;

  // Delete existing items and recreate
  await db.orderItem.deleteMany({
    where: { orderId },
  });

  const updated = await db.orderRecord.update({
    where: { id: orderId },
    data: {
      customerName: formData.customerName,
      customerMobile: formData.customerMobile || null,
      productName: primaryProductName,
      quantity: totalQuantity,
      unitPrice: preparedItems[0].unitPrice,
      totalAmount,
      paidAmount,
      remainingAmount,
      status,
      notes: formData.notes || null,
      items: {
        create: preparedItems,
      },
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/completed');
  revalidatePath('/dashboard/customers');
  return updated;
}

export async function addOrderPayment(orderId: string, paymentAmount: number) {
  const order = await db.orderRecord.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error('Order not found');

  const newPaid = order.paidAmount + paymentAmount;
  const newRemaining = Math.max(0, order.totalAmount - newPaid);
  const newStatus = newRemaining <= 0 ? 'COMPLETED' : 'PENDING';

  await db.paymentHistory.create({
    data: {
      orderId,
      amount: paymentAmount,
    },
  });

  const updated = await db.orderRecord.update({
    where: { id: orderId },
    data: {
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      status: newStatus,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/completed');
  revalidatePath('/dashboard/customers');
  return updated;
}

export async function archiveOrder(orderId: string) {
  const updated = await db.orderRecord.update({
    where: { id: orderId },
    data: {
      status: 'ARCHIVED',
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/completed');
  revalidatePath('/dashboard/customers');
  return updated;
}

export async function unarchiveOrder(orderId: string, customDueAmount?: number) {
  const order = await db.orderRecord.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');

  // Set custom due amount (default 1 if not specified)
  const due = customDueAmount !== undefined && customDueAmount > 0 ? customDueAmount : 1;
  const newRemainingAmount = Math.min(order.totalAmount, due);
  const newPaidAmount = Math.max(0, order.totalAmount - newRemainingAmount);

  const updated = await db.orderRecord.update({
    where: { id: orderId },
    data: {
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      status: 'PENDING',
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/completed');
  revalidatePath('/dashboard/customers');
  return updated;
}

export async function deleteOrder(orderId: string) {
  await db.orderRecord.delete({
    where: { id: orderId },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/completed');
  revalidatePath('/dashboard/customers');
  return { success: true };
}

export async function deleteOrdersByDateRange(startDateStr: string, endDateStr: string) {
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDateStr);
  end.setHours(23, 59, 59, 999);

  const deleted = await db.orderRecord.deleteMany({
    where: {
      status: { in: ['COMPLETED', 'ARCHIVED'] },
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/completed');
  return { success: true, count: deleted.count };
}

export async function deleteOrdersByIds(ids: string[]) {
  if (!ids || ids.length === 0) return { success: true, count: 0 };

  const deleted = await db.orderRecord.deleteMany({
    where: {
      id: { in: ids },
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/completed');
  return { success: true, count: deleted.count };
}

export async function getPendingOrders() {
  return db.orderRecord.findMany({
    where: { status: 'PENDING' },
    include: { items: true, payments: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCompletedOrders() {
  return db.orderRecord.findMany({
    where: { status: { in: ['COMPLETED', 'ARCHIVED'] } },
    include: { items: true, payments: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOrders(archived: boolean = false) {
  return db.orderRecord.findMany({
    where: archived
      ? { status: { in: ['COMPLETED', 'ARCHIVED'] } }
      : { status: 'PENDING' },
    include: { items: true, payments: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProducts() {
  return db.product.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function addProduct(name: string, price: number, unit: string = 'Pcs', stock: number = 100) {
  const prod = await db.product.create({
    data: { name: name.trim(), price, unit, stock },
  });
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/products-catalog');
  return prod;
}

export async function updateProduct(
  id: string,
  formData: { name: string; price: number; unit: string; stock?: number }
) {
  const updated = await db.product.update({
    where: { id },
    data: {
      name: formData.name.trim(),
      price: formData.price,
      unit: formData.unit,
      stock: formData.stock !== undefined ? formData.stock : 100,
    },
  });
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/products-catalog');
  return updated;
}

export async function deleteProduct(id: string) {
  await db.product.delete({
    where: { id },
  });
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/products-catalog');
  return { success: true };
}

/* CUSTOMER DIRECTORY ACTIONS */
export async function getCustomers() {
  return db.customer.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createCustomer(formData: {
  name: string;
  mobile?: string;
  address?: string;
  notes?: string;
}) {
  if (!formData.name.trim()) throw new Error('Customer name is required');

  const customer = await db.customer.create({
    data: {
      name: formData.name.trim(),
      mobile: formData.mobile?.trim() || null,
      address: formData.address?.trim() || null,
      notes: formData.notes?.trim() || null,
    },
  });

  revalidatePath('/dashboard/customers');
  revalidatePath('/dashboard');
  return customer;
}

export async function deleteCustomer(id: string) {
  await db.customer.delete({
    where: { id },
  });

  revalidatePath('/dashboard/customers');
  return { success: true };
}
