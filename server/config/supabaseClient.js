const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin client with service_role key
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

module.exports = { supabaseAdmin };