import "../types/context.js";
import {
    CONST,
    CUSTOM_COMMAND,
    CUSTOM_COMMAND_DESCRIPTION,
    DATABASE,
    ENV,
    ENV_KEY_MAPPER,
    mergeEnvironment
} from '../config/env.js';
import {
    getChatRoleWithContext,
    sendChatActionToTelegramWithContext,
    sendMessageToTelegramWithContext as msgTG,
    sendPhotoToTelegramWithContext,
} from './telegram.js';
import {actWithLLM} from '../agent/llm.js';
import {
    currentChatModel,
    currentImageModel,
    loadChatLLM,
    loadImageGen
} from "../agent/agents.js";
import {trimUserConfig} from "../config/context.js";
import {mentionBotUsername,getBotNameWithCtx} from "./message.js";

const commandAuthCheck = { 
    default: function (chatType) {
        if (CONST.GROUP_TYPES.includes(chatType)) {
            return ['administrator', 'creator'];
        }
        return false;
    },
    shareModeGroup: function (chatType) {
        if (CONST.GROUP_TYPES.includes(chatType)) {
            // 每个人在群里有上下文的时候，不限制; 但是在群里没有shared上下文的时候，需要管理员权限
            if (!ENV.GROUP_CHAT_BOT_SHARE_MODE) {
                return false;
            }
            return ['administrator', 'creator'];
        }
        return false;
    },
};


/*
scopes: ['all_private_chats', 'all_group_chats', 'all_chat_administrators'],
fn: commandCreateNewChatContext,
needAuth: commandAuthCheck.default 需要群管权限, commandAuthCheck.shareModeGroup, 每个人在群里有上下文的时候，不限制; 但是在群里没有shared上下文的时候，需要管理员权限
*/ 

const scopeMod = ['all_private_chats', 'all_chat_administrators'];
const scopeFull = scopeMod.concat(['all_group_chats']);

// 命令绑定
const commandHandlers = {
    '/help': {
        scopes: scopeMod,
        fn: commandGetHelp,
    },
    '/start': {
        scopes: [],
        fn: commandGetHelp,
    },
    '/act': {
        scopes: scopeFull,
        fn: commandActUndefined,
        needAuth: commandAuthCheck.shareModeGroup,
    },
    '/img': {
        scopes: scopeMod,
        fn: commandGenerateImg,
        needAuth: commandAuthCheck.shareModeGroup,
    },
    '/mod_env_set': {
        scopes: scopeMod,
        fn: commandUpdateUserConfig,
        needAuth: commandAuthCheck.shareModeGroup,
    },
    '/mod_env_set_batch': {
        scopes: scopeMod,
        fn: commandUpdateUserConfigs,
        needAuth: commandAuthCheck.shareModeGroup,
    },
    '/mod_env_del': {
        scopes: scopeMod,
        fn: commandDeleteUserConfig,
        needAuth: commandAuthCheck.shareModeGroup,
    },
    '/mod_env_del_all': {
        scopes: scopeMod,
        fn: commandClearUserConfig,
        needAuth: commandAuthCheck.shareModeGroup,
    },
    '/mod_system': {
        scopes: scopeMod,
        fn: commandSystem,
        needAuth: commandAuthCheck.default,
    },
};

const commandSortList = Object.keys(commandHandlers).filter((key)=>!['/start','/img'].includes(key)); //.sort((a, b) => a.length - b.length);

/* init dynamic commands */
function initDynamicCommands() {
    registerActCommands();
}

/* register /act_* commands */
function registerActCommands() {
    Object.keys(ENV.I18N.acts).forEach((act) => {
        commandHandlers[`/act_${act}`] = {
            scopes: scopeFull,
            fn: commandActWithLLM,
            needAuth: commandAuthCheck.shareModeGroup,
        };
        commandSortList.splice(1,0,`/act_${act}`);
    });
}

