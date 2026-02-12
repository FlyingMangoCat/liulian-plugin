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
    e.reply("正在分析聊天记录，寻找本群大水逼，请等一等！");
    let CharList = {};
    let allcount = 0;
    let lastSeq = seq;
    let loopCount = 0;
    // 最多循环1000次，每次20条，最多2万条消息，避免无限循环
    while (loopCount < 1000) {
        let CharTemp = await e.group.getChatHistory(lastSeq, 20);
        if (!CharTemp || CharTemp.length == 0) {
            break;
        }
        let hasNewData = false;
        for (const key in CharTemp) {
            if (!CharTemp[key] || Object.keys(CharTemp[key]).length === 0) {
                continue;
            }
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
            // 更新最后一个消息的seq
            if (CharTemp[key].message_seq) {
                lastSeq = CharTemp[key].message_seq;
            }
        }
        if (!hasNewData) {
            break;
        }
        loopCount++;
    }
    let CharArray = [];
    for (const key in CharList) {
        CharArray.push(CharList[key]);
    }
    CharArray.sort((a, b) => {
        return b.times - a.times
    })
    console.log(CharArray);
    let l = Math.ceil(CharArray.length / 10);
    CharArray = CharArray.slice(0, l > 10 ? 10 : l);
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