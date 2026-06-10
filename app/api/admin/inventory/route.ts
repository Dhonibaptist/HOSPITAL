import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/utils/db';
import { mockDb, tryDbQuery } from '@/utils/mock-db';
import { verifyJWT } from '@/utils/jwt';

const inventorySchema = z.object({
  name: z.string().min(2),
  quantity: z.number().min(0),
  expiryDate: z.string(), // YYYY-MM-DD
  supplier: z.string(),
});

const updateInventorySchema = z.object({
  id: z.string(),
  quantity: z.number().min(0),
});

async function getAuthUser(request: Request) {
  const tokenHeader = request.headers.get('cookie');
  const tokenCookie = tokenHeader?.split(';').find(c => c.trim().startsWith('token='));
  const token = tokenCookie ? tokenCookie.split('=')[1] : null;
  if (!token) return null;
  return await verifyJWT(token);
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: "Unauthorized Administrative Session" }, { status: 403 });
    }

    const items = await tryDbQuery(
      async () => {
        const dbItems = await prisma.medicineInventory.findMany({
          orderBy: { name: 'asc' }
        });
        return dbItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          expiryDate: item.expiryDate.toISOString().split('T')[0],
          supplier: item.supplier
        }));
      },
      async () => {
        return mockDb.medicineInventory;
      }
    );

    return NextResponse.json({ success: true, inventory: items });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error fetching inventory" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: "Unauthorized Administrative Session" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = inventorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, quantity, expiryDate, supplier } = parsed.data;

    const newItem = await tryDbQuery(
      async () => {
        const item = await prisma.medicineInventory.create({
          data: {
            name,
            quantity,
            expiryDate: new Date(expiryDate),
            supplier
          }
        });
        return {
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          expiryDate: expiryDate,
          supplier: item.supplier
        };
      },
      async () => {
        const id = 'inv-' + Math.random().toString(36).substring(2, 6);
        const item = { id, name, quantity, expiryDate, supplier };
        mockDb.medicineInventory.push(item);
        return item;
      }
    );

    return NextResponse.json({
      success: true,
      message: "Medicine added to inventory successfully",
      item: newItem
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error writing inventory item" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: "Unauthorized Administrative Session" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateInventorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { id, quantity } = parsed.data;

    const result = await tryDbQuery(
      async () => {
        await prisma.medicineInventory.update({
          where: { id },
          data: { quantity }
        });
        return { success: true };
      },
      async () => {
        const item = mockDb.medicineInventory.find(i => i.id === id);
        if (!item) return { error: "Inventory item not found" };
        item.quantity = quantity;
        return { success: true };
      }
    );

    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Stock quantity updated successfully" });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error updating stock level" }, { status: 500 });
  }
}
