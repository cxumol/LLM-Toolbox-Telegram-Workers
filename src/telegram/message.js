import {CONST, DATABASE, ENV} from '../config/env.js';
import {Context} from '../config/context.js';
import {getBot, sendMessageToTelegramWithContext} from './telegram.js';
import {handleCommandMessage} from './command.js';
import {errorToString} from '../utils/utils.js';
import {retrieveUrlTxt} from "./retrieval.js";

import '../types/telegram.js';


/**
 * 初始化聊天上下文
 *
 * @param {TelegramMessage} message
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function msgInitChatContext(message, context) {
    await context.initContext(message);
    return null;
}



/**
 * 检查环境变量是否设置
 *
 * @param {TelegramMessage} message
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function msgCheckEnvIsReady(message, context) {
    if (!DATABASE) {
        return sendMessageToTelegramWithContext(context)('DATABASE Not Set');
    }
    return null;
}

/**
 * 过滤非白名单用户
 *
 * @param {TelegramMessage} message
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function msgFilterWhiteList(message, context) {
    if (ENV.I_AM_A_GENEROUS_PERSON) {
        return null;
    }
    // 判断私聊消息
    if (context.SHARE_CONTEXT.chatType === 'private') {
        // 白名单判断
        if (!ENV.CHAT_WHITE_LIST.includes(`${context.CURRENT_CHAT_CONTEXT.chat_id}`)) {
            return sendMessageToTelegramWithContext(context)(
                `You are not in the white list, please contact the administrator to add you to the white list. Your chat_id: ${context.CURRENT_CHAT_CONTEXT.chat_id}`,
            );
        }
        return null;
    }

    // 判断群组消息
    if (CONST.GROUP_TYPES.includes(context.SHARE_CONTEXT.chatType)) {
        // 未打开群组机器人开关,直接忽略
        if (!ENV.GROUP_CHAT_BOT_ENABLE) throw new Error('Not support');
        // 白名单判断
        if (!ENV.CHAT_GROUP_WHITE_LIST.includes(`${context.CURRENT_CHAT_CONTEXT.chat_id}`)) {
            return sendMessageToTelegramWithContext(context)(
                `403. Add the group to the whitelist to proceed. chat_id ${context.CURRENT_CHAT_CONTEXT.chat_id}`,
            );
        }
        return null;
    }
    return sendMessageToTelegramWithContext(context)(
        `Not support chat type: ${context.SHARE_CONTEXT.chatType}`,
    );
}


/**
 * 过滤不支持的消息
 *
 * @param {TelegramMessage} message
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
// eslint-disable-next-line no-unused-vars
async function msgFilterUnsupportedMessage(message, context) {
    if (!(message?.entities[0]?.type === 'bot_command')) throw new Error('Only bot_command is supported');
    if (message.caption) message.text = message.caption;
    if (!message.text) throw new Error('Not supported message type');
    return null;
}

/**
 * 过滤群消息, 除去AT部分
 *
 * @param {TelegramMessage} message
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function msgHandleGroupMessage(message, context) {
    // 非群组消息不作处理
    if (!CONST.GROUP_TYPES.includes(context.SHARE_CONTEXT.chatType)) return null;
    // https://core.telegram.org/bots/faq#why-doesn-39t-my-bot-see-messages-from-other-bots
    if ( (message.reply_to_message?.from.is_bot) && (`${message.reply_to_message?.from.id}` !== context.SHARE_CONTEXT.currentBotId) ){
        await sendMessageToTelegramWithContext(context)(`Don't reply to a bot. Reason: \nhttps://core.telegram.org/bots/faq#why-doesn-39t-my-bot-see-messages-from-other-bots`);
        throw new Error(`Not supported message type: reply to a bot. reply_to: ${message.reply_to_message?.from.id} currentBotId: ${context.SHARE_CONTEXT.currentBotId}`);
    } 
    
    const mentioned = await mentionBotUsername(message, context);
    // 必须在群里@本bot才会回应, 否则中断回应
    if (!mentioned) throw new Error('No mentioned');
    /*debug*/ console.log(`mentioned:${mentioned}`);
    context.SHARE_CONTEXT.extraMessageContext.mentioned = mentioned;
    return null;
}

