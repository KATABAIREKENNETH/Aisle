import { supabase } from '../supabase/client';
import type { Vendor, VendorFormData, VendorStatus } from '../../types';

export async function getVendors(weddingId: string) {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Vendor[];
}

export async function getVendorById(vendorId: string) {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .single();

  if (error) throw error;
  return data as Vendor;
}

export async function createVendor(weddingId: string, vendorData: VendorFormData) {
  const { data, error } = await supabase
    .from('vendors')
    .insert({
      wedding_id: weddingId,
      ...vendorData,
      quoted_amount: vendorData.quoted_amount ? parseFloat(vendorData.quoted_amount) : null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Vendor;
}

export async function updateVendor(vendorId: string, updates: Partial<VendorFormData>) {
  const { data, error } = await supabase
    .from('vendors')
    .update({
      ...updates,
      quoted_amount: updates.quoted_amount ? parseFloat(updates.quoted_amount) : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', vendorId)
    .select()
    .single();

  if (error) throw error;
  return data as Vendor;
}

export async function deleteVendor(vendorId: string) {
  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', vendorId);

  if (error) throw error;
}

export async function updateVendorStatus(vendorId: string, status: VendorStatus) {
  const { data, error } = await supabase
    .from('vendors')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', vendorId)
    .select()
    .single();

  if (error) throw error;
  return data as Vendor;
}
