const proxy={
    "jina":"https://r.jina.ai/",
    // "md": ["https://urltomarkdown.herokuapp.com/?title=true&url=",], // <doc="https://github.com/macsplit/urltomarkdown" fofa='body="Please specify a valid url query parameter"'/>
    // "ft":  "https://12ft.io/?proxy?q=", 
    "twitter":"https://fixupx.com", // <doc="github.com/FixTweet/FxTwitter"/>
    "medium":"https://r.jina.ai/https://www.smry.ai/proxy?url=",
};

const sites = {
    "twitterEvil" : ["twitter.com", "x.com", "mobile.twitter.com", "mobile.x.com", "vxtwitter.com", "fixvx.com"], // vx 比 fx 多了赞转
    "linkPreview" : ["fxtwitter.com", "fixupx.com", "twittpr.com", "fixvx.com"],
    "medium" : ["medium.com", "towardsdatascience.com","betterprogramming.pub","uxdesign.cc","thebolditalic.com","betterhumans.pub",
        "levelup.gitconnected.com","writingcooperative.com","blog.prototypr.io","ehandbook.com","hackernoon.com"],
};


/**
 * 
 * @param {string} link
 * @returns {Promise<string>}
 */
export async function retrieveUrlTxt(link){
    /*debug*/console.log(link);
    const url = new URL(link);
    if(sites["twitterEvil"].includes(url.hostname)){
        return await twitterGrab(url);
    }else if(sites["linkPreview"].some(host=>url.hostname.endsWith(host))){
        const html = await fetch(link).then(r=>r.text());
        return _linkpreviewParser(html);
    }else if(sites["medium"].some(host=>url.hostname.endsWith(host))){
        return await mediumGrab(url);
    }
    // no need `else` cuz each condition has return
    return await fetch(proxy["jina"]+ link).then(r=>r.text());
}

/**
 * 
 * @param {URL} url 
 * @returns {Promise<string>}
 */
async function mediumGrab(url){
    const newlink = proxy["medium"] + encodeURIComponent(url.origin + url.pathname);
    let txt = await fetch(newlink).then(r=>r.text());
    txt = txt.slice(txt.indexOf('smry · '));
    return txt.slice(txt.indexOf('\n')+1).trim();
}

/**
 * 
 * @param {URL} url 
 * @returns {Promise<string>}
 */
async function twitterGrab(url){
    const newlink = proxy["twitter"] + url.pathname;
    const html = await fetch(newlink,{ headers:{'User-Agent':'facebookexternalhit/1.1'} }).then(r => r.text());
    return _linkpreviewParser(html);
}

/**
 * 
 * str -> str
 */
const _linkpreviewParser=html=> Array.from(
    html.matchAll(/<meta\s+(?:name|property)="(?:og:description|description)"\s+content="([^"]+)"[^>]*>/gi))
    .map(match => match[1])
    .reduce((long, cur) => cur.length > long.length ? cur : long, "");


