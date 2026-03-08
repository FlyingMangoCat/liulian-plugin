import fetch from "node-fetch";

//项目路径
const _path = process.cwd();

//简单应用示例

//1.定义命令规则
export const rule = {
  早报: {
    reg: "^#*早报$", //匹配消息正则，命令正则
    priority: 100, //优先级，越小优先度越高
    describe: "【#例子】开发简单示例演示", //【命令】功能说明
  },

};


export async function 早报(e) {

   // 使用v3 POST接口
   let url = `https://v3.alapi.cn/api/zaobao`;
   let response = await fetch(url, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       token: '17Noc6E1x3kduTdK',
       format: 'image'
     })
   });
   
   let res = await response.json();
   
   if (res.code != 200) {
     e.reply(`⚠️获取早报失败：${res.msg || '未知错误'}`);
     return false;
   }
   
   let msg = [
     segment.image(res.data.image),
     `\n${res.data.date}`,
     res.data.news ? `\n【新闻】${res.data.news}` : '',
     res.data.weiyu ? `\n【微语】${res.data.weiyu}` : ''
   ];
  
  e.reply(msg);

  return true;
}
