const { supabase, setCors } = require("../lib/supabase");

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST,OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  const { email, password } = body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email 和 password 不能为空" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const token = data?.session?.access_token;
  const user = data?.user;
  if (!token || !user) {
    return res.status(400).json({ error: "登录失败：未返回会话信息" });
  }

  return res.status(200).json({
    msg: "登录成功",
    token,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.user_metadata?.nickname,
    },
  });
};
