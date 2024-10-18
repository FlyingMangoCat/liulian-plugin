
import fs from 'fs';
import fetch from "node-fetch";
import { promisify } from "util";
import { pipeline } from "stream";
import path from 'path';

const _path = process.cwd();//项目路径
var filesNameA = [];//存放js文件名称的数组

let app = App.init({
  id: 'wjgl',
  name: 'wjgl',
  desc: 'wjgl'
})

app.reg({
  v3JsPlugins:
  {
    reg: "noCheck",
    priority: 450,
    describe: "生成js文件自动放到插件目录下面",
  },

  v3PluginsList:
  {
    reg: "^插件列表$",//这里的这个*代表它前面挨着的字符可以重复：##、####、###############都是对的
    priority: 450,
    describe: "查看你安装的插件的列表",
  },

  v3WarehPluginsList:
  {
    reg: "^(仓库列表)$",
    priority: 450,
    describe: "查看被停用的插件的列表",
  },

  v3RemovePlugins:
  {
    reg: "^(移除插件)(.*)$",//*表示匹配1个或多个     .表示除个别的任意字符
    priority: 450,
    describe: "移除插件(插件名)",//只是把它们换了个文件夹
  },

  v3LoadPlugins:
  {
    reg: "^(添加插件)(.*)$", //由于添加指令会冲突所以改用新增
    priority: 450,
    describe: "启用插件(插件名)",
  },

  v3DeletePlugins:
  {
    reg: "^(删除插件)(.*)$", //由于添加指令会冲突所以改用新增
    priority: 450,
    describe: "删除插件(插件名)",
  },

  v3HelpMenu:
  {
    reg: "^(插件管理帮助)(.*)$", //由于添加指令会冲突所以改用新增
    priority: 450,
    describe: "帮助菜单",
  }
})
export default app
//********************************************************************************************* */

export async function v3JsPlugins(e) {
  if (!e.isMaster) { return false; }
  if (!e.file || !e.file.name.includes("js")) { return false; }
  if (e.file.name.includes("json")) {
    return false
  }
  let path = "plugins/example/";
  if (!fs.existsSync(path)) { e.reply("插件目录不存在！"); }
  let textPath = `${path}${e.file.name}`;
  let fileUrl = await e.friend.getFileUrl(e.file.fid);
  const response = await fetch(fileUrl);
  const streamPipeline = promisify(pipeline);
  await streamPipeline(response.body, fs.createWriteStream(textPath));
  e.reply(e.file.name + "插件添加成功！可输入插件列表查看安装是否成功~");
  return true;
}

export async function v3PluginsList(e) {
  filesNameA = [];
  let fNA = fs.readdirSync(`${_path}/plugins/example`);  //获取所有插件名称的数组
  let afn = ArrangeFileName(fNA);
  e.reply(afn.replace(/,/g, '\n'));
  return true;
}

export async function v3WarehPluginsList(e) {
  filesNameA = [];
  let fNA = fs.readdirSync(`${_path}/plugins/example/garbage`); //获取所有插件名称的数组
  let afn = ArrangeFileName(fNA);
  e.reply(afn.replace(/,/g, '\n'));
  return true;
}

export async function v3RemovePlugins(e) {
  if (!e.isMaster) {
    e.reply("你没有权限！")
    return true;
  }
  if (!fs.existsSync('./plugins/example/garbage/')) { fs.mkdirSync('./plugins/example/garbage/'); }
  let len = e.msg.search(/(停用插件|tycj)/) + 4;
  let fileName = e.msg.slice(len, e.msg.length).trim();//因为从命令语句后开始截取的字符串前后可能有空格
  ArrangeInstruction(fileName, 0, e);
  return true;
}

export async function v3LoadPlugins(e) {
  if (!e.isMaster) {
    e.reply("你没有权限！")
    return true;
  }
  let len = e.msg.search(/qycj|启用插件/) + 4;
  let fileName = e.msg.slice(len, e.msg.length).trim();
  ArrangeInstruction(fileName, 1, e);
  return true;
}