/**
 * 返回所有AT本bot的 slice pair; 无则 null
 *
 * @param {TelegramMessage} message
 * @param {ContextType} context
 * _return {Promise<Array<[number, number]>>|null}
 * @return {bool|null}
 */
export async function mentionBotUsername(message, context) {
    
    let botName = await getBotNameWithCtx(context);
    if (!botName) throw new Error('Bot has no username');
    botName = '@'+botName;
    if (!message.text.includes(botName)) return null;
    return true;
    // const indices = [...message.text.matchAll(new RegExp(botName, 'g'))].map(match => [match.index, match.index + botName.length]);
    // return indices.length > 0 ? indices : null;
}
export async function getBotNameWithCtx(context) {
    let botName = context.SHARE_CONTEXT?.currentBotName;
    if (!botName) {
        const res = await getBot(context.SHARE_CONTEXT.currentBotToken);
        context.SHARE_CONTEXT.currentBotName = res.info.bot_name;
    }
    return botName;
}


/**
 * 加载消息 (或被引消息) 内第一个 URL 指向的文档
 * 
 */
async function msgHandleUrl(message, context) {
    const url = _getFirstUrl(message);
    if (!url) return null;
    const doc = await retrieveUrlTxt(url);
    /*debug*/ console.log(`url: ${url}, doc.length: ${doc.length}`);
    if (!doc){
        await sendMessageToTelegramWithContext(context)(`Doc extraction failed: ${url}`);
        throw new Error('Doc extraction failed');
    }
    context.SHARE_CONTEXT.extraMessageContext.doc = doc.substring(0, 4000); // conservative max context window limit
    return null;
}
function _getFirstUrl(message) {
    for (const msg of [message.reply_to_message, message]) {
        if(!msg) continue;
        for (const entities of [msg.entities, msg.caption_entities]) {
            if(!entities) continue;
            const urlEntity = entities.find(entity => entity.type === 'text_link' || entity.type === 'url');
            if (!urlEntity) continue;
            return urlEntity.type === 'text_link' ? urlEntity.url : (msg.text || msg.caption).substring(urlEntity.offset, urlEntity.offset + urlEntity.length);
        }
    }
    return null;
}


/**
 * 响应命令消息
 *
 * @param {TelegramMessage} message
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function msgHandleCommand(message, context) {
    return await handleCommandMessage(message, context);
}


/**
 * 加载真实TG消息
 *
 * @param {Request} request
 * @param {ContextType} context
 * @return {Promise<TelegramMessage>}
 */
// eslint-disable-next-line no-unused-vars
async function loadMessage(request, context) {
    /**
     * @type {TelegramWebhookRequest}
     */
    const raw = await request.json();
    if (raw.edited_message) {
        throw new Error('Ignore edited message');
    }
    if (raw.message) {
        return raw.message;
    } else {
        throw new Error('Invalid message');
    }
}

/**
 * 处理消息
 *
 * @param {Request} request
 * @return {Promise<Response|null>}
 */
export async function handleMessage(request) {
    const context = new Context();
    context.initTelegramContext(request);
    const message = await loadMessage(request, context);

    // 中间件定义 function (message: TelegramMessage, context: Context): Promise<Response|null>
    // 1. 当函数抛出异常时，结束消息处理，返回异常信息
    // 2. 当函数返回 Response 对象时，结束消息处理，返回 Response 对象
    // 3. 当函数返回 null 时，继续下一个中间件处理

    // 消息处理中间件
    const handlers = [
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
        msgHandleCommand,
    ];

    for (const handler of handlers) {
        try {
            const result = await handler(message, context);
            if (result && result instanceof Response) {
                return result;
            }
        } catch (e) {
            console.error(e);
            return new Response(errorToString(e), {status: 500});
        }
    }
    return null;
}
