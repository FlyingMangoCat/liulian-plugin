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
        icon: 101,
        title: "#热搜",
        desc: "全网热搜榜，支持：微博/知乎/百度/抖音/B站/CSDN/少数派"
      },
      {
        icon: 102,
        title: "#热搜词云",
        desc: "生成热搜词云图"
      },
      {
        icon: 103,
        title: "#热搜趋势",
        desc: "生成热搜趋势图"
      }
    ]
  },
  {
    group: '关键词订阅',
    list: [
      {
        icon: 104,
        title: "#订阅关键词",
        desc: "订阅热搜关键词，出现时自动通知"
      },
      {
        icon: 105,
        title: "#取消订阅",
        desc: "取消已订阅的关键词"
      },
      {
        icon: 106,
        title: "#查看订阅",
        desc: "查看当前订阅的关键词列表"
      }
    ]
  },
  {
    group: '屏蔽词管理',
    list: [
      {
        icon: 107,
        title: "#添加群屏蔽词",
        desc: "添加群级别屏蔽词，过滤不感兴趣的热搜"
      },
      {
        icon: 108,
        title: "#删除群屏蔽词",
        desc: "删除群级别屏蔽词"
      },
      {
        icon: 109,
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
        icon: 110,
        title: "#添加全局屏蔽词",
        desc: "添加全局屏蔽词，所有群生效"
      },
      {
        icon: 111,
        title: "#删除全局屏蔽词",
        desc: "删除全局屏蔽词"
      },
      {
        icon: 112,
        title: "#查看全局屏蔽词",
        desc: "查看全局屏蔽词列表"
      },
      {
        icon: 113,
        title: "#查看订阅申请",
        desc: "查看待处理的订阅申请"
      },
      {
        icon: 114,
        title: "#通过订阅申请",
        desc: "通过订阅申请（需指定申请ID）"
      },
      {
        icon: 115,
        title: "#拒绝订阅申请",
        desc: "拒绝订阅申请（需指定申请ID）"
      }
    ]
  },
  {
    group: '定时推送',
    list: [
      {
        icon: 116,
        title: "#开启热搜推送",
        desc: "开启定时推送热搜功能"
      },
      {
        icon: 117,
        title: "#关闭热搜推送",
        desc: "关闭定时推送热搜功能"
      },
      {
        icon: 118,
        title: "#设置推送时间",
        desc: "设置定时推送的时间"
      },
      {
        icon: 119,
        title: "#设置推送平台",
        desc: "设置推送的热搜平台"
      },
      {
        icon: 120,
        title: "#热搜推送列表",
        desc: "查看当前推送配置"
      }
    ]
  }
]