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
    sendMessageToTelegramWithContext,
    sendPhotoToTelegramWithContext,
} from './telegram.js';
import {actWithLLM} from '../agent/llm.js';
import {
    chatModelKey,
    currentChatModel,
    currentImageModel,
    imageModelKey,
    loadChatLLM,
    loadImageGen
} from "../agent/agents.js";
import {trimUserConfig} from "../config/context.js";


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


const commandSortList = [
    '/act',
    '/img',
    '/setenv',
    '/delenv',
    '/system',
    '/help',
];

/*
scopes: ['all_private_chats', 'all_group_chats', 'all_chat_administrators'],
fn: commandCreateNewChatContext,
needAuth: commandAuthCheck.default 需要群管权限, commandAuthCheck.shareModeGroup, 每个人在群里有上下文的时候，不限制; 但是在群里没有shared上下文的时候，需要管理员权限
*/ 

// 命令绑定
const commandHandlers = {
    '/help': {
        scopes: ['all_private_chats', 'all_chat_administrators'],
        fn: commandGetHelp,
    },
    '/start': {
        scopes: [],
        fn: commandGetHelp,
    },
    '/act': {
        scopes: ['all_private_chats', 'all_group_chats'],
        fn: commandActUndefined,
        needAuth: commandAuthCheck.shareModeGroup,
    },
    '/img': {
        scopes: ['all_private_chats', 'all_chat_administrators'],
        fn: commandGenerateImg,
        needAuth: commandAuthCheck.shareModeGroup,
    },
    '/setenv': {
        scopes: [],
        fn: commandUpdateUserConfig,
        needAuth: commandAuthCheck.shareModeGroup,
    },
    '/setenvs': {
        scopes: [],
        fn: commandUpdateUserConfigs,
        needAuth: commandAuthCheck.shareModeGroup,
    },
    '/delenv': {
        scopes: [],
        fn: commandDeleteUserConfig,
        needAuth: commandAuthCheck.shareModeGroup,
    },
    '/clearenv': {
        scopes: [],
        fn: commandClearUserConfig,
        needAuth: commandAuthCheck.shareModeGroup,
    },
    '/system': {
        scopes: ['all_private_chats', 'all_chat_administrators'],
        fn: commandSystem,
        needAuth: commandAuthCheck.default,
    },
};

/* init dynamic commands */
function initDynamicCommands() {
    registerActCommands();
}

