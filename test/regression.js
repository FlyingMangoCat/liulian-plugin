// 榴莲插件回归自测：在插件根目录运行 node test/regression.js
// 覆盖：黑白名单判定（含 0=全部响应约定）/ AI回复清理链 / 猜角色合并正则 / CT_MAP 接线
// 全过输出 ALL PASS；任一失败退出码 1。改 A 破坏 B 的情况在这里现形。
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
let pass = 0, fail = 0
function check (name, got, exp) {
  const ok = got === exp
  ok ? pass++ : fail++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ` | 期望 ${JSON.stringify(exp)} 实际 ${JSON.stringify(got)}`}`)
}

// ── 0. 源码漂移检查：关键实现行被删/被改时在此现形 ─────────────────
const src = {
  aiIndex: fs.readFileSync(path.join(ROOT, 'apps/ai/index.js'), 'utf8'),
  index: fs.readFileSync(path.join(ROOT, 'apps/index.js'), 'utf8'),
  bwConfig: fs.readFileSync(path.join(ROOT, 'model/bwConfig.js'), 'utf8'),
  regex: fs.readFileSync(path.join(ROOT, 'apps/Guess.js'), 'utf8')
}
const drift = []
function expectLine (file, needle) {
  if (!src[file].includes(needle)) drift.push(`${file} 缺少: ${needle}`)
}
expectLine('aiIndex', 'bmd_GroupQQ.map(String).includes(String(e.group_id))')
expectLine('aiIndex', 'hmd_userqq.map(String).includes(String(e.user_id))')
expectLine('bwConfig', "if (list.length > 0 && list.map(toStr).includes('0')) return true")
expectLine('bwConfig', 'return list.length > 0 && list.map(toStr).includes(toStr(groupId))')
expectLine('index', 'const CT_MAP = {')
expectLine('index', '猜角色(?:鸣潮)?')

// ── 1. 黑白名单判定（读取真实模板，判定式与 model/bwConfig.js 同款）─────────
function parseSimpleYaml (text) {
  const root = {}
  const stack = [{ indent: -1, obj: root }]
  let lastKey = null
  for (const raw of text.split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue
    const indent = raw.match(/^ */)[0].length
    const t = raw.trim()
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop()
    if (t.startsWith('- ')) {
      // 首个条目时该键的值还是空对象，先转成数组再入列（持有者是登记键时的父级对象）
      if (lastKey) {
        if (!Array.isArray(lastKey.obj[lastKey.key])) lastKey.obj[lastKey.key] = []
        lastKey.obj[lastKey.key].push(t.slice(2).trim())
      }
      continue
    }
    const obj = stack[stack.length - 1].obj
    const m = t.match(/^([^:]+):\s*(.*)$/)
    if (!m) continue
    const key = m[1].trim()
    let val = m[2].trim().replace(/\s*#.*$/, '')
    lastKey = { obj, key }
    if (val === '') { obj[key] = {}; stack.push({ indent, obj: obj[key] }) }
    else if (val === '[]') obj[key] = []
    else obj[key] = val
  }
  return root
}

function objToStr (v) { return v === undefined || v === null ? undefined : String(v) }
function isGroupBlack (list, groupId) { return (list || []).map(objToStr).includes(objToStr(groupId)) }
function isGroupWhite (list, groupId) {
  list = list || []
  if (list.length > 0 && list.map(objToStr).includes('0')) return true
  return list.length > 0 && list.map(objToStr).includes(objToStr(groupId))
}

const yamlText = fs.readFileSync(path.join(ROOT, 'config/default_config/liulian/bwlist.yaml'), 'utf8')
const bw = parseSimpleYaml(yamlText)
const gAI = bw.black.groups.ai
const gBQ = bw.black.groups.bq
const wKUN = bw.white.groups.kun
const wWJC = bw.white.groups.wjc

check('AI 黑名单群命中', isGroupBlack(gAI, 1023688845), true)
check('AI 黑名单群未命中放行', isGroupBlack(gAI, 999), false)
check('随机表情黑名单群命中', isGroupBlack(gBQ, 931286774), true)
check('小黑子白名单群命中', isGroupWhite(wKUN, 790621765), true)
check('小黑子白名单群外拦截', isGroupWhite(wKUN, 999), false)
check('违禁词白名单群命中', isGroupWhite(wWJC, 790621765), true)
check('白名单填 0 = 作废全响应', isGroupWhite([0], 999), true)
check('AI 用户黑名单（空表不命中）', isGroupBlack(bw.black.users.bq, 123), false)

// ── 2. AI 回复清理链形态（与 apps/ai/index.js 清理链同款表达式）────────────
function cleanReply (replyText) {
  return replyText
    .replace(/\[查看\s*#?\d+\]/g, '')
    .replace(/^【回复】\s*[:：]?\s*/, '')
    .replace(/\[reply\]([\s\S]*?)\[\/reply\]/gi, '$1')
    .replace(/\[\/?reply\]/gi, '')
    .replace(/\[\/?回复\]/g, '')
    .replace(/\[\/?引用消息\]/g, '')
    .replace(/^\s*#\d+\s+\S+[:：].*$/gm, '')
    .replace(/([^\s/]{2,30}[?？!！。～~]?)(?:\s*\/+\s*\1)+/g, '$1')
    .replace(/[\s/]+$/, '')
    .trim()
}
check('清理:半角回复壳', cleanReply('[回复] 有吧'), '有吧')
check('清理:全角回复壳', cleanReply('【回复】有吧'), '有吧')
check('清理:reply包裹', cleanReply('[reply]有吧[/reply]'), '有吧')
check('清理:引用消息壳', cleanReply('[引用消息] 有吧 [/引用消息]'), '有吧')
check('清理:裸回复不误删', cleanReply('回复：有吧'), '回复：有吧')
check('清理:合法引语保留', cleanReply('“有吧”'), '“有吧”')
check('清理:整条只剩壳→空', cleanReply('[回复]'), '')
check('清理:复读收敛', cleanReply('有人斗虫吗？/有人斗虫吗？'), '有人斗虫吗？')

// ── 3. 猜角色合并正则（apps/Guess.js ww/nte 原版行为对照）──────────────────
const reWW = new RegExp('^(?:鸣潮|~|ww|#鸣潮|#ww|(?=.*(?:鸣潮|ww)))猜角色(?:鸣潮)?(?:普通|困难|地狱|炼狱)?(?:模式)?|^#猜角色(?:鸣潮|ww|~)(?:普通|困难|地狱|炼狱)?(?:模式)?$', 'i')
const reNTE = new RegExp('^(?:异环|nte|#异环|#nte)猜角色(?:异环)?(?:普通|困难|地狱|炼狱)?(?:模式)?|^#猜角色(?:异环|nte)(?:普通|困难|地狱|炼狱)?(?:模式)?$', 'i')
check('正则:鸣潮猜角色', reWW.test('鸣潮猜角色'), true)
check('正则:ww猜角色', reWW.test('ww猜角色'), true)
check('正则:#猜角色鸣潮', reWW.test('#猜角色鸣潮'), true)
check('正则:原神猜角色不串', reWW.test('原神猜角色'), false)
check('正则:异环猜角色', reNTE.test('异环猜角色'), true)
check('正则:#猜角色异环', reNTE.test('#猜角色异环'), true)

// ── 4. CT_MAP 接线（静态解析：死键必须为 0）──────────────────────────────
function blockKeys (startMark) {
  const s = src.index.indexOf(startMark)
  if (s < 0) return []
  const body = src.index.slice(src.index.indexOf('{', s) + 1, src.index.indexOf('\n}', s))
  // 兼容两种形态：简写标识符（help, maphelp, ...）与键值对（ai: 'AI回复'）
  const out = []
  for (let tok of body.split(/[,\n]/)) {
    const k = tok.replace(/['"\s]/g, '').split(':')[0].trim()
    if (k) out.push(k)
  }
  return out
}
const exportedKeys = blockKeys('const exportedFunctions = {')
// 动态挂载的键（exportedFunctions.x = ...）也计入
const dynamicMount = /exportedFunctions\.([A-Za-z_][A-Za-z0-9_]*)\s*=/g
let dm
while ((dm = dynamicMount.exec(src.index))) exportedKeys.push(dm[1])
const ctKeys = blockKeys('const CT_MAP = {')
const expSet = new Set(exportedKeys)
const deadKeys = [...new Set(ctKeys)].filter(k => !expSet.has(k))
check('CT_MAP 死键为 0', deadKeys.length, 0)

// ── 汇总 ─────────────────────────────────────────────────────────────────
console.log(`\n结果: ${pass} 过 / ${fail} 挂`)
if (drift.length) { console.log('源码漂移:'); drift.forEach(d => console.log('  ' + d)) }
console.log(fail === 0 && drift.length === 0 ? 'ALL PASS' : 'NOT PASS')
process.exitCode = fail === 0 && drift.length === 0 ? 0 : 1
