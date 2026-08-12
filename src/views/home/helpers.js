import * as echarts from "echarts";

/** 图表配色：以绿色为主，辅以互补色，保持清新统一 */
export const CHART_PALETTE = [
  "#2ECC71",
  "#58D68D",
  "#82E0AA",
  "#F5B041",
  "#5DADE2",
  "#AF7AC5",
  "#EC7063",
];

/** 拼接父子路由 path */
function joinPath(parent, child) {
  if (!child) return parent || "/";
  if (/^(https?:)?\/\//.test(child)) return child;
  if (child.charAt(0) === "/") return child;
  return `${parent || ""}/${child}`.replace(/\/{2,}/g, "/");
}

/**
 * 收集当前用户可访问的叶子菜单（用于「常用入口」回退展示）
 */
export function collectAccessibleMenus(routes, parentPath = "") {
  const menus = [];
  (routes || []).forEach((route) => {
    if (!route || route.hidden) return;
    const path = joinPath(parentPath, route.path);
    const children = collectAccessibleMenus(route.children, path);
    if (children.length) {
      menus.push(...children);
      return;
    }
    if (route.meta && route.meta.title && path !== "/index") {
      menus.push({
        path,
        title: route.meta.title,
        icon: route.meta.icon || "menu",
        count: 0,
      });
    }
  });
  return menus;
}

/** 根据时段返回问候语 */
export function greetingText() {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

/** 格式化日期为「YYYY年M月D日 HH:mm」 */
export function formatClock(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}年${
    date.getMonth() + 1
  }月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 构建近 7 天访问趋势折线图 option */
export function buildTrendOption(trend = [], palette = CHART_PALETTE) {
  return {
    grid: { left: 6, right: 10, top: 24, bottom: 6, containLabel: true },
    tooltip: { trigger: "axis", formatter: "{b}<br/>菜单打开：{c} 次" },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: trend.map((item) => item.label),
      axisLine: { lineStyle: { color: "#dfe7e2" } },
      axisTick: { show: false },
      axisLabel: { color: "#7c8b84" },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#7c8b84" },
      splitLine: { lineStyle: { color: "#eef3f0", type: "dashed" } },
    },
    series: [
      {
        type: "line",
        smooth: 0.35,
        symbol: "circle",
        symbolSize: 7,
        data: trend.map((item) => item.count),
        lineStyle: { color: palette[0], width: 3 },
        itemStyle: { color: palette[0], borderColor: "#fff", borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(46, 204, 113, 0.26)" },
            { offset: 1, color: "rgba(46, 204, 113, 0.02)" },
          ]),
        },
      },
    ],
  };
}

/** 构建功能访问分布饼图 option */
export function buildCategoryOption(categories = [], palette = CHART_PALETTE) {
  return {
    color: palette,
    tooltip: { trigger: "item", formatter: "{b}<br/>{c} 次（{d}%）" },
    legend: {
      type: "scroll",
      bottom: 0,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: "#7c8b84" },
    },
    series: [
      {
        type: "pie",
        radius: ["46%", "68%"],
        center: ["50%", "44%"],
        avoidLabelOverlap: true,
        label: { show: false },
        itemStyle: { borderColor: "#fff", borderWidth: 3, borderRadius: 6 },
        data: categories.map((item) => ({
          name: item.name,
          value: item.value,
        })),
      },
    ],
  };
}

/** 构建号码台账逐彩种柱状图 option（5 个彩种：总购买金额 vs 中奖金额） */
export function buildLotteryTypeOption(stats = [], palette = CHART_PALETTE) {
  const labels = stats.map((item) => item.label);
  return {
    grid: { left: 4, right: 12, top: 30, bottom: 6, containLabel: true },
    legend: {
      top: 0,
      right: 4,
      icon: "roundRect",
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { color: "#7c8b84", fontSize: 11 },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const lines = params.map(
          (p) => `${p.marker} ${p.seriesName}：￥${p.value}`
        );
        return `${params[0].name}<br/>${lines.join("<br/>")}`;
      },
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLine: { lineStyle: { color: "#dfe7e2" } },
      axisTick: { show: false },
      axisLabel: { color: "#7c8b84", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#7c8b84",
        formatter: (value) => (value >= 1000 ? `${value / 1000}k` : value),
      },
      splitLine: { lineStyle: { color: "#eef3f0", type: "dashed" } },
    },
    series: [
      {
        name: "总购买金额",
        type: "bar",
        barGap: "20%",
        barCategoryGap: "45%",
        data: stats.map((item) => item.spent),
        itemStyle: { color: palette[3], borderRadius: [4, 4, 0, 0] },
      },
      {
        name: "中奖金额",
        type: "bar",
        data: stats.map((item) => item.won),
        itemStyle: { color: palette[0], borderRadius: [4, 4, 0, 0] },
      },
    ],
  };
}