/* register /act_* commands */
function registerActCommands() {
    Object.keys(ENV.I18N.acts).forEach((act) => {
        commandHandlers[`/act_${act}`] = {
            scopes: ['all_private_chats', 'all_group_chats'],
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
    if (subcommand === '') {
        return sendMessageToTelegramWithContext(context)(ENV.I18N.command.help.img);
    }
    try {
        const gen = loadImageGen(context)?.request;
        if (!gen) {
            return sendMessageToTelegramWithContext(context)(`ERROR: Image generator not found`);
        }
        setTimeout(() => sendChatActionToTelegramWithContext(context)('upload_photo').catch(console.error), 0);
        const img = await gen(subcommand, context);
        return sendPhotoToTelegramWithContext(context)(img);
    } catch (e) {
        return sendMessageToTelegramWithContext(context)(`ERROR: ${e.message}`);
    }
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
        ...Object.keys(commandHandlers).map(key => `${key}：${ENV.I18N.command.help[key.substring(1)]}`),
        ...Object.keys(CUSTOM_COMMAND)
            .filter(key => CUSTOM_COMMAND_DESCRIPTION[key])
            .map(key => `${key}：${CUSTOM_COMMAND_DESCRIPTION[key]}`)
    ];

    context.CURRENT_CHAT_CONTEXT.parse_mode = null;
    return sendMessageToTelegramWithContext(context)(helpSections.join('\n'));
}

/**
 * /act 新的动作
 *
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandActUndefined(message, command, subcommand, context) {
    try {
        context.CURRENT_CHAT_CONTEXT.reply_markup = JSON.stringify({
            remove_keyboard: true,
            selective: true,
        });
        if (command === '/act') {
            return sendMessageToTelegramWithContext(context)(ENV.I18N.command.new.act);
        } else {
            return sendMessageToTelegramWithContext(context)(`${ENV.I18N.command.new.act}(${context.CURRENT_CHAT_CONTEXT.chat_id})`);
        }
    } catch (e) {
        return sendMessageToTelegramWithContext(context)(`ERROR: ${e.message}`);
    }
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
    if (!act) {
        return sendMessageToTelegramWithContext(context)(`ERROR: action not found`);
    }
    let text = message.reply_to_message ? message.reply_to_message.text : subcommand.trim();
    /* insert EXTRA_MESSAGE_CONTEXT if exists */
    if (ENV.EXTRA_MESSAGE_CONTEXT && context.SHARE_CONTEXT?.extraMessageContext?.text) {
        text = context.SHARE_CONTEXT.extraMessageContext.text + '\n' + text;
    }
    console.log("Act with LLM: ", act, text);
    return actWithLLM({message: text, prompt: act.prompt}, context);
}



/**
 * /setenv 用户配置修改
 *
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandUpdateUserConfig(message, command, subcommand, context) {
    let [key, value] = subcommand.split('=');
    if (!value) return sendMessageToTelegramWithContext(context)(ENV.I18N.command.help.setenv);
    key = ENV_KEY_MAPPER[key] || key;
    if (ENV.LOCK_USER_CONFIG_KEYS.includes(key)) {
        return sendMessageToTelegramWithContext(context)(`Key ${key} is locked`);
    }
    if (!Object.keys(context.USER_CONFIG).includes(key)) {
        return sendMessageToTelegramWithContext(context)(`Key ${key} not found`);
    }
    try {
        context.USER_CONFIG.DEFINE_KEYS = [...new Set([...context.USER_CONFIG.DEFINE_KEYS, key])];
        mergeEnvironment(context.USER_CONFIG, {[key]: value});
        console.log("Update user config: ", key, context.USER_CONFIG[key]);
        await DATABASE.put(
            context.SHARE_CONTEXT.configStoreKey,
            JSON.stringify(trimUserConfig(context.USER_CONFIG)),
        );
        return sendMessageToTelegramWithContext(context)('Update user config success');
    } catch (e) {
        return sendMessageToTelegramWithContext(context)(`ERROR: ${e.message}`);
    }
}

/**
 * /setenvs 批量用户配置修改
 *
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandUpdateUserConfigs(message, command, subcommand, context) {
    try {
        const values = JSON.parse(subcommand);
        const configKeys = new Set(Object.keys(context.USER_CONFIG));
        for (const ent of Object.entries(values)) {
            let [key, value] = ent;
            key = ENV_KEY_MAPPER[key] || key;
            if (ENV.LOCK_USER_CONFIG_KEYS.includes(key)) {
                return sendMessageToTelegramWithContext(context)(`Key ${key} is locked`);
            }
            if (!configKeys.has(key)) {
                return sendMessageToTelegramWithContext(context)(`Key ${key} not found`);
            }
            context.USER_CONFIG.DEFINE_KEYS.push(key);
            mergeEnvironment(context.USER_CONFIG, {[key]: value});
            console.log("Update user config: ", key, context.USER_CONFIG[key]);
        }
        context.USER_CONFIG.DEFINE_KEYS = Array.from(new Set(context.USER_CONFIG.DEFINE_KEYS));
        await DATABASE.put(
            context.SHARE_CONTEXT.configStoreKey,
            JSON.stringify(trimUserConfig(context.USER_CONFIG)),
        );
        return sendMessageToTelegramWithContext(context)('Update user config success');
    } catch (e) {
        return sendMessageToTelegramWithContext(context)(`ERROR: ${e.message}`);
    }
}

/**
 * /delenv 用户配置修改
 *
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandDeleteUserConfig(message, command, subcommand, context) {
    if (ENV.LOCK_USER_CONFIG_KEYS.includes(subcommand)) {
        const msg = `Key ${subcommand} is locked`;
        return sendMessageToTelegramWithContext(context)(msg);
    }
    try {
        context.USER_CONFIG[subcommand] = null;
        context.USER_CONFIG.DEFINE_KEYS = context.USER_CONFIG.DEFINE_KEYS.filter((key) => key !== subcommand);
        await DATABASE.put(
            context.SHARE_CONTEXT.configStoreKey,
            JSON.stringify(trimUserConfig(context.USER_CONFIG)),
        );
        return sendMessageToTelegramWithContext(context)('Delete user config success');
    } catch (e) {
        return sendMessageToTelegramWithContext(context)(`ERROR: ${e.message}`);
    }
}


/**
 * /clearenv 清空用户配置
 *
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandClearUserConfig(message, command, subcommand, context) {
    try {
        await DATABASE.put(
            context.SHARE_CONTEXT.configStoreKey,
            JSON.stringify({}),
        );
        return sendMessageToTelegramWithContext(context)('Clear user config success');
    } catch (e) {
        return sendMessageToTelegramWithContext(context)(`ERROR: ${e.message}`);
    }
}


/**
 * /system 获得系统信息
 *
 * @param {TelegramMessage} message
 * @param {string} command
 * @param {string} subcommand
 * @param {ContextType} context
 * @return {Promise<Response>}
 */
async function commandSystem(message, command, subcommand, context) {
    let chatAgent = loadChatLLM(context)?.name;
    let imageAgent = loadImageGen(context)?.name;
    const agent = {
        AI_PROVIDER: chatAgent,
        AI_IMAGE_PROVIDER: imageAgent,
    };
    if (chatModelKey(chatAgent)) {
        agent[chatModelKey(chatAgent)] = currentChatModel(chatAgent, context);
    }
    if (imageModelKey(imageAgent)) {
        agent[imageModelKey(imageAgent)] = currentImageModel(imageAgent, context);
    }
    let msg = `AGENT: ${JSON.stringify(agent, null, 2)}\n`;
    if (ENV.DEV_MODE) {
        const shareCtx = {...context.SHARE_CONTEXT};
        const redactKeys = (config) => {
            const redactedConfig = {...config};
            for (const key in redactedConfig) {
                if (/api|token|account|key/i.test(key)) {
                    redactedConfig[key] = '******';
                }
            }
            return redactedConfig;
        };
        shareCtx.currentBotToken = '******';
        const redactedUserConfig = redactKeys(context.USER_CONFIG);
    
        const config = trimUserConfig(redactedUserConfig);
        msg = `<pre>\nUSER_CONFIG: ${JSON.stringify(config, null, 2)}\n`;
        msg += `CHAT_CONTEXT: ${JSON.stringify(context.CURRENT_CHAT_CONTEXT, null, 2)}\n`;
        msg += `SHARE_CONTEXT: ${JSON.stringify(shareCtx, null, 2)}\n</pre>`;
    }
    context.CURRENT_CHAT_CONTEXT.parse_mode = 'HTML';
    return sendMessageToTelegramWithContext(context)(msg);
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
    var msg = `<pre>${JSON.stringify({message}, null, 2)}</pre>`;
    context.CURRENT_CHAT_CONTEXT.parse_mode = 'HTML';
    return sendMessageToTelegramWithContext(context)(msg);
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
    if (ENV.DEV_MODE) {
        commandHandlers['/echo'] = {
            help: '[DEBUG ONLY] echo message',
            scopes: ['all_private_chats', 'all_chat_administrators'],
            fn: commandEcho,
            needAuth: commandAuthCheck.default,
        };
    }

    // 检查是否有自定义命令
    if (CUSTOM_COMMAND[message.text]) {
        message.text = CUSTOM_COMMAND[message.text];
    }

    // 查找匹配的命令
    const command = Object.keys(commandHandlers).find(key => 
        message.text === key || message.text.startsWith(key + ' ')
    );

    if (command) {
        const handler = commandHandlers[command];
        try {
            // 如果存在权限条件，进行权限验证
            if (handler.needAuth) {
                const roleList = handler.needAuth(context.SHARE_CONTEXT.chatType);
                if (roleList) {
                    const chatRole = await getChatRoleWithContext(context)(context.SHARE_CONTEXT.speakerId);
                    if (!chatRole) {
                        return sendMessageToTelegramWithContext(context)('ERROR: Get chat role failed');
                    }
                    if (!roleList.includes(chatRole)) {
                        return sendMessageToTelegramWithContext(context)(`ERROR: Permission denied, need ${roleList.join(' or ')}`);
                    }
                }
            }
            // 提取子命令并执行
            const subcommand = message.text.slice(command.length).trim();
            return await handler.fn(message, command, subcommand, context);
        } catch (e) {
            return sendMessageToTelegramWithContext(context)(`ERROR: ${e.message}`);
        }
    }
    return null;
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
            `https://api.telegram.org/bot${token}/setMyCommands`,
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    commands: scopeCommandMap[scope].map(command => ({
                        command,
                        description: ENV.I18N.command.help[command.substring(1)] || ENV.I18N.acts[command.slice('/act_'.length)].name,
                    })),
                    scope: {type: scope},
                }),
            },
        ).then(res => res.json());
    }
    return {ok: true, result, scopeCommandMap: JSON.stringify(scopeCommandMap)};
}

/**
 * 获取所有命令的描述
 * @return {{description: *, command: *}[]}
 */
export function commandsDocument() {
    return Object.keys(commandHandlers).map((key) => {
        return {
            command: key,
            description: ENV.I18N.command.help[key.substring(1)] || ENV.I18N.acts[key.slice('/act_'.length)].name,
        };
    });
}
