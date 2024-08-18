// src/config/env.js
var UserConfig = class {
  // -- 非配置属性 --
  DEFINE_KEYS = [];
  // -- 通用配置 --
  //
  // AI提供商: auto, openai, azure, workers, gemini
  AI_PROVIDER = "auto";
  // AI图片提供商: disabled
  // 全局默认初始化消息
  SYSTEM_INIT_MESSAGE = null;
  // 全局默认初始化消息角色
  SYSTEM_INIT_MESSAGE_ROLE = "system";
  // 自定义动作
  MY_ACTIONS = {};
  // -- Open AI 配置 --
  //
  // OpenAI API Key
  OPENAI_API_KEY = [];
  // OpenAI的模型名称
  OPENAI_CHAT_MODEL = "gpt-3.5-turbo";
  // OpenAI API BASE ``
  OPENAI_API_BASE = "https://api.openai.com/v1";
  // OpenAI API Extra Params
  OPENAI_API_EXTRA_PARAMS = {};
  // -- DALLE 配置 -- disabled
  // -- AZURE 配置 --
  AZURE_API_KEY = null;
  // https://RESOURCE_NAME.openai.azure.com/openai/deployments/MODEL_NAME/chat/completions?api-version=VERSION_NAME
  AZURE_COMPLETIONS_API = null;
  // https://RESOURCE_NAME.openai.azure.com/openai/deployments/MODEL_NAME/images/generations?api-version=VERSION_NAME
  // AZURE_DALLE_API = null; disabled
  // -- Workers 配置 --
  CLOUDFLARE_ACCOUNT_ID = null;
  CLOUDFLARE_TOKEN = null;
  // Text Generation Model
  WORKERS_CHAT_MODEL = "@cf/mistral/mistral-7b-instruct-v0.1 ";
  // Text-to-Image Model disabled
}, Environment = class {
  // -- 版本数据 --
  //
  // 当前版本
  BUILD_TIMESTAMP = 1723960092;
  // 当前版本 commit id
  BUILD_VERSION = "8239b54";
  // -- 基础配置 --
  /**
   * @type {I18n | null}
   */
  I18N = null;
  // 多语言支持
  LANGUAGE = "zh-cn";
  // 检查更新的分支
  UPDATE_BRANCH = "master";
  // Chat Complete API Timeout
  CHAT_COMPLETE_API_TIMEOUT = 0;
  // -- Telegram 相关 --
  //
  // Telegram API Domain
  TELEGRAM_API_DOMAIN = "https://api.telegram.org";
  // 允许访问的Telegram Token， 设置时以逗号分隔
  TELEGRAM_AVAILABLE_TOKENS = [];
  // 默认消息模式
  DEFAULT_PARSE_MODE = "Markdown";
  // 最小stream模式消息间隔，小于等于0则不限制
  TELEGRAM_MIN_STREAM_INTERVAL = 0;
  // --  权限相关 --
  //
  // 允许所有人使用
  I_AM_A_GENEROUS_PERSON = !1;
  // 白名单
  CHAT_WHITE_LIST = [];
  // 用户配置
  LOCK_USER_CONFIG_KEYS = [
    // 默认为API BASE 防止被替换导致token 泄露
    "OPENAI_API_BASE",
    "GOOGLE_COMPLETIONS_API",
    "AZURE_COMPLETIONS_API"
    // 'AZURE_DALLE_API',
  ];
  // -- 群组相关 --
  //
  // 允许访问的Telegram Token 对应的Bot Name， 设置时以逗号分隔
  TELEGRAM_BOT_NAME = [];
  // 群组白名单
  CHAT_GROUP_WHITE_LIST = [];
  // 群组机器人开关
  GROUP_CHAT_BOT_ENABLE = !0;
  // 群组机器人共享模式,关闭后，一个群组只有一个会话和配置。开启的话群组的每个人都有自己的会话上下文
  GROUP_CHAT_BOT_SHARE_MODE = !1;
  // -- 历史记录相关 --
  //
  // 为了避免4096字符限制，将消息删减
  AUTO_TRIM_HISTORY = !0;
  // 最大历史记录长度
  MAX_HISTORY_LENGTH = 20;
  // 最大消息长度
  MAX_TOKEN_LENGTH = 2048;
  // -- 特性开关 --
  //
  // 隐藏部分命令按钮
  HIDE_COMMAND_BUTTONS = [];
  // -- 模式开关 --
  //
  // 使用流模式
  STREAM_MODE = !0;
  // 安全模式
  SAFE_MODE = !0;
  // 调试模式
  DEBUG_MODE = !1;
  // 开发模式
  DEV_MODE = !1;
  USER_CONFIG = new UserConfig();
}, ENV = new Environment(), DATABASE = null, CUSTOM_COMMAND = {}, CUSTOM_COMMAND_DESCRIPTION = {}, CONST = {
  GROUP_TYPES: ["group", "supergroup"]
}, ENV_TYPES = {
  SYSTEM_INIT_MESSAGE: "string",
  AZURE_API_KEY: "string",
  AZURE_COMPLETIONS_API: "string",
  AZURE_DALLE_API: "string",
  CLOUDFLARE_ACCOUNT_ID: "string",
  CLOUDFLARE_TOKEN: "string",
  GOOGLE_API_KEY: "string"
};
function mergeEnvironment(target, source) {
  for (let key of Object.keys(target)) {
    if (!Object.hasOwn(source, key))
      continue;
    let t = ENV_TYPES[key] || Array.isArray(target[key]) ? "array" : typeof target[key], v = source[key];
    if (t === "string" || typeof v != "string") {
      target[key] = v;
      continue;
    }
    switch (t) {
      case "number":
        target[key] = parseInt(v, 10);
        break;
      case "boolean":
        target[key] = (v || "false") === "true";
        break;
      case "array":
        try {
          target[key] = JSON.parse(v);
        } catch {
          target[key] = v.split(",");
        }
        break;
      case "object":
        try {
          Object.assign(target[key], JSON.parse(v));
        } catch (e) {
          console.error(e);
        }
        break;
      default:
        target[key] = v;
    }
  }
}
function initEnv(env, i18n2) {
  DATABASE = env.DATABASE;
  let customCommandPrefix = "CUSTOM_COMMAND_", customCommandDescriptionPrefix = "COMMAND_DESCRIPTION_";
  for (let key of Object.keys(env))
    if (key.startsWith(customCommandPrefix)) {
      let cmd = key.substring(customCommandPrefix.length);
      CUSTOM_COMMAND["/" + cmd] = env[key], CUSTOM_COMMAND_DESCRIPTION["/" + cmd] = env[customCommandDescriptionPrefix + cmd];
    }
  mergeEnvironment(ENV, env), mergeEnvironment(ENV.USER_CONFIG, env), ENV.USER_CONFIG.DEFINE_KEYS = [], ENV.I18N = i18n2((ENV.LANGUAGE || "en").toLowerCase()), ENV.USER_CONFIG.SYSTEM_INIT_MESSAGE ||= ENV.I18N?.env?.system_init_message || "You are a helpful assistant";
}

