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
  { label: "客队", value: "客队", type: "info" }, // 中性/客队 - 灰色
  { label: "德比战", value: "德比战", type: "primary" }, // 焦点对决-深蓝
  { label: "恩怨局", value: "恩怨局", type: "danger" }, // 矛盾对决-红色

  // 主场/客场表现
  { label: "主场龙", value: "主场龙", type: "success" }, // 正向-绿色
  { label: "客场虫", value: "客场虫", type: "danger" }, // 负向-红色
  { label: "客场龙", value: "客场龙", type: "success" }, // 客场强势-绿色
  { label: "主场软", value: "主场软", type: "danger" }, // 主场拉胯-红色
  { label: "血脉压制", value: "血脉压制", type: "primary" }, // 优势-深蓝
  { label: "苦主克星", value: "苦主克星", type: "primary" }, // 克制对手-深蓝
  { label: "平局大师", value: "平局大师", type: "info" }, // 中性-灰色
  { label: "杯赛大师", value: "杯赛大师", type: "info" }, // 中性-灰色
  { label: "杯赛拉胯", value: "杯赛拉胯", type: "danger" }, // 杯赛拉胯-红色
  { label: "二队出战", value: "二队出战", type: "warning" }, // 提醒-黄色
  { label: "轮换为主", value: "轮换为主", type: "warning" }, // 轮换出战-黄色
  { label: "全主力", value: "全主力", type: "success" }, // 主力尽出-绿色

  // 比赛风格类
  { label: "攻势足球", value: "攻势足球", type: "success" }, // 正向-绿色
  { label: "防守反击", value: "防守反击", type: "primary" }, // 战术-深蓝
  { label: "传控流", value: "传控流", type: "info" }, // 中性-灰色
  { label: "摆大巴", value: "摆大巴", type: "warning" }, // 偏保守-黄色
  { label: "高空轰炸", value: "高空轰炸", type: "primary" }, // 战术-深蓝
  { label: "低位防守", value: "低位防守", type: "info" }, // 战术中性-灰色
  { label: "高位逼抢", value: "高位逼抢", type: "primary" }, // 战术-深蓝
  { label: "边路冲击", value: "边路冲击", type: "success" }, // 边路强势-绿色
  { label: "大开大合", value: "大开大合", type: "warning" }, // 攻防都奔放-黄色
  { label: "稳扎稳打", value: "稳扎稳打", type: "success" }, // 稳健风格-绿色

  // 状态表现类
  { label: "状态火热", value: "状态火热", type: "success" }, // 正向-绿色
  { label: "状态低迷", value: "状态低迷", type: "danger" }, // 负向-红色
  { label: "起伏不定", value: "起伏不定", type: "warning" }, // 不稳定-黄色
  { label: "连胜势头", value: "连胜势头", type: "success" }, // 正向-绿色
  { label: "连败颓势", value: "连败颓势", type: "danger" }, // 负向-红色
  { label: "连平走势", value: "连平走势", type: "info" }, // 连续平局-灰色
  { label: "绝杀专业户", value: "绝杀专业户", type: "success" }, // 正向-绿色
  { label: "被逆转之王", value: "被逆转之王", type: "danger" }, // 负向-红色
  { label: "补时丢球", value: "补时丢球", type: "danger" }, // 末段失守-红色
  { label: "顺风稳", value: "顺风稳", type: "success" }, // 领先会守-绿色
  { label: "逆风硬", value: "逆风硬", type: "success" }, // 落后能追-绿色
  { label: "顺风浪", value: "顺风浪", type: "warning" }, // 领先后松懈-黄色

  // 球队定位&特质类
  { label: "青年近卫军", value: "青年近卫军", type: "info" }, // 中性-灰色
  { label: "老牌劲旅", value: "老牌劲旅", type: "primary" }, // 核心-深蓝
  { label: "升班马", value: "升班马", type: "warning" }, // 提醒-黄色
  { label: "降班马", value: "降班马", type: "warning" }, // 降级归来-黄色
  { label: "保级队", value: "保级队", type: "danger" }, // 危机-红色
  { label: "保级狂魔", value: "保级狂魔", type: "warning" }, // 保级经验足-黄色
  { label: "争冠热门", value: "争冠热门", type: "success" }, // 正向-绿色
  { label: "争冠梯队", value: "争冠梯队", type: "primary" }, // 争冠第二集团-深蓝
  { label: "欧战资格", value: "欧战资格", type: "primary" }, // 冲欧战-深蓝
  { label: "中游混子", value: "中游混子", type: "info" }, // 无欲无求-灰色
  { label: "土豪新军", value: "土豪新军", type: "primary" }, // 资金雄厚-深蓝
  { label: "铁血之师", value: "铁血之师", type: "success" }, // 作风硬朗-绿色
  { label: "玻璃军团", value: "玻璃军团", type: "danger" }, // 伤病多-红色
  { label: "点球大战专家", value: "点球大战专家", type: "primary" }, // 优势-深蓝

  // 战术&单点特点类
  { label: "边路飞翼", value: "边路飞翼", type: "success" }, // 正向-绿色
  { label: "中场绞肉机", value: "中场绞肉机", type: "warning" }, // 强硬-黄色
  { label: "中场大师", value: "中场大师", type: "primary" }, // 中场控制力强-深蓝
  { label: "定位球高手", value: "定位球高手", type: "primary" }, // 优势-深蓝
  { label: "定位球漏勺", value: "定位球漏勺", type: "danger" }, // 定位球防守差-红色
  { label: "门将开挂", value: "门将开挂", type: "success" }, // 正向-绿色
  { label: "门将卧底", value: "门将卧底", type: "danger" }, // 门将失误多-红色
  { label: "锋线哑火", value: "锋线哑火", type: "danger" }, // 负向-红色
  { label: "锋线狂飙", value: "锋线狂飙", type: "success" }, // 进球效率高-绿色
  { label: "后防稳如狗", value: "后防稳如狗", type: "success" }, // 防守稳固-绿色
  { label: "后防漏勺", value: "后防漏勺", type: "danger" }, // 防守容易丢球-红色
  { label: "头球强势", value: "头球强势", type: "primary" }, // 头球优势-深蓝
  { label: "防空困难", value: "防空困难", type: "danger" }, // 怕高空球-红色
  { label: "吃牌大户", value: "吃牌大户", type: "warning" }, // 容易吃牌犯规-黄色
  { label: "犯规凶悍", value: "犯规凶悍", type: "warning" }, // 对抗尺度大-黄色

  // 伤病&赛程附加标签
  { label: "伤病满营", value: "伤病满营", type: "danger" }, // 伤病严重-红色
  { label: "核心伤缺", value: "核心伤缺", type: "danger" }, // 主力缺阵-红色
  { label: "核心回归", value: "核心回归", type: "success" }, // 主力复出-绿色
  { label: "赛程密集", value: "赛程密集", type: "warning" }, // 多线作战疲劳-黄色
  { label: "多线作战", value: "多线作战", type: "warning" }, // 多线奔波-黄色
  { label: "以逸待劳", value: "以逸待劳", type: "success" }, // 休息充足-绿色

  // 玄学/球迷梗标签
  { label: "客场玄学", value: "客场玄学", type: "warning" },
  { label: "主场玄学", value: "主场玄学", type: "warning" },
  { label: "红牌体质", value: "红牌体质", type: "danger" },
  { label: "点球体质", value: "点球体质", type: "primary" },
  { label: "送点大户", value: "送点大户", type: "danger" },
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
    label: "拉齐奥奥林匹克球场",
    value: "拉齐奥奥林匹克球场",
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