/**
 * /img 命令
 *
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandGenerateImg(message, command, subcommand, context) {
    if (subcommand === '')
        return msgTG(context)(ENV.I18N.command.help.img);

    const gen = loadImageGen(context)?.request;
    if (!gen) return msgTG(context)(`ERROR: Image generator not found`);

    setTimeout(() => sendChatActionToTelegramWithContext(context)('upload_photo').catch(console.error), 0);
    const img = await gen(subcommand, context);
    return sendPhotoToTelegramWithContext(context)(img);
}

/**
 * /help 获取帮助信息
 *
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandGetHelp(message, command, subcommand, context) {
    let helpSections = [
        ENV.I18N.command.help.summary,
        ...Object.keys(commandHandlers).map(key => `${key.replaceAll('_', `\\_`)}：${ENV.I18N.command.help[key.substring(1)] || ENV.I18N.acts[key.slice('/act_'.length)]?.name}`),
        ...Object.keys(CUSTOM_COMMAND)
            .filter(key => CUSTOM_COMMAND_DESCRIPTION[key])
            .map(key => `${key}：${CUSTOM_COMMAND_DESCRIPTION[key]}`)
    ];

    return msgTG(context)(helpSections.join('\n'));
}

/**
 * /act 获取动作列表
 *
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandActUndefined(message, command, subcommand, context) {
    context.CURRENT_CHAT_CONTEXT.reply_markup = '{"remove_keyboard":true,"selective":true}';
    const msgText=Object.keys(ENV.I18N.acts).map(key => `/act\\_${key}：${ENV.I18N.acts[key].name}`).join('\n');
    return msgTG(context)(msgText);
}

/**
 * /act_{action} 执行动作
 * 
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandActWithLLM(message, command, subcommand, context) {
    const _act = command.split('_').slice(1).join('_'); 
    const act = ENV.I18N.acts[_act];
    if (!act) return msgTG(context)(`ERROR: action not found`);

    let text = message.reply_to_message ? message.reply_to_message.text +'\n'+ subcommand.trim() : subcommand.trim();

    const extraCtx = context.SHARE_CONTEXT?.extraMessageContext;
    // /*debug*/ if(extraCtx)console.log(extraCtx);
    if (extraCtx?.doc) {
        text = `<Document>\n${extraCtx.doc}\n</Document>\n\n` + text;
    }
    if (extraCtx?.textInput) {
        text = extraCtx.textInput + '\n' + text;
    }
    
    return actWithLLM({message: text, prompt: act.prompt}, context);
}

/**
 * /mod_env_set 用户配置修改
 *
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandUpdateUserConfig(message, command, subcommand, context) {
    return _handleUserConfig(message, command, subcommand, context, 'update');
}

/**
 * /mod_env_set_batch 批量用户配置修改
 *
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandUpdateUserConfigs(message, command, subcommand, context) {
    return _handleUserConfig(message, command, subcommand, context, 'batchUpdate');
}

/**
 * /mod_env_del 用户配置单项删除
 *
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandDeleteUserConfig(message, command, subcommand, context) {
    _handleUserConfig(message, command, subcommand, context, 'delete');
}

/**
 * 处理用户配置的更新和删除
 * 
 * @param {TelegramMessage} message - 来自Telegram的消息对象
 * @param {string} command - 命令名称
 * @param {string} subcommand - 子命令字符串，可能包含要设置的配置键和值
 * @param {ContextType} context - 上下文对象，包含用户配置等信息
 * @param {string} operation - 操作类型，如 'update', 'batchUpdate' 或 'delete'
 * @return {Promise<Response>}
 */
async function _handleUserConfig(message, command, subcommand, context, operation) {
    let updates = [];

    if (operation === 'delete') {
        if (!Object.keys(context.USER_CONFIG).includes(subcommand)) {
            return msgTG(context)(`Key ${subcommand} not found`);
        }
        updates.push({ key: subcommand, value: null });
    } else if (['update', 'batchUpdate'].includes(operation)) {
        const entries = operation === 'update' ? [subcommand.split('=')] : Object.entries(JSON.parse(subcommand));
        for (const [k, v] of entries) {
            let key = ENV_KEY_MAPPER[k] || k;
            if (!Object.keys(context.USER_CONFIG).includes(key) || ENV.LOCK_USER_CONFIG_KEYS.includes(key))
                return msgTG(context)(`Key "${key}" not found or locked`);
            updates.push({ key, value: v });
        }
    }

    // for (const { key, value } of updates) {
    //     context.USER_CONFIG[key] = value;
    // }
    mergeEnvironment(context.USER_CONFIG, Object.fromEntries( updates.map( ({ key, value }) => [key, value] ) ) );

    context.USER_CONFIG.DEFINE_KEYS = updates.map(u => u.key).filter(k => context.USER_CONFIG[k] !== null);

    await DATABASE.put(
        context.SHARE_CONTEXT.configStoreKey,
        JSON.stringify(trimUserConfig(context.USER_CONFIG)),
    );

    const action = operation === 'delete' ? 'Deleted' : 'Updated';
    return msgTG(context)(`${action} user config successfully`);
}


