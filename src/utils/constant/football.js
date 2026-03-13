// 球队地区预选选项数组
export const teamCountryOptions = [
  // 五大联赛
  { label: "德甲", value: "德甲" },
  { label: "英超", value: "英超" },
  { label: "西甲", value: "西甲" },
  { label: "意甲", value: "意甲" },
  { label: "法甲", value: "法甲" },
  // 国家队
  { label: "世界杯", value: "世界杯" },
  { label: "欧洲杯", value: "欧洲杯" },
  { label: "德国", value: "德国" },
  { label: "英国", value: "英国" },
  { label: "西班牙", value: "西班牙" },
  { label: "意大利", value: "意大利" },
  { label: "法国", value: "法国" },
  // 新增：五大联赛国内杯赛
  { label: "德国杯", value: "德国杯" },
  { label: "英格兰足总杯", value: "英格兰足总杯" },
  { label: "英格兰联赛杯", value: "英格兰联赛杯" },
  { label: "西班牙国王杯", value: "西班牙国王杯" },
  { label: "意大利杯", value: "意大利杯" },
  { label: "法国杯", value: "法国杯" },
  { label: "法国联赛杯", value: "法国联赛杯" },
  // 新增：五大联赛关联的洲际/顶级杯赛
  { label: "欧冠", value: "欧冠" },
  { label: "欧联杯", value: "欧联杯" },
  { label: "欧协联", value: "欧协联" },
  { label: "欧洲超级杯", value: "欧洲超级杯" },
  { label: "德国超级杯", value: "德国超级杯" },
  { label: "社区盾杯", value: "社区盾杯" },
  { label: "西班牙超级杯", value: "西班牙超级杯" },
  { label: "意大利超级杯", value: "意大利超级杯" },
  { label: "法国超级杯", value: "法国超级杯" },
  // 其他，杂七杂八
  { label: "德乙", value: "德乙" },
  { label: "英冠", value: "英冠" },
  { label: "荷甲", value: "荷甲" },
  { label: "日职", value: "日职" },
  { label: "日乙", value: "日乙" },
  { label: "韩职", value: "韩职" },
  { label: "中超", value: "中超" },
  { label: "中甲", value: "中甲" },
  { label: "亚洲杯", value: "亚洲杯" },
];

// 球队标签预设选项数组
export const teamTagOptions = [
  // 基础标签 - 中性/主队相关
  { label: "我横", value: "我横", type: "warning" }, // 我横-黄色
  { label: "主队", value: "主队", type: "info" }, // 中性/主队相关 - 灰色
  { label: "窝里横", value: "窝里横", type: "warning" }, // 偏负面中性
  // 主场/客场表现
  { label: "主场龙", value: "主场龙", type: "success" }, // 正向-绿色
  { label: "客场虫", value: "客场虫", type: "danger" }, // 负向-红色
  { label: "血脉压制", value: "血脉压制", type: "primary" }, // 优势-深蓝
  { label: "平局大师", value: "平局大师", type: "info" }, // 中性-灰色
  { label: "杯赛大师", value: "杯赛大师", type: "info" }, // 中性-灰色
  { label: "二队出战", value: "二队出战", type: "warning" }, // 提醒-黄色
  // 比赛风格类
  { label: "攻势足球", value: "攻势足球", type: "success" }, // 正向-绿色
  { label: "防守反击", value: "防守反击", type: "primary" }, // 战术-深蓝
  { label: "传控流", value: "传控流", type: "info" }, // 中性-灰色
  { label: "摆大巴", value: "摆大巴", type: "warning" }, // 偏保守-黄色
  { label: "高空轰炸", value: "高空轰炸", type: "primary" }, // 战术-深蓝
  // 状态表现类
  { label: "状态火热", value: "状态火热", type: "success" }, // 正向-绿色
  { label: "状态低迷", value: "状态低迷", type: "danger" }, // 负向-红色
  { label: "连胜势头", value: "连胜势头", type: "success" }, // 正向-绿色
  { label: "连败颓势", value: "连败颓势", type: "danger" }, // 负向-红色
  { label: "绝杀专业户", value: "绝杀专业户", type: "success" }, // 正向-绿色
  { label: "被逆转之王", value: "被逆转之王", type: "danger" }, // 负向-红色
  // 球队特质类
  { label: "青年近卫军", value: "青年近卫军", type: "info" }, // 中性-灰色
  { label: "老牌劲旅", value: "老牌劲旅", type: "primary" }, // 核心-深蓝
  { label: "升班马", value: "升班马", type: "warning" }, // 提醒-黄色
  { label: "保级队", value: "保级队", type: "danger" }, // 危机-红色
  { label: "争冠热门", value: "争冠热门", type: "success" }, // 正向-绿色
  { label: "点球大战专家", value: "点球大战专家", type: "primary" }, // 优势-深蓝
  // 战术特点类
  { label: "边路飞翼", value: "边路飞翼", type: "success" }, // 正向-绿色
  { label: "中场绞肉机", value: "中场绞肉机", type: "warning" }, // 强硬-黄色
  { label: "定位球高手", value: "定位球高手", type: "primary" }, // 优势-深蓝
  { label: "门将开挂", value: "门将开挂", type: "success" }, // 正向-绿色
  { label: "锋线哑火", value: "锋线哑火", type: "danger" }, // 负向-红色
];

