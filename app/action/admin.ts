// app/actions/admin.ts
'use server';

import { supabaseAdmin } from '@/utils/supabase/admin';

// 1. Create a new user with a specific role
export async function createStaffUser(email: string, password: string, fullName: string, role: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm the email for internal staff
    user_metadata: {
      fullName: fullName,
      role: role, // e.g., 'cutting_supervisor', 'ADMIN'
    },
  });

  if (error) {
    console.error('Error creating user:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}

// 2. Update an existing user's role
export async function updateUserRole(userId: string, newRole: string) {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: {
      role: newRole,
    },
  });

  if (error) {
    console.error('Error updating role:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}

// 3. Delete a user (Admin only)
export async function deleteUser(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}

// 4. List all staff users (Admin only)
export async function listStaffUsers() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  
  if (error) {
    console.error('Error listing users:', error.message);
    return { success: false, error: error.message, users: [] };
  }

  const users = (data?.users || []).map((u) => ({
    id: u.id,
    email: u.email || '',
    fullName: u.user_metadata?.fullName || u.email?.split('@')[0] || 'Unknown',
    role: (u.user_metadata?.role || 'OPERATOR').toUpperCase(),
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at || null,
  }));

  return { success: true, users };
}