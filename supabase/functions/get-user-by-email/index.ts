import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// These headers are essential for your Electron app to call the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Create the Admin Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      // **** UPDATED THIS LINE ****
      Deno.env.get('MY_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Get the email from the request body
    const { email } = await req.json()
    if (!email) {
      throw new Error('Email is required')
    }

    // 3. Query the custom admin table instead of auth.users
    const { data: user, error } = await supabaseAdmin
      .from('admin')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      throw error
    }

    // 4. Return the user data
    return new Response(JSON.stringify({ user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // 5. Handle errors
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

