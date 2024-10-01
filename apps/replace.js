const _path = process.cwd();
const replace_list = {
  "^/": "#",
}
export const rule = {
  replace: {
    reg: "",
    priority: -10,
    describe: "",
  }
};
export async function replace(e){
    for (const key in replace_list) try {
      const reg = RegExp(key)
      if (!reg.test(e.msg)) continue
      e.msg = e.msg.replace(reg, replace_list[key])
    } catch (err) {}
}