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
    const modelKey = chatLlmAgents.find(a => a.name === agentName)?.modelKey;
    const modelVal = context.USER_CONFIG[modelKey];
    switch (agentName) {
        case "azure":
            return _azApiToModelName(modelVal);
        case "openai":
        case "workers":
        case "gemini":
            return modelVal;
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
    const modelKey = imageGenAgents.find(a => a.name === agentName)?.modelKey;
    const modelVal = context.USER_CONFIG[modelKey];
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


function _azApiToModelName(AZURE_API){
    try {
        return new URL(AZURE_API).pathname.split("/")[3];
    } catch {
        return AZURE_API;
    }
};