export async function v3DeletePlugins(e) {
  if (!e.isMaster) {
    e.reply("你没有权限！")
    return true;
  }
  let len = e.msg.search(/sccj|删除插件/) + 4;
  let fileName = e.msg.slice(len, e.msg.length).trim();
  ArrangeInstruction(fileName, 2, e);
  return true;
}

export async function v3HelpMenu(e) {
  let helpMenu = (
    "      帮助菜单," +
    "#cjhelp  #插件管理帮助," +
    "#cjlb     #插件列表," +
    "#cklb    #仓库列表," +
    "#tycj     #停用插件," +
    "#qycj    #启用插件," +
    "#sccj    #删除插件," +
    "1简化命令输入，可以用命令的拼音首字母," +
    "2简化文件名输入，可以用文件名前的序号代替," +
    " 例: #移除插件 ai自定义.js 等价于 #yccj 1," +
    "3支持多插件同时启用/停用，序号间用逗号隔开!," +
    "4新增删除插件，只能删除仓库列表中的停用插件," +
    "5删除是真删除，请小心使用！," +
    "6停用插件可以把插件管理自己停用！！！>_<"
  );
  e.reply(helpMenu.replace(/,/g, '\n'));
  return true;
}

//******************************************************************************************** */

function Filemove(sf, dp, fn, kg, e1) //文件移动操作
{
  let str = "";
  switch (kg) {
    case 0: str = "停用成功~";
      break;
    case 1: str = "启用成功~";
      break;
    case 2: str = "删除成功~";
  }
  if (kg != 2) { fs.writeFileSync(dp, fs.readFileSync(sf)); }//复制粘贴
  fs.unlink(sf, (err) =>               //删除,真的删除了！！！小心使用！
  {
    if (err) { e1.reply("目标不存在！" + sf); }
    e1.reply(fn + "  " + str);
  });
}

function ArrangeFileName(a)//筛选后缀是.js的文件，并增加序号
{
  for (let i = 0; i < a.length; i++) {
    if (a[i].includes(".js")) filesNameA.push(a[i]);
  }
  let sss = "";
  for (let i = 0; i < filesNameA.length; i++) {
    sss = sss + (i + 1).toString() + "  " + filesNameA[i] + ",";
  }
  return sss;
}

function ArrangeInstruction(fn, kg, ee) //处理用户的指令
{
  let path1 = "";
  let path2 = "";
  if (kg) {
    path1 = "plugins/example/garbage";
    path2 = "plugins/example";
  }
  else {
    path1 = "plugins/example";
    path2 = "plugins/example/garbage";
  }
  let sourceFile = "";
  let destPath = "";
  //如果文件名的第一个字符是数字
  if (!isNaN(fn[0])) {
    let fnA = fn.split(/, */);//分割成数字字符数组
    for (let i = 0; i < fnA.length; i++) {
      if (typeof (filesNameA[Number(fnA[i]) - 1]) == "undefined")//文件名为undefined时path.join()会出错
      {
        ee.reply("目标文件错误！或目标文件不存在！");
      }
      else {
        sourceFile = path.join(_path, path1, filesNameA[Number(fnA[i]) - 1]);
        destPath = path.join(_path, path2, filesNameA[Number(fnA[i]) - 1]);
        Filemove(sourceFile, destPath, filesNameA[Number(fnA[i]) - 1], kg, ee);
      }
    }
  }
  else {
    if (fn.includes(".js")) {
      sourceFile = path.join(_path, path1, fn);
      destPath = path.join(_path, path2, fn);
    }
    else {
      sourceFile = path.join(_path, path1, fn + ".js");
      destPath = path.join(_path, path2, fn + ".js");
    }
    fs.access(sourceFile, (err) =>   //查看文件是否存在
    {
      if (err) { ee.reply("文件名错误！或目标文件不存在！"); }
      else { Filemove(sourceFile, destPath, fn, kg, ee); }
    });
  }
}

/**
e.reply("收到3！");  最慢
this.reply("收到4！"); 最快
this.e.reply("收到5！"); 第二
*/