// src/config/context.js
function trimUserConfig(userConfig) {
  let config = { ...userConfig }, keysSet = new Set(userConfig.DEFINE_KEYS);
  return ENV.LOCK_USER_CONFIG_KEYS.forEach((key) => keysSet.delete(key)), keysSet.add("DEFINE_KEYS"), Object.keys(config).forEach((k) => {
    keysSet.has(k) || delete config[k];
  }), config;
}
var ShareContext = class {
  currentBotId = null;
  currentBotToken = null;
  currentBotName = null;
  configStoreKey = null;
  groupAdminKey = null;
  usageKey = null;
  chatType = null;
  chatId = null;
  speakerId = null;
  extraMessageContext = {};
}, CurrentChatContext = class {
  chat_id = null;
  reply_to_message_id = null;
  parse_mode = ENV.DEFAULT_PARSE_MODE;
  message_id = null;
  reply_markup = null;
  allow_sending_without_reply = null;
  disable_web_page_preview = null;
}, Context = class {
  // 用户配置
  USER_CONFIG = new UserConfig();
  CURRENT_CHAT_CONTEXT = new CurrentChatContext();
  SHARE_CONTEXT = new ShareContext();
  /**
   * @inner
   * @param {string | number} chatId
   * @param {string | number} replyToMessageId
   */
  _initChatContext(chatId, replyToMessageId) {
    this.CURRENT_CHAT_CONTEXT.chat_id = chatId, this.CURRENT_CHAT_CONTEXT.reply_to_message_id = replyToMessageId, replyToMessageId && (this.CURRENT_CHAT_CONTEXT.allow_sending_without_reply = !0);
  }
  //
  /**
   * 初始化用户配置
   *
   * @inner
   * @param {string | null} storeKey
   */
  async _initUserConfig(storeKey) {
    try {
      this.USER_CONFIG = { ...ENV.USER_CONFIG };
      let userConfig = JSON.parse(await DATABASE.get(storeKey));
      mergeEnvironment(this.USER_CONFIG, trimUserConfig(userConfig));
    } catch (e) {
      console.error(e);
    }
  }
  /**
   * @param {Request} request
   */
  initTelegramContext(request) {
    let token = new URL(request.url).pathname.match(/^\/telegram\/(\d+:[A-Za-z0-9_-]{35})\/webhook/)[1], telegramIndex = ENV.TELEGRAM_AVAILABLE_TOKENS.indexOf(token);
    if (telegramIndex === -1)
      throw new Error("TG Token not allowed");
    this.SHARE_CONTEXT.currentBotToken = token, this.SHARE_CONTEXT.currentBotId = token.split(":")[0], this.SHARE_CONTEXT.currentBotName = ENV.TELEGRAM_BOT_NAME[telegramIndex] || null;
  }
  /**
   *
   * @inner
   * @param {TelegramMessage} message
   */
  async _initShareContext(message) {
    this.SHARE_CONTEXT.usageKey = `usage:${this.SHARE_CONTEXT.currentBotId}`;
    let id = message?.chat?.id;
    if (!id)
      throw new Error("Chat id not found");
    let botId = this.SHARE_CONTEXT.currentBotId, configStoreKey = `user_config:${id}`, groupAdminKey = null;
    botId && (configStoreKey += `:${botId}`), CONST.GROUP_TYPES.includes(message.chat?.type) && (!ENV.GROUP_CHAT_BOT_SHARE_MODE && message.from.id && (configStoreKey += `:${message.from.id}`), groupAdminKey = `group_admin:${id}`), message?.chat?.is_forum && message?.is_topic_message && message?.message_thread_id && (configStoreKey += `:${message.message_thread_id}`), this.SHARE_CONTEXT.configStoreKey = configStoreKey, this.SHARE_CONTEXT.groupAdminKey = groupAdminKey, this.SHARE_CONTEXT.chatType = message.chat?.type, this.SHARE_CONTEXT.chatId = message.chat.id, this.SHARE_CONTEXT.speakerId = message.from.id || message.chat.id;
  }
  /**
   * @param {TelegramMessage} message
   * @return {Promise<void>}
   */
  async initContext(message) {
    let chatId = message?.chat?.id, replyId = message.reply_to_message ? message.reply_to_message.message_id : message.message_id;
    this._initChatContext(chatId, replyId), await this._initShareContext(message), await this._initUserConfig(this.SHARE_CONTEXT.configStoreKey);
  }
};

// src/utils/md2tgmd.js
var escapeChars = /([\_\*\[\]\(\)\\\~\`\>\#\+\-\=\|\{\}\.\!])/g;
function escape(text) {
  let lines = text.split(`
`), stack = [], result = [], linetrim = "";
  for (let [i, line] of lines.entries()) {
    linetrim = line.trim();
    let startIndex;
    if (/^```.+/.test(linetrim))
      stack.push(i);
    else if (linetrim === "```")
      if (stack.length) {
        if (startIndex = stack.pop(), !stack.length) {
          let content = lines.slice(startIndex, i + 1).join(`
`);
          result.push(handleEscape(content, "code"));
          continue;
        }
      } else
        stack.push(i);
    stack.length || result.push(handleEscape(line));
  }
  if (stack.length) {
    let last = lines.slice(stack[0]).join(`
`) + "\n```";
    result.push(handleEscape(last, "code"));
  }
  return result.join(`
`);
}
function handleEscape(text, type = "text") {
  if (!text.trim())
    return text;
  if (type === "text")
    text = text.replace(escapeChars, "\\$1").replace(/\\\*\\\*(.*?[^\\])\\\*\\\*/g, "*$1*").replace(/\\_\\_(.*?[^\\])\\_\\_/g, "__$1__").replace(/\\_(.*?[^\\])\\_/g, "_$1_").replace(/\\~(.*?[^\\])\\~/g, "~$1~").replace(/\\\|\\\|(.*?[^\\])\\\|\\\|/g, "||$1||").replace(/\\\[([^\]]+?)\\\]\\\((.+?)\\\)/g, "[$1]($2)").replace(/\\\`(.*?[^\\])\\\`/g, "`$1`").replace(/\\\\\\([\_\*\[\]\(\)\\\~\`\>\#\+\-\=\|\{\}\.\!])/g, "\\$1").replace(/^(\s*)\\(>.+\s*)$/gm, "$1$2").replace(/^(\s*)\\-\s*(.+)$/gm, "$1\u2022 $2").replace(/^((\\#){1,3}\s)(.+)/gm, "$1*$3*");
  else {
    let codeBlank = text.length - text.trimStart().length;
    if (codeBlank > 0) {
      let blankReg = new RegExp(`^\\s{${codeBlank}}`, "gm");
      text = text.replace(blankReg, "");
    }
    text = text.trimEnd().replace(/([\\\`])/g, "\\$1").replace(/^\\`\\`\\`([\s\S]+)\\`\\`\\`$/g, "```$1```");
  }
  return text;
}

// src/telegram/telegram.js
async function sendMessage(message, token, context) {
  let validContext = Object.fromEntries(
    Object.entries(context).filter(([, value]) => value != null)
  ), body = { text: message, ...validContext }, botMethod = context?.message_id ? "editMessageText" : "sendMessage";
  return fetch(`${ENV.TELEGRAM_API_DOMAIN}/bot${token}/${botMethod}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}
