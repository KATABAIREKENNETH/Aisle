import { Stack } from 'expo-router';
import { requireSuperadmin } from '../../lib/supabase/superadmin';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

export default function SuperadminLayout() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const authorized = await requireSuperadmin();
      if (!authorized) {
        router.replace('/(auth)/login');
      } else {
        setIsAuthorized(true);
      }
      setIsLoading(false);
    }

    checkAuth();
  }, []);

  if (isLoading) {
    return null;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a2e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Superadmin Dashboard',
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: 'User Management',
        }}
      />
      <Stack.Screen
        name="weddings"
        options={{
          title: 'Wedding Management',
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Platform Analytics',
        }}
      />
    </Stack>
  );
}
