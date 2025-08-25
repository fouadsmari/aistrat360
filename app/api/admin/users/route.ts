import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      first_name,
      last_name,
      role = 'subscriber',
      phone,
      company,
      address,
      city,
      postal_code,
      country
    } = body

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create user with admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: `Auth error: ${authError.message}` },
        { status: 400 }
      )
    }

    if (authData.user) {
      // Update the profile with additional information using service role
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          first_name,
          last_name,
          role,
          phone: phone || null,
          company: company || null,
          address: address || null,
          city: city || null,
          postal_code: postal_code || null,
          country: country || null,
          is_active: true,
        })
        .eq('id', authData.user.id)

      if (profileError) {
        return NextResponse.json(
          { error: `Profile error: ${profileError.message}` },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        user: authData.user
      })
    }

    return NextResponse.json(
      { error: 'User creation failed' },
      { status: 400 }
    )

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}