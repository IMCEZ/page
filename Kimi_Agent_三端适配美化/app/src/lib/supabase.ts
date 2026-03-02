import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hopddhrokczuyunhzvcy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvcGRkaHJva2N6dXl1bmh6dmN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTQ3MjksImV4cCI6MjA4Nzk5MDcyOX0.dw54cXeD7HQR2x9Si2-5XTuQodFuM8kkNzSgWPZQpI0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
