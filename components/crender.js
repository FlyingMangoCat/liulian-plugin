import template from "art-template";
import fs from "fs";
import puppeteer from "puppeteer";
import lodash from "lodash";
import common from "../model/rendercommon.js";
import { Data } from '#liulian'
import { logger } from './index.js'

const _path = process.cwd();
//html模板
const html = {};
//浏览�?let browser = "";
//截图数达到时重启浏览�?避免生成速度越来越慢
let restartNum = 200;
//截图次数
let renderNum = 0;
let restartCount = 0;
let restartFn = null;
//锁住
let lock = false;
//截图�?let shoting = [];

/**
 * 渲染生成图片，调试命�?npm run debug，window会直接打开无头浏览�? *
 * 原始html文件路径�?resources/app/type/type.html，文件夹名要和html名一�? *
 * 生成html文件路径�?data/html/app/type/save_id.html
 *
 * 模板生成art-template文档 http://aui.github.io/art-template/zh-cn/docs/
 *
 * @param app 应用名称
 * @param type 方法�? * @param data 前端参数，必�?data.save_id 用来区分模板
 * @param imgType 图片类型 jpeg，png（清晰一点，大小更大�? */
async function render (app = "", type = "", data = {}, imgType = "jpeg") {
  if (lodash.isUndefined(data._res_path)) {
    data._res_path = `../../../../resources/`;
  }
  if (lodash.isUndefined(data._sys_res_path)) {
    data._sys_res_path = `../../../../resources/`;
  }

  let tplKey = `${app}.${type}`;
  let saveId = data.save_id || type;
  let tplFile = `${_path}/resources/${app}/${type}/${type}.html`;
  if (data._no_type_path) {
    tplFile = `${_path}/resources/${app}/${type}.html`;
  }
  Data.createDir(_path + `/data/`, `html/${app}/${type}`);
  let savePath = _path + `/data/html/${app}/${type}/${saveId}.html`;

  return await doRender(app, type, data, imgType, {
    tplKey,
    tplFile,
    savePath,
    saveId,
  });
}

function getPluginRender (plugin) {
  return async function (app = "", type = "", data = {}, imgType = "jpeg") {
    // 在data中保存plugin信息
    data._plugin = plugin;

    if (lodash.isUndefined(data._res_path)) {
      data._res_path = `../../../../../plugins/${plugin}/resources/`;
    }
    if (lodash.isUndefined(data._sys_res_path)) {
      data._sys_res_path = `../../../../../resources/`;
    }
    let tplKey = `${plugin}.${app}.${type}`;
    let saveId = data.save_id;
    let tplFile = _path + `/plugins/${plugin}/resources/${app}/${type}.html`;
    Data.createDir(_path + `/data/`, `html/plugin_${plugin}/${app}/${type}`);
    let savePath = _path + `/data/html/plugin_${plugin}/${app}/${type}/${saveId}.html`;
    return await doRender(app, type, data, imgType, {
      tplKey,
      tplFile,
      savePath,
      saveId,
    });
  }
}

async function doRender (app, type, data, imgType, renderCfg) {

  let { tplKey, tplFile, savePath, saveId } = renderCfg;

  if (global.debugView === "web-debug") {
    // debug下保存当前页面的渲染数据，方便模板编写与调试
    // 由于只用于调试，开发者只关注自己当时开发的文件即可，暂不考虑app及plugin的命名冲�?    let saveDir = _path + "/data/ViewData/";
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir);
    }
    let file = saveDir + type + ".json";
    data._app = app;
    fs.writeFileSync(file, JSON.stringify(data));

    logger.mark(`${type}-tplFile:${tplFile}`);
      logger.mark(`${type}-savePath:${savePath}`);  }

  if (!html[tplKey] || global.debugView) {
    html[tplKey] = fs.readFileSync(tplFile, "utf8");
  }

  //替换模板
  let tmpHtml = template.render(html[tplKey], data);
  //保存模板
  fs.writeFileSync(savePath, tmpHtml);


  if (!(await browserInit())) {
    return false;
  }

  let base64 = "";
  let start = Date.now();
  try {
    shoting.push(saveId);
    //图片渲染
    const page = await browser.newPage();
    await page.goto("file://" + savePath);
    await page.waitForSelector("#container")
    await page.waitForTimeout(100)
    let body = await page.$("#container");
    let randData = {
      type: imgType,
      encoding: "base64",
    }
    if (imgType === "jpeg") {
      randData.quality = 90;
    }
if(imgType == "png"){
	  randData.omitBackground=true;
	}
    base64 = await body.screenshot(randData);
    if (!global.debugView) {
      page.close().catch((err) => logger.error(err));
    }
    shoting.pop();
  } catch (error) {
    logger.error(`图片生成失败:${type}:${error}`);
    //重启浏览�?    if (browser) {
      await browser.close().catch((err) => logger.error(err));
    }
    browser = "";
    base64 = "";
    return false;
  }

  if (!base64) {
    logger.error(`图片生成为空:${type}`);
    return false;
  }

  renderNum++;
  /** 计算图片大小 */
  let kb = (base64.length / 1024).toFixed(1) + 'kb'
  logger.mark(`【图片生成�?{app}/${type}.html: 格式:${imgType}, 大小�?{kb}，耗时�?{Date.now() - start}ms，次�?${renderNum}`);

  if (typeof test != "undefined") {
    return `图片base64:${type}`;
  }

  //截图超过重启数时，自动关闭重启浏览器，避免生成速度越来越慢
  if (renderNum > restartNum * (restartCount + 1)) {
    if (shoting.length <= 0) {
      restartFn && clearTimeout(restartFn)
      restartFn = setTimeout(async function () {
        browser.removeAllListeners("disconnected");
        await browser.close().catch((err) => logger.error(err));
        browser = "";
        restartCount++;
        logger.mark("puppeteer 关闭重启");
      }, 100);
    }
  }

  return base64;
}

async function browserInit () {
  if (browser) {
    return browser;
  }
  if (lock) {
    return false;
  }
  lock = true;
  logger.mark("puppeteer 启动中。�?);
  //初始化puppeteer
  browser = await puppeteer
    .launch({
      // executablePath:'',//chromium其他路径
      headless: global.debugView === "debug" ? false : true,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-first-run",
        "--no-sandbox",
        "--no-zygote",
        "--single-process",
      ],
    })
    .catch((err) => {
      logger.error(err);
      if (String(err).includes("correct Chromium")) {
        logger.error("没有正确安装Chromium，可以尝试执行安装命令：node ./node_modules/puppeteer/install.js");
      }
    });

  lock = false;

  if (browser) {
    logger.mark("puppeteer 启动成功");

    //监听Chromium实例是否断开
    browser.on("disconnected", function (e) {
      logger.error("Chromium实例关闭或崩溃！");
      browser = "";
    });

    return browser;
  } else {
    logger.error("puppeteer 启动失败");
    return false;
  }
}

export { render, browserInit, renderNum, getPluginRender };
