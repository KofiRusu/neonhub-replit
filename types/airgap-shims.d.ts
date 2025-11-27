/* Air-gap ambient declarations to let tsc run without node_modules (when tsc is present) */
declare var process: any; declare var __dirname: string;
declare module '@prisma/client'; declare module 'zod'; declare module 'pino'; declare module 'prom-client';
declare module 'openai'; declare module 'bullmq'; declare module '@trpc/server'; declare module 'superjson';
declare module 'express'; declare module 'socket.io'; declare module '@tanstack/react-query'; declare module '@playwright/test';
declare module '@sentry/nextjs'; declare module 'next'; declare module 'next/*'; declare module 'next-auth'; declare module 'next-auth/*';
declare module 'react'; declare module 'react/*'; declare module 'framer-motion'; declare module 'lucide-react'; declare module 'node:crypto';
