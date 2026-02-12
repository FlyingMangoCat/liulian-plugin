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

    // 获取最新消息
    let CharHistory = await e.group.getChatHistory(0, 1);
    if (!CharHistory || CharHistory.length === 0) {
        e.reply("无法获取聊天记录，请稍后再试");
        ing[e.group_id] = 0;
        return true;
    }
    
    // 计算预估总数和时间
    let msgId = CharHistory[0]?.message_id || 0;
    let estimatedCount = Math.floor(msgId * 0.0001);
    let estimatedTime = (estimatedCount / 960).toFixed(2);
    e.reply(`大概有${estimatedCount}条记录需要分析，预计需要${estimatedTime}分钟`);

    // 准备统计
    let CharList = {};
    let scanSeq = CharHistory[0]?.message_seq || 0;
    let scanProcessed = new Set([scanSeq]);
    console.log(`初始 message_seq: ${scanSeq}`);
    
    // 扫描消息并统计
    while (true) {
        console.log(`当前 scanSeq: ${scanSeq}`);
        let temp = null;
        
        // 尝试获取历史消息
        try {
            temp = await e.group.getChatHistory(scanSeq, 20);
        } catch (err) {
            console.log(`getChatHistory(${scanSeq}, 20) 失败: ${err.message}`);
        }
        
        if (!temp || temp.length == 0) {
            console.log(`getChatHistory(${scanSeq}, 20) 返回空，统计结束`);
            break;
        }
        
        console.log(`getChatHistory(${scanSeq}, 20) 返回: ${temp.length} 条消息`);
        
        let hasNew = false;
        let candidateSeqs = [];
        
        // 处理获取到的消息
        for (const key in temp) {
            if (!temp[key] || Object.keys(temp[key]).length === 0) continue;
            
            let msgSeq = temp[key].message_seq;
            if (!msgSeq) continue;
            
            candidateSeqs.push(msgSeq);
            
            if (scanProcessed.has(msgSeq)) continue;
            
            scanProcessed.add(msgSeq);
            hasNew = true;
            
            // 更新用户消息统计
            let userId = temp[key].user_id;
            if (CharList[userId]) {
                CharList[userId].times += 1;
                CharList[userId].uname = temp[key].sender.card ? temp[key].sender.card : temp[key].sender.nickname;
            } else {
                CharList[userId] = {
                    times: 1,
                    user_id: userId,
                    uname: temp[key].sender.card ? temp[key].sender.card : temp[key].sender.nickname
                };
            }
        }
        
        if (!hasNew) {
            console.log(`本轮无新数据，统计结束`);
            break;
        }
        
        // 使用并行试错机制找到下一个有效的 seq
        let nextSeqFound = false;
        let testResults = await Promise.all(candidateSeqs.map(async (seq) => {
            try {
                let testResult = await e.group.getChatHistory(seq, 1);
                if (testResult && testResult.length > 0) {
                    return seq;
                }
            } catch (err) {
                return null;
            }
        }));
        
        for (let result of testResults) {
            if (result) {
                scanSeq = result;
                nextSeqFound = true;
                console.log(`试错成功：使用 seq ${scanSeq}`);
                break;
            }
        }
        
        if (!nextSeqFound) {
            console.log(`所有候选 seq 都不可用，统计结束`);
            break;
        }
    }
    
    // 处理统计结果
    let CharArray = [];
    for (const key in CharList) {
        CharArray.push(CharList[key]);
    }
    
    // 排序并取前十
    CharArray.sort((a, b) => b.times - a.times);
    console.log(CharArray);
    CharArray = CharArray.slice(0, 10);
    
    // 计算最终总数和放大倍数
    let actualCount = scanProcessed.size;
    let scaleRatio = estimatedCount / actualCount;
    
    // 如果预估比实际少，采用实际总数；放大倍数至少为1（不缩小）
    let finalCount = Math.max(estimatedCount, actualCount);
    let finalScaleRatio = Math.max(1, scaleRatio);
    
    // 生成结果
    let res = `一共检测到聊天记录 ${finalCount} 句话，其中：\n`;
    let itemp = 0;
    for (let v of CharArray) {
        let scaledTimes = Math.floor(v.times * finalScaleRatio);
        res += `${v.uname}  水了${scaledTimes}句话，占比${(scaledTimes/finalCount*100).toFixed(2)}% `;
        if(!itemp){
            res += " （这人水是真滴多 ！）";
        }
        if(itemp != CharArray.length - 1 ){
            res += "\n";
        }
        itemp++;
    }
    
    e.reply(res);
    ing[e.group_id] = 0;
    return true;
}