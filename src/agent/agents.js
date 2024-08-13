import {isOpenAIEnable, requestCompletionsFromOpenAI, requestImageFromOpenAI} from "./openai.js";
import {isWorkersAIEnable, requestCompletionsFromWorkersAI, requestImageFromWorkersAI} from "./workersai.js";
import {isGeminiAIEnable, requestCompletionsFromGeminiAI} from "./gemini.js";
import {
    isAzureEnable,
    isAzureImageEnable,
    requestCompletionsFromAzureOpenAI,
    requestImageFromAzureOpenAI
} from "./azure.js";
import "../types/context.js";
import "../types/agent.js";


/**
 * @type {ChatAgent[]}
 */
export const chatLlmAgents = [
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
    },
    {
        name: "gemini",
        enable: isGeminiAIEnable,
        request: requestCompletionsFromGeminiAI,
        modelKey: "GOOGLE_COMPLETIONS_MODEL"
    },
];

/**
 * @param {string} agentName
 * @param {ContextType} context
 * @returns {null|string}
 */
export function currentChatModel(agentName, context) {
    switch (agentName) {
        case "azure":
            try {
                const url = new URL(context.USER_CONFIG.AZURE_COMPLETIONS_API);
                return url.pathname.split("/")[3];
            } catch  {
                return context.USER_CONFIG.AZURE_COMPLETIONS_API;
            }
        case "openai":
            return context.USER_CONFIG.OPENAI_CHAT_MODEL;
        case "workers":
            return context.USER_CONFIG.WORKERS_CHAT_MODEL;
        case "gemini":
            return context.USER_CONFIG.GOOGLE_COMPLETIONS_MODEL;
        default:
            return null;
    }
}


/**
 * 加载聊天AI
 *
 * @param {ContextType} context
 * @return {ChatAgent | null}
 */
export function loadChatLLM(context) {
    return chatLlmAgents.find(llm => llm.name === context.USER_CONFIG.AI_PROVIDER) || chatLlmAgents.find(llm => llm.enable(context)) || null;
}


/**
 *
 * @typedef {function} ImageAgentRequest
 * @param {string} prompt
 * @param {ContextType} context
 */
/**
 * @typedef {object} ImageAgent
 * @property {string} name
 * @property {function} enable
 * @property {ImageAgentRequest} request
 */
/**
 * @type {ImageAgent[]}
 */
export const imageGenAgents = [
    {
        name: "azure",
        enable: isAzureImageEnable,
        request: requestImageFromAzureOpenAI,
        modelKey: "AZURE_DALLE_API"
    },
    {
        name: "openai",
        enable: isOpenAIEnable,
        request: requestImageFromOpenAI,
        modelKey: "DALL_E_MODEL"
    },
    {
        name: "workers",
        enable: isWorkersAIEnable,
        request: requestImageFromWorkersAI,
        modelKey: "WORKERS_IMAGE_MODEL"
    }
];


/**
 * 加载图片AI
 *
 * @param {ContextType} context
 * @return {ImageAgent | null}
 */
export function loadImageGen(context) {
    // 如果没有指定 AI_IMAGE_PROVIDER，则找到第一个可用的AI
    return imageGenAgents.find(imgGen => imgGen.name === context.USER_CONFIG.AI_IMAGE_PROVIDER) || imageGenAgents.find(imgGen => imgGen.enable(context)) || null;
}

/**
 * @param {string} agentName
 * @param {ContextType} context
 * @returns {null|string}
 */
export function currentImageModel(agentName, context) {
    switch (agentName) {
        case "azure":
            try {
                const url = new URL(context.USER_CONFIG.AZURE_DALLE_API);
                return url.pathname.split("/")[3];
            } catch  {
                return context.USER_CONFIG.AZURE_DALLE_API;
            }
        case "openai":
            return context.USER_CONFIG.DALL_E_MODEL;
        case "workers":
            return context.USER_CONFIG.WORKERS_IMAGE_MODEL;
        default:
            return null;
    }
}