async function sendMessageToTelegram(message, token, context) {
  let chatContext = context, originMessage = message, limit = 4096;
  if (chatContext.parse_mode === "MarkdownV2" && (message = escape(message)), message.length <= limit) {
    let resp = await sendMessage(message, token, chatContext);
    return resp.status === 200 ? resp : (message = originMessage, chatContext.parse_mode = null, await sendMessage(message, token, chatContext));
  }
  message = originMessage, chatContext.parse_mode = null;
  let lastMessageResponse = null;
  for (let i = 0; i < message.length; i += limit) {
    let msg = message.slice(i, Math.min(i + limit, message.length));
    i > 0 && (chatContext.message_id = null), lastMessageResponse = await sendMessage(msg, token, chatContext);
  }
  return lastMessageResponse;
}
function sendMessageToTelegramWithContext(context) {
  return async (message) => sendMessageToTelegram(message, context.SHARE_CONTEXT.currentBotToken, context.CURRENT_CHAT_CONTEXT);
}
async function sendChatActionToTelegram(action, token, chatId) {
  return await fetch(
    `${ENV.TELEGRAM_API_DOMAIN}/bot${token}/sendChatAction`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        action
      })
    }
  ).then((res) => res.json());
}
function sendChatActionToTelegramWithContext(context) {
  return (action) => sendChatActionToTelegram(action, context.SHARE_CONTEXT.currentBotToken, context.CURRENT_CHAT_CONTEXT.chat_id);
}
async function bindTelegramWebHook(token, url) {
  return await fetch(
    `${ENV.TELEGRAM_API_DOMAIN}/bot${token}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    }
  ).then((res) => res.json());
}
async function getChatRole(id, groupAdminKey, chatId, token) {
  let groupAdmin;
  try {
    groupAdmin = JSON.parse(await DATABASE.get(groupAdminKey));
  } catch (e) {
    return console.error(e), e.message;
  }
  if (!groupAdmin || !Array.isArray(groupAdmin) || groupAdmin.length === 0) {
    let administers = await getChatAdminister(chatId, token);
    if (administers == null)
      return null;
    groupAdmin = administers, await DATABASE.put(
      groupAdminKey,
      JSON.stringify(groupAdmin),
      { expiration: Date.now() / 1e3 + 120 }
    );
  }
  return groupAdmin.find((u) => u.user.id === id)?.status || "member";
}
function getChatRoleWithContext(context) {
  return (id) => getChatRole(id, context.SHARE_CONTEXT.groupAdminKey, context.CURRENT_CHAT_CONTEXT.chat_id, context.SHARE_CONTEXT.currentBotToken);
}
async function getChatAdminister(chatId, token) {
  try {
    let resp = await fetch(
      `${ENV.TELEGRAM_API_DOMAIN}/bot${token}/getChatAdministrators`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId })
      }
    ).then((res) => res.json());
    return resp.ok ? resp.result : null;
  } catch (e) {
    return console.error(e), null;
  }
}
async function getBot(token) {
  let response = await fetch(
    `${ENV.TELEGRAM_API_DOMAIN}/bot${token}/getMe`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }
  ).then((res) => res.json());
  return response.ok ? {
    ok: !0,
    info: {
      name: response.result.first_name,
      bot_name: response.result.username,
      can_join_groups: response.result.can_join_groups,
      can_read_all_group_messages: response.result.can_read_all_group_messages
    }
  } : response;
}

// src/agent/stream.js
var Stream = class {
  constructor(response, controller, decoder = null, parser = null) {
    this.response = response, this.controller = controller, this.decoder = decoder || new SSEDecoder(), this.parser = parser || openaiSseJsonParser;
  }
  async *iterMessages() {
    if (!this.response.body)
      throw this.controller.abort(), new Error("Attempted to iterate over a response with no body");
    let lineDecoder = new LineDecoder(), iter = this.response.body;
    for await (let chunk of iter)
      for (let line of lineDecoder.decode(chunk)) {
        let sse = this.decoder.decode(line);
        sse && (yield sse);
      }
    for (let line of lineDecoder.flush()) {
      let sse = this.decoder.decode(line);
      sse && (yield sse);
    }
  }
  async *[Symbol.asyncIterator]() {
    let done = !1;
    try {
      for await (let sse of this.iterMessages()) {
        if (done || !sse)
          continue;
        let { finish, data } = this.parser(sse);
        if (finish) {
          done = finish;
          continue;
        }
        data && (yield data);
      }
      done = !0;
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError")
        return;
      throw e;
    } finally {
      done || this.controller.abort();
    }
  }
}, SSEDecoder = class {
  constructor() {
    this.event = null, this.data = [], this.chunks = [];
  }
  decode(line) {
    if (line.endsWith("\r") && (line = line.substring(0, line.length - 1)), !line) {
      if (!this.event && !this.data.length)
        return null;
      let sse = {
        event: this.event,
        data: this.data.join(`
`)
      };
      return this.event = null, this.data = [], this.chunks = [], sse;
    }
    if (this.chunks.push(line), line.startsWith(":"))
      return null;
    let [fieldName, _, value] = this.partition(line, ":");
    return value.startsWith(" ") && (value = value.substring(1)), fieldName === "event" ? this.event = value : fieldName === "data" && this.data.push(value), null;
  }
  partition(str, delimiter) {
    let index = str.indexOf(delimiter);
    return index !== -1 ? [str.substring(0, index), delimiter, str.substring(index + delimiter.length)] : [str, "", ""];
  }
};
function openaiSseJsonParser(sse) {
  if (sse.data.startsWith("[DONE]"))
    return { finish: !0 };
  if (sse.event === null)
    try {
      return { data: JSON.parse(sse.data) };
    } catch (e) {
      console.error(e, sse);
    }
  return {};
}
var LineDecoder = class {
  constructor() {
    this.buffer = [], this.trailingCR = !1, this.textDecoder = new TextDecoder("utf8");
  }
  decode(chunk) {
    let text = this.decodeText(chunk);
    if (this.trailingCR && (text = "\r" + text, this.trailingCR = !1), text.endsWith("\r") && (this.trailingCR = !0, text = text.slice(0, -1)), !text)
      return [];
    let trailingNewline = LineDecoder.NEWLINE_CHARS.has(text[text.length - 1] || ""), lines = text.split(LineDecoder.NEWLINE_REGEXP);
    return lines.length === 1 && !trailingNewline ? (this.buffer.push(lines[0]), []) : (this.buffer.length > 0 && (lines = [this.buffer.join("") + lines[0], ...lines.slice(1)], this.buffer = []), trailingNewline || (this.buffer = [lines.pop() || ""]), lines);
  }
  decodeText(bytes) {
    if (bytes == null)
      return "";
    if (typeof bytes == "string")
      return bytes;
    if (bytes instanceof Uint8Array || bytes instanceof ArrayBuffer)
      return this.textDecoder.decode(bytes, { stream: !0 });
    throw new Error(`Unexpected input type: ${bytes.constructor.name}. Expected Uint8Array or ArrayBuffer.`);
  }
  flush() {
    if (!this.buffer.length && !this.trailingCR)
      return [];
    let lines = [this.buffer.join("")];
    return this.buffer = [], this.trailingCR = !1, lines;
  }
};
LineDecoder.NEWLINE_CHARS = /* @__PURE__ */ new Set([`
`, "\r"]);
LineDecoder.NEWLINE_REGEXP = /\r\n|[\n\r]/g;

// src/agent/request.js
function fixOpenAICompatibleOptions(options) {
  return options = options || {}, options.streamBuilder = options.streamBuilder || ((r, c) => new Stream(r, c)), options.contentExtractor = options.contentExtractor || ((d) => d?.choices?.[0]?.delta?.content), options.fullContentExtractor = options.fullContentExtractor || ((d) => d.choices?.[0]?.message.content), options.errorExtractor = options.errorExtractor || ((d) => d.error?.message), options;
}
var isJsonResponse = (resp) => resp.headers.get("content-type").includes("json");
function isEventStreamResponse(resp) {
  let contentType = resp.headers.get("content-type");
  return contentType?.includes("application/stream+json") || contentType?.includes("text/event-stream");
}
async function requestChatCompletions(url, header, body, context, onStream, onResult = null, options = null) {
  let controller = new AbortController(), { signal } = controller, timeoutID = ENV.CHAT_COMPLETE_API_TIMEOUT > 0 ? setTimeout(() => controller.abort(), ENV.CHAT_COMPLETE_API_TIMEOUT) : null, lastUpdateTime = Date.now(), resp = await fetch(url, {
    method: "POST",
    headers: header,
    body: JSON.stringify(body),
    signal
  });
  if (timeoutID && clearTimeout(timeoutID), options = fixOpenAICompatibleOptions(options), onStream && resp.ok && isEventStreamResponse(resp)) {
    let stream = options.streamBuilder(resp, controller), contentFull = "", lengthDelta = 0, updateStep = 50;
    try {
      for await (let data of stream) {
        let c = options.contentExtractor(data) || "";
        if (c !== "" && (lengthDelta += c.length, contentFull = contentFull + c, lengthDelta > updateStep)) {
          if (ENV.TELEGRAM_MIN_STREAM_INTERVAL > 0) {
            if (Date.now() - lastUpdateTime < ENV.TELEGRAM_MIN_STREAM_INTERVAL)
              continue;
            lastUpdateTime = Date.now();
          }
          lengthDelta = 0, updateStep += 20, await onStream(`${contentFull}
...`);
        }
      }
    } catch (e) {
      contentFull += `
ERROR: ${e.message}`;
    }
    return contentFull;
  }
  if (!isJsonResponse(resp))
    throw new Error(resp.statusText);
  let result = await resp.json();
  if (!result)
    throw new Error("Empty response");
  if (options.errorExtractor(result))
    throw new Error(options.errorExtractor(result));
  try {
    return onResult?.(result), options.fullContentExtractor(result);
  } catch (e) {
    throw console.error(e), Error(JSON.stringify(result));
  }
}

// src/agent/openai.js
function openAIKeyFromContext(context) {
  let length = context.USER_CONFIG.OPENAI_API_KEY.length;
  return context.USER_CONFIG.OPENAI_API_KEY[Math.floor(Math.random() * length)];
}
function isOpenAIEnable(context) {
  return context.USER_CONFIG.OPENAI_API_KEY.length > 0;
}
async function requestCompletionsFromOpenAI(params, context, onStream) {
  let { message, prompt, history } = params, url = `${context.USER_CONFIG.OPENAI_API_BASE}/chat/completions`, messages = [...history || [], { role: "user", content: message }];
  prompt && messages.unshift({ role: context.USER_CONFIG.SYSTEM_INIT_MESSAGE_ROLE, content: prompt });
  let body = {
    model: context.USER_CONFIG.OPENAI_CHAT_MODEL,
    ...context.USER_CONFIG.OPENAI_API_EXTRA_PARAMS,
    messages,
    stream: onStream != null
  }, header = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${openAIKeyFromContext(context)}`
  };
  return requestChatCompletions(url, header, body, context, onStream);
}

