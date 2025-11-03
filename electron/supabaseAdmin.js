import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase admin environment variables');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Admin functions that will be moved to Edge Functions
export const adminFunctions = {
  updateUserPassword: async (userId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { data, error } = await supabaseAdmin
      .from('admin')
      .update({ password: hashedPassword, updated_at: new Date().toISOString() })
      .eq('id', parseInt(userId, 10))
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getUserByEmail: async (email) => {
    const { data, error } = await supabaseAdmin
      .from('admin')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  },

  storeOTP: async (userId, otp, expiresAt) => {
    const { data, error } = await supabaseAdmin
      .from('password_reset_otps')
      .insert({
        user_id: parseInt(userId, 10),
        otp: otp,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  verifyOTP: async (userId, otp) => {
    const { data, error } = await supabaseAdmin
      .from('password_reset_otps')
      .select('*')
      .eq('user_id', parseInt(userId, 10))
      .eq('otp', otp)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) throw new Error('Invalid or expired OTP');

    // Delete the used OTP
    await supabaseAdmin
      .from('password_reset_otps')
      .delete()
      .eq('id', data.id);

    return data;
  },

  loginAdmin: async (email, password) => {
    const { data, error } = await supabaseAdmin
      .from('admin')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;

    const isPasswordValid = await bcrypt.compare(password, data.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    return { id: data.id, email: data.email };
  }
};