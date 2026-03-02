const { supabase, getUser, setCors } = require("../lib/supabase");

const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_BASE_URL = process.env.LLM_BASE_URL;
const LLM_MODEL = process.env.LLM_MODEL;

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

  const { conversation_id: conversationId, message } = body || {};

  if (!conversationId || !message) {
    return res.status(400).json({ error: "conversation_id 和 message 不能为空" });
  }

  const { data: conversation, error: convoError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (convoError) {
    return res.status(400).json({ error: convoError.message });
  }
  if (!conversation) {
    return res.status(404).json({ error: "对话不存在" });
  }

  const { error: insertUserError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: message,
  });

  if (insertUserError) {
    return res.status(400).json({ error: insertUserError.message });
  }

  const { data: historyRows, error: historyError } = await supabase
    .from("messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (historyError) {
    return res.status(400).json({ error: historyError.message });
  }

  const history =
    Array.isArray(historyRows) && historyRows.length
      ? historyRows.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      : [];

  const messagesForLLM = [
    {
      role: "system",
      content: "你是一个友善的AI助手。",
    },
    ...history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  let reply;
  try {
    const baseUrl = (LLM_BASE_URL || "").replace(/\/+$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY || ""}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: messagesForLLM,
      }),
    });

    if (!response.ok) {
      return res
        .status(502)
        .json({ error: "调用 LLM 接口失败，请稍后重试。" });
    }

    const json = await response.json();
    reply = json?.choices?.[0]?.message?.content || "";
  } catch (e) {
    return res
      .status(500)
      .json({ error: "AI 服务暂时不可用，请稍后重试。" });
  }

  if (!reply) {
    reply = "抱歉，我暂时无法生成回复。";
  }

  const { error: insertAssistantError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: reply,
  });

  if (insertAssistantError) {
    return res.status(400).json({ error: insertAssistantError.message });
  }

  // 更新对话的更新时间（不强制失败）
  const nowIso = new Date().toISOString();
  await supabase
    .from("conversations")
    .update({ updated_at: nowIso })
    .eq("id", conversationId)
    .eq("user_id", user.id);

  return res.status(200).json({ reply });
};