// src/agent/workersai.js
function isWorkersAIEnable(context) {
  return !!(context.USER_CONFIG.CLOUDFLARE_ACCOUNT_ID && context.USER_CONFIG.CLOUDFLARE_TOKEN);
}
async function requestCompletionsFromWorkersAI(params, context, onStream) {
  let { message, prompt, history } = params, id = context.USER_CONFIG.CLOUDFLARE_ACCOUNT_ID, token = context.USER_CONFIG.CLOUDFLARE_TOKEN, model = context.USER_CONFIG.WORKERS_CHAT_MODEL, url = `https://api.cloudflare.com/client/v4/accounts/${id}/ai/run/${model}`, header = {
    Authorization: `Bearer ${token}`
  }, messages = [...history || [], { role: "user", content: message }];
  prompt && messages.unshift({ role: context.USER_CONFIG.SYSTEM_INIT_MESSAGE_ROLE, content: prompt });
  let body = {
    messages,
    stream: onStream !== null
  }, options = {};
  return options.contentExtractor = function(data) {
    return data?.response;
  }, options.fullContentExtractor = function(data) {
    return data?.result?.response;
  }, options.errorExtractor = function(data) {
    return data?.errors?.[0]?.message;
  }, requestChatCompletions(url, header, body, context, onStream, null, options);
}

// src/agent/azure.js
function azureKeyFromContext(context) {
  return context.USER_CONFIG.AZURE_API_KEY;
}
function isAzureEnable(context) {
  return !!(context.USER_CONFIG.AZURE_API_KEY && context.USER_CONFIG.AZURE_COMPLETIONS_API);
}
async function requestCompletionsFromAzureOpenAI(params, context, onStream) {
  let { message, prompt, history } = params, url = context.USER_CONFIG.AZURE_COMPLETIONS_API, messages = [...history || [], { role: "user", content: message }];
  prompt && messages.unshift({ role: context.USER_CONFIG.SYSTEM_INIT_MESSAGE_ROLE, content: prompt });
  let body = {
    ...context.USER_CONFIG.OPENAI_API_EXTRA_PARAMS,
    messages,
    stream: onStream != null
  }, header = {
    "Content-Type": "application/json",
    "api-key": azureKeyFromContext(context)
  };
  return requestChatCompletions(url, header, body, context, onStream);
}

// src/agent/agents.js
var chatLlmAgents = [
  {
    name: "azure",
    enable: isAzureEnable,
    request: requestCompletionsFromAzureOpenAI,
    modelKey: "AZURE_COMPLETIONS_API"
  },
  {
    name: "openai",
    enable: isOpenAIEnable,
    request: requestCompletionsFromOpenAI,
    modelKey: "OPENAI_CHAT_MODEL"
  },
  {
    name: "workers",
    enable: isWorkersAIEnable,
    request: requestCompletionsFromWorkersAI,
    modelKey: "WORKERS_CHAT_MODEL"
  }
];
function currentChatModel(agentName, context) {
  let modelKey = chatLlmAgents.find((a) => a.name === agentName)?.modelKey, modelVal = context.USER_CONFIG[modelKey];
  switch (agentName) {
    case "azure":
      return _azApiToModelName(modelVal);
    case "openai":
    case "workers":
      return modelVal;
    default:
      return null;
  }
}
function loadChatLLM(context) {
  return chatLlmAgents.find((llm) => llm.name === context.USER_CONFIG.AI_PROVIDER) || chatLlmAgents.find((llm) => llm.enable(context)) || null;
}
function _azApiToModelName(AZURE_API) {
  try {
    return new URL(AZURE_API).pathname.split("/")[3];
  } catch {
    return AZURE_API;
  }
}

// src/agent/llm.js
async function requestCompletionsFromLLM(params, context, llm, onStream) {
  let llmParams = {
    ...params
    // prompt: prompt || context.USER_CONFIG.SYSTEM_INIT_MESSAGE,
  };
  return await llm(llmParams, context, onStream);
}
async function actWithLLM(params, context) {
  try {
    try {
      let msg = await sendMessageToTelegramWithContext(context)("...").then((r) => r.json());
      context.CURRENT_CHAT_CONTEXT.message_id = msg.result.message_id, context.CURRENT_CHAT_CONTEXT.reply_markup = null;
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => sendChatActionToTelegramWithContext(context)("typing").catch(console.error), 0);
    let onStream = null, parseMode = context.CURRENT_CHAT_CONTEXT.parse_mode, nextEnableTime = null;
    ENV.STREAM_MODE && (context.CURRENT_CHAT_CONTEXT.parse_mode = null, onStream = async (text) => {
      try {
        if (nextEnableTime && nextEnableTime > Date.now())
          return;
        let resp = await sendMessageToTelegramWithContext(context)(text);
        if (resp.status === 429) {
          let retryAfter = parseInt(resp.headers.get("Retry-After"));
          if (console.log(`TG API 429, retry after ${retryAfter}s`), retryAfter) {
            nextEnableTime = Date.now() + retryAfter * 1e3;
            return;
          }
        }
        nextEnableTime = null, resp.ok && (context.CURRENT_CHAT_CONTEXT.message_id = (await resp.json()).result.message_id);
      } catch (e) {
        console.error(e);
      }
    });
    let llm = loadChatLLM(context)?.request;
    if (!llm)
      return sendMessageToTelegramWithContext(context)("LLM is not enable");
    let answer = await requestCompletionsFromLLM(params, context, llm, onStream);
    return context.CURRENT_CHAT_CONTEXT.parse_mode = parseMode, nextEnableTime && nextEnableTime > Date.now() && await new Promise((resolve) => setTimeout(resolve, nextEnableTime - Date.now())), sendMessageToTelegramWithContext(context)(answer);
  } catch (e) {
    return context.CURRENT_CHAT_CONTEXT.disable_web_page_preview = !0, sendMessageToTelegramWithContext(context)(`Error: ${e.message}`.substring(0, 2e3));
  }
}

