import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useWeddingStore } from '../../store/weddingStore';
import { getWeddingByUserId } from '../api/weddings';

export function useWedding() {
  const { user } = useAuthStore();
  const { wedding, setWedding } = useWeddingStore();

  useEffect(() => {
    async function loadWedding() {
      if (!user) return;

      try {
        const weddingData = await getWeddingByUserId(user.id);
        setWedding(weddingData);
      } catch (error) {
        console.error('Error loading wedding:', error);
      }
    }

    loadWedding();
  }, [user, setWedding]);

  return { wedding };
}
