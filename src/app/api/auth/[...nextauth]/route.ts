import NextAuth from 'next-auth';
import { auth as authConfig } from '@/auth.config';

const handler = NextAuth(authConfig);

export const GET = handler;
export const POST = handler;
