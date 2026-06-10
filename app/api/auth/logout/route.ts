import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully"
  });

  // Clear HTTP-only token cookie
  response.cookies.set({
    name: 'token',
    value: '',
    path: '/',
    maxAge: 0, // Immediately expires
  });

  return response;
}
