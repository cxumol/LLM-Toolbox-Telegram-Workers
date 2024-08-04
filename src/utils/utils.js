/**
 * @param {number} length
 * @return {string}
 */
export function randomString(length) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

/**
 * @param {string} body
 * @return {string}
 */
export function renderHTML(body) {
    return `${body}`;
}

/**
 * @param {Error} e
 * @return {string}
 */
export function errorToString(e) {
    return JSON.stringify({
        message: e.message,
        stack: e.stack,
    });
}


/**
 *
 * @param {Response} resp
 * @return {Response}
 */
export async function makeResponse200(resp) {
    if (resp === null) {
        return new Response('NOT HANDLED', {status: 200});
    }
    if (resp.status === 200) {
        return resp;
    } else {
        // 如果返回4xx，5xx，Telegram会重试这个消息，后续消息就不会到达，所有webhook的错误都返回200
        return new Response(resp.body, {
            status: 200,
            headers: {
                'Original-Status': resp.status,
                ...resp.headers,
            }
        });
    }
}

