import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/utils/db';
import { mockDb, tryDbQuery } from '@/utils/mock-db';
import { verifyJWT } from '@/utils/jwt';

const familyMemberSchema = z.object({
  name: z.string().min(2),
  relation: z.enum(['FATHER', 'MOTHER', 'CHILD', 'GRANDPARENT', 'SPOUSE']),
  age: z.number().min(0).max(120),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
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
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized Session" }, { status: 401 });
    }

    const members = await tryDbQuery(
      async () => {
        return await prisma.familyMember.findMany({
          where: { parentId: user.id },
          orderBy: { name: 'asc' }
        });
      },
      async () => {
        return mockDb.familyMembers.filter(f => f.parentId === user.id);
      }
    );

    return NextResponse.json({ success: true, familyMembers: members });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error fetching family members" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized Session" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = familyMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, relation, age, gender } = parsed.data;

    const newMember = await tryDbQuery(
      async () => {
        const mem = await prisma.familyMember.create({
          data: {
            parentId: user.id,
            name,
            relation,
            age,
            gender
          }
        });
        return mem;
      },
      async () => {
        const id = 'fam-' + Math.random().toString(36).substring(2, 6);
        const mem = { id, parentId: user.id, name, relation, age, gender };
        mockDb.familyMembers.push(mem);
        return mem;
      }
    );

    return NextResponse.json({
      success: true,
      message: "Family profile registered successfully",
      familyMember: newMember
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error saving family member" }, { status: 500 });
  }
}
