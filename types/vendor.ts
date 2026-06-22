export type VendorStatus = 'researching' | 'contacted' | 'quoted' | 'booked' | 'paid';

export interface Vendor {
  id: string;
  wedding_id: string;
  name: string;
  category: string;
  email?: string;
  phone?: string;
  website?: string;
  status: VendorStatus;
  quoted_amount?: number;
  actual_amount?: number;
  contract_url?: string;
  contract_uploaded?: boolean;
  rating?: number;
  review?: string;
  notes?: string;
  user_id?: string;
  invitation_sent?: boolean;
  invitation_accepted?: boolean;
  invitation_token?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorFormData {
  name: string;
  category: string;
  email?: string;
  phone?: string;
  website?: string;
  quoted_amount?: string;
  notes?: string;
}
