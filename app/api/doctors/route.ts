import { NextResponse } from 'next/server';
import { prisma } from '@/utils/db';
import { mockDb, tryDbQuery } from '@/utils/mock-db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const spec = searchParams.get('specialization');

    const doctorsList = await tryDbQuery(
      async () => {
        const query: any = {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              }
            }
          }
        };
        
        if (spec) {
          query.where = { specialization: { equals: spec, mode: 'insensitive' } };
        }
        
        const dbDocs = await prisma.doctor.findMany(query);
        // Map database shape to match our frontend interface format
        return dbDocs.map(d => ({
          id: d.id,
          name: d.user.name,
          specialization: d.specialization,
          experience: d.experience,
          consultationFee: d.consultationFee,
          availability: d.availability as Record<string, string[]>,
          qualifications: d.qualifications,
          languages: d.languages,
          rating: d.rating,
          image: d.id === 'usr-doc-1'
            ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=300&auto=format&fit=crop'
            : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop'
        }));
      },
      async () => {
        let docs = mockDb.doctors;
        if (spec) {
          docs = docs.filter(d => d.specialization.toLowerCase() === spec.toLowerCase());
        }
        return docs;
      }
    );

    return NextResponse.json({
      success: true,
      doctors: doctorsList
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error listing doctors" }, { status: 500 });
  }
}
