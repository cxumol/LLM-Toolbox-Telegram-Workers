import {
    sendChatActionToTelegramWithContext,
    sendMessageToTelegramWithContext as msgTG,
} from '../telegram/telegram.js';
import {ENV} from '../config/env.js';
import {loadChatLLM} from "./agents.js";
import "../types/agent.js";





/**
 * lower level llm call
 *
 * @param {LlmRequestParams} params
 * @param {ContextType} context
 * @param {ChatAgentRequest} llm
 * @param {function(string)} onStream
 * @return {Promise<string>}
 */
async function requestCompletionsFromLLM(params, context, llm, onStream) {

    // const { message, prompt } = params;

    const llmParams = {
        ...params,
        // prompt: prompt || context.USER_CONFIG.SYSTEM_INIT_MESSAGE,
    };
    const answer = await llm(llmParams, context, onStream);
    return answer;
}

/**
 * 与LLM聊天
 *
 * @param {LlmRequestParams} params
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
export async function actWithLLM(params, context) {
    try {
        try {
            const msg = await msgTG(context)('...').then((r) => r.json());
            context.CURRENT_CHAT_CONTEXT.message_id = msg.result.message_id;
            context.CURRENT_CHAT_CONTEXT.reply_markup = null;
        } catch (e) {
            console.error(e);
        }
        setTimeout(() => sendChatActionToTelegramWithContext(context)('typing').catch(console.error), 0);
        let onStream = null;
        const parseMode = context.CURRENT_CHAT_CONTEXT.parse_mode;
        let nextEnableTime = null;
        if (ENV.STREAM_MODE) {
            context.CURRENT_CHAT_CONTEXT.parse_mode = null;
            onStream = async (text) => {
                try {
                    // 判断是否需要等待
                    if (nextEnableTime && nextEnableTime > Date.now()) return;

                    const resp = await msgTG(context)(text);
                    if (resp.status === 429) {
                        // 获取重试时间
                        const retryAfter = parseInt(resp.headers.get('Retry-After'));
                        console.log(`TG API 429, retry after ${retryAfter}s`);
                        if (retryAfter) {
                            nextEnableTime = Date.now() + retryAfter * 1000;
                            return;
                        }
                    }
                    nextEnableTime = null;
                    if (resp.ok) {
                        context.CURRENT_CHAT_CONTEXT.message_id = (await resp.json()).result.message_id;
                    }
                } catch (e) {
                    console.error(e);
                }
            };
        }

        const llm = loadChatLLM(context)?.request;
        if (!llm) return msgTG(context)(`LLM is not enable`);

        const answer = await requestCompletionsFromLLM(params, context, llm, onStream);
        context.CURRENT_CHAT_CONTEXT.parse_mode = parseMode;

        if (nextEnableTime && nextEnableTime > Date.now()) {
            await new Promise((resolve) => setTimeout(resolve, nextEnableTime - Date.now()));
        }
        return msgTG(context)(answer);
    } catch (e) {
        context.CURRENT_CHAT_CONTEXT.disable_web_page_preview = true;
        return msgTG(context)(`Error: ${e.message}`.substring(0, 2000));
    }
}

