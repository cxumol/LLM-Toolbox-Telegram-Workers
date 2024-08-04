import {handleMessage} from './telegram/message.js';
import {ENV} from './config/env.js';
import {bindCommandForTelegram, commandsDocument} from './telegram/command.js';
import {bindTelegramWebHook, getBot} from './telegram/telegram.js';
import {errorToString, makeResponse200, renderHTML} from './utils/utils.js';


const helpLink = 'https://github.com/TBXark/ChatGPT-Telegram-Workers/blob/master/doc/en/DEPLOY.md';
const issueLink = 'https://github.com/TBXark/ChatGPT-Telegram-Workers/issues';
const initLink = './init';

const footer = ``;

/**
 * @param {string} key
 * @return {string}
 */
function buildKeyNotFoundHTML(key) {
    return `Please set the <strong>${key}</strong> environment variable in Cloudflare Workers.`;
}

/**
 *
 * @param {Request} request
 * @return {Promise<Response>}
 */
async function bindWebHookAction(request) {
    const result = [];
    const domain = new URL(request.url).host;
    for (const token of ENV.TELEGRAM_AVAILABLE_TOKENS) {
        const url = `https://${domain}/telegram/${token.trim()}/webhook`;
        const id = token.split(':')[0];
        result[id] = {
            webhook: await bindTelegramWebHook(token, url).catch((e) => errorToString(e)),
            command: await bindCommandForTelegram(token).catch((e) => errorToString(e)),
        };
    }

    const HTML = renderHTML(`
    ${domain}
    ${
        ENV.TELEGRAM_AVAILABLE_TOKENS.length === 0 ? buildKeyNotFoundHTML('TELEGRAM_AVAILABLE_TOKENS') : ''
    }
    ${
        Object.keys(result).map((id) => `
        Bot ID: ${id}
        Webhook: ${JSON.stringify(result[id].webhook)}
        Command: ${JSON.stringify(result[id].command)}
        `).join('')
    }
      ${footer}
    `);
    return new Response(HTML, {status: 200, headers: {'Content-Type': 'text/plain'}});
}


/**
 * 处理Telegram回调
 * @param {Request} request
 * @return {Promise<Response>}
 */
async function telegramWebhook(request) {
    try {
        return await makeResponse200(await handleMessage(request));
    } catch (e) {
        console.error(e);
        return new Response(errorToString(e), {status: 200});
    }
}


/**
 * @return {Promise<Response>}
 */
async function defaultIndexAction() {
    const HTML = renderHTML(`
    OK!
    Version (ts:${ENV.BUILD_TIMESTAMP},sha:${ENV.BUILD_VERSION})
    Bind webhook ${initLink}
  `);
    return new Response(HTML, {status: 200, headers: {'Content-Type': 'text/plain'}});
}

/**
 * @return {Promise<Response>}
 */
async function loadBotInfo() {
    const result = [];
    for (const token of ENV.TELEGRAM_AVAILABLE_TOKENS) {
        const id = token.split(':')[0];
        result[id] = await getBot(token);
    }
    const HTML = renderHTML(`
    Bot Info (Env)
    GROUP_CHAT_BOT_ENABLE: ${ENV.GROUP_CHAT_BOT_ENABLE}
    GROUP_CHAT_BOT_SHARE_MODE: ${ENV.GROUP_CHAT_BOT_SHARE_MODE}
    TELEGRAM_BOT_NAME: ${ENV.TELEGRAM_BOT_NAME.join(',')}
    
    ${Object.keys(result).map((id) => `
    Bot ID: ${id}
    ${JSON.stringify(result[id])}
    `).join('')}
  `);
    return new Response(HTML, {status: 200, headers: {'Content-Type': 'text/plain'}});
}

/**
 * @param {Request} request
 * @return {Promise<Response>}
 */
export async function handleRequest(request) {
    const {pathname} = new URL(request.url);
    if (pathname === `/`) {
        return defaultIndexAction();
    }
    if (pathname.startsWith(`/init`)) {
        return bindWebHookAction(request);
    }
    if (pathname.startsWith(`/telegram`) && pathname.endsWith(`/webhook`)) {
        return telegramWebhook(request);
    }

    if (ENV.DEV_MODE || ENV.DEBUG_MODE) {
        if (pathname.startsWith(`/telegram`) && pathname.endsWith(`/bot`)) {
            return loadBotInfo();
        }
    }
    return null;
}
