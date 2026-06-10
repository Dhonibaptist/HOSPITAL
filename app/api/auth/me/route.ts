import { NextResponse } from 'next/server';
import { verifyJWT } from '@/utils/jwt';

export async function GET(request: Request) {
  try {
    // Read cookie token
    const tokenHeader = request.headers.get('cookie');
    const tokenCookie = tokenHeader
      ?.split(';')
      .find(c => c.trim().startsWith('token='));
    
    const token = tokenCookie ? tokenCookie.split('=')[1] : null;

    if (!token) {
      return NextResponse.json({ success: true, user: null });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ success: true, user: null });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      }
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error reading session" }, { status: 500 });
  }
}
