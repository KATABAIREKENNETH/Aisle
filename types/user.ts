export type UserRole = 'couple' | 'planner' | 'vendor' | 'guest' | 'superadmin';
export type WeddingMemberRole = 'couple' | 'partner' | 'planner' | 'vendor' | 'guest';

export interface User {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface WeddingMember {
  id: string;
  wedding_id: string;
  user_id: string;
  role: WeddingMemberRole;
  permissions: WeddingPermissions;
  joined_at: string;
  updated_at: string;
}

export interface WeddingPermissions {
  can_edit_budget: boolean;
  can_manage_guests: boolean;
  can_view_tasks: boolean;
  can_assign_tasks: boolean;
  can_send_messages: boolean;
  can_edit_wedding_details: boolean;
  can_manage_vendors: boolean;
  can_view_budget: boolean;
}

export interface UserWeddingContext {
  wedding_id: string;
  role: WeddingMemberRole;
  permissions: WeddingPermissions;
}

export interface AuthSession {
  user: User;
  access_token: string;
  refresh_token: string;
}
