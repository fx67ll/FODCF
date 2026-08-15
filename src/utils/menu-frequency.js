/**
 * 菜单访问频率统计（仅本机 localStorage）
 *
 * 设计目标（对应首页需求）：
 * 1. 仅记录最近 7 个自然日的菜单访问，超期自动清理；
 * 2. 按当前登录用户隔离存储，互不污染；
 * 3. 读写均做容错，隐私模式 / 存储不可用时不影响路由跳转；
 * 4. 提供聚合 summary，供首页「常用入口」与「访问趋势 / 分布」图表使用。
 */

const STORAGE_PREFIX = "fodcf:menu-usage:";
const RETENTION_DAYS = 7;

/**
 * 统计区间类型（预留扩展）
 * 当前首页仅消费 daily；未来月/季/年数据源可按同一结构接入，不改存储与清理逻辑。
 * 读取旧 localStorage 记录时 range 缺失，按 DAILY 兜底（见 normalizeRange）。
 */
export const RANGE_TYPES = {
  DAILY: "daily",
  // 预留：WEEKLY / MONTHLY / QUARTERLY / YEARLY
};

/** 兜底：旧记录无 range 字段时按 daily 处理，保证向后兼容 */
function normalizeRange(range) {
  return range || RANGE_TYPES.DAILY;
}
// 这些路径不属于业务菜单，不记录
const EXCLUDED_PATHS = [
  "/",
  "/index",
  "/login",
  "/register",
  "/401",
  "/404",
  "/user/profile",
];

function storageKey(userName) {
  return STORAGE_PREFIX + encodeURIComponent(userName || "anonymous");
}

/** 生成 YYYY-MM-DD 的日期键 */
function dayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** 最近 7 天窗口的起始时间戳（含当天） */
function retentionCutoff() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (RETENTION_DAYS - 1));
  return start.getTime();
}

/** 读取并清理过期记录 */
function readEntries(userName) {
  let entries = [];
  try {
    entries = JSON.parse(localStorage.getItem(storageKey(userName)) || "[]");
  } catch (error) {
    entries = [];
  }
  if (!Array.isArray(entries)) return [];
  const cutoff = retentionCutoff();
  const valid = entries.filter((entry) => {
    if (!entry || !entry.path || !entry.date) return false;
    const timestamp = new Date(`${entry.date}T00:00:00`).getTime();
    if (!(Number.isFinite(timestamp) && timestamp >= cutoff)) return false;
    // 旧记录补齐 range，向后兼容
    entry.range = normalizeRange(entry.range);
    return true;
  });
  return mergeDuplicateEntries(valid);
}

/**
 * 合并同日同路径的重复记录（历史脏数据 / 时钟回拨可能产生）
 * 仅修正 count 累加口径：count 求和、lastVisitedAt 取最大，展示字段取最新一次。
 */
function mergeDuplicateEntries(entries) {
  const merged = new Map();
  entries.forEach((entry) => {
    const key = `${entry.date}|${entry.path}`;
    const existing = merged.get(key);
    entry.count = Number(entry.count) || 0;
    if (!existing) {
      merged.set(key, entry);
      return;
    }
    existing.count += entry.count;
    if ((entry.lastVisitedAt || 0) > (existing.lastVisitedAt || 0)) {
      existing.lastVisitedAt = entry.lastVisitedAt;
      existing.title = entry.title;
      existing.icon = entry.icon;
      existing.category = entry.category;
    }
  });
  return Array.from(merged.values());
}

function writeEntries(userName, entries) {
  try {
    localStorage.setItem(storageKey(userName), JSON.stringify(entries));
  } catch (error) {
    // 隐私模式或配额耗尽时静默失败，不影响导航
  }
}

/** 从路由 matched 中解析菜单标题、图标与所属分组 */
function resolveRouteMeta(route) {
  const matched = (route && route.matched) || [];
  const titled = matched.filter((record) => record.meta && record.meta.title);
  const leaf = titled[titled.length - 1];
  const parent = titled.length > 1 ? titled[titled.length - 2] : leaf;
  const path =
    (leaf && leaf.meta && leaf.meta.activeMenu) || (route && route.path) || "";
  return {
    path,
    title: (leaf && leaf.meta && leaf.meta.title) || "未命名菜单",
    icon:
      (leaf && leaf.meta && leaf.meta.icon) ||
      (parent && parent.meta && parent.meta.icon) ||
      "menu",
    category: (parent && parent.meta && parent.meta.title) || "其他",
  };
}

