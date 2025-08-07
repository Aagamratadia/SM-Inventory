import NextAuth from 'next-auth';
import { auth as authConfig } from '@/auth.config';

export const { 
  auth, 
  signIn, 
  signOut, 
  handlers 
} = NextAuth({
  ...authConfig,
  // Add any additional configuration here if needed
});
