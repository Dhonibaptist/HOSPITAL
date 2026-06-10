import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/utils/db';
import { mockDb, tryDbQuery } from '@/utils/mock-db';
import { verifyJWT } from '@/utils/jwt';

const prescriptionSchema = z.object({
  appointmentId: z.string(),
  medicines: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string()
  })),
  notes: z.string().optional(),
});

async function getAuthUser(request: Request) {
  const tokenHeader = request.headers.get('cookie');
  const tokenCookie = tokenHeader?.split(';').find(c => c.trim().startsWith('token='));
  const token = tokenCookie ? tokenCookie.split('=')[1] : null;
  if (!token) return null;
  return await verifyJWT(token);
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ success: false, message: "Unauthorized Professional Session" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = prescriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { appointmentId, medicines, notes } = parsed.data;

    const result = await tryDbQuery(
      async () => {
        // Create in Prisma
        const pres = await prisma.prescription.create({
          data: {
            appointmentId,
            medicines: medicines as any,
            notes
          }
        });
        return { success: true, id: pres.id };
      },
      async () => {
        // Create in Mock
        const id = 'pr-' + Math.random().toString(36).substring(2, 7);
        mockDb.prescriptions.push({
          id,
          appointmentId,
          medicines,
          notes,
          createdAt: new Date().toISOString()
        });
        return { success: true, id };
      }
    );

    return NextResponse.json({
      success: true,
      message: "Prescription recorded in EMR systems",
      prescriptionId: result.id
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error writing prescription" }, { status: 500 });
  }
}
