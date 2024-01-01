import fs from 'fs'
import Cfg from '../components/Cfg.js'
import lodash from 'lodash'
import { exec } from 'child_process'
import Common from '../components/Common.js'

let cfgMap = {
  渲染: 'sys.scale',
  帮助: 'sys.help',
  随机表情: 'sys.bq',
  打卡: 'sys.dk',
  群名片: 'sys.qmp',
  打我: 'sys.dw',
  设置: 'aysCfgReg',
  娶群友CD:'sys.wife',
  伪造信息:'sys.forge',
  群友强制休息: 'sys.xx',
  小黑子: 'sys.jtm',
  随机概率:'sys.gl',
  表情图库:'sys.expression',
  娶群友:'sys.qqy',
  群聊闭嘴限制:'sys.limit',
  群聊闭嘴:'sys.shutup',
}
let sysCfgReg = `^#榴莲设置\\s*(${lodash.keys(cfgMap).join('|')})?\\s*(.*)$`
export const rule = {
  updateRes: {
    hashMark: true,
    reg: '^#榴莲(更新图像|图像更新)$',
    describe: '【#管理】更新素材'
  },
  updateLiulianPlugin: {
    hashMark: true,
    reg: '^#榴莲(强制)?更新',
    describe: '【#管理】榴莲更新'
  },
  sysCfg: {
    hashMark: true,
    reg: sysCfgReg,
    describe: '【#管理】系统设置'
  },
  profileCfg: {
    hashMark: true,
    reg: '^#榴莲面板(?:设置)?.*',
    describe: '【#管理】面板设置'
  },
    cj: {
    hashMark: true,
    reg: '^#榴莲(安装|更新)芒果插件$',
    describe: '【#管理】安装/更新插件'
  }
}

const _path = process.cwd()
const resPath = `${_path}/plugins/liulian-plugin/resources/`
const imgPath = `${resPath}/liulian-res-plus/`

export async function sysCfg (e, { render }) {
  if (!e.isMaster) {
    e.reply('只有主人才能命令榴莲哦~')
    return true
  }

  let cfgReg = new RegExp(sysCfgReg)
  let regRet = cfgReg.exec(e.msg)

  if (!regRet) {
    return true
  }

  if (regRet[1]) {
    // 设置模式
    let val = regRet[2] || ''

    let cfgKey = cfgMap[regRet[1]]
    if (cfgKey === 'sys.scale') {
      val = Math.min(200, Math.max(50, val * 1 || 100))
    } else if(cfgKey === "sys.wife"){
			val= Math.min(100,Math.max(val,0));
		} else if(cfgKey === "sys.gl"){
			val= Math.min(100,Math.max(val,0));
		} else if(cfgKey === "sys.expression"){
			val= Math.min(2,Math.max(val,0));
		} else if(cfgKey === "sys.limit"){
			val= Math.min(2,Math.max(val,0));
		} else {
      val = !/关闭/.test(val)
    }

    if (cfgKey) {
      Cfg.set(cfgKey, val)
    }
  }

  let cfg = {
    help: getStatus('sys.help', false),
    bq: getStatus('sys.bq', false),
    dk: getStatus('sys.dk', false),
    dw: getStatus('sys.dw', false),
    qmp: getStatus('sys.qmp', false),
    wife: Cfg.get('sys.wife', 1),
    imgPlus: fs.existsSync(imgPath),
    xx: getStatus('sys.xx', false),
    forge: getStatus('sys.forge', false),
    jtm: getStatus('sys.jtm', false),
    qqy: getStatus('sys.qqy', false),
    expression: Cfg.get('sys.expression', 1),
    gl: Cfg.get('sys.gl', 5),
    scale: Cfg.get('sys.scale', 100),
    limit: Cfg.get('sys.limit', 0),
    shutup: getStatus('sys.shutup', false),
  }

  // 渲染图像
  return await Common.render('admin/index', {
    ...cfg
  }, { e, render, scale: 1.4 })
}

const getStatus = function (rote, def = true) {
  if (Cfg.get(rote, def)) {
    return '<div class="cfg-status" >已开启</div>'
  } else {
    return '<div class="cfg-status status-off">已关闭</div>'
  }
}

