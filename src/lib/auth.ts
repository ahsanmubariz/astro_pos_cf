import bcrypt from 'bcryptjs';

export interface UserSession {
  userId: string;
  username: string;
  name: string;
  role: 'super_admin' | 'tenant_admin' | 'cashier';
  tenantId: string | null;
}

export async function hashPin(pin: string): Promise<string> {
  return await bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(pin, hash);
}

export function setSessionCookie(Astro: any, session: UserSession) {
  const sessionStr = JSON.stringify(session);
  // In a real app, we would sign/encrypt this cookie
  Astro.cookies.set('pos_session', sessionStr, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

export function getSession(Astro: any): UserSession | null {
  const cookie = Astro.cookies.get('pos_session');
  if (!cookie) return null;
  try {
    return JSON.parse(cookie.value);
  } catch {
    return null;
  }
}

export function logout(Astro: any) {
  Astro.cookies.delete('pos_session', { path: '/' });
}
