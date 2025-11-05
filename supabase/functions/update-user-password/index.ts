import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    // 1. Get user ID and new password from request
    const { userId, newPassword } = await req.json()
    if (!userId || !newPassword) {
      throw new Error('User ID and new password are required')
    }

    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 3. Update the password in the custom admin table
    const { data, error } = await supabaseAdmin
      .from('admin')
      .update({ password: hashedPassword, updated_at: new Date().toISOString() })
      .eq('id', parseInt(userId, 10))
      .select()
      .single()

    if (error) {
      throw error
    }

    // 4. Return success message
    return new Response(JSON.stringify({ message: 'Password updated successfully', user: data }), {
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
