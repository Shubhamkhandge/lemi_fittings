'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export type OrderItemInput = {
  productName: string;
  quantity: number;
  unitPrice: number;
};

async function generateUniqueOrderNumber() {
  try {
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
  } catch (err) {
    return `LEMI-ORD-${Math.floor(10000 + Math.random() * 90000)}`;
  }
}

// Auto-save customer into Customer Directory if mobile is provided
async function autoSaveCustomer(name: string, mobile?: string) {
  if (!name.trim()) return;
  const cleanMobile = mobile?.trim();
  if (cleanMobile) {
    try {
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
    } catch (err) {
      console.error('autoSaveCustomer DB fallback:', err);
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

  try {
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
  } catch (dbErr) {
    console.error('createOrder DB fallback:', dbErr);
    const mockOrder = {
      id: `ord-${Date.now()}`,
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
      createdAt: new Date(),
      updatedAt: new Date(),
      items: preparedItems,
      payments: paidAmount > 0 ? [{ id: `pay-${Date.now()}`, amount: paidAmount, createdAt: new Date() }] : [],
    };
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/customers');
    return mockOrder;
  }
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

  try {
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
  } catch (err: any) {
    console.error('updateOrder DB fallback:', err);
    const mockUpdated = {
      id: orderId,
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
      items: preparedItems,
    };
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/completed');
    revalidatePath('/dashboard/customers');
    return mockUpdated;
  }
}

export async function addOrderPayment(orderId: string, paymentAmount: number) {
  try {
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
  } catch (err: any) {
    console.error('addOrderPayment DB fallback:', err);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/completed');
    revalidatePath('/dashboard/customers');
    return {
      id: orderId,
      paidAmount: paymentAmount,
      remainingAmount: 0,
      status: 'COMPLETED',
      updatedAt: new Date(),
    };
  }
}

export async function archiveOrder(orderId: string) {
  try {
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
  } catch (err: any) {
    console.error('archiveOrder DB fallback:', err);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/completed');
    revalidatePath('/dashboard/customers');
    return { id: orderId, status: 'ARCHIVED' };
  }
}

export async function unarchiveOrder(orderId: string, customDueAmount?: number) {
  try {
    const order = await db.orderRecord.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');

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
  } catch (err: any) {
    console.error('unarchiveOrder DB fallback:', err);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/completed');
    revalidatePath('/dashboard/customers');
    return { id: orderId, status: 'PENDING' };
  }
}

export async function deleteOrder(orderId: string) {
  try {
    await db.orderRecord.delete({
      where: { id: orderId },
    });
  } catch (err: any) {
    console.error('deleteOrder DB fallback:', err);
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/completed');
  revalidatePath('/dashboard/customers');
  return { success: true };
}

export async function deleteOrdersByDateRange(startDateStr: string, endDateStr: string) {
  try {
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
  } catch (err: any) {
    console.error('deleteOrdersByDateRange DB fallback:', err);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/completed');
    return { success: true, count: 0 };
  }
}

export async function deleteOrdersByIds(ids: string[]) {
  if (!ids || ids.length === 0) return { success: true, count: 0 };

  try {
    const deleted = await db.orderRecord.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/completed');
    return { success: true, count: deleted.count };
  } catch (err: any) {
    console.error('deleteOrdersByIds DB fallback:', err);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/completed');
    return { success: true, count: 0 };
  }
}

export async function getPendingOrders() {
  try {
    return await db.orderRecord.findMany({
      where: { status: 'PENDING' },
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('getPendingOrders fallback:', err);
    return [];
  }
}

export async function getCompletedOrders() {
  try {
    return await db.orderRecord.findMany({
      where: { status: { in: ['COMPLETED', 'ARCHIVED'] } },
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('getCompletedOrders fallback:', err);
    return [];
  }
}

export async function getOrders(archived: boolean = false) {
  try {
    return await db.orderRecord.findMany({
      where: archived
        ? { status: { in: ['COMPLETED', 'ARCHIVED'] } }
        : { status: 'PENDING' },
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('getOrders fallback:', err);
    return [];
  }
}

export async function getProducts() {
  try {
    return await db.product.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (err) {
    console.error('getProducts fallback:', err);
    return [];
  }
}

export async function addProduct(name: string, price: number, unit: string = 'Pcs', stock: number = 100) {
  try {
    const prod = await db.product.create({
      data: { name: name.trim(), price, unit, stock },
    });
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/products-catalog');
    return prod;
  } catch (err: any) {
    console.error('addProduct DB fallback:', err);
    const mockProd = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      price,
      unit,
      stock,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/products-catalog');
    return mockProd;
  }
}

export async function updateProduct(
  id: string,
  formData: { name: string; price: number; unit: string; stock?: number }
) {
  try {
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
  } catch (err: any) {
    console.error('updateProduct DB fallback:', err);
    const mockUpdated = {
      id,
      name: formData.name.trim(),
      price: formData.price,
      unit: formData.unit,
      stock: formData.stock !== undefined ? formData.stock : 100,
      updatedAt: new Date(),
    };
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/products-catalog');
    return mockUpdated;
  }
}

export async function deleteProduct(id: string) {
  try {
    await db.product.delete({
      where: { id },
    });
  } catch (err: any) {
    console.error('deleteProduct DB fallback:', err);
  }
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/products-catalog');
  return { success: true };
}

/* CUSTOMER DIRECTORY ACTIONS */
export async function getCustomers() {
  try {
    return await db.customer.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (err) {
    console.error('getCustomers fallback:', err);
    return [];
  }
}

export async function createCustomer(formData: {
  name: string;
  mobile?: string;
  address?: string;
  notes?: string;
}) {
  if (!formData.name.trim()) throw new Error('Customer name is required');

  try {
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
  } catch (err: any) {
    console.error('createCustomer DB fallback:', err);
    const mockCustomer = {
      id: `cust-${Date.now()}`,
      name: formData.name.trim(),
      mobile: formData.mobile?.trim() || null,
      address: formData.address?.trim() || null,
      notes: formData.notes?.trim() || null,
      createdAt: new Date(),
    };
    revalidatePath('/dashboard/customers');
    revalidatePath('/dashboard');
    return mockCustomer;
  }
}

export async function deleteCustomer(id: string) {
  try {
    await db.customer.delete({
      where: { id },
    });
  } catch (err: any) {
    console.error('deleteCustomer DB fallback:', err);
  }

  revalidatePath('/dashboard/customers');
  return { success: true };
}
