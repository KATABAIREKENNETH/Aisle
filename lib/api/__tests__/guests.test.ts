import { getGuests, getGuestById, createGuest, updateGuest, deleteGuest, updateRSVPStatus } from '../guests';
import { supabase } from '../../__mocks__/supabase/client';

jest.mock('../../supabase/client', () => ({
  supabase: require('../../__mocks__/supabase/client').supabase,
}));

describe('Guests API - Integration Tests', () => {
  const mockWeddingId = 'wedding-123';
  const mockGuestId = 'guest-123';
  const mockGuest = {
    id: mockGuestId,
    wedding_id: mockWeddingId,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    rsvp_status: 'invited',
    children_count: 0,
    accommodation_needed: false,
    dietary_restrictions: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  describe('getGuests', () => {
    it('should fetch guests for a wedding', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockReturnValue(supabase);
      (supabase.order as jest.Mock).mockResolvedValue({ data: [mockGuest], error: null });

      const result = await getGuests(mockWeddingId);

      expect(supabase.from).toHaveBeenCalledWith('guests');
      expect(supabase.eq).toHaveBeenCalledWith('wedding_id', mockWeddingId);
      expect(supabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual([mockGuest]);
    });

    it('should throw error when fetch fails', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockReturnValue(supabase);
      (supabase.order as jest.Mock).mockResolvedValue({ data: null, error: new Error('Database error') });

      await expect(getGuests(mockWeddingId)).rejects.toThrow('Database error');
    });
  });

  describe('getGuestById', () => {
    it('should fetch a single guest by ID', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockReturnValue(supabase);
      (supabase.single as jest.Mock).mockResolvedValue({ data: mockGuest, error: null });

      const result = await getGuestById(mockGuestId);

      expect(supabase.from).toHaveBeenCalledWith('guests');
      expect(supabase.eq).toHaveBeenCalledWith('id', mockGuestId);
      expect(result).toEqual(mockGuest);
    });

    it('should throw error when guest not found', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockReturnValue(supabase);
      (supabase.single as jest.Mock).mockResolvedValue({ data: null, error: new Error('Guest not found') });

      await expect(getGuestById(mockGuestId)).rejects.toThrow('Guest not found');
    });
  });

  describe('createGuest', () => {
    it('should create a new guest', async () => {
      const guestData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1234567890',
        rsvp_status: 'invited' as const,
        plus_one: false,
      };

      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.insert as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.single as jest.Mock).mockResolvedValue({ 
        data: { ...mockGuest, ...guestData }, 
        error: null 
      });

      const result = await createGuest(mockWeddingId, guestData);

      expect(supabase.from).toHaveBeenCalledWith('guests');
      expect(supabase.insert).toHaveBeenCalledWith({
        wedding_id: mockWeddingId,
        ...guestData,
        children_count: 0,
        accommodation_needed: false,
      });
      expect(result).toHaveProperty('name', 'Jane Doe');
    });
  });

  describe('updateGuest', () => {
    it('should update an existing guest', async () => {
      const updates = { name: 'Updated Name', rsvp_status: 'attending' as const };

      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.update as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.single as jest.Mock).mockResolvedValue({ 
        data: { ...mockGuest, ...updates }, 
        error: null 
      });

      const result = await updateGuest(mockGuestId, updates);

      expect(supabase.from).toHaveBeenCalledWith('guests');
      expect(supabase.eq).toHaveBeenCalledWith('id', mockGuestId);
      expect(result).toHaveProperty('name', 'Updated Name');
    });
  });

  describe('deleteGuest', () => {
    it('should delete a guest', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.delete as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockResolvedValue({ error: null });

      await deleteGuest(mockGuestId);

      expect(supabase.from).toHaveBeenCalledWith('guests');
      expect(supabase.eq).toHaveBeenCalledWith('id', mockGuestId);
    });

    it('should throw error when delete fails', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.delete as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockResolvedValue({ error: new Error('Delete failed') });

      await expect(deleteGuest(mockGuestId)).rejects.toThrow('Delete failed');
    });
  });

  describe('updateRSVPStatus', () => {
    it('should update RSVP status to attending', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.update as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.single as jest.Mock).mockResolvedValue({ 
        data: { ...mockGuest, rsvp_status: 'attending' }, 
        error: null 
      });

      const result = await updateRSVPStatus(mockGuestId, 'attending');

      expect(supabase.update).toHaveBeenCalledWith(
        expect.objectContaining({ rsvp_status: 'attending' })
      );
      expect(result).toHaveProperty('rsvp_status', 'attending');
    });

    it('should update RSVP status to declined', async () => {
      (supabase.from as jest.Mock).mockReturnValue(supabase);
      (supabase.update as jest.Mock).mockReturnValue(supabase);
      (supabase.eq as jest.Mock).mockReturnValue(supabase);
      (supabase.select as jest.Mock).mockReturnValue(supabase);
      (supabase.single as jest.Mock).mockResolvedValue({ 
        data: { ...mockGuest, rsvp_status: 'declined' }, 
        error: null 
      });

      const result = await updateRSVPStatus(mockGuestId, 'declined');

      expect(supabase.update).toHaveBeenCalledWith(
        expect.objectContaining({ rsvp_status: 'declined' })
      );
      expect(result).toHaveProperty('rsvp_status', 'declined');
    });
  });
});
