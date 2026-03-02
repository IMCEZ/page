const jwt = require("jsonwebtoken");
const { supabase, setCors } = require("../../../../lib/supabase");

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET,OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const code = req.query && (req.query.code || req.query.code);

  if (!code) {
    // eslint-disable-next-line no-console
    console.error("[Discord OAuth] 回调缺少 code 参数");
    return redirectWithError(res, "missing_code");
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const jwtSecret = process.env.JWT_SECRET;

  if (!clientId || !clientSecret || !redirectUri || !jwtSecret) {
    // eslint-disable-next-line no-console
    console.error(
      "[Discord OAuth] 环境变量未正确配置",
      JSON.stringify(
        {
          DISCORD_CLIENT_ID: !!clientId,
          DISCORD_CLIENT_SECRET: !!clientSecret,
          DISCORD_REDIRECT_URI: !!redirectUri,
          JWT_SECRET: !!jwtSecret,
        },
        null,
        2
      )
    );
    return redirectWithError(res, "env_not_configured");
  }

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text().catch(() => "");
      // eslint-disable-next-line no-console
      console.error("[Discord OAuth] token 交换失败", {
        status: tokenResponse.status,
        body: errorText,
      });
      return redirectWithError(res, "token_exchange_failed");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData && tokenData.access_token;

    if (!accessToken) {
      // eslint-disable-next-line no-console
      console.error("[Discord OAuth] 未能获取 access_token", tokenData);
      return redirectWithError(res, "token_exchange_failed");
    }

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text().catch(() => "");
      // eslint-disable-next-line no-console
      console.error("[Discord OAuth] 获取用户信息失败", {
        status: userResponse.status,
        body: errorText,
      });
      return redirectWithError(res, "user_info_failed");
    }

    const userData = await userResponse.json();

    const discordId = String(userData.id || "");
    const username = String(userData.username || "");
    const globalName = userData.global_name || null;
    const email = userData.email || null; // 可能为空，需兼容
    const avatarHash = userData.avatar || null;

    if (!discordId) {
      // eslint-disable-next-line no-console
      console.error("[Discord OAuth] 返回数据缺少用户 ID", userData);
      return redirectWithError(res, "user_info_failed");
    }

    const avatarUrl =
      avatarHash && discordId
        ? `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png`
        : null;

    // 查询 / 创建我们自己的用户表记录
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("discord_id", discordId)
      .maybeSingle();

    if (selectError && selectError.code !== "PGRST116") {
      // eslint-disable-next-line no-console
      console.error("[Discord OAuth] 查询用户失败", selectError);
      return redirectWithError(res, "user_lookup_failed");
    }

    let userRecord = existingUser || null;

    if (!userRecord) {
      const nickname = globalName || username || "Discord 用户";
      const insertPayload = {
        email,
        password_hash: null,
        username: nickname,
        discord_id: discordId,
        discord_avatar: avatarUrl,
        auth_provider: "discord",
      };

      const { data: inserted, error: insertError } = await supabase
        .from("users")
        .insert(insertPayload)
        .select("*")
        .single();

      if (insertError || !inserted) {
        // eslint-disable-next-line no-console
        console.error("[Discord OAuth] 创建用户失败", insertError);
        return redirectWithError(res, "user_create_failed");
      }

      userRecord = inserted;
    }

    // 构造前端使用的 user 对象
    const nickname =
      (userRecord && (userRecord.username || userRecord.nickname)) || username || null;

    const userPayload = {
      id: userRecord.id,
      username: userRecord.username,
      email: userRecord.email,
      nickname,
      discord_avatar: userRecord.discord_avatar,
    };

    const jwtToken = jwt.sign(userPayload, jwtSecret, {
      expiresIn: "7d",
    });

    const userJson = JSON.stringify(userPayload);
    const userBase64 = Buffer.from(userJson, "utf8").toString("base64");

    const redirectUrl = `/?auth=discord#token=${encodeURIComponent(
      jwtToken
    )}&user=${encodeURIComponent(userBase64)}`;

    res.statusCode = 302;
    res.setHeader("Location", redirectUrl);
    return res.end();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[Discord OAuth] 回调处理异常", err);
    return redirectWithError(res, "callback_exception");
  }
};

function redirectWithError(res, message) {
  const url = `/?auth=error&message=${encodeURIComponent(message || "Discord 登录失败")}`;
  res.statusCode = 302;
  res.setHeader("Location", url);
  return res.end();
}

