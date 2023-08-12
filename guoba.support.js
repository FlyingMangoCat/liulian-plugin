import path from "path";
const _path = process.cwd() + "/plugins/liulian-plugin";

/**
 *  支持锅巴配置
 */
export function supportGuoba() {
  return {
    pluginInfo: {
      name: "liulian-plugin",
      title: "榴莲插件（liulian-plugin）",
      author: "@会飞的芒果猫",
      authorLink: "https://gitee.com/huifeidemangguomao",
      link: "https://gitee.com/huifeidemangguomao/liulian-plugin",
      isV3: true,
      isV2: true,
      description: "提供原神地下地图，插件管理，B站推送，及娶群友，猜角色，榴莲问答等群聊功能",
      // 显示图标，此为个性化配置
      // 图标可在 https://icon-sets.iconify.design 这里进行搜索
      icon: "",
      // 图标颜色，例：#FF0000 或 rgb(255, 0, 0)
      iconColor: "#7CFC00",
    },
  };
}
