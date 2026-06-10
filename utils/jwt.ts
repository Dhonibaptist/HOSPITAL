import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'enterprise_hospital_appointment_jwt_secret_key_2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function signJWT(payload: any, expiry: string = '24h') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(secretKey);
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    return null;
  }
}
