const replace_list = {
  "^/": "#",
}
export class input_replace extends plugin {
  constructor () {
    super({
      name: "输入替换",
      dsc: "",
      event: "message",
      priority: -10
    })
  }
  accept(e) {
    for (const key in replace_list) try {
      const reg = RegExp(key)
      if (!reg.test(e.msg)) continue
      e.msg = e.msg.replace(reg, replace_list[key])
    } catch (err) {}
  }
}