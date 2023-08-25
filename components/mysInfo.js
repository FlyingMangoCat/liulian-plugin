import fetch from "node-fetch";
import { render } from "./crender.js";
import lodash from "lodash";
import fs from "fs";

//角色昵称
let nameID = "";

let element = {}, genshin = {}, daily = {};

let areaName = {
  1: "蒙德",
  2: "璃月",
  3: "雪山",
  4: "稻妻",
  5: "渊下宫",
  6: "层岩巨渊",
  7: "层岩地下",
  8: "须弥",
};

await init();

export async function init (isUpdate = false) {
  let version = isUpdate ? new Date().getTime() : 0;
  genshin = await import(`../config/roleId.js?version=${version}`);
  nameID = "";
}

export function roleIdToName (keyword, search_val = false) {
  if (!keyword) {
    return false;
  }
  if (search_val) {
    if (genshin.roleId[keyword] && genshin.roleId[keyword][0]) {
      return genshin.roleId[keyword][0];
    } else {
      return "";
    }
  }

  if (!nameID) {
    nameID = new Map();
    for (let i in genshin.roleId) {
      for (let val of genshin.roleId[i]) {
        nameID.set(val, i);
      }
    }
  }
  let name = nameID.get(keyword);
  return name ? name : "";
}
export function starroleIdToName (keyword, search_val = false) {
  if (!keyword) {
    return false;
  }
  if (search_val) {
    if (genshin.starroleId[keyword] && genshin.starroleId[keyword][0]) {
      return genshin.starroleId[keyword][0];
    } else {
      return "";
    }
  }

  if (!nameID) {
    nameID = new Map();
    for (let i in genshin.starroleId) {
      for (let val of genshin.starroleId[i]) {
        nameID.set(val, i);
      }
    }
  }
  let name = nameID.get(keyword);
  return name ? name : "";
}