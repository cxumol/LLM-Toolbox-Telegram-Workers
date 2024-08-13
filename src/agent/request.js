import "../types/context.js";
import {ENV} from "../config/env.js";
import {Stream} from "./stream.js";


/**
 *
 * @typedef {function} StreamBuilder
 * @param {Response} resp
 * @param {AbortController} controller
 * @return {Stream}
 *
 * @typedef {function} SSEContentExtractor
 * @param {object} data
 * @return {string|null}
 *
 * @typedef {function} FullContentExtractor
 * @param {object} data
 * @return {string|null}
 *
 * @typedef {object} ErrorExtractor
 * @param {object} data
 * @return {string|null}
 *
 * @typedef {object} SseChatCompatibleOptions
 * @property {StreamBuilder} streamBuilder
 * @property {SSEContentExtractor} contentExtractor
 * @property {FullContentExtractor} fullContentExtractor
 * @property {ErrorExtractor} errorExtractor
 */

/**
 * 修复OpenAI兼容的选项
 *
 * @param {SseChatCompatibleOptions | null} options
 * @return {SseChatCompatibleOptions}
 */
function fixOpenAICompatibleOptions(options) {
    options = options || {};
    options.streamBuilder = options.streamBuilder || ((r, c) => new Stream(r, c));
    options.contentExtractor = options.contentExtractor || (d => d?.choices?.[0]?.delta?.content);
    options.fullContentExtractor = options.fullContentExtractor || (d => d.choices?.[0]?.message.content);
    options.errorExtractor = options.errorExtractor || (d => d.error?.message);
    return options;
}

/**
 * @param {Response} resp
 * @return {boolean}
 */
export const isJsonResponse = (resp) => resp.headers.get('content-type').includes('json');

/**
 * @param {Response} resp
 * @return {boolean}
 */
export function isEventStreamResponse(resp) {
    const contentType = resp.headers.get('content-type');
    return contentType?.includes('application/stream+json') || contentType?.includes('text/event-stream');
}

/**
 * 发送请求到支持sse的聊天接口
 *
 * @param {string | null} url
 * @param {object} header
 * @param {object} body
 * @param {ContextType} context
 * @param {function} onStream
 * @param {function} onResult
 * @param {SseChatCompatibleOptions | null} options
 * @return {Promise<string>}
 */
export async function requestChatCompletions(url, header, body, context, onStream, onResult = null, options = null) {
    const controller = new AbortController();
    const {signal} = controller;

    let timeoutID = ENV.CHAT_COMPLETE_API_TIMEOUT > 0 ? setTimeout(() => controller.abort(), ENV.CHAT_COMPLETE_API_TIMEOUT) : null;
    let lastUpdateTime = Date.now();

    const resp = await fetch(url, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(body),
        signal,
    });
    if (timeoutID) clearTimeout(timeoutID);

    options = fixOpenAICompatibleOptions(options);

    if (onStream && resp.ok && isEventStreamResponse(resp)) {
        const stream = options.streamBuilder(resp, controller);
        let contentFull = '';
        let lengthDelta = 0;
        let updateStep = 50;
        try {
            for await (const data of stream) {
                const c = options.contentExtractor(data) || '';
                if (c === '') continue;

                lengthDelta += c.length;
                contentFull = contentFull + c;
                if (lengthDelta > updateStep) {
                    if (ENV.TELEGRAM_MIN_STREAM_INTERVAL > 0){
                        // timeDelta < minInterval
                        if (Date.now() - lastUpdateTime < ENV.TELEGRAM_MIN_STREAM_INTERVAL) continue;
                        lastUpdateTime = Date.now();
                    }
                    lengthDelta = 0;
                    updateStep += 20;
                    await onStream(`${contentFull}\n...`);
                }
            }
        } catch (e) {
            contentFull += `\nERROR: ${e.message}`;
        }
        return contentFull;
    }

    if (!isJsonResponse(resp)) throw new Error(resp.statusText);

    const result = await resp.json();
    if (!result) throw new Error('Empty response');
    if (options.errorExtractor(result)) throw new Error(options.errorExtractor(result));

    try {
        onResult?.(result);
        return options.fullContentExtractor(result);
    } catch (e) {
        console.error(e);
        throw Error(JSON.stringify(result));
    }
}
