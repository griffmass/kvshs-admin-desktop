import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * NOTE: This function assumes you have a table named `password_reset_otps`
 * with columns: `user_id` (integer), `otp` (text), `expires_at` (timestamptz), etc.
 *
 * It checks if a given OTP is valid and not expired for a user.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      // This uses the secret you just set
      Deno.env.get('MY_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get userId and OTP from request
    const { userId, otp } = await req.json()
    if (!userId || !otp) {
      throw new Error('User ID and OTP are required')
    }

    // 2. Get the current time
    const now = new Date().toISOString()

    // 3. Find a matching and non-expired OTP for the user
    const { data: otpEntry, error } = await supabaseAdmin
      .from('password_reset_otps')
      .select('*')
      .eq('user_id', parseInt(userId, 10))
      .eq('otp', otp)
      .gt('expires_at', now) // Check that it's greater than (after) now
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !otpEntry) {
      throw new Error('Invalid or expired OTP')
    }

    // 4. If successful, delete the OTP so it can't be reused
    await supabaseAdmin
      .from('password_reset_otps')
      .delete()
      .eq('id', otpEntry.id)

    // 5. Return success with user_id
    return new Response(JSON.stringify({
      success: true,
      message: 'OTP verified',
      userId: otpEntry.user_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
