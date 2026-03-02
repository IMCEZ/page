// 全局配置与状态
const API_BASE = "";
let token = localStorage.getItem("token") || "";
let currentUser = null;
try {
  currentUser = JSON.parse(localStorage.getItem("user") || "null");
} catch {
  currentUser = null;
}
let conversationId = localStorage.getItem("conversationId") || "";

// DOM 引用
let authPageEl;
let chatPageEl;
let nicknameInputEl;
let emailInputEl;
let passwordInputEl;
let authErrorEl;
let chatUserNicknameEl;
let chatMessagesEl;
let chatInputEl;
let loginButtonEl;
let registerButtonEl;
let logoutButtonEl;

function setButtonLoading(button, loading) {
  if (!button) return;
  if (loading) {
    button.classList.add("loading");
    button.disabled = true;
  } else {
    button.classList.remove("loading");
    button.disabled = false;
  }
}

function getAuthHeaders() {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

// 1. 注册
async function handleRegister() {
  if (!emailInputEl || !passwordInputEl || !nicknameInputEl || !authErrorEl) return;

  const email = emailInputEl.value.trim();
  const password = passwordInputEl.value.trim();
  const nickname = nicknameInputEl.value.trim();

  if (!email || !password) {
    authErrorEl.textContent = "邮箱和密码不能为空";
    return;
  }

  authErrorEl.textContent = "";
  setButtonLoading(registerButtonEl, true);

  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, nickname }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      authErrorEl.textContent = data?.error || "注册失败，请稍后重试";
      return;
    }

    authErrorEl.textContent = "注册成功，请登录。";
  } catch (e) {
    authErrorEl.textContent = "网络错误，请稍后重试";
  } finally {
    setButtonLoading(registerButtonEl, false);
  }
}

// 2. 登录
async function handleLogin() {
  if (!emailInputEl || !passwordInputEl || !authErrorEl) return;

  const email = emailInputEl.value.trim();
  const password = passwordInputEl.value.trim();

  if (!email || !password) {
    authErrorEl.textContent = "邮箱和密码不能为空";
    return;
  }

  authErrorEl.textContent = "";
  setButtonLoading(loginButtonEl, true);

  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      authErrorEl.textContent = data?.error || "登录失败，请稍后重试";
      return;
    }

    token = data.token || "";
    currentUser = data.user || null;

    if (!token || !currentUser) {
      authErrorEl.textContent = "登录失败：缺少会话信息";
      return;
    }

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(currentUser));

    showChatPage();
  } catch (e) {
    authErrorEl.textContent = "网络错误，请稍后重试";
  } finally {
    setButtonLoading(loginButtonEl, false);
  }
}

// 3. 显示聊天页
async function showChatPage() {
  if (!authPageEl || !chatPageEl || !chatUserNicknameEl) return;

  authPageEl.style.display = "none";
  chatPageEl.style.display = "flex";
  chatPageEl.setAttribute("aria-hidden", "false");

  const nickname =
    (currentUser && currentUser.user_metadata && currentUser.user_metadata.nickname) ||
    "新用户";
  chatUserNicknameEl.textContent = nickname;

  if (!conversationId) {
    await createConversation();
  } else {
    await loadMessages();
  }
}

// 4. 创建新对话
async function createConversation() {
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ title: "新对话" }),
    });

    if (res.status === 401) {
      handleLogout();
      return;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      addMessageToUI("assistant", data?.error || "创建对话失败，请稍后重试");
      return;
    }

    conversationId = data.id;
    if (conversationId) {
      localStorage.setItem("conversationId", conversationId);
    }
  } catch (e) {
    addMessageToUI("assistant", "网络错误，请稍后重试");
  }
}

