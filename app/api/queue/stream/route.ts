import { NextResponse } from 'next/server';
import { prisma } from '@/utils/db';
import { mockDb, tryDbQuery } from '@/utils/mock-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get('doctorId');
  const appointmentId = searchParams.get('appointmentId');

  if (!doctorId) {
    return NextResponse.json({ success: false, message: "Doctor ID is required" }, { status: 400 });
  }

  const responseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const sendUpdate = async () => {
        try {
          const data = await tryDbQuery(
            async () => {
              // 1. Find the token currently serving (queueStatus === ACTIVE for today's appts)
              const today = new Date().toISOString().split('T')[0];
              const activeAppt = await prisma.appointment.findFirst({
                where: {
                  doctorId,
                  date: { gte: new Date(today) },
                  queueStatus: 'ACTIVE',
                },
                select: { tokenNumber: true }
              });

              const currentServing = activeAppt?.tokenNumber || 0;

              // 2. Find patient's token if appointmentId provided
              let patientToken = 0;
              let patientQueueStatus = 'NOT_ARRIVED';
              if (appointmentId) {
                const appt = await prisma.appointment.findUnique({
                  where: { id: appointmentId },
                  select: { tokenNumber: true, queueStatus: true }
                });
                patientToken = appt?.tokenNumber || 0;
                patientQueueStatus = appt?.queueStatus || 'NOT_ARRIVED';
              }

              // Estimate: 3 minutes per patient remaining
              const waitDifference = patientToken > currentServing ? patientToken - currentServing : 0;
              const estimatedWaitMinutes = waitDifference * 3;

              return {
                currentServing,
                patientToken,
                patientQueueStatus,
                estimatedWaitMinutes,
                timestamp: new Date().toISOString()
              };
            },
            async () => {
              // Mock DB Fallback
              const currentServing = mockDb.currentQueueToken[doctorId] || 0;
              
              let patientToken = 0;
              let patientQueueStatus = 'NOT_ARRIVED';
              
              if (appointmentId) {
                const appt = mockDb.appointments.find(a => a.id === appointmentId);
                patientToken = appt?.tokenNumber || 0;
                patientQueueStatus = appt?.queueStatus || 'NOT_ARRIVED';
              }

              const waitDifference = patientToken > currentServing ? patientToken - currentServing : 0;
              const estimatedWaitMinutes = waitDifference * 3;

              return {
                currentServing,
                patientToken,
                patientQueueStatus,
                estimatedWaitMinutes,
                timestamp: new Date().toISOString()
              };
            }
          );

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          console.error("Error writing SSE queue update:", err);
        }
      };

      // Send initial update
      await sendUpdate();

      // Poll database / mockDb state every 3 seconds
      const interval = setInterval(async () => {
        await sendUpdate();
      }, 3000);

      // Clean up when request closes
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
      });
    }
  });

  return new Response(stream, { headers: responseHeaders });
}
