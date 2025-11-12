import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'admin' | 'staff' | 'user';
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: 'admin' | 'staff' | 'user';
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: 'admin' | 'staff' | 'user';
    id: string;
  }
}
