export interface Wedding {
  id: string;
  couple_id: string;
  partner_id?: string;
  wedding_date: string;
  wedding_location?: string;
  venue_name?: string;
  theme?: string;
  budget?: number;
  guest_count?: number;
  created_at: string;
  updated_at: string;
}

export interface WeddingFormData {
  weddingDate: string;
  weddingLocation: string;
  venueName?: string;
  theme?: string;
  budget?: string;
  guestCount?: string;
  selectedSize?: 'intimate' | 'medium' | 'large' | null;
}
