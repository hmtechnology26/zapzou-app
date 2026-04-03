'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleAuthCallback = useCallback(async () => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      router.push('/login?error=auth_failed');
      return;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth callback error:', error);
      router.push('/login?error=auth_failed');
    } else if (session) {
      router.push('/');
    } else {
      router.push('/login');
    }
  }, [router, searchParams]);

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error('Error exchanging auth code:', error);
          handleAuthCallback();
          return;
        }

        router.replace('/');
      });
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          console.error('Error setting session from hash:', error);
          handleAuthCallback();
        } else {
          router.replace('/');
        }
      });
      return;
    }

    handleAuthCallback();
  }, [handleAuthCallback, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
