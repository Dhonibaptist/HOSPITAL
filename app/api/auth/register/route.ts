import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/utils/db';
import { mockDb, tryDbQuery } from '@/utils/mock-db';

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN']).default('PATIENT'),
  
  // Optional doctor specific details
  specialization: z.string().optional(),
  experience: z.number().optional(),
  consultationFee: z.number().optional(),
  availability: z.any().optional(),
  qualifications: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Zod validation
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        success: false, 
        message: parsed.error.issues[0].message 
      }, { status: 400 });
    }

    const { name, email, phone, password, role } = parsed.data;

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await tryDbQuery(
      async () => {
        // DB Query: Check if email exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          return { error: 'Email address already registered' };
        }

        // Create user
        const newUser = await prisma.user.create({
          data: {
            name,
            email,
            phone,
            role,
            passwordHash,
          }
        });

        // Create doctor profile if doctor role
        if (role === 'DOCTOR') {
          await prisma.doctor.create({
            data: {
              id: newUser.id,
              specialization: parsed.data.specialization || 'General',
              experience: parsed.data.experience || 5,
              consultationFee: parsed.data.consultationFee || 500,
              availability: parsed.data.availability || {},
              qualifications: parsed.data.qualifications || [],
              languages: parsed.data.languages || ['English'],
            }
          });
        }

        return { user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } };
      },
      async () => {
        // Mock query: check email
        const existing = mockDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          return { error: 'Email address already registered' };
        }

        const id = 'usr-' + Math.random().toString(36).substring(2, 9);
        const newUser = { id, name, email, phone: phone || '', role, passwordHash };
        mockDb.users.push(newUser);

        if (role === 'DOCTOR') {
          mockDb.doctors.push({
            id,
            name,
            specialization: parsed.data.specialization || 'General Medicine',
            experience: parsed.data.experience || 5,
            consultationFee: parsed.data.consultationFee || 500,
            availability: parsed.data.availability || { "Monday": ["09:00 AM", "11:00 AM"] },
            qualifications: parsed.data.qualifications || ['MBBS'],
            languages: parsed.data.languages || ['English'],
            rating: 5.0,
            image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop'
          });
        }

        return { user: { id, name, email, role } };
      }
    );

    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Account registered successfully",
      user: result.user
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error during registration" 
    }, { status: 500 });
  }
}
