import '../types/i18n.js';
import '../types/context.js';

/**
 * @class
 * @implements {UserConfigType}
 */
export class UserConfig {
    // -- 非配置属性 --
    DEFINE_KEYS = [];

    // -- 通用配置 --
    //
    // AI提供商: auto, openai, azure, workers, gemini
    AI_PROVIDER = 'auto';
    // AI图片提供商: disabled
    // 全局默认初始化消息
    SYSTEM_INIT_MESSAGE = null;
    // 全局默认初始化消息角色
    SYSTEM_INIT_MESSAGE_ROLE = 'system';
    // 自定义动作
    MY_ACTIONS = {};

    // -- Open AI 配置 --
    //
    // OpenAI API Key
    OPENAI_API_KEY = [];
    // OpenAI的模型名称
    OPENAI_CHAT_MODEL = 'gpt-3.5-turbo';
    // OpenAI API BASE ``
    OPENAI_API_BASE = 'https://api.openai.com/v1';
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
    WORKERS_CHAT_MODEL = '@cf/mistral/mistral-7b-instruct-v0.1 ';
    // Text-to-Image Model disabled
}


class Environment {

    // -- 版本数据 --
    //
    // 当前版本
    BUILD_TIMESTAMP = process?.env?.BUILD_TIMESTAMP || 0;
    // 当前版本 commit id
    BUILD_VERSION = process?.env?.BUILD_VERSION || '';


    // -- 基础配置 --
    /**
     * @type {I18n | null}
     */
    I18N = null;
    // 多语言支持
    LANGUAGE = 'zh-cn';
    // 检查更新的分支
    UPDATE_BRANCH = 'master';
    // Chat Complete API Timeout
    CHAT_COMPLETE_API_TIMEOUT = 0;

    // -- Telegram 相关 --
    //
    // Telegram API Domain
    TELEGRAM_API_DOMAIN = 'https://api.telegram.org';
    // 允许访问的Telegram Token， 设置时以逗号分隔
    TELEGRAM_AVAILABLE_TOKENS = [];
    // 默认消息模式
    DEFAULT_PARSE_MODE = 'Markdown';
    // 最小stream模式消息间隔，小于等于0则不限制
    TELEGRAM_MIN_STREAM_INTERVAL = 0;

    // --  权限相关 --
    //
    // 允许所有人使用
    I_AM_A_GENEROUS_PERSON = false;
    // 白名单
    CHAT_WHITE_LIST = [];
    // 用户配置
    LOCK_USER_CONFIG_KEYS = [
        // 默认为API BASE 防止被替换导致token 泄露
        'OPENAI_API_BASE',
        'GOOGLE_COMPLETIONS_API',
        'AZURE_COMPLETIONS_API',
        // 'AZURE_DALLE_API',
    ];

    // -- 群组相关 --
    //
    // 允许访问的Telegram Token 对应的Bot Name， 设置时以逗号分隔
    TELEGRAM_BOT_NAME = [];
    // 群组白名单
    CHAT_GROUP_WHITE_LIST = [];
    // 群组机器人开关
    GROUP_CHAT_BOT_ENABLE = true;
    // 群组机器人共享模式,关闭后，一个群组只有一个会话和配置。开启的话群组的每个人都有自己的会话上下文
    GROUP_CHAT_BOT_SHARE_MODE = false;

    // -- 历史记录相关 --
    //
    // 为了避免4096字符限制，将消息删减
    AUTO_TRIM_HISTORY = true;
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
    STREAM_MODE = true;
    // 安全模式
    SAFE_MODE = true;
    // 调试模式
    DEBUG_MODE = false;
    // 开发模式
    DEV_MODE = false;

    USER_CONFIG = new UserConfig();
}


// Environment Variables: Separate configuration values from a Worker script with Environment Variables.
export const ENV = new Environment();
// KV Namespace Bindings: Bind an instance of a KV Namespace to access its data in a Worker
export let DATABASE = null;

export const CUSTOM_COMMAND = {};
export const CUSTOM_COMMAND_DESCRIPTION = {};

export const CONST = {
    GROUP_TYPES: ['group', 'supergroup'],
};

const ENV_TYPES = {
    SYSTEM_INIT_MESSAGE: 'string',
    AZURE_API_KEY: 'string',
    AZURE_COMPLETIONS_API: 'string',
    AZURE_DALLE_API: 'string',
    CLOUDFLARE_ACCOUNT_ID: 'string',
    CLOUDFLARE_TOKEN: 'string',
    GOOGLE_API_KEY: 'string',
};

export function mergeEnvironment(target, source) {
    for (const key of Object.keys(target)) {
        // 只合并两边都有的
        if (!Object.hasOwn(source,key)) continue;
        
        let t = ENV_TYPES[key] || Array.isArray(target[key]) ? 'array' : typeof target[key];
        const v = source[key];
        // 不是字符串直接赋值
        if (t==='string' || typeof v !== 'string') {
            target[key] = v;
            continue;
        }
        switch (t) {
            case 'number':
                target[key] = parseInt(v, 10);
                break;
            case 'boolean':
                target[key] = (v || 'false') === 'true';
                break;
            case 'array':
                try {
                    target[key] = v.startsWith('[') ? JSON.parse(v): v.split(',');
                } catch {
                    target[key] = v.split(',');
                }
                break;
            case 'object':
                try {
                    // target[key] = JSON.parse(v);
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


/**
 * @param {object} env
 * @param {I18nGenerator} i18n
 */
export function initEnv(env, i18n) {

    // 全局对象
    DATABASE = env.DATABASE;

    // 绑定自定义命令
    const customCommandPrefix = 'CUSTOM_COMMAND_';
    const customCommandDescriptionPrefix = 'COMMAND_DESCRIPTION_';
    for (const key of Object.keys(env)) {
        if (key.startsWith(customCommandPrefix)) {
            const cmd = key.substring(customCommandPrefix.length);
            CUSTOM_COMMAND['/' + cmd] = env[key];
            CUSTOM_COMMAND_DESCRIPTION['/' + cmd] = env[customCommandDescriptionPrefix + cmd];
        }
    }

    // 合并环境变量
    mergeEnvironment(ENV, env);
    mergeEnvironment(ENV.USER_CONFIG, env);
    ENV.USER_CONFIG.DEFINE_KEYS = [];
    ENV.I18N = i18n((ENV.LANGUAGE || 'en').toLowerCase());
    ENV.USER_CONFIG.SYSTEM_INIT_MESSAGE ||= ENV.I18N?.env?.system_init_message || 'You are a helpful assistant';
}