/**
 * 每日新鲜内容池（纯前端，按日期轮换，不依赖运行时 AI 调用）
 * 同一天打开首页内容稳定，跨天自动换一条，带来每日新鲜感
 */
const DAILY_TIPS = [
  "清晨先扫一眼号码台账，确认昨夜开奖是否需要补录。",
  "上线前记得比对前后端接口字段，避免脱敏字段回流前端。",
  "服务脉搏要看「进程运行 / 系统开机」占比，低于阈值说明近期重启过。",
  "号码台账金额以弹窗逐彩种统计为准，跨彩种求和会重复计入汇总行。",
  "备忘录随手记下当天的待办与灵感，富文本支持列表与代码块。",
  "公开服务状态页对游客免登录，展示的均为脱敏聚合数据。",
  "常用入口会按近 7 天本机使用频率自动排序，越用越顺手。",
  "盈亏记录记得及时落袋，避免月底统计遗漏。",
  "排查首页动效失效，先检查系统是否开启了「减少动态效果」。",
  "公告详情改成了信封样式，未拆阅前无法关闭公告条。",
  "iframe 加载通勤地图较慢时，可直接用「新窗口打开」。",
  "技术选型卡片悬浮可高亮，点击技术点会跟随主色填充。",
  "登录验证码切回页签会自动刷新，无需手动点。",
  "号码台账支持同期号同类型一键合并，减少冗余记录。",
  "把高频菜单固定在常用入口，能让仪表盘越用越贴合自己。",
  "运行稳定性 = 应用进程持续运行天数 ÷ 系统开机天数。",
];

const DAILY_QUOTES = [
  "代码如镜，照见的是昨天的自己。",
  "稳定，是给用户最好的功能。",
  "把复杂留给自己，把简单交给用户。",
  "每一次重启都是一次反思的机会。",
  "数据不会说谎，但聚合方式会。",
  "小步快跑，频繁验证。",
  "注释是写给未来的自己的信。",
  "首页是产品的门面，细节决定温度。",
  "能用配置解决的，就不要写死代码。",
  "权限边界清晰，系统才安稳。",
  "刷新一下，世界又是新的。",
  "记录是为了更好地遗忘。",
  "动效是沉默的引导。",
  "把每个 403 都当作一次设计提醒。",
  "清晨的第一行代码，配一杯咖啡。",
  "日拱一卒，功不唐捐。",
];

/** 计算一年中的第几天（用于内容按日轮换的稳定种子） */
function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / 86400000);
}

/** 取当日新鲜内容（提示 + 一言），同一天稳定、跨天轮换 */
export function dailyFreshContent(date = new Date()) {
  const idx = dayOfYear(date);
  return {
    tip: DAILY_TIPS[idx % DAILY_TIPS.length],
    quote: DAILY_QUOTES[idx % DAILY_QUOTES.length],
  };
}

/**
 * 管理员默认常用入口的分组定义：label 为对外名称，keys 为菜单标题匹配别名
 * 用于无本机使用记录时的默认入口（需求 #4）
 */
export const DEFAULT_QUICK_GROUPS = [
  { label: "每日总览", keys: ["总览", "概览", "日报", "首页"] },
  { label: "盈亏", keys: ["盈亏", "外快"] },
  { label: "备忘录", keys: ["备忘", "富文本", "笔记", "记录"] },
  { label: "常用链接", keys: ["链接", "友情", "外链"] },
];

/** 按当前时段给出默认入口分组的优先排序（需求 #5：按时段动态切换） */
export function timeBasedDefaultGroups(hour = new Date().getHours()) {
  if (hour < 6) return ["备忘录", "常用链接", "每日总览", "盈亏"];
  if (hour < 11) return ["每日总览", "盈亏", "常用链接", "备忘录"];
  if (hour < 14) return ["盈亏", "每日总览", "常用链接", "备忘录"];
  if (hour < 18) return ["盈亏", "备忘录", "每日总览", "常用链接"];
  return ["备忘录", "常用链接", "盈亏", "每日总览"];
}

/**
 * 在可访问菜单中按时段优先级挑选默认常用入口
 * @param {Array} accessibleMenus 可访问叶子菜单
 * @param {number} hour 当前小时
 * @returns {Array} 默认入口数组
 */
export function pickDefaultQuickMenus(
  accessibleMenus,
  hour = new Date().getHours()
) {
  const menus = (accessibleMenus || []).filter(
    (item) => item.path !== "/index" && !/\/tool\/build/.test(item.path)
  );
  const picked = [];
  timeBasedDefaultGroups(hour).forEach((label) => {
    const group = DEFAULT_QUICK_GROUPS.find((item) => item.label === label);
    if (!group) return;
    const match = menus.find(
      (item) =>
        group.keys.some((key) => (item.title || "").indexOf(key) !== -1) &&
        !picked.find((p) => p.path === item.path)
    );
    if (match) picked.push(match);
  });
  return picked;
}
