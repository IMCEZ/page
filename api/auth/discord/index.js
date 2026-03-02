// GET /api/auth/discord
// 构造 Discord OAuth2 授权 URL 并 302 重定向
module.exports = (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify email",
    prompt: "consent",
  });

  res.writeHead(302, {
    Location: `https://discord.com/api/oauth2/authorize?${params.toString()}`,
  });
  res.end();
};