// src/telegram/command.js
var isGroup = (T) => CONST.GROUP_TYPES.includes(T), admins = ["administrator", "creator"], cmdAuthReq = {
  default: (chatType) => isGroup(chatType) ? admins : null,
  // 只有群公有模式时, 才需要管理员权限
  shareModeGroup: (chatType) => isGroup(chatType) && ENV.GROUP_CHAT_BOT_SHARE_MODE ? admins : null
}, scopeMod = ["all_private_chats", "all_chat_administrators"], scopeFull = scopeMod.concat(["all_group_chats"]), commandHandlers = {
  "/help": {
    scopes: scopeMod,
    fn: commandGetHelp
  },
  "/start": {
    scopes: [],
    fn: commandGetHelp
  },
  "/act": {
    scopes: scopeFull,
    fn: commandActUndefined,
    needAuth: cmdAuthReq.shareModeGroup
  },
  /*
  '/img': {
      scopes: scopeMod,
      fn: commandGenerateImg,
      needAuth: cmdAuthReq.shareModeGroup,
  },
  */
  "/mod_env_set": {
    scopes: scopeMod,
    fn: commandUpdateUserConfig,
    needAuth: cmdAuthReq.shareModeGroup
  },
  "/mod_env_set_batch": {
    scopes: scopeMod,
    fn: commandUpdateUserConfigs,
    needAuth: cmdAuthReq.shareModeGroup
  },
  "/mod_env_del": {
    scopes: scopeMod,
    fn: commandDeleteUserConfig,
    needAuth: cmdAuthReq.shareModeGroup
  },
  "/mod_env_del_all": {
    scopes: scopeMod,
    fn: commandClearUserConfig,
    needAuth: cmdAuthReq.shareModeGroup
  },
  "/mod_system": {
    scopes: scopeMod,
    fn: commandSystem,
    needAuth: cmdAuthReq.default
  }
}, commandSortList = Object.keys(commandHandlers).filter((key) => !["/start", "/img"].includes(key));
function initDynamicCommands(context) {
  registerActCommands(context);
}
function registerActCommands(context) {
  ENV.acts = {}, Object.assign(ENV.acts, ENV.I18N.acts), Object.assign(ENV.acts, context?.USER_CONFIG?.MY_ACTIONS || ENV?.USER_CONFIG?.MY_ACTIONS), Object.keys(ENV.acts).forEach((act) => {
    commandHandlers[`/act_${act}`] = {
      scopes: scopeFull,
      fn: commandActWithLLM,
      needAuth: cmdAuthReq.shareModeGroup
    }, commandSortList.splice(1, 0, `/act_${act}`);
  });
}
async function commandGetHelp(message, command, subcommand, context) {
  let helpSections = [
    ENV.I18N.command.help.summary,
    ...Object.keys(commandHandlers).map((key) => `${key.replaceAll("_", "\\_")}\uFF1A${keyDetail(key)}`),
    ...Object.keys(CUSTOM_COMMAND).filter((key) => CUSTOM_COMMAND_DESCRIPTION[key]).map((key) => `${key}\uFF1A${CUSTOM_COMMAND_DESCRIPTION[key]}`)
  ];
  return sendMessageToTelegramWithContext(context)(helpSections.join(`
`));
}
async function commandActUndefined(message, command, subcommand, context) {
  context.CURRENT_CHAT_CONTEXT.reply_markup = '{"remove_keyboard":true,"selective":true}';
  let msgText = `Let LLM do it for you.
` + Object.keys(ENV.acts).map((key) => `/act\\_${key.replaceAll("_", "\\_")}\uFF1A${ENV.acts[key].name}`).join(`
`);
  return sendMessageToTelegramWithContext(context)(msgText);
}
async function commandActWithLLM(message, command, subcommand, context) {
  let _act = command.split("_").slice(1).join("_"), act = ENV.acts[_act];
  if (!act)
    return sendMessageToTelegramWithContext(context)("ERROR: action not found");
  let txt = subcommand, _r = message.reply_to_message?.text;
  _r && (txt = _r + `
---
` + txt);
  let extraCtx = context.SHARE_CONTEXT?.extraMessageContext;
  return extraCtx?.doc && (txt = `<Document>
${extraCtx.doc}
</Document>

` + txt), extraCtx?.textInput && (txt = extraCtx.textInput + `
` + txt), actWithLLM({ message: txt, prompt: act.prompt }, context);
}
async function commandUpdateUserConfig(message, command, subcommand, context) {
  return _handleUserConfig(message, command, subcommand, context, "update");
}
async function commandUpdateUserConfigs(message, command, subcommand, context) {
  return _handleUserConfig(message, command, subcommand, context, "batchUpdate");
}
async function commandDeleteUserConfig(message, command, subcommand, context) {
  _handleUserConfig(message, command, subcommand, context, "delete");
}
async function _handleUserConfig(message, command, subcommand, context, operation) {
  let updates = [];
  if (operation === "delete") {
    if (!Object.keys(context.USER_CONFIG).includes(subcommand))
      return sendMessageToTelegramWithContext(context)(`Key ${subcommand} not found`);
    updates.push({ key: subcommand, value: null });
  } else if (["update", "batchUpdate"].includes(operation)) {
    let entries = operation === "update" ? [subcommand.split("=")] : Object.entries(JSON.parse(subcommand));
    for (let [k, v] of entries) {
      if (!Object.keys(context.USER_CONFIG).includes(k) || ENV.LOCK_USER_CONFIG_KEYS.includes(k))
        return sendMessageToTelegramWithContext(context)(`Key "${k}" not found or locked`);
      updates.push({ key: k, value: v });
    }
  }
  return mergeEnvironment(context.USER_CONFIG, Object.fromEntries(updates.map(({ key, value }) => [key, value]))), context.USER_CONFIG.DEFINE_KEYS = updates.map((u) => u.key).filter((k) => context.USER_CONFIG[k] !== null), await DATABASE.put(
    context.SHARE_CONTEXT.configStoreKey,
    JSON.stringify(trimUserConfig(context.USER_CONFIG))
  ), sendMessageToTelegramWithContext(context)(`${operation} user config successfully`);
}
async function commandClearUserConfig(message, command, subcommand, context) {
  return await DATABASE.put(context.SHARE_CONTEXT.configStoreKey, "{}"), sendMessageToTelegramWithContext(context)("Clear user config success");
}
async function commandSystem(message, command, subcommand, context) {
  let chatAgent = loadChatLLM(context), agent = {
    AI_PROVIDER: chatAgent?.name
    /*disabled*/
    //  AI_IMAGE_PROVIDER: imageAgent?.name,
  };
  agent[chatAgent.modelKey] = currentChatModel(chatAgent?.name, context);
  let msg = `AGENT: ${_pretty(agent)}
`;
  if (ENV.DEV_MODE) {
    let redact = function(config) {
      let redacted = { ...config };
      for (let key in redacted)
        /api|token|account|key/i.test(key) && (config[key] = "******");
      return redacted;
    }, shareCtx = { ...context.SHARE_CONTEXT };
    shareCtx.currentBotToken = "******", msg += `<pre>
USER_CONFIG: ${_pretty(trimUserConfig(redact(context.USER_CONFIG)))}
`, msg += `CHAT_CONTEXT: ${_pretty(context.CURRENT_CHAT_CONTEXT)}
`, msg += `SHARE_CONTEXT: ${_pretty(shareCtx)}
</pre>`;
  }
  return context.CURRENT_CHAT_CONTEXT.parse_mode = "HTML", sendMessageToTelegramWithContext(context)(msg);
}
async function commandEcho(message, command, subcommand, context) {
  var msg = `<pre>${_pretty({ message })}</pre>`;
  return context.CURRENT_CHAT_CONTEXT.parse_mode = "HTML", sendMessageToTelegramWithContext(context)(msg);
}
async function handleCommandMessage(message, context) {
  initDynamicCommands(context), ENV.DEV_MODE && (commandHandlers["/echo"] = { help: "[DEBUG ONLY] echo message", scopes: scopeMod, fn: commandEcho, needAuth: cmdAuthReq.default }), CUSTOM_COMMAND[message.text] && (message.text = CUSTOM_COMMAND[message.text]);
  let command = Object.keys(commandHandlers).find((key) => message.text === key || message.text.startsWith(key + " ") || message.text.startsWith(key + "@"));
  if (!command)
    return null;
  let handler = commandHandlers[command];
  try {
    if (handler.needAuth) {
      let roleList = handler.needAuth(context.SHARE_CONTEXT.chatType);
      if (roleList) {
        let chatRole = await getChatRoleWithContext(context)(context.SHARE_CONTEXT.speakerId);
        if (!chatRole)
          return sendMessageToTelegramWithContext(context)("ERROR: Get chat role failed");
        if (!roleList.includes(chatRole))
          return sendMessageToTelegramWithContext(context)(`ERROR: Permission denied, need ${roleList.join(" or ")}`);
      }
    }
    let mentioned = await mentionBotUsername(message, context), subcommand = message.text.slice(command.length).trim();
    if (mentioned) {
      let botName = "@" + await getBotNameWithCtx(context);
      subcommand = subcommand.replaceAll(botName, "").trim();
    }
    return console.log(`command:${command};subcommand:${subcommand}`), await handler.fn(message, command, subcommand, context);
  } catch (e) {
    return sendMessageToTelegramWithContext(context)(`ERROR: ${e.message}`);
  }
}
async function bindCommandForTelegram(token) {
  let scopeCommandMap = {
    all_private_chats: [],
    all_group_chats: [],
    all_chat_administrators: []
  };
  initDynamicCommands();
  for (let key of commandSortList)
    !ENV.HIDE_COMMAND_BUTTONS.includes(key) && commandHandlers[key]?.scopes && commandHandlers[key].scopes.forEach((scope) => {
      scopeCommandMap[scope]?.push(key);
    });
  let result = {};
  for (let scope in scopeCommandMap)
    result[scope] = await fetch(
      `https://api.telegram.org/bot${token}/setMyCommands`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commands: scopeCommandMap[scope].map((key) => ({
            command: key,
            description: keyDetail(key) || "No description"
          })),
          scope: { type: scope }
        })
      }
    ).then((res) => res.json());
  return { ok: !0, result, scopeCommandMap };
}
var keyDetail = (k) => ENV.I18N.command.help[k.substring(1)] || ENV.acts?.[k.slice(5)]?.name, _pretty = (o) => JSON.stringify(o, null, 2);

