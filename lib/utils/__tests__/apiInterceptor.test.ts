import { apiFetch, apiGet, apiPost, apiPut, apiDelete, apiPatch } from '../apiInterceptor';
import { getSession, refreshSession } from '../../supabase/auth';

jest.mock('../../supabase/auth', () => ({
  getSession: jest.fn(),
  refreshSession: jest.fn(),
}));

global.fetch = jest.fn();

describe('API Interceptor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('apiFetch', () => {
    it('should add JWT token to request headers', async () => {
      (getSession as jest.Mock).mockResolvedValue({
        access_token: 'test-token-123',
      });
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        ok: true,
      });

      await apiFetch('https://api.example.com/data');

      expect(getSession).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
    });

    it('should skip auth when skipAuth is true', async () => {
      (getSession as jest.Mock).mockResolvedValue({
        access_token: 'test-token-123',
      });
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        ok: true,
      });

      await apiFetch('https://api.example.com/data', { skipAuth: true });

      expect(getSession).not.toHaveBeenCalled();
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers).toBeUndefined();
    });

    it('should refresh token on 401 response and retry', async () => {
      (getSession as jest.Mock)
        .mockResolvedValueOnce({
          access_token: 'expired-token',
        })
        .mockResolvedValueOnce({
          access_token: 'new-token',
        });
      (refreshSession as jest.Mock).mockResolvedValue({
        session: { access_token: 'new-token' },
      });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ status: 401 })
        .mockResolvedValueOnce({ status: 200, ok: true });

      await apiFetch('https://api.example.com/data');

      expect(refreshSession).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry if refresh fails', async () => {
      (getSession as jest.Mock).mockResolvedValue({
        access_token: 'expired-token',
      });
      (refreshSession as jest.Mock).mockRejectedValue(new Error('Refresh failed'));
      (global.fetch as jest.Mock).mockResolvedValue({ status: 401 });

      const response = await apiFetch('https://api.example.com/data');

      expect(refreshSession).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(401);
    });

    it('should handle missing session gracefully', async () => {
      (getSession as jest.Mock).mockResolvedValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        ok: true,
      });

      await apiFetch('https://api.example.com/data');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers).toBeUndefined();
    });
  });

  describe('HTTP Method Helpers', () => {
    beforeEach(() => {
      (getSession as jest.Mock).mockResolvedValue({
        access_token: 'test-token',
      });
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        ok: true,
      });
    });

    it('apiGet should use GET method', async () => {
      await apiGet('https://api.example.com/data');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('apiPost should use POST method with JSON body', async () => {
      const data = { name: 'Test', value: 123 };
      await apiPost('https://api.example.com/data', data);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(data),
        })
      );
    });

    it('apiPut should use PUT method with JSON body', async () => {
      const data = { name: 'Updated' };
      await apiPut('https://api.example.com/data/1', data);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data/1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(data),
        })
      );
    });

    it('apiDelete should use DELETE method', async () => {
      await apiDelete('https://api.example.com/data/1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('apiPatch should use PATCH method with JSON body', async () => {
      const data = { partial: 'update' };
      await apiPatch('https://api.example.com/data/1', data);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data/1',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(data),
        })
      );
    });
  });
});
