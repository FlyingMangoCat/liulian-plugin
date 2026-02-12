import fetch from "node-fetch";
const _path = process.cwd();
let ing = {};
export const rule = {
    FuckingChatterbox: {
        reg: "^#*(话痨统计|话痨检测|水逼检测|水逼统计)$",
        priority: 60,
        describe: "寻找大水逼",
    },
};
export async function FuckingChatterbox(e) {
    if(ing[e.group_id]){
        e.reply("在找了，在找了，已经在找了，很慢，请再等等！\n");
        return true;
    }
    ing[e.group_id] = 1;
    e.reply("正在分析聊天记录，寻找本群大水逼，请等一等！\n");

    let CharHistory = await e.group.getChatHistory(0, 1);
    if (!CharHistory || CharHistory.length === 0) {
        e.reply("无法获取聊天记录，请稍后再试\n");
        ing[e.group_id] = 0;
        return true;
    }
    let seq = CharHistory[0]?.message_seq || 0;
    console.log(`初始 message_seq: ${seq}, message_id: ${CharHistory[0]?.message_id}`);

    // 第一阶段：快速扫描，估算消息数量（只收集seq，不统计）
    let scanSeq = seq;
    let scanProcessed = new Set([seq]);
    let finalScanSeq = seq; // 记录扫描停止时的seq
    console.log("第一阶段：快速扫描估算消息数量...");
    console.log(`初始 seq: ${seq}`);

    // 快速扫描：直接用第一条seq，不试错
    while (true) {
        console.log(`快速扫描 - 当前 scanSeq: ${scanSeq}`);
        let temp = null;
        try {
            temp = await e.group.getChatHistory(scanSeq, 20);
        } catch (err) {
            console.log(`getChatHistory(${scanSeq}, 20) 失败: ${err.message}`);
            break;
        }
        if (!temp || temp.length == 0) {
            console.log(`getChatHistory(${scanSeq}, 20) 返回空，快速扫描结束`);
            break;
        }
        console.log(`getChatHistory(${scanSeq}, 20) 返回: ${temp.length} 条消息`);
        let hasNew = false;
        for (const key in temp) {
            if (!temp[key] || Object.keys(temp[key]).length === 0) continue;
            let msgSeq = temp[key].message_seq;
            if (!msgSeq) continue;
            if (scanProcessed.has(msgSeq)) continue;
            scanProcessed.add(msgSeq);
            hasNew = true;
        }
        // 快速扫描：直接用第一条seq继续，不试错
        if (temp.length > 0 && temp[0]?.message_seq) {
            scanSeq = temp[0].message_seq;
            console.log(`使用第一条 seq: ${scanSeq}`);
        } else {
            console.log(`无法获取下一条 seq，快速扫描结束`);
            break;
        }
        console.log(`已处理总数: ${scanProcessed.size}`);
        if (!hasNew) break;
    }
    let estimatedMsgCount = scanProcessed.size;
    let estimatedTime = (estimatedMsgCount / 20 / 4 / 60).toFixed(2);
    e.reply(`大概有${estimatedMsgCount}条记录需要分析，预计需要${estimatedTime}分钟`);

    // 第二阶段：实际统计消息（使用快速扫描找到的seq）
    let CharList = {};
    let allcount = 0;
    let lastSeq = seq; // 从初始seq开始
    let processedSeqs = new Set();
    let loopCount = 0;

    console.log("第二阶段：开始实际统计...");
    while (true) {
        loopCount++;
        console.log(`循环第 ${loopCount} 次，lastSeq: ${lastSeq}`);
        let CharTemp = null;
        try {
            CharTemp = await e.group.getChatHistory(lastSeq, 20);
        } catch (err) {
            console.log(`getChatHistory(${lastSeq}, 20) 失败: ${err.message}`);
            break;
        }
        if (!CharTemp || CharTemp.length == 0) {
            console.log(`getChatHistory(${lastSeq}, 20) 返回空，统计结束`);
            break;
        }
        let hasNewData = false;
        let candidateSeqs = [];
        for (const key in CharTemp) {
            if (!CharTemp[key] || Object.keys(CharTemp[key]).length === 0) continue;
            let msgSeq = CharTemp[key].message_seq;
            if (!msgSeq) continue;
            candidateSeqs.push(msgSeq);
            if (processedSeqs.has(msgSeq)) continue;
            processedSeqs.add(msgSeq);
            hasNewData = true;
            allcount++;
            if (CharList[CharTemp[key].user_id]) {
                CharList[CharTemp[key].user_id].times += 1;
                CharList[CharTemp[key].user_id].uname = CharTemp[key].sender.card ? CharTemp[key].sender.card : CharTemp[key].sender.nickname;
            } else {
                CharList[CharTemp[key].user_id] = {
                    times: 1,
                    user_id: CharTemp[key].user_id,
                    uname: CharTemp[key].sender.card ? CharTemp[key].sender.card : CharTemp[key].sender.nickname
                };
            }
        }
        if (!hasNewData) {
            console.log(`本轮无新数据，统计结束`);
            break;
        }
        // 试错机制
        let nextSeqFound = false;
        for (let i = 0; i < candidateSeqs.length; i++) {
            try {
                let testResult = await e.group.getChatHistory(candidateSeqs[i], 1);
                if (testResult && testResult.length > 0) {
                    lastSeq = candidateSeqs[i];
                    nextSeqFound = true;
                    console.log(`试错成功：使用 seq ${lastSeq}`);
                    break;
                }
            } catch (err) {
                console.log(`试错失败：seq ${candidateSeqs[i]} 不可用`);
            }
        }
        if (!nextSeqFound) {
            console.log(`所有候选 seq 都不可用，统计结束`);
            break;
        }
    }
    console.log(`统计完成，共 ${allcount} 条消息`);

    let CharArray = [];
    for (const key in CharList) {
        CharArray.push(CharList[key]);
    }
    CharArray.sort((a, b) => {
        return b.times - a.times
    })
    console.log(CharArray);
    CharArray = CharArray.slice(0, 10);
    let res = `一共检测到聊天记录 ${allcount} 句话，其中：\n`;
    let itemp = 0;
    for (let v of CharArray) {
        res += (v.uname) + `  水了${v.times}句话，占比${(v.times/allcount*100).toFixed(2)}% `;
        if(!itemp){
            res += " （这人水是真滴多 ！）";
        }
        if(itemp != CharArray.length -1 ){
            res += "\n";
        }
        itemp++;
    }
    e.reply(res);
    ing[e.group_id] = 0;
    return true;
}
