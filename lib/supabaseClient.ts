import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON;

// Create a function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Create a mock client for when Supabase is not configured
const createMockClient = () => ({
  storage: {
    from: () => ({
      list: async () => ({
        data: [],
        error: { message: "Supabase not configured" },
      }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  },
  from: () => ({
    select: () => ({
      order: () => ({
        data: null,
        error: { message: "Supabase not configured - using sample data" },
      }),
      eq: () => ({
        data: null,
        error: { message: "Supabase not configured - using sample data" },
        single: () => ({
          data: null,
          error: { message: "Supabase not configured - using sample data" },
        }),
        order: () => ({
          data: null,
          error: { message: "Supabase not configured - using sample data" },
        }),
      }),
    }),
  }),
});

// Validate environment variables and create client
let supabase:
  | ReturnType<typeof createClient>
  | ReturnType<typeof createMockClient>;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️  Supabase environment variables not configured. Using mock client."
  );
  console.warn(
    "Required variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );

  // In production, log instructions for Vercel
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "🔧 To fix this in Vercel: Go to your project dashboard → Settings → Environment Variables"
    );
  } else {
    console.warn(
      "🔧 For local development: Create a .env.local file with your Supabase credentials"
    );
  }

  supabase = createMockClient();
} else {
  // Validate URL format
  try {
    new URL(supabaseUrl);
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch {
    console.error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". Must be a valid HTTP or HTTPS URL.`
    );
    supabase = createMockClient();
  }
}

export { supabase };