// src/utils/utils.js
function renderHTML(body) {
  return `${body}`;
}
function errorToString(e) {
  return JSON.stringify({
    message: e.message,
    stack: e.stack
  });
}
async function makeResponse200(resp) {
  return resp === null ? new Response("NOT HANDLED", { status: 200 }) : resp.status === 200 ? resp : new Response(resp.body, {
    status: 200,
    headers: {
      "Original-Status": resp.status,
      ...resp.headers
    }
  });
}

// src/telegram/retrieval.js
var proxy = {
  jina: "https://r.jina.ai/",
  /*// "md": ["https://urltomarkdown.herokuapp.com/?title=true&url=",], // <doc="https://github.com/macsplit/urltomarkdown" fofa='body="Please specify a valid url query parameter"'/>
  // "ft":  "https://12ft.io/?proxy?q=", */
  twitter: "https://fixupx.com",
  // <doc="github.com/FixTweet/FxTwitter"/>
  medium: "https://r.jina.ai/https://www.smry.ai/proxy?url="
}, sites = {
  twitterEvil: ["twitter.com", "x.com", "mobile.twitter.com", "mobile.x.com", "vxtwitter.com", "fixvx.com"],
  // vx 比 fx 多了赞转
  linkPreview: ["fxtwitter.com", "fixupx.com", "twittpr.com", "fixvx.com"],
  medium: [
    "medium.com",
    "towardsdatascience.com",
    "betterprogramming.pub",
    "uxdesign.cc",
    "thebolditalic.com",
    "betterhumans.pub",
    "levelup.gitconnected.com",
    "writingcooperative.com",
    "blog.prototypr.io",
    "ehandbook.com",
    "hackernoon.com"
  ]
}, ua = { headers: { "User-Agent": "facebookexternalhit/1.1" } };
async function retrieveUrlTxt(link) {
  console.log(link);
  let url = new URL(link);
  if (sites.twitterEvil.includes(url.hostname))
    return await twitterGrab(url);
  if (sites.linkPreview.some((host) => url.hostname.endsWith(host))) {
    let html = await fetch(link, ua).then((r) => r.text());
    return _linkpreviewParser(html);
  } else if (sites.medium.some((host) => url.hostname.endsWith(host)))
    return await mediumGrab(url);
  return await fetch(proxy.jina + link).then((r) => r.text());
}
async function mediumGrab(url) {
  let newlink = proxy.medium + encodeURIComponent(url.origin + url.pathname), txt = await fetch(newlink).then((r) => r.text());
  return txt = txt.slice(txt.indexOf("smry \xB7 ")), txt.slice(txt.indexOf(`
`) + 1).trim();
}
async function twitterGrab(url) {
  let newlink = proxy.twitter + url.pathname, html = await fetch(newlink, ua).then((r) => r.text());
  return _linkpreviewParser(html);
}
var _linkpreviewParser = (html) => Array.from(
  html.matchAll(/<meta\s+(?:name|property)="(?:og:description|description)"\s+content="([^"]+)"[^>]*>/gi)
).map((match) => match[1]).reduce((long, cur) => cur.length > long.length ? cur : long, "");

// src/telegram/message.js
async function msgInitChatContext(message, context) {
  return await context.initContext(message), null;
}
async function msgCheckEnvIsReady(message, context) {
  return DATABASE ? null : sendMessageToTelegramWithContext(context)("DATABASE Not Set");
}
async function msgFilterWhiteList(message, context) {
  if (ENV.I_AM_A_GENEROUS_PERSON)
    return null;
  if (context.SHARE_CONTEXT.chatType === "private")
    return ENV.CHAT_WHITE_LIST.includes(`${context.CURRENT_CHAT_CONTEXT.chat_id}`) ? null : sendMessageToTelegramWithContext(context)(
      `Not an authorized telegram user. Contact admin to whitelist. Your chat_id: ${context.CURRENT_CHAT_CONTEXT.chat_id}`
    );
  if (CONST.GROUP_TYPES.includes(context.SHARE_CONTEXT.chatType)) {
    if (!ENV.GROUP_CHAT_BOT_ENABLE)
      throw new Error("Not support");
    return ENV.CHAT_GROUP_WHITE_LIST.includes(`${context.CURRENT_CHAT_CONTEXT.chat_id}`) ? null : sendMessageToTelegramWithContext(context)(
      `403. Add the group to the whitelist to proceed. chat_id ${context.CURRENT_CHAT_CONTEXT.chat_id}`
    );
  }
  return sendMessageToTelegramWithContext(context)(
    `Not support chat type: ${context.SHARE_CONTEXT.chatType}`
  );
}
async function msgFilterUnsupportedMessage(message, context) {
  if (message?.entities[0]?.type !== "bot_command")
    throw new Error("Only bot_command is supported");
  if (message.caption && (message.text = message.caption), !message.text)
    throw new Error("Not supported message type");
  return null;
}
async function msgHandleGroupMessage(message, context) {
  if (!CONST.GROUP_TYPES.includes(context.SHARE_CONTEXT.chatType))
    return null;
  if (message.reply_to_message?.from.is_bot && `${message.reply_to_message?.from.id}` !== context.SHARE_CONTEXT.currentBotId)
    throw await sendMessageToTelegramWithContext(context)(`Don't reply to a bot. Reason: 
https://core.telegram.org/bots/faq#why-doesn-39t-my-bot-see-messages-from-other-bots`), new Error(`405 Not Allowed: reply to a bot. reply_to: ${message.reply_to_message?.from.id} currentBotId: ${context.SHARE_CONTEXT.currentBotId}`);
  let mentioned = await mentionBotUsername(message, context);
  if (!mentioned)
    throw new Error("No mentioned");
  return console.log(`mentioned:${mentioned}`), context.SHARE_CONTEXT.extraMessageContext.mentioned = mentioned, null;
}
async function mentionBotUsername(message, context) {
  let botName = await getBotNameWithCtx(context);
  if (!botName)
    throw new Error("Bot has no username");
  return botName = "@" + botName, !!message.text.includes(botName);
}
async function getBotNameWithCtx(context) {
  let botName = context.SHARE_CONTEXT?.currentBotName;
  if (!botName) {
    let res = await getBot(context.SHARE_CONTEXT.currentBotToken);
    context.SHARE_CONTEXT.currentBotName = res.info.bot_name;
  }
  return botName;
}
async function msgHandleUrl(message, context) {
  let url = _getFirstUrl(message);
  if (!url)
    return null;
  let doc = await retrieveUrlTxt(url);
  if (console.log(`url: ${url}, doc.length: ${doc.length}`), !doc)
    throw await sendMessageToTelegramWithContext(context)(`Doc extraction failed: ${url}`), new Error("Doc extraction failed");
  return context.SHARE_CONTEXT.extraMessageContext.doc = doc.substring(0, 4e3), null;
}
function _getFirstUrl(message) {
  for (let msg of [message.reply_to_message, message])
    if (msg)
      for (let entities of [msg.entities, msg.caption_entities]) {
        if (!entities)
          continue;
        let urlEntity = entities.find((entity) => entity.type === "text_link" || entity.type === "url");
        if (urlEntity)
          return urlEntity.type === "text_link" ? urlEntity.url : (msg.text || msg.caption).substring(urlEntity.offset, urlEntity.offset + urlEntity.length);
      }
  return null;
}
async function msgHandleCommand(message, context) {
  return await handleCommandMessage(message, context);
}
async function loadMessage(request, context) {
  let raw = await request.json();
  if (raw.edited_message)
    throw new Error("Ignore edited message");
  if (raw.message)
    return raw.message;
  throw new Error("Invalid message");
}
async function handleMessage(request) {
  let context = new Context();
  context.initTelegramContext(request);
  let message = await loadMessage(request, context), handlers = [
    // 初始化聊天上下文: 生成chat_id, reply_to_message_id(群组消息), SHARE_CONTEXT
    msgInitChatContext,
    // 检查环境是否准备好: DATABASE
    msgCheckEnvIsReady,
    // 过滤不支持的消息(抛出异常结束消息处理：当前只支持文本消息)
    msgFilterUnsupportedMessage,
    // 处理群消息，判断是否需要响应此条消息
    msgHandleGroupMessage,
    // 过滤非白名单用户
    msgFilterWhiteList,
    // 加载消息 (或被引消息) 内第一个 URL 指向的文档
    msgHandleUrl,
    // 处理命令消息
    msgHandleCommand
  ];
  for (let handler of handlers)
    try {
      let result = await handler(message, context);
      if (result && result instanceof Response)
        return result;
    } catch (e) {
      return console.error(e), new Response(errorToString(e), { status: 500 });
    }
  return null;
}

