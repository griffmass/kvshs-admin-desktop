import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * NOTE: This function authenticates admin users against the custom admin table
 * with bcrypt password hashing.
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

    // 1. Get email and password from the request
    const { email, password } = await req.json()
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    // 2. Get the admin user from the custom admin table
    const { data: adminUser, error } = await supabaseAdmin
      .from('admin')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !adminUser) {
      throw new Error('Invalid email or password')
    }

    // 3. Verify the password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, adminUser.password)
    if (!isPasswordValid) {
      throw new Error('Invalid email or password')
    }

    // 4. Return success with user data
    return new Response(JSON.stringify({
      success: true,
      user: { id: adminUser.id, email: adminUser.email }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
