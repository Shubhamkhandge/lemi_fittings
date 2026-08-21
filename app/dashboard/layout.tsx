import React from 'react';
import { getSession } from '@/lib/auth';
import { DashboardClientLayout } from './client-layout';
import { UnauthenticatedRedirect } from './unauthenticated-redirect';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session) {
    return <UnauthenticatedRedirect />;
  }

  return (
    <DashboardClientLayout user={session}>
      {children}
    </DashboardClientLayout>
  );
}
