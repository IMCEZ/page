const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getUser(req) {
  try {
    const auth =
      (req && req.headers && (req.headers.authorization || req.headers.Authorization)) ||
      "";
    const match = typeof auth === "string" ? auth.match(/^Bearer\s+(.+)$/i) : null;
    const token = match && match[1] ? match[1].trim() : "";
    if (!token) return null;

    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data && data.user ? data.user : null;
  } catch {
    return null;
  }
}

function setCors(res) {
  if (!res || typeof res.setHeader !== "function") return;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

module.exports = {
  supabase,
  getUser,
  setCors,
};