// 5. 加载消息
async function loadMessages() {
  if (!token || !conversationId || !chatMessagesEl) return;

  try {
    const res = await fetch(
      `${API_BASE}/api/messages?conversation_id=${encodeURIComponent(
        conversationId
      )}`,
      {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
        },
      }
    );

    if (res.status === 401) {
      handleLogout();
      return;
    }

    const data = await res.json().catch(() => []);

    if (!res.ok) {
      addMessageToUI("assistant", data?.error || "加载消息失败");
      return;
    }

    chatMessagesEl.innerHTML = "";
    (data || []).forEach((msg) => {
      addMessageToUI(msg.role || "assistant", msg.content || "");
    });
    scrollMessagesToBottom();
  } catch (e) {
    addMessageToUI("assistant", "网络错误，请稍后重试");
  }
}

function scrollMessagesToBottom() {
  if (!chatMessagesEl) return;
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

// 6. 发送消息
async function sendMessage() {
  if (!chatInputEl || !chatMessagesEl) return;

  const text = chatInputEl.value.trim();
  if (!text) return;

  chatInputEl.value = "";

  if (!conversationId) {
    await createConversation();
    if (!conversationId) {
      addMessageToUI("assistant", "无法创建对话，请稍后重试");
      return;
    }
  }

  addMessageToUI("user", text);

  const thinkingEl = addMessageToUI("assistant", "思考中... 💭");
  scrollMessagesToBottom();

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: text,
      }),
    });

    if (res.status === 401) {
      handleLogout();
      return;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      thinkingEl.textContent = data?.error || "发送失败，请稍后重试";
      return;
    }

    const reply = data.reply || "（AI 未返回内容）";
    thinkingEl.textContent = reply;
  } catch (e) {
    thinkingEl.textContent = "网络错误，请稍后重试";
  } finally {
    scrollMessagesToBottom();
  }
}

// 7. 添加消息到界面
function addMessageToUI(role, content) {
  if (!chatMessagesEl) return document.createElement("div");

  const row = document.createElement("div");
  row.className =
    "chat-message-row " +
    (role === "user" ? "chat-message-row--user" : "chat-message-row--assistant");

  const bubble = document.createElement("div");
  bubble.className =
    "chat-bubble " +
    (role === "user" ? "chat-bubble--user" : "chat-bubble--assistant");
  bubble.classList.add("message", role); // 兼容要求的 class
  bubble.textContent = content;

  row.appendChild(bubble);
  chatMessagesEl.appendChild(row);

  return bubble;
}

// 8. 登出
function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("conversationId");

  token = "";
  currentUser = null;
  conversationId = "";

  if (chatPageEl && authPageEl) {
    chatPageEl.style.display = "none";
    chatPageEl.setAttribute("aria-hidden", "true");
    authPageEl.style.display = "flex";
  }
}

// 事件绑定与初始化
window.onload = function () {
  authPageEl = document.getElementById("authPage");
  chatPageEl = document.getElementById("chatPage");
  nicknameInputEl = document.getElementById("nicknameInput");
  emailInputEl = document.getElementById("emailInput");
  passwordInputEl = document.getElementById("passwordInput");
  authErrorEl = document.getElementById("authError");
  chatUserNicknameEl = document.getElementById("chatUserNickname");
  chatMessagesEl = document.getElementById("chatMessages");
  chatInputEl = document.getElementById("chatInput");
  loginButtonEl = document.getElementById("loginButton");
  registerButtonEl = document.getElementById("registerButton");
  logoutButtonEl = document.getElementById("logoutButton");

  if (loginButtonEl) {
    loginButtonEl.onclick = function () {
      handleLogin();
    };
  }

  if (registerButtonEl) {
    registerButtonEl.onclick = function () {
      handleRegister();
    };
  }

  if (logoutButtonEl) {
    logoutButtonEl.onclick = function () {
      handleLogout();
    };
  }

  const chatForm = document.querySelector(".chat-input-row");
  if (chatForm) {
    chatForm.addEventListener("submit", function (e) {
      e.preventDefault();
      sendMessage();
    });
  }

  if (chatInputEl) {
    chatInputEl.addEventListener("keypress", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // 自动登录已存在会话
  if (token && currentUser) {
    showChatPage();
  } else if (authPageEl && chatPageEl) {
    authPageEl.style.display = "flex";
    chatPageEl.style.display = "none";
  }
};

