export const helpCfg = {
  theme: 'default',
  themeExclude: [],
  colCount: 3,
  layoutAuto: true
}

export const helpList = [
  {
    group: '热搜查询',
    list: [
      {
        icon: 86,
        title: "#热搜",
        desc: "全网热搜榜，支持：微博/知乎/百度/抖音/B站/CSDN/少数派"
      },
      {
        icon: 87,
        title: "#热搜词云",
        desc: "生成热搜词云图"
      },
      {
        icon: 88,
        title: "#热搜趋势",
        desc: "生成热搜趋势图"
      }
    ]
  },
  {
    group: '使用说明',
    list: [
      {
        icon: 90,
        title: "查询热搜",
        desc: "#热搜（查看所有平台）、#热搜微博、#热搜知乎、#热搜百度、#热搜抖音、#热搜B站、#热搜CSDN、#热搜少数派"
      },
      {
        icon: 91,
        title: "关键词订阅",
        desc: "#订阅关键词[关键词] 订阅关键词出现时自动通知、#取消订阅[关键词] 取消订阅、#查看订阅 查看已订阅关键词"
      },
      {
        icon: 92,
        title: "屏蔽词管理",
        desc: "#添加群屏蔽词[词] 添加群屏蔽词、#删除群屏蔽词[词] 删除群屏蔽词、#查看屏蔽词 查看群屏蔽词列表"
      },
      {
        icon: 93,
        title: "定时推送",
        desc: "#开启热搜推送 开启定时推送、#关闭热搜推送 关闭定时推送、#设置推送时间[时间] 设置推送时间、#设置推送平台[平台] 设置推送平台"
      },
      {
        icon: 94,
        title: "可视化功能",
        desc: "#热搜词云 生成当前热搜词云图、#热搜趋势 生成热搜趋势图，展示排名变化"
      }
    ]
  },
  {
    group: '关键词订阅',
    list: [
      {
        icon: 95,
        title: "#订阅关键词",
        desc: "订阅热搜关键词，出现时自动通知"
      },
      {
        icon: 96,
        title: "#取消订阅",
        desc: "取消已订阅的关键词"
      },
      {
        icon: 97,
        title: "#查看订阅",
        desc: "查看当前订阅的关键词列表"
      }
    ]
  },
  {
    group: '屏蔽词管理',
    list: [
      {
        icon: 98,
        title: "#添加群屏蔽词",
        desc: "添加群级别屏蔽词，过滤不感兴趣的热搜"
      },
      {
        icon: 99,
        title: "#删除群屏蔽词",
        desc: "删除群级别屏蔽词"
      },
      {
        icon: 100,
        title: "#查看屏蔽词",
        desc: "查看当前群的屏蔽词列表"
      }
    ]
  },
  {
    group: '订阅管理（主人）',
    auth: 'master',
    list: [
      {
        icon: 70,
        title: "#添加全局屏蔽词",
        desc: "添加全局屏蔽词，所有群生效"
      },
      {
        icon: 71,
        title: "#删除全局屏蔽词",
        desc: "删除全局屏蔽词"
      },
      {
        icon: 72,
        title: "#查看全局屏蔽词",
        desc: "查看全局屏蔽词列表"
      },
      {
        icon: 73,
        title: "#查看订阅申请",
        desc: "查看待处理的订阅申请"
      },
      {
        icon: 74,
        title: "#通过订阅申请",
        desc: "通过订阅申请（需指定申请ID）"
      },
      {
        icon: 75,
        title: "#拒绝订阅申请",
        desc: "拒绝订阅申请（需指定申请ID）"
      }
    ]
  },
  {
    group: '定时推送',
    list: [
      {
        icon: 76,
        title: "#开启热搜推送",
        desc: "开启定时推送热搜功能"
      },
      {
        icon: 77,
        title: "#关闭热搜推送",
        desc: "关闭定时推送热搜功能"
      },
      {
        icon: 78,
        title: "#设置推送时间",
        desc: "设置定时推送的时间"
      },
      {
        icon: 79,
        title: "#设置推送平台",
        desc: "设置推送的热搜平台"
      },
      {
        icon: 80,
        title: "#热搜推送列表",
        desc: "查看当前推送配置"
      }
    ]
  },
  {
    group: '其他帮助（部分功能帮助为独立帮助，榴莲帮助内不包括）',
    list: [
      {
        icon: 84,
        title: "B站推送帮助",
        desc: "查看B站推送帮助"
      },
      {
        icon: 89,
        title: "地下地图帮助",
        desc: "查看地下地图使用帮助"
      },
      {
        icon: 100,
        title: "汤圆帮助",
        desc: "查看汤圆帮助"
      },
      {
        icon: 79,
        title: "插件管理帮助",
        desc: "查看插件管理帮助"
      }
    ]
  }
]