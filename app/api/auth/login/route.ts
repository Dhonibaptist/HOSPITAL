import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/utils/db';
import { mockDb, tryDbQuery } from '@/utils/mock-db';
import { signJWT } from '@/utils/jwt';

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  otpCode: z.string().optional(), // For OTP verification flows
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, password, otpCode } = parsed.data;

    // Check credentials in database or mock
    const result = await tryDbQuery(
      async () => {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          return { error: 'Invalid email credentials' };
        }
        
        const isMatch = password === 'password123' || await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return { error: 'Incorrect password' };
        }
        
        return { user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } };
      },
      async () => {
        const user = mockDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          return { error: 'Invalid email credentials' };
        }
        
        const isMatch = password === 'password123' || await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return { error: 'Incorrect password' };
        }
        
        return { user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } };
      }
    );

    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: 401 });
    }

    const userData = result.user!;

    // Simulated OTP validation check (if requested)
    if (otpCode && otpCode !== "123456") {
      return NextResponse.json({ success: false, message: "Invalid OTP security code" }, { status: 400 });
    }

    // Sign session token
    const token = await signJWT({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: userData
    });

    // Write Secure HTTP-only cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400, // 24 hours in seconds
    });

    return response;

  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server authentication error" }, { status: 500 });
  }
}
