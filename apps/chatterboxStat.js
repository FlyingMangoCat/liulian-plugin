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
        e.reply("在找了，在找了，已经在找了，很慢，请再等等！");
        return true;
    }
    ing[e.group_id] = 1;
    e.reply("正在分析聊天记录，寻找本群大水逼，请等一等！");

    let CharHistory = await e.group.getChatHistory(0, 1);
    if (!CharHistory || CharHistory.length === 0) {
        e.reply("无法获取聊天记录，请稍后再试");
        ing[e.group_id] = 0;
        return true;
    }
    let seq = CharHistory[0]?.message_seq || 0;
    console.log(`初始 message_seq: ${seq}, message_id: ${CharHistory[0]?.message_id}`);

    // 快速扫描，估算消息数量
    let scanSeq = seq;
    let scanProcessed = new Set([seq]);
    console.log("开始快速扫描估算消息数量...");
    console.log(`初始 seq: ${seq}`);
    
    // 先测试不传参数，看看能否获取历史消息
    let testNoParam = await e.group.getChatHistory();
    console.log(`getChatHistory() 不传参数返回: ${testNoParam ? testNoParam.length : 0} 条`);
    if (testNoParam && testNoParam.length > 0) {
        console.log(`第一条消息 message_id: ${testNoParam[0].message_id}, message_seq: ${testNoParam[0].message_seq}`);
        if (testNoParam.length > 1) {
            console.log(`最后一条消息 message_id: ${testNoParam[testNoParam.length-1].message_id}, message_seq: ${testNoParam[testNoParam.length-1].message_seq}`);
        }
    }
    
    while (true) {
        console.log(`快速扫描 - 当前 scanSeq: ${scanSeq}`);
        let temp = await e.group.getChatHistory(scanSeq, 20);
        console.log(`getChatHistory(${scanSeq}, 20) 返回: ${temp ? temp.length : 0} 条消息`);
        if (!temp || temp.length == 0) break;
        let hasNew = false;
        let currentBatchSeqs = [];
        for (const key in temp) {
            if (!temp[key] || Object.keys(temp[key]).length === 0) continue;
            let msgSeq = temp[key].message_seq;
            // 跳过 message_seq 为 null 的消息
            if (!msgSeq) continue;
            currentBatchSeqs.push(msgSeq);
            if (scanProcessed.has(msgSeq)) continue;
            scanProcessed.add(msgSeq);
            hasNew = true;
        }
        let firstSeq = null;
        for (const key in temp) {
            if (!temp[key] || Object.keys(temp[key]).length === 0) continue;
            let msgSeq = temp[key].message_seq;
            // 跳过 message_seq 为 null 的消息
            if (!msgSeq) continue;
            currentBatchSeqs.push(msgSeq);
            if (scanProcessed.has(msgSeq)) continue;
            scanProcessed.add(msgSeq);
            hasNew = true;
            // 记录第一条有效消息的 seq
            if (firstSeq === null) firstSeq = msgSeq;
        }
        // 用第一条消息的 seq 作为下一次的参数（最早的）
        if (firstSeq !== null) {
            scanSeq = firstSeq;
        }
        console.log(`本批次 message_seq 列表: ${currentBatchSeq.join(', ')}`);
        console.log(`hasNew: ${hasNew}, 新 scanSeq: ${scanSeq}, 已处理总数: ${scanProcessed.size}`);
        if (!hasNew) break;
    }
    let estimatedMsgCount = scanProcessed.size;
    let estimatedTime = (estimatedMsgCount / 20 / 4 / 60).toFixed(2);
    e.reply(`大概有${estimatedMsgCount}条记录需要分析，预计需要${estimatedTime}分钟`);

    let CharList = {};
    let allcount = 0;
    let lastSeq = seq;
    let processedSeqs = new Set([seq]);
    let loopCount = 0;

    while (true) {
        loopCount++;
        console.log(`循环第 ${loopCount} 次，lastSeq: ${lastSeq}, 已处理 seq 数量: ${processedSeqs.size}`);
        let CharTemp = await e.group.getChatHistory(lastSeq, 20);
        if (!CharTemp || CharTemp.length == 0) {
            break;
        }
        let hasNewData = false;
        let minSeq = lastSeq;

        for (const key in CharTemp) {
            if (!CharTemp[key] || Object.keys(CharTemp[key]).length === 0) {
                continue;
            }
            let msgSeq = CharTemp[key].message_seq;

            if (processedSeqs.has(msgSeq)) {
                continue;
            }
            processedSeqs.add(msgSeq);
            hasNewData = true;
            allcount ++;
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
            if (msgSeq && msgSeq < minSeq) {
                minSeq = msgSeq;
            }
        }
        if (!hasNewData) {
            break;
        }
        lastSeq = minSeq;
    }
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