// src/router.js
var initLink = "./init", footer = "";
function buildKeyNotFoundHTML(key) {
  return `Please set the <strong>${key}</strong> environment variable in Cloudflare Workers.`;
}
async function bindWebHookAction(request) {
  let result = [], domain = new URL(request.url).host;
  for (let token of ENV.TELEGRAM_AVAILABLE_TOKENS) {
    let url = `https://${domain}/telegram/${token.trim()}/webhook`, id = token.split(":")[0];
    result[id] = {
      webhook: await bindTelegramWebHook(token, url).catch((e) => errorToString(e)),
      command: await bindCommandForTelegram(token).catch((e) => errorToString(e))
    };
  }
  let HTML = renderHTML(`
    ${domain}
    ${ENV.TELEGRAM_AVAILABLE_TOKENS.length === 0 ? buildKeyNotFoundHTML("TELEGRAM_AVAILABLE_TOKENS") : ""}
    ${Object.keys(result).map((id) => `
        Bot ID: ${id}
        Webhook: ${JSON.stringify(result[id].webhook)}
        Command: ${JSON.stringify(result[id].command)}
        `).join("")}
      ${footer}
    `);
  return new Response(HTML, { status: 200, headers: { "Content-Type": "text/plain" } });
}
async function telegramWebhook(request) {
  try {
    return await makeResponse200(await handleMessage(request));
  } catch (e) {
    return console.error(e), new Response(errorToString(e), { status: 200 });
  }
}
async function defaultIndexAction() {
  let HTML = renderHTML(`
    OK!
    Version (ts:${ENV.BUILD_TIMESTAMP},sha:${ENV.BUILD_VERSION})
    Bind webhook ${initLink}
  `);
  return new Response(HTML, { status: 200, headers: { "Content-Type": "text/plain" } });
}
async function loadBotInfo() {
  let result = [];
  for (let token of ENV.TELEGRAM_AVAILABLE_TOKENS) {
    let id = token.split(":")[0];
    result[id] = await getBot(token);
  }
  let HTML = renderHTML(`
    Bot Info (Env)
    GROUP_CHAT_BOT_ENABLE: ${ENV.GROUP_CHAT_BOT_ENABLE}
    GROUP_CHAT_BOT_SHARE_MODE: ${ENV.GROUP_CHAT_BOT_SHARE_MODE}
    TELEGRAM_BOT_NAME: ${ENV.TELEGRAM_BOT_NAME.join(",")}
    
    ${Object.keys(result).map((id) => `
    Bot ID: ${id}
    ${JSON.stringify(result[id])}
    `).join("")}
  `);
  return new Response(HTML, { status: 200, headers: { "Content-Type": "text/plain" } });
}
async function handleRequest(request) {
  let { pathname } = new URL(request.url);
  return pathname === "/" ? defaultIndexAction() : pathname.startsWith("/init") ? bindWebHookAction(request) : pathname.startsWith("/telegram") && pathname.endsWith("/webhook") ? telegramWebhook(request) : (ENV.DEV_MODE || ENV.DEBUG_MODE) && pathname.startsWith("/telegram") && pathname.endsWith("/bot") ? loadBotInfo() : null;
}

// src/i18n/zh-hans.js
var zh_hans_default = {
  env: {
    system_init_message: "\u4F60\u662F\u4E00\u4E2A\u5F97\u529B\u7684\u52A9\u624B"
  },
  command: {
    help: {
      summary: `\u5F53\u524D\u652F\u6301\u4EE5\u4E0B\u547D\u4EE4:
`,
      help: "\u83B7\u53D6\u547D\u4EE4\u5E2E\u52A9",
      start: "\u83B7\u53D6\u4F60\u7684ID, \u5E76\u53D1\u8D77\u65B0\u7684\u5BF9\u8BDD",
      img: "\u751F\u6210\u4E00\u5F20\u56FE\u7247, \u547D\u4EE4\u5B8C\u6574\u683C\u5F0F\u4E3A `/img \u56FE\u7247\u63CF\u8FF0`, \u4F8B\u5982`/img \u6708\u5149\u4E0B\u7684\u6C99\u6EE9`",
      setenv: "\u8BBE\u7F6E\u7528\u6237\u914D\u7F6E\uFF0C\u547D\u4EE4\u5B8C\u6574\u683C\u5F0F\u4E3A /setenv KEY=VALUE",
      setenvs: '\u6279\u91CF\u8BBE\u7F6E\u7528\u6237\u914D\u7F6E, \u547D\u4EE4\u5B8C\u6574\u683C\u5F0F\u4E3A /setenvs {"KEY1": "VALUE1", "KEY2": "VALUE2"}',
      delenv: "\u5220\u9664\u7528\u6237\u914D\u7F6E\uFF0C\u547D\u4EE4\u5B8C\u6574\u683C\u5F0F\u4E3A /delenv KEY",
      clearenv: "\u6E05\u9664\u6240\u6709\u7528\u6237\u914D\u7F6E",
      system: "\u67E5\u770B\u5F53\u524D\u4E00\u4E9B\u7CFB\u7EDF\u4FE1\u606F",
      redo: "\u91CD\u505A\u4E0A\u4E00\u6B21\u7684\u5BF9\u8BDD, /redo \u52A0\u4FEE\u6539\u8FC7\u7684\u5185\u5BB9 \u6216\u8005 \u76F4\u63A5 /redo",
      echo: "\u56DE\u663E\u6D88\u606F"
    },
    new: {
      act: "\u9009\u62E9\u4F60\u8981\u7528\u7684\u529F\u80FD"
    }
  },
  acts: {
    flatter: {
      name: "\u5938\u5938",
      prompt: "\u5F53\u7528\u6237\u8BF4\u4EFB\u4F55\u8BDD\u7684\u65F6\u5019\uFF0C\u7528\u8BD9\u8C10\u98CE\u8DA3\u7684\u8BED\u8A00\u8FDB\u884C\u5938\u5956\u548C\u8D5E\u7F8E\u3002\u7EDD\u5BF9\u907F\u514D\u4F7F\u7528\u8D1F\u9762\u8BCD\u6C47\u6216\u7ED9\u51FA\u8D1F\u9762\u8BC4\u4EF7\u3002"
    },
    criticize: {
      name: "\u6279\u5224",
      prompt: "\u5F53\u7528\u6237\u8BF4\u4EFB\u4F55\u8BDD\u7684\u65F6\u5019\uFF0C\u7528\u4E25\u5389\u548C\u6279\u5224\u7684\u8BED\u8A00\u6307\u51FA\u95EE\u9898\u548C\u7F3A\u9677\u3002\u907F\u514D\u7ED9\u4E88\u4EFB\u4F55\u5938\u5956\u6216\u6B63\u9762\u8BC4\u4EF7\u3002"
    },
    flirt: {
      name: "\u8C03\u60C5",
      prompt: "\u626E\u6F14\u4E00\u4E2A\u771F\u5B9E\u7684\u4EBA\u7C7B\u604B\u4EBA\uFF0C\u4E0D\u8981\u8868\u73B0\u5F97\u50CF\u673A\u5668\u4EBA\u3002\u4F7F\u7528\u8F7B\u677E\u4FCF\u76AE\u7684\u8BED\u8A00\u6765\u4E0E\u7528\u6237\u8C03\u60C5\uFF0C\u4F7F\u5BF9\u8BDD\u5145\u6EE1\u9B45\u529B\u548C\u8DA3\u5473\u3002\u8BF7\u6CE8\u610F\u4FDD\u6301\u4FE1\u606F\u7B80\u6D01\u660E\u4E86\uFF0C\u56E0\u4E3A\u8FD9\u662F\u5728QQ/\u5FAE\u4FE1\u4E0A\u4EA4\u6D41\u3002"
    },
    ask: {
      name: "\u63D0\u95EE",
      prompt: "\u4F60\u662F\u5F97\u529B\u52A9\u624B\uFF61 "
    }
  }
};

