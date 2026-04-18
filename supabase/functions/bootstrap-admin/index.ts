// Bootstrap admin: one-shot endpoint to (re)create the primary Z Agro Tech admin
// account and revoke any prior admins. Idempotent — safe to invoke repeatedly.
//
// SECURITY: Only callable while NO admin exists in user_roles, OR when the
// caller is already an authenticated admin. After the first successful run,
// this should ideally be deleted or disabled.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const TARGET_EMAIL = 'nijhumislam570@gmail.com';
const TARGET_PASSWORD = 'Munmun@109548';
const TARGET_FULL_NAME = 'Nijhum Islam';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Authorization: allow if zero admins exist yet, OR caller is already admin.
    const { count: existingAdmins } = await admin
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if ((existingAdmins ?? 0) > 0) {
      const authHeader = req.headers.get('Authorization') ?? '';
      const jwt = authHeader.replace('Bearer ', '').trim();
      if (!jwt) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: existing admins present, must be signed in as admin' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      const { data: caller } = await admin.auth.getUser(jwt);
      if (!caller.user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: callerRole } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', caller.user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!callerRole) {
        return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 1. Find or create the auth user.
    let userId: string | null = null;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users.find((u) => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());

    if (existing) {
      userId = existing.id;
      // Reset password + ensure email is confirmed.
      await admin.auth.admin.updateUserById(existing.id, {
        password: TARGET_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: TARGET_FULL_NAME },
      });
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: TARGET_EMAIL,
        password: TARGET_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: TARGET_FULL_NAME },
      });
      if (createErr || !created.user) {
        return new Response(
          JSON.stringify({ error: createErr?.message ?? 'Failed to create user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      userId = created.user.id;
    }

    // 2. Ensure profile row exists.
    await admin
      .from('profiles')
      .upsert({ user_id: userId, full_name: TARGET_FULL_NAME }, { onConflict: 'user_id' });

    // 3. Revoke ALL other admin roles, then grant admin to this user.
    await admin.from('user_roles').delete().eq('role', 'admin').neq('user_id', userId);

    const { data: existingRole } = await admin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!existingRole) {
      await admin.from('user_roles').insert({ user_id: userId, role: 'admin' });
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        email: TARGET_EMAIL,
        message: 'Admin bootstrapped. You can now sign in with the configured credentials.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
