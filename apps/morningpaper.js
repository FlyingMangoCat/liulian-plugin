import fetch from "node-fetch";
import { App } from '#liulian'

//项目路径
const _path = process.cwd();

let app = App.init({
  id: 'zb',
  name: 'zb',
  desc: 'zb'
})

app.reg({
  早报: {
    reg: "^#*早报$", //匹配消息正则，命令正则
    priority: 100, //优先级，越小优先度越高
    describe: "【#例子】开发简单示例演示", //【命令】功能说明
  },

})
export default app


export async function 早报(e) {

   let url = `https://v2.alapi.cn/api/zaobao?token=17Noc6E1x3kduTdK&format=image`;
//https://admin.alapi.cn/account/center
  let msg = [

    segment.image(url),

  ];
  
  e.reply(msg);

  return true;
}
