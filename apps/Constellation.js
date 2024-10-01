import fetch from "node-fetch";

//项目路径
const _path = process.cwd();

let app = App.init({
  id: '运势',
  name: '运势',
  desc: '运势'
})

app.reg({
  xzys: {
    reg: "^#?.*运势$", //匹配消息正则，命令正则
    priority: 5, //优先级，越小优先度越高
    describe: "【水瓶运势】开发简单示例演示", //【命令】功能说明
  },
})
export default app
//2.编写功能方法
//方法名字与rule中的examples保持一致
//测试命令 npm test 例子
export async function xzys(e) {
    
  //e.msg 用户的命令消息
  let keyword = e.msg.replace("#","");
  keyword = keyword.replace("运势","");
  console.log(keyword);
  
  if(keyword == `白羊` || keyword == `白羊座`){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E7%99%BD%E7%BE%8A%E5%BA%A7`),
  ];

  e.reply(msg);
  }
  
 else if(keyword == `金牛` || keyword == `金牛座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E9%87%91%E7%89%9B%E5%BA%A7`),
  ];

  e.reply(msg);
  
  }
  
else  if(keyword == `双子` || keyword == `双子座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E5%8F%8C%E5%AD%90`),
  ];

  e.reply(msg);
  
  }
  
else  if(keyword == `巨蟹` || keyword == `巨蟹座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E5%B7%A8%E8%9F%B9`),
  ];

  e.reply(msg);
  
  }
  
else if(keyword == `狮子` || keyword == `狮子座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E7%8B%AE%E5%AD%90`),
  ];

  e.reply(msg);
  
  }
  
else   if(keyword == `处女` || keyword == `处女座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E5%A4%84%E5%A5%B3`),
  ];

  e.reply(msg);
  
  }
  
else  if(keyword == `天秤` || keyword == `天秤座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E5%A4%A9%E7%A7%A4`),
  ];

  e.reply(msg);
  
  }
  
  
else  if(keyword == `天蝎` || keyword == `天蝎座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E5%A4%A9%E8%9D%8E`),
  ];

  e.reply(msg);
  
  }
  
else  if(keyword == `射手` || keyword == `射手座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E5%B0%84%E6%89%8B`),
  ];

  e.reply(msg);
  
  }
  
 else if(keyword == `摩羯` || keyword == `摩羯座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E6%91%A9%E7%BE%AF`),
  ];

  e.reply(msg);
  
  }
  
 else if(keyword == `水瓶` || keyword == `水瓶座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E6%B0%B4%E7%93%B6`),
  ];

  e.reply(msg);
  
  }
  
  
 else if(keyword == `双鱼` || keyword == `双鱼座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E5%8F%8C%E9%B1%BC`),
  ];

  e.reply(msg);
  
  }else
   {
       e.reply(`请输入正确的星座名称！`);
   }

  return true; //返回true 阻挡消息不再往下
}
