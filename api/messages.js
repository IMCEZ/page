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

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET,OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const conversationId = req?.query?.conversation_id;
  if (!conversationId) {
    return res.status(400).json({ error: "缺少 conversation_id" });
  }

  const { data: conversation, error: convoError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (convoError) return res.status(400).json({ error: convoError.message });
  if (!conversation) return res.status(404).json({ error: "对话不存在" });

  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json(messages || []);
};