export async function updateRes (e) {
  if (!e.isMaster) {
   e.reply('只有主人才能命令榴莲哦~')
   return true
  }
  let command = ''
  if (fs.existsSync(`${resPath}/liulian-res-plus/`)) {
    e.reply('开始尝试更新，请耐心等待~')
    command = 'git pull'
    exec(command, { cwd: `${resPath}/liulian-res-plus/` }, function (error, stdout, stderr) {
      console.log(stdout)
      if (/(Already up[ -]to[ -]date|已经是最新的)/.test(stdout)) {
        e.reply('目前所有图片都已经是最新了~')
        return true
      }
      let numRet = /(\d*) files changed,/.exec(stdout)
      if (numRet && numRet[1]) {
        e.reply(`报告主人，更新成功，此次更新了${numRet[1]}个图片~`)
        return true
      }
      if (error) {
        e.reply('更新失败！\nError code: ' + error.code + '\n' + error.stack + '\n 请稍后重试。')
      } else {
        e.reply('图片加量包更新成功~')
      }
    })
  } else {
    command = `git clone https://gitee.com/huifeidemangguomao/liulian-res-plus.git "${resPath}/liulian-res-plus/"`
    e.reply('开始尝试安装图片加量包，可能会需要一段时间，请耐心等待~')
    exec(command, function (error, stdout, stderr) {
      if (error) {
        e.reply('图片加量包安装失败！\nError code: ' + error.code + '\n' + error.stack + '\n 请稍后重试。')
      } else {
        e.reply('图片加量包安装成功！您后续也可以通过 #榴莲更新图像 命令来更新图像')
      }
    })
  }
  return true
}
export async function cj (e) {
  if (!e.isMaster) {
    e.reply('只有主人才能命令榴莲哦~')
    return true
  }
  let command = ''
  if (fs.existsSync(`${_path}/plugins/mango-plugin/`)) {
    e.reply('开始尝试更新，请耐心等待~')
    command = 'git pull'
    exec(command, { cwd: `${_path}/plugins/mango-plugin/` }, function (error, stdout, stderr) {
      console.log(stdout)
      if (/(Already up[ -]to[ -]date|已经是最新的)/.test(stdout)) {
        e.reply('目前插件已经是最新了~')
        return true
      }
      let numRet = /(\d*) files changed,/.exec(stdout)
      if (numRet && numRet[1]) {
        e.reply(`报告主人，更新成功，此次更新了${numRet[1]}个文件~`)
        return true
      }
      if (error) {
        e.reply('更新失败！\nError code: ' + error.code + '\n' + error.stack + '\n 请稍后重试。')
      } else {
        e.reply('插件更新成功~')
      }
    })
  } else {
    command = `git clone https://gitee.com/huifeidemangguomao/mango-plugin.git "${_path}/plugins/mango-plugin/"`
    e.reply('开始尝试安装插件，可能会需要一段时间，请耐心等待~')
    exec(command, function (error, stdout, stderr) {
      if (error) {
        e.reply('安装失败！\nError code: ' + error.code + '\n' + error.stack + '\n 请稍后重试。')
      } else {
         }
    })
  }
  return true
}


let timer

export async function updateLiulianPlugin (e) {
  if (!e.isMaster) {
    e.reply('只有主人才能命令榴莲哦~')
    return true
  }
  let isForce = e.msg.includes('强制')
  let command = 'git  pull'
  if (isForce) {
    command = 'git  checkout . && git  pull'
    e.reply('正在执行强制更新操作，请稍等')
  } else {
    e.reply('正在执行更新操作，请稍等')
  }
  exec(command, { cwd: `${_path}/plugins/liulian-plugin/` }, function (error, stdout, stderr) {
    if (/(Already up[ -]to[ -]date|已经是最新的)/.test(stdout)) {
      e.reply('目前已经是最新版榴莲了~')
      return true
    }
    if (error) {
      e.reply('榴莲更新失败！\nError code: ' + error.code + '\n' + error.stack + '\n 请稍后重试。')
      return true
    }
    e.reply('榴莲更新成功，正在尝试重新启动Yunzai以应用更新...')
    timer && clearTimeout(timer)
    redis.set('liulian:restart-msg', JSON.stringify({
      msg: '重启成功，新版榴莲已经生效',
      qq: e.user_id
    }), { EX: 30 })
    timer = setTimeout(function () {
      let command = 'npm run start'
      if (process.argv[1].includes('pm2')) {
        command = 'npm run restart'
      }
      exec(command, function (error, stdout, stderr) {
        if (error) {
          e.reply('自动重启失败，请手动重启以应用新版榴莲。\nError code: ' + error.code + '\n' + error.stack + '\n')
          Bot.logger.error(`重启失败\n${error.stack}`)
          return true
        } else if (stdout) {
          Bot.logger.mark('重启成功，运行已转为后台，查看日志请用命令：npm run log')
          Bot.logger.mark('停止后台运行命令：npm stop')
          process.exit()
        }
      })
    }, 1000)
  })
  return true
}

export async function profileCfg (e, { render }) {
  if (!e.isMaster) {
    e.reply('只有主人才能命令榴莲哦~')
    return true
  }

  let keyMap = {
    好友: 'friend',
    群: 'group',
    陌生人: 'stranger'
  }

  let regRet = /榴莲面板(?:设置)?\s*(好友|群|群聊|陌生人)?\s*(\d*)\s*(开启|关闭|删除)?\s*$/.exec(e.msg)

  if (!regRet) {
    return
  }

  let [, target, groupId, actionType] = regRet
  if (target === '群聊') {
    target = '群'
  }

  if (target) {
    if (groupId && (target === '群' || !target)) {
      if (actionType === '删除') {
        Cfg.del(`profile.groups.群${groupId}`)
      } else {
        Cfg.set(`profile.groups.群${groupId}.status`, actionType !== '关闭')
      }
    } else {
      Cfg.set(`profile.${keyMap[target]}.status`, actionType !== '关闭')
    }
  }

  let cfg = {
    groups: []
  }

  lodash.forEach(['friend', 'group', 'stranger'], (key) => {
    cfg[key] = getStatus(`profile.${key}.status`, true)
  })

  let groups = Cfg.get('profile-data.groups', {})
  lodash.forEach(lodash.keys(groups), (group, idx) => {
    if (lodash.isUndefined(groups[group])) {
      return
    }
    cfg.groups.push({
      group,
      idx: idx + 1,
      status: getStatus(`profile.groups.${group}.status`, true)
    })
  })

  // 渲染图像
  return await Common.render('admin/profile', {
    ...cfg
  }, { e, render, scale: 1.4 })
}