// 球场预设选项数组
export const teamVenueOptions = [
  {
    label: "伊度纳信号公园球场",
    value: "伊度纳信号公园球场",
    team: "多特蒙德",
  },
  {
    label: "老特拉福德球场",
    value: "老特拉福德球场",
    team: "曼联",
  },
  {
    label: "安菲尔德球场",
    value: "安菲尔德球场",
    team: "利物浦",
  },
  {
    label: "酋长球场",
    value: "酋长球场",
    team: "阿森纳",
  },
  {
    label: "伊蒂哈德球场",
    value: "伊蒂哈德球场",
    team: "曼城",
  },
  {
    label: "斯坦福桥球场",
    value: "斯坦福桥球场",
    team: "切尔西",
  },
  {
    label: "托特纳姆热刺球场",
    value: "托特纳姆热刺球场",
    team: "热刺",
  },
  {
    label: "伯纳乌球场",
    value: "伯纳乌球场",
    team: "皇家马德里",
  },
  {
    label: "诺坎普球场",
    value: "诺坎普球场",
    team: "巴塞罗那",
  },
  {
    label: "万达大都会球场",
    value: "万达大都会球场",
    team: "马德里竞技",
  },
  {
    label: "圣马梅斯球场",
    value: "圣马梅斯球场",
    team: "毕尔巴鄂竞技",
  },
  {
    label: "安联球场",
    value: "安联球场",
    team: "尤文图斯",
  },
  {
    label: "圣西罗球场",
    value: "圣西罗球场",
    team: "AC米兰",
  },
  {
    label: "朱塞佩·梅阿查球场",
    value: "朱塞佩·梅阿查球场",
    team: "国际米兰",
  },
  {
    label: "罗马奥林匹克球场",
    value: "罗马奥林匹克球场",
    team: "罗马",
  },
  {
    label: "罗马奥林匹克球场",
    value: "罗马奥林匹克球场",
    team: "拉齐奥",
  },
  {
    label: "王子公园球场",
    value: "王子公园球场",
    team: "巴黎圣日耳曼",
  },
  {
    label: "韦洛德罗姆球场",
    value: "韦洛德罗姆球场",
    team: "马赛",
  },
  {
    label: "安盟球场",
    value: "安盟球场",
    team: "里昂",
  },
  {
    label: "路易二世体育场",
    value: "路易二世体育场",
    team: "摩纳哥",
  },
];
