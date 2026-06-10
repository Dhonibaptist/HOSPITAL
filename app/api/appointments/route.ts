import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/utils/db';
import { mockDb, tryDbQuery, MockAppointment } from '@/utils/mock-db';
import { verifyJWT } from '@/utils/jwt';

const bookSchema = z.object({
  doctorId: z.string(),
  date: z.string(), // YYYY-MM-DD
  timeSlot: z.string(),
  paymentStatus: z.enum(['UNPAID', 'PAID']).default('UNPAID'),
  paymentId: z.string().optional(),
  familyMemberId: z.string().optional(),
});

const updateSchema = z.object({
  appointmentId: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'PAID', 'REFUNDED']).optional(),
  date: z.string().optional(),
  timeSlot: z.string().optional(),
});

// Helper to check user auth inside API
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
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized Session" }, { status: 401 });
    }

    const { id: userId, role } = user;

    const list = await tryDbQuery(
      async () => {
        let whereClause: any = {};
        if (role === 'PATIENT') {
          whereClause.patientId = userId;
        } else if (role === 'DOCTOR') {
          whereClause.doctorId = userId;
        }

        const appts = await prisma.appointment.findMany({
          where: whereClause,
          include: {
            patient: { select: { name: true, email: true } },
            familyMember: { select: { name: true } },
            doctor: { include: { user: { select: { name: true } } } },
            prescription: true
          },
          orderBy: { date: 'asc' }
        });

        return appts.map(a => ({
          id: a.id,
          patientId: a.patientId,
          patientName: a.familyMember ? `${a.familyMember.name} (Family)` : a.patient.name,
          familyMemberId: a.familyMemberId || undefined,
          familyMemberName: a.familyMember?.name || undefined,
          doctorId: a.doctorId,
          doctorName: a.doctor.user.name,
          specialization: a.doctor.specialization,
          date: a.date.toISOString().split('T')[0],
          timeSlot: a.timeSlot,
          status: a.status,
          paymentStatus: a.paymentStatus,
          paymentId: a.paymentId || undefined,
          tokenNumber: a.tokenNumber || undefined,
          queueStatus: a.queueStatus,
          prescription: a.prescription ? {
            id: a.prescription.id,
            medicines: a.prescription.medicines as any[],
            notes: a.prescription.notes
          } : undefined
        }));
      },
      async () => {
        let appts = [...mockDb.appointments];
        if (role === 'PATIENT') {
          appts = appts.filter(a => a.patientId === userId);
        } else if (role === 'DOCTOR') {
          appts = appts.filter(a => a.doctorId === userId);
        }
        
        // Populate prescription details in mock if they exist
        return appts.map(a => {
          const pr = mockDb.prescriptions.find(p => p.appointmentId === a.id);
          return {
            ...a,
            prescription: pr ? { id: pr.id, medicines: pr.medicines, notes: pr.notes } : undefined
          };
        });
      }
    );

    return NextResponse.json({ success: true, appointments: list });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error fetching appointments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized Session" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { doctorId, date, timeSlot, paymentStatus, paymentId, familyMemberId } = parsed.data;

    const result = await tryDbQuery(
      async () => {
        // Fetch doctor info to get specialization and verify existence
        const doctor = await prisma.doctor.findUnique({
          where: { id: doctorId },
          include: { user: { select: { name: true } } }
        });
        if (!doctor) return { error: "Doctor profile not found" };

        // Generate token number (count of appointments for doctor on this day + 1)
        const count = await prisma.appointment.count({
          where: { doctorId, date: new Date(date) }
        });
        const tokenNumber = count + 1;

        const appt = await prisma.appointment.create({
          data: {
            patientId: user.id as string,
            familyMemberId: familyMemberId || null,
            doctorId,
            date: new Date(date),
            timeSlot,
            paymentStatus,
            paymentId,
            tokenNumber,
            status: paymentStatus === 'PAID' ? 'CONFIRMED' : 'PENDING',
          },
          include: {
            familyMember: { select: { name: true } }
          }
        });

        return {
          appointment: {
            id: appt.id,
            patientId: appt.patientId,
            patientName: appt.familyMember ? `${appt.familyMember.name} (Family)` : (user.name as string),
            familyMemberId: appt.familyMemberId || undefined,
            familyMemberName: appt.familyMember?.name || undefined,
            doctorId: appt.doctorId,
            doctorName: doctor.user.name,
            specialization: doctor.specialization,
            date: date,
            timeSlot: appt.timeSlot,
            status: appt.status,
            paymentStatus: appt.paymentStatus,
            paymentId: appt.paymentId || undefined,
            tokenNumber: appt.tokenNumber || undefined,
            queueStatus: appt.queueStatus
          }
        };
      },
      async () => {
        const doctor = mockDb.doctors.find(d => d.id === doctorId);
        if (!doctor) return { error: "Doctor profile not found" };

        const count = mockDb.appointments.filter(a => a.doctorId === doctorId && a.date === date).length;
        const tokenNumber = count + 1;

        let familyMemberName = undefined;
        if (familyMemberId) {
          const fm = mockDb.familyMembers.find(f => f.id === familyMemberId);
          familyMemberName = fm?.name;
        }

        const newAppt: MockAppointment = {
          id: 'appt-' + Math.random().toString(36).substring(2, 9),
          patientId: user.id as string,
          patientName: familyMemberName ? `${familyMemberName} (Family)` : (user.name as string),
          familyMemberId,
          familyMemberName,
          doctorId,
          doctorName: doctor.name,
          specialization: doctor.specialization,
          date,
          timeSlot,
          status: paymentStatus === 'PAID' ? 'CONFIRMED' : 'PENDING',
          paymentStatus,
          paymentId,
          tokenNumber,
          queueStatus: 'NOT_ARRIVED'
        };

        mockDb.appointments.push(newAppt);
        return { appointment: newAppt };
      }
    );

    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Appointment scheduled successfully",
      appointment: result.appointment
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error booking appointment" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized Session" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { appointmentId, status, paymentStatus, date, timeSlot } = parsed.data;

    const result = await tryDbQuery(
      async () => {
        const data: any = {};
        if (status) data.status = status;
        if (paymentStatus) data.paymentStatus = paymentStatus;
        if (date) data.date = new Date(date);
        if (timeSlot) data.timeSlot = timeSlot;

        const updated = await prisma.appointment.update({
          where: { id: appointmentId },
          data
        });

        return { success: true };
      },
      async () => {
        const appt = mockDb.appointments.find(a => a.id === appointmentId);
        if (!appt) return { error: "Appointment not found" };

        if (status) appt.status = status;
        if (paymentStatus) appt.paymentStatus = paymentStatus;
        if (date) appt.date = date;
        if (timeSlot) appt.timeSlot = timeSlot;

        return { success: true };
      }
    );

    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Appointment updated successfully" });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error updating appointment" }, { status: 500 });
  }
}
