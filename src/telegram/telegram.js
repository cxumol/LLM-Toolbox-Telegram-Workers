import {DATABASE, ENV} from '../config/env.js';
import {escape} from "../utils/md2tgmd.js";
import "../types/context.js";

/**
 * @param {string} message
 * @param {string} token
 * @param {object} context
 * @return {Promise<Response>}
 */
async function sendMessage(message, token, context) {
    const validContext = Object.fromEntries(
        Object.entries(context).filter(([, value]) => value !== null && value !== undefined)
    );
    
    const body = { text: message, ...validContext };
    
    const botMethod = context?.message_id ? 'editMessageText' : 'sendMessage';
    
    // 使用 fetch 发送请求
    return fetch(`${ENV.TELEGRAM_API_DOMAIN}/bot${token}/${botMethod}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}


/**
 * @param {string} message
 * @param {string} token
 * @param {CurrentChatContextType} context
 * @return {Promise<Response>}
 */
export async function sendMessageToTelegram(message, token, context) {
    const chatContext = context;
    const originMessage = message;
    const limit = 4096;

    if (chatContext.parse_mode === 'MarkdownV2') {
        message = escape(message);
    }

    if (message.length <= limit) {
        const resp = await sendMessage(message, token, chatContext);
        if (resp.status === 200) {
            return resp;
        } else {
            message = originMessage;
            // 可能格式错乱导致发送失败，使用纯文本格式发送
            chatContext.parse_mode = null;
            return await sendMessage(message, token, chatContext);
        }
    }
    message = originMessage;
    // 拆分消息后可能导致markdown格式错乱，所以采用纯文本模式发送
    chatContext.parse_mode = null;
    let lastMessageResponse = null;
    for (let i = 0; i < message.length; i += limit) {
        const msg = message.slice(i, Math.min(i + limit, message.length));
        if (i > 0) {
            chatContext.message_id = null;
        }
        lastMessageResponse = await sendMessage(msg, token, chatContext);
    }
    return lastMessageResponse;
}

/**
 * @param {ContextType} context
 * @return {function(string): Promise<Response>}
 */
export function sendMessageToTelegramWithContext(context) {
    return async (message) => {
        return sendMessageToTelegram(message, context.SHARE_CONTEXT.currentBotToken, context.CURRENT_CHAT_CONTEXT);
    };
}

/**
 * 发送图片消息到Telegram
 *
 * @param {string | Blob} photo
 * @param {string} token
 * @param {CurrentChatContextType} context
 * @return {Promise<Response>}
 */
export async function sendPhotoToTelegram(photo, token, context) {
    const url = `${ENV.TELEGRAM_API_DOMAIN}/bot${token}/sendPhoto`;
    const isPhotoString = typeof photo === 'string';
    const filteredContext = Object.fromEntries(Object.entries(context).filter(([, v]) => v !== undefined && v !== null)); // Filter context
    
    const body = isPhotoString ? JSON.stringify({ photo, ...filteredContext }) : new FormData(); // Use filteredContext
    const headers = isPhotoString ? { 'Content-Type': 'application/json' } : {};
    
    if (!isPhotoString) {
        body.append('photo', photo, 'photo.png');
        Object.entries(filteredContext).forEach(([key, value]) => body.append(key, `${value}`));
    }
    
    return await fetch(url, {
        method: 'POST',
        headers: headers,
        body,
    });
}


/**
 * @param {ContextType} context
 * @return {function(string): Promise<Response>}
 */
export function sendPhotoToTelegramWithContext(context) {
    return (url) => {
        return sendPhotoToTelegram(url, context.SHARE_CONTEXT.currentBotToken, context.CURRENT_CHAT_CONTEXT);
    };
}


/**
 * 发送聊天动作到TG
 *
 * @param {string} action
 * @param {string} token
 * @param {string | number} chatId
 *
 * @return {Promise<Response>}
 */
export async function sendChatActionToTelegram(action, token, chatId) {
    return await fetch(
        `${ENV.TELEGRAM_API_DOMAIN}/bot${token}/sendChatAction`,
        {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: chatId,
                action: action,
            }),
        },
    ).then((res) => res.json());
}

/**
 * @param {ContextType} context
 * @return {function(string): Promise<Response>}
 */
export function sendChatActionToTelegramWithContext(context) {
    return (action) => {
        return sendChatActionToTelegram(action, context.SHARE_CONTEXT.currentBotToken, context.CURRENT_CHAT_CONTEXT.chat_id);
    };
}

/**
 * @param {string} token
 * @param {string} url
 * @return {Promise<Response>}
 */
export async function bindTelegramWebHook(token, url) {
    return await fetch(
        `${ENV.TELEGRAM_API_DOMAIN}/bot${token}/setWebhook`,
        {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({url: url})
        },
    ).then((res) => res.json());
}

/**
 * 判断是否为群组管理员
 *
 * @param {string | number} id
 * @param {string} groupAdminKey
 * @param {string | number} chatId
 * @param {string} token
 * @return {Promise<string>}
 */
export async function getChatRole(id, groupAdminKey, chatId, token) {
    let groupAdmin;
    try {
        groupAdmin = JSON.parse(await DATABASE.get(groupAdminKey));
    } catch (e) {
        console.error(e);
        return e.message;
    }
    if (!groupAdmin || !Array.isArray(groupAdmin) || groupAdmin.length === 0) {
        const administers = await getChatAdminister(chatId, token);
        if (administers == null) {
            return null;
        }
        groupAdmin = administers;
        // 缓存120s
        await DATABASE.put(
            groupAdminKey,
            JSON.stringify(groupAdmin),
            {expiration: (Date.now() / 1000) + 120},
        );
    }
    return groupAdmin.find(u => u.user.id === id)?.status || 'member';
}

/**
 * 判断是否为群组管理员
 *
 * @param {ContextType} context
 * @return {function(*): Promise<string>}
 */
export function getChatRoleWithContext(context) {
    return (id) => {
        return getChatRole(id, context.SHARE_CONTEXT.groupAdminKey, context.CURRENT_CHAT_CONTEXT.chat_id, context.SHARE_CONTEXT.currentBotToken);
    };
}

/**
 * 获取群组管理员信息
 *
 * @param {string | number} chatId
 * @param {string} token
 * @return {Promise<object>}
 */
export async function getChatAdminister(chatId, token) {
    try {
        const resp = await fetch(
            `${ENV.TELEGRAM_API_DOMAIN}/bot${token}/getChatAdministrators`,
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({chat_id: chatId}),
            }).then((res) => res.json());
        return resp.ok ? resp.result : null;
    } catch (e) {
        console.error(e);
        return null;
    }
}

// 获取机器人信息
/**
 * @typedef {object} BotInfo
 * @property {boolean} ok
 * @property {object} info
 * @property {string} info.name
 * @property {string} info.bot_name
 * @property {boolean} info.can_join_groups
 * @property {boolean} info.can_read_all_group_messages
 */
/**
 *
 * @param {string} token
 * @return {Promise<BotInfo>}
 */
export async function getBot(token) {
    const response = await fetch(
        `${ENV.TELEGRAM_API_DOMAIN}/bot${token}/getMe`,{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
        }).then((res) => res.json());

    return response.ok ? {
              ok: true,
              info: {
                  name: response.result.first_name,
                  bot_name: response.result.username,
                  can_join_groups: response.result.can_join_groups,
                  can_read_all_group_messages: response.result.can_read_all_group_messages,
              },
          } : response;
}
