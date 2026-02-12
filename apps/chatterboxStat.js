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

    // 一次性统计：边扫描边统计
    let CharList = {};
    let allcount = 0;
    let scanSeq = seq;
    let scanProcessed = new Set([seq]);
    let estimatedMsgCount = 0;
    let hasEstimated = false;

    console.log("开始扫描并统计消息...");
    console.log(`初始 seq: ${seq}`);

    while (true) {
        console.log(`当前 scanSeq: ${scanSeq}, 已处理: ${scanProcessed.size}`);
        let temp = null;
        try {
            temp = await e.group.getChatHistory(scanSeq, 20);
        } catch (err) {
            console.log(`getChatHistory(${scanSeq}, 20) 失败: ${err.message}`);
            break;
        }
        if (!temp || temp.length == 0) {
            console.log(`getChatHistory(${scanSeq}, 20) 返回空，扫描结束`);
            break;
        }
        console.log(`getChatHistory(${scanSeq}, 20) 返回: ${temp.length} 条消息`);
        let hasNew = false;
        let candidateSeqs = [];
        for (const key in temp) {
            if (!temp[key] || Object.keys(temp[key]).length === 0) continue;
            let msgSeq = temp[key].message_seq;
            if (!msgSeq) continue;
            candidateSeqs.push(msgSeq);
            if (scanProcessed.has(msgSeq)) continue;
            scanProcessed.add(msgSeq);
            hasNew = true;

            // 直接统计消息
            allcount++;
            if (CharList[temp[key].user_id]) {
                CharList[temp[key].user_id].times += 1;
                CharList[temp[key].user_id].uname = temp[key].sender.card ? temp[key].sender.card : temp[key].sender.nickname;
            } else {
                CharList[temp[key].user_id] = {
                    times: 1,
                    user_id: temp[key].user_id,
                    uname: temp[key].sender.card ? temp[key].sender.card : temp[key].sender.nickname
                };
            }
        }
        // 试错机制：从候选 seq 中逐个尝试
        let nextSeqFound = false;
        for (let i = 0; i < candidateSeqs.length; i++) {
            try {
                let testResult = await e.group.getChatHistory(candidateSeqs[i], 1);
                if (testResult && testResult.length > 0) {
                    scanSeq = candidateSeqs[i];
                    nextSeqFound = true;
                    console.log(`试错成功：使用 seq ${scanSeq}`);
                    break;
                }
            } catch (err) {
                console.log(`试错失败：seq ${candidateSeqs[i]} 不可用`);
            }
        }
        if (!nextSeqFound) {
            console.log(`所有候选 seq 都不可用，扫描结束`);
            break;
        }
        console.log(`已处理总数: ${scanProcessed.size}, 已统计: ${allcount}`);
        if (!hasNew) break;

        // 在处理到500条时发一次预估
        if (!hasEstimated && scanProcessed.size >= 500) {
            estimatedMsgCount = scanProcessed.size;
            let estimatedTime = (estimatedMsgCount / 20 / 4 / 60).toFixed(2);
            e.reply(`已扫描${estimatedMsgCount}条，预计需要${estimatedTime}分钟`);
            hasEstimated = true;
        }
    }
    console.log(`扫描完成，共统计 ${allcount} 条消息`);

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