/**
 * /mod_env_del_all 清空用户配置
 *
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandClearUserConfig(message, command, subcommand, context) {
    await DATABASE.put(
        context.SHARE_CONTEXT.configStoreKey,
        "{}",
    );
    return msgTG(context)('Clear user config success');
}


/**
 * /mod_system 获得系统信息
 *
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandSystem(message, command, subcommand, context) {
    let chatAgent = loadChatLLM(context);
    let imageAgent = loadImageGen(context);
    const agent = {
        AI_PROVIDER: chatAgent?.name,
        AI_IMAGE_PROVIDER: imageAgent?.name,
    };
    agent[chatAgent.modelKey] = currentChatModel(chatAgent?.name, context);
    agent[imageAgent.modelKey] = currentImageModel(imageAgent?.name, context);

    let msg = `AGENT: ${_pretty(agent)}\n`;
    if (ENV.DEV_MODE) {
        function redact(config){
            const redacted = {...config};
            for (const key in redacted) {
                if (/api|token|account|key/i.test(key)) config[key] = '******';
            }
            return redacted;
        };
        const shareCtx = {...context.SHARE_CONTEXT};
        shareCtx.currentBotToken = '******';

        msg += `<pre>\nUSER_CONFIG: ${_pretty(trimUserConfig(redact(context.USER_CONFIG)))}\n`;
        msg += `CHAT_CONTEXT: ${_pretty(context.CURRENT_CHAT_CONTEXT)}\n`;
        msg += `SHARE_CONTEXT: ${_pretty(shareCtx)}\n</pre>`;
    }
    context.CURRENT_CHAT_CONTEXT.parse_mode = 'HTML';
    return msgTG(context)(msg);
}


/**
 * /echo 回显消息
 *
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandEcho(message, command, subcommand, context) {
    var msg = `<pre>${_pretty({message})}</pre>`;
    context.CURRENT_CHAT_CONTEXT.parse_mode = 'HTML';
    return msgTG(context)(msg);
}

/**
 * 处理命令消息
 *
 * @param {TelegramMessage} message
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
export async function handleCommandMessage(message, context) {
    initDynamicCommands();

    // 如果是开发模式，添加 /echo 命令用于调试
    if (ENV.DEV_MODE)
        commandHandlers['/echo'] = { help: '[DEBUG ONLY] echo message', scopes: scopeMod, fn: commandEcho, needAuth: commandAuthCheck.default };

    // 检查是否有自定义 alias
    if (CUSTOM_COMMAND[message.text]) message.text = CUSTOM_COMMAND[message.text];

    // 查找匹配的命令
    const command = Object.keys(commandHandlers).find(key => message.text === key || message.text.startsWith(key + ' ') || message.text.startsWith(key + '@'));
    if (!command) return null;

    // 提取子命令, 执行命令函数
    const handler = commandHandlers[command];
    try {
        // 如果存在权限条件，进行权限验证
        if (handler.needAuth) {
            const roleList = handler.needAuth(context.SHARE_CONTEXT.chatType);
            if (roleList) {
                const chatRole = await getChatRoleWithContext(context)(context.SHARE_CONTEXT.speakerId);
                if (!chatRole) return msgTG(context)('ERROR: Get chat role failed');
                if (!roleList.includes(chatRole)) return msgTG(context)(`ERROR: Permission denied, need ${roleList.join(' or ')}`);
            }
        }
        /// Subcommand = message.text - command - mentionBotUsername
        const mentioned = context.SHARE_CONTEXT.extraMessageContext?.mentioned || await mentionBotUsername(message, context);
        // context.SHARE_CONTEXT.extraMessageContext.mentioned = mentioned;
        let subcommand = message.text.slice(command.length).trim();
        if (mentioned) {
            const botName = '@'+await getBotNameWithCtx(context);
            subcommand = subcommand.replaceAll(botName, '').trim();
        }
        
        /* unused *
        let cursor = command.length, subcommand="";
        for (const mention of mentions){
            subcommand += message.text.slice(cursor, mention[0]);
            cursor=mention[1];
        }
        subcommand += message.text.slice(cursor).trim();
        * /unused  */
        /*debug*/console.log(`command:${command};subcommand:${subcommand}`);
        return await handler.fn(message, command, subcommand, context);
    } catch (e) {
        return msgTG(context)(`ERROR: ${e.message}`);
    }
}

/**
 * 绑定命令到Telegram
 *
 * @param {string} token
 * @return {Promise<{result: {}, ok: boolean}>}
 */
export async function bindCommandForTelegram(token) {
    const scopeCommandMap = {
        all_private_chats: [],
        all_group_chats: [],
        all_chat_administrators: [],
    };

    // 初始化动态命令
    initDynamicCommands();

    // 填充 scopeCommandMap
    for (const key of commandSortList) {
        if (!ENV.HIDE_COMMAND_BUTTONS.includes(key) &&
            commandHandlers[key]?.scopes) {
            commandHandlers[key].scopes.forEach(scope => {
                scopeCommandMap[scope]?.push(key);
            });
        }
    }

    const result = {};
    // 发送命令到Telegram
    for (const scope in scopeCommandMap) {
        result[scope] = await fetch(
            `https://api.telegram.org/bot${token}/setMyCommands`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    commands: scopeCommandMap[scope].map(key => ({
                        command: key,
                        description: ENV.I18N.command.help[key.substring(1)] || ENV.I18N.acts[key.slice('/act_'.length)]?.name || "No description",
                    })),
                    scope: {type: scope},
                }),
            },
        ).then(res => res.json());
    }
    return {ok: true, result, scopeCommandMap: scopeCommandMap};
}

/**
 * 获取所有命令的描述 (Not Used)
 * @return {{description: *, command: *}[]}
 */
export function commandsDocument() {
    return Object.keys(commandHandlers).map((key) => {
        return {
            command: key,
            description: ENV.I18N.command.help[key.substring(1)] || ENV.I18N.acts[key.slice('/act_'.length)]?.name,
        };
    });
}

const _pretty=(o)=>JSON.stringify(o, null, 2);