/**
 * 记录一次菜单访问
 * @param {object} route vue-router 的 to 对象
 * @param {string} userName 当前登录用户名
 */
export function recordMenuVisit(route, userName) {
  if (!route || !userName) return;
  const meta = resolveRouteMeta(route);
  if (
    !meta.path ||
    meta.path === "/index" ||
    EXCLUDED_PATHS.indexOf(meta.path) !== -1
  )
    return;
  if (meta.path.indexOf("/redirect/") === 0) return;

  const entries = readEntries(userName);
  const today = dayKey(new Date());
  const existing = entries.find(
    (entry) => entry.date === today && entry.path === meta.path
  );
  if (existing) {
    existing.count += 1;
    existing.lastVisitedAt = Date.now();
    existing.title = meta.title;
    existing.icon = meta.icon;
    existing.category = meta.category;
  } else {
    entries.push({
      date: today,
      path: meta.path,
      title: meta.title,
      icon: meta.icon,
      category: meta.category,
      count: 1,
      lastVisitedAt: Date.now(),
      range: RANGE_TYPES.DAILY,
    });
  }
  writeEntries(userName, entries);
}

/**
 * 读取当前用户最近 7 天的菜单访问聚合数据，供首页展示
 * @param {string} userName
 * @returns {{
 *   totalVisits: number,
 *   activeDays: number,
 *   dailyTrend: Array<{date:string,label:string,count:number}>,
 *   topMenus: Array<object>,
 *   recentMenus: Array<object>,
 *   categories: Array<{name:string,value:number}>
 * }}
 */
export function getMenuUsageSummary(userName) {
  const entries = readEntries(userName);
  const menuMap = {};
  const categoryMap = {};
  const dayMap = {};
  const dailyTrend = [];

  // 预置最近 7 天的趋势骨架，保证图表即使无数据也有连续横轴
  for (let offset = RETENTION_DAYS - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = dayKey(date);
    dayMap[key] = 0;
    dailyTrend.push({
      date: key,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      count: 0,
    });
  }

  entries.forEach((entry) => {
    const count = Number(entry.count) || 0;
    dayMap[entry.date] = (dayMap[entry.date] || 0) + count;

    const category = entry.category || "其他";
    categoryMap[category] = (categoryMap[category] || 0) + count;

    if (!menuMap[entry.path]) {
      menuMap[entry.path] = { ...entry, count: 0, dailyMap: {} };
    }
    menuMap[entry.path].count += count;
    // 累计每个菜单逐日访问次数，供首页「最近活动」迷你频次图使用
    menuMap[entry.path].dailyMap[entry.date] =
      (menuMap[entry.path].dailyMap[entry.date] || 0) + count;
    if ((entry.lastVisitedAt || 0) > (menuMap[entry.path].lastVisitedAt || 0)) {
      menuMap[entry.path].lastVisitedAt = entry.lastVisitedAt;
      menuMap[entry.path].title = entry.title;
      menuMap[entry.path].icon = entry.icon;
    }
  });

  dailyTrend.forEach((item) => {
    item.count = dayMap[item.date] || 0;
  });

  // 把每个菜单的逐日字典展开为与 dailyTrend 对齐的 7 元数组，非破坏性新增字段
  const trendDates = dailyTrend.map((item) => item.date);
  const menus = Object.values(menuMap).map((menu) => {
    const dailyMap = menu.dailyMap || {};
    const { dailyMap: _omit, ...rest } = menu;
    return {
      ...rest,
      daily: trendDates.map((date) => Number(dailyMap[date]) || 0),
    };
  });
  const byCountDesc = (a, b) =>
    (b.count || 0) - (a.count || 0) ||
    (b.lastVisitedAt || 0) - (a.lastVisitedAt || 0);
  const byRecentDesc = (a, b) =>
    (b.lastVisitedAt || 0) - (a.lastVisitedAt || 0);

  return {
    // 当前 summary 区间类型（预留月/季/年扩展）
    range: RANGE_TYPES.DAILY,
    totalVisits: entries.reduce(
      (sum, entry) => sum + (Number(entry.count) || 0),
      0
    ),
    activeDays: dailyTrend.filter((item) => item.count > 0).length,
    dailyTrend,
    topMenus: menus.slice().sort(byCountDesc),
    recentMenus: menus.slice().sort(byRecentDesc),
    categories: Object.keys(categoryMap)
      .map((name) => ({ name, value: categoryMap[name] }))
      .sort((a, b) => b.value - a.value),
  };
}
