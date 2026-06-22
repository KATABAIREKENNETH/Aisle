require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log("Trying to sign up...");
  const { data, error } = await supabase.auth.signUp({
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    options: {
      data: { full_name: 'Test User' }
    }
  });
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
