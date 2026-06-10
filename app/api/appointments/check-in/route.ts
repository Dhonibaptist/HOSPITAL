import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/utils/db';
import { mockDb, tryDbQuery } from '@/utils/mock-db';
import { verifyJWT } from '@/utils/jwt';

const checkInSchema = z.object({
  appointmentId: z.string(),
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
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'RECEPTIONIST')) {
      return NextResponse.json({ success: false, message: "Unauthorized Check-In Personnel" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = checkInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { appointmentId } = parsed.data;

    const result = await tryDbQuery(
      async () => {
        const appt = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: { patient: true }
        });
        
        if (!appt) return { error: "Appointment not found" };
        if (appt.queueStatus !== 'NOT_ARRIVED') {
          return { error: `Patient already checked-in. Status: ${appt.queueStatus}` };
        }

        // Check if tokenNumber already exists, otherwise assign
        let tokenNumber = appt.tokenNumber;
        if (!tokenNumber) {
          const count = await prisma.appointment.count({
            where: { doctorId: appt.doctorId, date: appt.date }
          });
          tokenNumber = count + 1;
        }

        await prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            queueStatus: 'WAITING',
            tokenNumber,
            status: 'CONFIRMED'
          }
        });

        return { name: appt.patient.name, tokenNumber };
      },
      async () => {
        const appt = mockDb.appointments.find(a => a.id === appointmentId);
        if (!appt) return { error: "Appointment not found" };
        if (appt.queueStatus !== 'NOT_ARRIVED') {
          return { error: `Patient already checked-in. Status: ${appt.queueStatus}` };
        }

        let tokenNumber = appt.tokenNumber;
        if (!tokenNumber) {
          const count = mockDb.appointments.filter(
            a => a.doctorId === appt.doctorId && a.date === appt.date
          ).length;
          tokenNumber = count + 1;
          appt.tokenNumber = tokenNumber;
        }

        appt.queueStatus = 'WAITING';
        appt.status = 'CONFIRMED';

        return { name: appt.patientName, tokenNumber };
      }
    );

    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully checked-in ${result.name}`,
      tokenNumber: result.tokenNumber
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error performing check-in" }, { status: 500 });
  }
}
