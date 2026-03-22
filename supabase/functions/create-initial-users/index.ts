import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: any[] = [];

    // Create Patrick (admin)
    const { data: patrick, error: patrickError } = await supabaseAdmin.auth.admin.createUser({
      email: "patrick@ramosengenharia.info",
      password: "Patrick@Ramos2026!",
      email_confirm: true,
      user_metadata: { display_name: "Patrick" },
    });

    if (patrickError) {
      results.push({ user: "Patrick", error: patrickError.message });
    } else {
      // Assign admin role
      const { error: roleErr } = await supabaseAdmin.from("user_roles").upsert(
        { user_id: patrick.user.id, role: "admin" },
        { onConflict: "user_id,role" }
      );
      results.push({ user: "Patrick", id: patrick.user.id, role: "admin", roleError: roleErr?.message });
    }

    // Create Zenilda (financeiro)
    const { data: zenilda, error: zenildaError } = await supabaseAdmin.auth.admin.createUser({
      email: "zenilda@ramosengenharia.info",
      password: "Zenilda@Ramos2026!",
      email_confirm: true,
      user_metadata: { display_name: "Zenilda" },
    });

    if (zenildaError) {
      results.push({ user: "Zenilda", error: zenildaError.message });
    } else {
      // Assign financeiro role
      const { error: roleErr } = await supabaseAdmin.from("user_roles").upsert(
        { user_id: zenilda.user.id, role: "financeiro" },
        { onConflict: "user_id,role" }
      );
      results.push({ user: "Zenilda", id: zenilda.user.id, role: "financeiro", roleError: roleErr?.message });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
