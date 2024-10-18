import fetch from "node-fetch";

const API_BASE_URL = "https://api.yxyos.com/liulian/classic";

export const rule = {
  sjclassic: {
    reg: "#?(来点|整点|搞点|随机|看看|来一张)(经典|小怪话|怪话|逆天|逆天语录|经典语录|乐子|杂图)$",
    priority: 1000,
    describe: "经典发言",
  },
  zdclassic: {
    reg: "#?(来点|整点|搞点|随机|看看|来一张)(.*)$",
    priority: 1000,
    describe: "经典发言",
  },
};

async function fetchClassic(keyword) {
  try {
    const url = `${API_BASE_URL}/?=${encodeURIComponent(keyword)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error("Error fetching classic:", error);
    return "无法获取，请稍后再试。";
  }
}

export async function sjclassic(e) {
  const msg = [fetchClassic("")];
  e.reply(msg, true);
}

export async function zdclassic(e) {
  const keyword = e.msg.replace("#", "").replace("(来点|整点|搞点|随机|看看|来一张)", "").trim();
  const msg = [fetchClassic(keyword)];
  e.reply(msg, true);
}