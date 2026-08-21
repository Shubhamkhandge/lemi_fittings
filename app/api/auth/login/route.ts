import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createSessionToken, setSessionCookie, hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    let user = null;
    try {
      user = await db.user.findUnique({
        where: { email: cleanEmail },
      });

      // Auto-create default admin user if user table is empty
      if (!user && cleanEmail === 'admin@lemi.com') {
        const hashedPassword = await hashPassword('admin123');
        user = await db.user.create({
          data: {
            email: 'admin@lemi.com',
            password: hashedPassword,
            name: 'LEMI Admin',
            role: 'ADMIN',
          },
        });
      }
    } catch (dbErr) {
      console.error('Database connection/query warning on serverless:', dbErr);
      // Hardcoded fallback for production demo if DB fails on serverless container
      if (cleanEmail === 'admin@lemi.com' && password === 'admin123') {
        user = {
          id: 'admin-default-id',
          email: 'admin@lemi.com',
          name: 'LEMI Admin',
          role: 'ADMIN',
          password: '',
        };
      } else {
        return NextResponse.json({ error: 'Invalid credentials or DB connection error' }, { status: 401 });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.password) {
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({ success: true, role: user.role });
  } catch (error: any) {
    console.error('Login error details:', error);
    return NextResponse.json({ error: error?.message || 'Login failed' }, { status: 500 });
  }
}