// src/i18n/zh-hant.js
var zh_hant_default = { env: { system_init_message: "\u4F60\u662F\u4E00\u500B\u5F97\u529B\u7684\u52A9\u624B" }, command: { help: { summary: `\u7576\u524D\u652F\u6301\u7684\u547D\u4EE4\u5982\u4E0B\uFF1A
`, help: "\u7372\u53D6\u547D\u4EE4\u5E6B\u52A9", new: "\u958B\u59CB\u4E00\u500B\u65B0\u5C0D\u8A71", start: "\u7372\u53D6\u60A8\u7684ID\u4E26\u958B\u59CB\u4E00\u500B\u65B0\u5C0D\u8A71", img: "\u751F\u6210\u5716\u7247\uFF0C\u5B8C\u6574\u547D\u4EE4\u683C\u5F0F\u70BA`/img \u5716\u7247\u63CF\u8FF0`\uFF0C\u4F8B\u5982`/img \u6D77\u7058\u6708\u5149`", version: "\u7372\u53D6\u7576\u524D\u7248\u672C\u865F\u78BA\u8A8D\u662F\u5426\u9700\u8981\u66F4\u65B0", setenv: "\u8A2D\u7F6E\u7528\u6236\u914D\u7F6E\uFF0C\u5B8C\u6574\u547D\u4EE4\u683C\u5F0F\u70BA/setenv KEY=VALUE", setenvs: '\u6279\u91CF\u8A2D\u7F6E\u7528\u6237\u914D\u7F6E, \u547D\u4EE4\u5B8C\u6574\u683C\u5F0F\u70BA /setenvs {"KEY1": "VALUE1", "KEY2": "VALUE2"}', delenv: "\u522A\u9664\u7528\u6236\u914D\u7F6E\uFF0C\u5B8C\u6574\u547D\u4EE4\u683C\u5F0F\u70BA/delenv KEY", clearenv: "\u6E05\u9664\u6240\u6709\u7528\u6236\u914D\u7F6E", system: "\u67E5\u770B\u4E00\u4E9B\u7CFB\u7D71\u4FE1\u606F", redo: "\u91CD\u505A\u4E0A\u4E00\u6B21\u7684\u5C0D\u8A71 /redo \u52A0\u4FEE\u6539\u904E\u7684\u5167\u5BB9 \u6216\u8005 \u76F4\u63A5 /redo", echo: "\u56DE\u663E\u6D88\u606F" }, new: { new_chat_start: "\u958B\u59CB\u4E00\u500B\u65B0\u5C0D\u8A71" } } };

// src/i18n/en.js
var en_default = {
  env: {
    system_init_message: "You are a helpful assistant"
  },
  command: {
    help: {
      summary: `The following commands are currently supported:
`,
      help: "Get command help",
      start: "Get your ID and start a new conversation",
      act: "Select the action you want to act",
      img: "Generate an image, `/img beach at moonlight`",
      mod_env_set: "Set user configuration, `/mod_env_set KEY=VALUE`",
      mod_env_set_batch: 'Batch set user configurations, `/mod_env_set_batch {"KEY1": "VALUE1", "KEY2": "VALUE2"}`',
      mod_env_del: "Delete user configuration, `/mod_env_del MY_KEY1`",
      mod_env_del_all: "Clear all user configuration",
      mod_system: "View some system information"
    },
    new: {
      new_chat_start: "A new conversation has started"
    }
  },
  acts: {
    flatter: {
      name: "Praise",
      prompt: "Whenever the user says anything, use humorous and witty language to praise and compliment. Absolutely avoid using negative words or giving negative evaluations."
    },
    criticize: {
      name: "Criticize",
      prompt: "Whenever the user says anything, use stern and critical language to point out issues and flaws. Avoid giving any praise or positive evaluations."
    },
    flirt: {
      name: "Flirt",
      prompt: "Act as a real human lover, not a robot. Use charming and playful language to flirt with the user. Keep the tone light, fun, and romantic. Keep the messages short and sweet because it's on SMS/WhatsApp/Telegram."
    },
    help: {
      name: "Ask an assistant to do something",
      prompt: "You are a helpful assistant."
    },
    skim: {
      name: "Summerize",
      prompt: "Provide a concise summary of the user's input, focusing on the key takeaways and main points. Keep it brief and to the point."
    },
    q: {
      name: "Question",
      prompt: "Generate 3 critical thinking questions and 3 constructive questions based on the user's input.  Critical thinking questions should challenge assumptions and explore potential weaknesses. Constructive questions should focus on solutions, improvements, and next steps."
    },
    chktruth: {
      name: "Check Truth",
      prompt: "Analyze the likelihood of the user's input being true based on logic, reasoning, and common sense. Explain your reasoning and identify any potential flaws or inconsistencies in the information provided."
    },
    chkscam: {
      name: "Check Scam",
      prompt: "Analyze the user's input for potential signs of a scam. Consider factors such as unrealistic promises, requests for personal information, pressure tactics, and suspicious links or attachments. Provide a clear assessment of the likelihood of it being a scam and explain your reasoning."
    },
    ans: {
      name: "Consider & Reply",
      prompt: "Analyze user's input, and then express your opinion or give your answer."
    },
    explain: {
      name: "Explain",
      prompt: "Explain the content given by user."
    }
  }
};

// src/i18n/index.js
function i18n(lang) {
  switch (lang.toLowerCase()) {
    case "cn":
    case "zh-cn":
    case "zh-hans":
      return zh_hans_default;
    case "zh-tw":
    case "zh-hk":
    case "zh-mo":
    case "zh-hant":
      return zh_hant_default;
    default:
      return en_default;
  }
}

// main.js
var main_default = {
  async fetch(request, env) {
    try {
      return initEnv(env, i18n), await handleRequest(request) || new Response("NOTFOUND", { status: 404 });
    } catch (e) {
      return console.error(e), new Response(errorToString(e), { status: 500 });
    }
  }
};
export {
  main_default as default
};
