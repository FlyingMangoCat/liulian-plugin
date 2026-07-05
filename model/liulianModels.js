/**
 * 简易 Character / Weapon 模型
 * 模拟 miao-plugin 的 #miao.models 接口，供 genshin 插件等共用
 * 使用 liulian-plugin 的 roleId 数据进行角色/武器查询
 */
import fs from "node:fs"
import YAML from "yaml"
import { roleId, abbr, actWeapon } from "../config/roleId.js"

/** 名称 → ID 反向映射 */
let _nameToId = null
function getNameToId() {
  if (_nameToId) return _nameToId
  _nameToId = {}
  for (const [id, names] of Object.entries(roleId)) {
    for (const name of names) {
      _nameToId[name] = id
    }
  }
  return _nameToId
}

/** 缓存：角色元素映射、武器类型映射 */
let _roleElem, _weaponType

function getRoleElem() {
  if (_roleElem) return _roleElem
  const file = "./plugins/genshin/defSet/element/role.yaml"
  if (!fs.existsSync(file)) return (_roleElem = {})
  return (_roleElem = YAML.parse(fs.readFileSync(file, "utf8")) || {})
}

function getWeaponType() {
  if (_weaponType) return _weaponType
  const file = "./plugins/genshin/defSet/element/weapon.yaml"
  if (!fs.existsSync(file)) return (_weaponType = {})
  return (_weaponType = YAML.parse(fs.readFileSync(file, "utf8")) || {})
}

/** 检查文件是否存在（支持 .png / .webp） */
function imgExist(basePath) {
  for (const ext of [".png", ".webp", ".jpg"]) {
    if (fs.existsSync(basePath + ext)) return basePath + ext
  }
  return ""
}

class Character {
  constructor(name, game = "gs") {
    this.name = name
    this.game = game
    this._imgs = null
  }

  /** 短名称 */
  get sName() {
    const abbrMap = {}
    for (const [full, short] of abbr) abbrMap[full] = short
    return abbrMap[this.name] || this.name
  }

  get imgs() {
    if (this._imgs) return this._imgs
    const name = this.name
    /* 路径相对于 genshin 的 pluResPath（plugins/genshin/resources/） */
    this._imgs = {
      face: (imgExist(`plugins/liulian-plugin/resources/genshin/logo/role/${name}`) || "")
        .replace(/^plugins\/liulian-plugin\/resources\//, "../../liulian-plugin/resources/"),
      side: (imgExist(`plugins/liulian-plugin/resources/genshin/gacha/character/${name}`) || "")
        .replace(/^plugins\/liulian-plugin\/resources\//, "../../liulian-plugin/resources/"),
      gacha: (imgExist(`plugins/liulian-plugin/resources/genshin/gacha/character/${name}`) || "")
        .replace(/^plugins\/liulian-plugin\/resources\//, "../../liulian-plugin/resources/"),
    }
    return this._imgs
  }

  /** 通过角色名查询 */
  static get(val, game = "gs") {
    if (!val || typeof val !== "string") return false
    const map = getNameToId()
    // 支持别名查询（roleId 里已有别名映射）
    const id = map[val]
    if (!id) return false
    // 取官方名称（roleId 数组第一个）
    const officialName = roleId[id]?.[0]
    if (!officialName) return false
    // 检查 element/role.yaml 中是否存在（确认是GS角色）
    const elemMap = getRoleElem()
    if (!elemMap[officialName] && game !== "sr") return false
    return new Character(officialName, game)
  }
}

class Weapon {
  constructor(name, game = "gs") {
    this.name = name
    this.game = game
    this._imgs = null
  }

  get imgs() {
    if (this._imgs) return this._imgs
    const name = this.name
    /* liulian没有武器图片资源，引用genshin的 */
    this._imgs = {
      icon: imgExist(`plugins/genshin/resources/img/weapon/${name}`)
        .replace(/^plugins\/genshin\/resources\//, "") || "",
      gacha: imgExist(`plugins/genshin/resources/img/weapon/${name}`)
        .replace(/^plugins\/genshin\/resources\//, "") || "",
    }
    return this._imgs
  }

  /** 通过武器名查询 */
  static get(name, game = "gs") {
    if (!name || typeof name !== "string") return false
    const wpMap = getWeaponType()
    if (!wpMap[name]) return false
    return new Weapon(name, game)
  }
}

export { Character, Weapon }
