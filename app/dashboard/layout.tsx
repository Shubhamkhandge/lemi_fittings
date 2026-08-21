import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardClientLayout } from './client-layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardClientLayout user={session}>
      {children}
    </DashboardClientLayout>
  );
}
