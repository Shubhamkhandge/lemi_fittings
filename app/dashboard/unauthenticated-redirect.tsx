'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function UnauthenticatedRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <div>
          <h2 className="text-base font-bold text-white">Session Expired or Login Required</h2>
          <p className="text-xs text-slate-400 mt-1">Redirecting you to LEMI Login page...</p>
        </div>
      </div>
    </div>
  );
}
