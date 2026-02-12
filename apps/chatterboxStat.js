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

    // 两个并行任务：快速预估 + 实际统计
    let quickEstimatePromise = (async () => {
        let scanSeq = seq;
        let scanProcessed = new Set([seq]);
        console.log("快速预估开始...");

        while (true) {
            let temp = null;
            try {
                temp = await e.group.getChatHistory(scanSeq, 20);
            } catch (err) {
                console.log(`快速预估失败: ${err.message}`);
                break;
            }
            if (!temp || temp.length == 0) break;

            for (const key in temp) {
                if (!temp[key] || Object.keys(temp[key]).length === 0) continue;
                let msgSeq = temp[key].message_seq;
                if (!msgSeq) continue;
                if (scanProcessed.has(msgSeq)) continue;
                scanProcessed.add(msgSeq);
            }

            // 快速预估：直接用第一条seq，不试错
            if (temp.length > 0 && temp[0]?.message_seq) {
                scanSeq = temp[0].message_seq;
            } else {
                break;
            }

            // 快速预估扫描10000条
            if (scanProcessed.size >= 10000) {
                console.log(`快速预估完成，扫描了${scanProcessed.size}条`);
                break;
            }
        }
        return scanProcessed.size;
    })();

    let actualStatPromise = (async () => {
        let CharList = {};
        let allcount = 0;
        let lastSeq = seq;
        let processedSeqs = new Set();
        console.log("实际统计开始...");

        while (true) {
            let CharTemp = null;
            try {
                CharTemp = await e.group.getChatHistory(lastSeq, 20);
            } catch (err) {
                console.log(`实际统计失败: ${err.message}`);
                break;
            }
            if (!CharTemp || CharTemp.length == 0) break;

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
            if (!hasNewData) break;

            // 试错机制：并行测试
            let testPromises = candidateSeqs.map(seq => {
                return e.group.getChatHistory(seq, 1)
                    .then(result => ({ seq, result }))
                    .catch(err => ({ seq, error: err }));
            });
            let testResults = await Promise.all(testPromises);
            let nextSeqFound = false;
            for (let i = 0; i < testResults.length; i++) {
                let { seq, result, error } = testResults[i];
                if (!error && result && result.length > 0) {
                    lastSeq = seq;
                    nextSeqFound = true;
                    break;
                }
            }
            if (!nextSeqFound) break;
        }
        console.log(`实际统计完成，共${allcount}条消息`);
        return { CharList, allcount };
    })();

    // 等待快速预估完成，发送预估消息
    let estimatedCount = await quickEstimatePromise;
    // 用扫描到的数量乘以1.5粗略估算总数（假设扫描了约2/3）
    let estimatedTotal = Math.round(estimatedCount * 1.5);
    let estimatedTime = (estimatedTotal / 20 / 4 / 60).toFixed(2);
    e.reply(`大概有${estimatedTotal}条记录需要分析，预计需要${estimatedTime}分钟`);

    // 等待实际统计完成
    let { CharList, allcount } = await actualStatPromise;

    let CharArray = [];
    for (const key in CharList) {
        CharArray.push(CharList[key]);
    }
    CharArray.sort((a, b) => {
        return b.times - a.times
    })
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