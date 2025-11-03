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
 * It will store an OTP for a given user ID.
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

    // 1. Get userId, otp, and expiresAt from request
    const { userId, otp, expiresAt } = await req.json()
    if (!userId || !otp || !expiresAt) {
      throw new Error('User ID, OTP, and expiresAt are required')
    }

    // 2. Insert the OTP into the password_reset_otps table
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
      .single()

    if (error) {
      throw error
    }

    // 3. Return success
    return new Response(JSON.stringify({ message: 'OTP stored successfully', data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
