export type RSVPStatus = 'invited' | 'opened' | 'attending' | 'declined' | 'no_response';

export interface Guest {
  id: string;
  wedding_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  dietary_needs?: string;
  plus_one: boolean;
  plus_one_name?: string;
  group_tag?: string;
  rsvp_status: RSVPStatus;
  meal_preference?: string;
  accommodation_needed: boolean;
  accessibility_needs?: string | null;
  children_count: number;
  table_number?: string | null;
  notes?: string | null;
  user_id?: string;
  invitation_sent?: boolean;
  invitation_accepted?: boolean;
  invitation_token?: string;
  created_at: string;
  updated_at: string;
}

export interface GuestFormData {
  name: string;
  email?: string | null | undefined;
  phone?: string | null;
  address?: string | null;
  dietary_needs?: string | null;
  plus_one: boolean;
  plus_one_name?: string | null;
  group_tag?: string | null;
  rsvp_status?: RSVPStatus;
  meal_preference?: string | null;
  accommodation_needed?: boolean;
  accessibility_needs?: string | null;
  children_count?: number;
  table_number?: string | null;
  notes?: string | null;
}
