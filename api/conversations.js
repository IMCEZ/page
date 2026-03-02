const { supabase, getUser, setCors } = require("../lib/supabase");

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  const user = await getUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "POST") {
    let body = req.body || {};
    if (typeof body === "string") {
      try {
        body = JSON.parse(body || "{}");
      } catch {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }

    const title = body?.title || "新对话";
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method === "DELETE") {
    const id = req?.query?.id;
    if (!id) return res.status(400).json({ error: "缺少对话ID" });

    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ msg: "删除成功" });
  }

  res.setHeader("Allow", "GET,POST,DELETE,OPTIONS");
  return res.status(405).json({ error: "Method Not Allowed" });
};
