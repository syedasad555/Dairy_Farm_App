import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { authService } from '@/services';
import { useAuthStore } from '@/stores';
import { cacheUserProfile } from '@/lib/queryClient';

export function useAuthListener() {
  const { setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      try {
        if (user) {
          const profile = await authService.getCurrentProfile();
          setProfile(profile);
          if (profile) await cacheUserProfile(profile);
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [setProfile, setLoading]);
}

export function useRoleGuard(allowedRoles: string[]) {
  const profile = useAuthStore((s) => s.profile);
  const isAllowed = profile ? allowedRoles.includes(profile.role) : false;
  return { profile, isAllowed };
}
