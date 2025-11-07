const { createClient } = require('@supabase/supabase-js');

// Read Supabase credentials from environment variables loaded in main.cjs
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// This check will now fire if the .env file is not found in production
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing. Make sure you have a .env file with SUPABASE_URL and SUPABASE_ANON_KEY.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

async function updateUserPassword(userId, newPassword) {
  const { data, error } = await supabaseAdmin
    .from('admin')
    .update({ password: newPassword, updated_at: new Date().toISOString() })
    .eq('id', parseInt(userId, 10))
    .select()
    .single();

  if (error) throw error;
  return { message: 'Password updated successfully', user: data };
}

async function getUserByEmail(email) {
  const { data: user, error } = await supabaseAdmin
    .from('admin')
    .select('*')
    .eq('email', email)
    .single();

  if (error) throw error;
  return user;
}

async function storeOTP(userId, otp, expiresAt) {
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
  return { message: 'OTP stored successfully', data };
}

async function verifyOTP(userId, otp) {
  const now = new Date().toISOString();

  const { data: otpEntry, error } = await supabaseAdmin
    .from('password_reset_otps')
    .select('*')
    .eq('user_id', parseInt(userId, 10))
    .eq('otp', otp)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !otpEntry) throw new Error('Invalid or expired OTP');

  await supabaseAdmin
    .from('password_reset_otps')
    .delete()
    .eq('id', otpEntry.id);

  return { success: true, message: 'OTP verified', userId: otpEntry.user_id };
}

async function loginAdmin(email, password) {
  const { data: adminUser, error } = await supabaseAdmin
    .from('admin')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !adminUser) throw new Error('Invalid email or password');

  if (password !== adminUser.password) throw new Error('Invalid email or password');

  return { id: adminUser.id, email: adminUser.email };
}

async function generateResetToken(userId) {
  // For a custom auth flow, we don't need a complex Supabase token.
  // A simple timestamp or a random string is enough to validate the next step.
  // We'll just use a timestamp as a placeholder "token".
  return { token: Date.now().toString() };
}

module.exports = {
  updateUserPassword,
  getUserByEmail,
  storeOTP,
  verifyOTP,
  loginAdmin,
  generateResetToken,
};