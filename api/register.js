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

  const { email, password, nickname } = body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "email 和 password 不能为空" });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname: nickname || "新用户",
      },
    },
  });

  if (error) {
    return res.status(400).json({ error: error.message || "注册失败" });
  }

  if (!data || !data.user || !data.user.id) {
    return res.status(400).json({ error: "注册失败：未返回用户信息" });
  }

  return res.status(200).json({ msg: "注册成功", userId: data.user.id });
};
