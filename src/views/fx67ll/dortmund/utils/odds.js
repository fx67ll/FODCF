k/*
 * Dortmund 倍率字段定义与通用校验规则
 * 与 fx67ll_dortmund_odds 表结构、DortmundFieldValidator 及六类倍率字典保持一致
 */

import {
  DORTMUND_LIMITS,
  decimalRule,
  optionalTextRule,
  requiredTextRule,
  trimText,
} from "./validation";

// 权重统一使用0-1区间；接口最多四位小数，落库由后端放大10000倍保存为整数
export const ODDS_WEIGHT_MIN = 0;
export const ODDS_WEIGHT_MAX = 1;
export const ODDS_WEIGHT_DEFAULT = "1.0000";

// 权重展示统一补齐四位小数，空值按业务默认权重显示
export function formatOddsWeight(value, emptyText = ODDS_WEIGHT_DEFAULT) {
  if (value === null || value === undefined || value === "") {
    return emptyText;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(4) : String(value);
}

// 六类倍率固定展示顺序；组件、列表摘要与提交字段共用，避免不同入口出现偏差
export const ODDS_MATRIX_ROWS = Object.freeze([
  {
    key: "homeWin",
    type: "HW",
    oddsField: "homeWinOdds",
    weightField: "homeWinWeight",
    oddsLabel: "主胜倍率",
    weightLabel: "主胜权重",
  },
  {
    key: "draw",
    type: "DR",
    oddsField: "drawOdds",
    weightField: "drawWeight",
    oddsLabel: "平局倍率",
    weightLabel: "平局权重",
  },
  {
    key: "awayWin",
    type: "AW",
    oddsField: "awayWinOdds",
    weightField: "awayWinWeight",
    oddsLabel: "客胜倍率",
    weightLabel: "客胜权重",
  },
  {
    key: "handicapHomeWin",
    type: "HH",
    oddsField: "handicapHomeWinOdds",
    weightField: "handicapHomeWinWeight",
    oddsLabel: "让分主胜倍率",
    weightLabel: "让分主胜权重",
  },
  {
    key: "handicapDraw",
    type: "HD",
    oddsField: "handicapDrawOdds",
    weightField: "handicapDrawWeight",
    oddsLabel: "让分平局倍率",
    weightLabel: "让分平局权重",
  },
  {
    key: "handicapAwayWin",
    type: "HA",
    oddsField: "handicapAwayWinOdds",
    weightField: "handicapAwayWinWeight",
    oddsLabel: "让分客胜倍率",
    weightLabel: "让分客胜权重",
  },
]);

// 倍率提交字段固定清单，新增或复制版本时只保留数据库认可字段
export const ODDS_FORM_FIELDS = Object.freeze([
  "oddsCode",
  "sourceTime",
  "handicapValue",
  ...ODDS_MATRIX_ROWS.reduce((fields, row) => fields.concat([row.oddsField, row.weightField]), []),
  "oddsRemark",
]);

const LOCAL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?$/;
const ZONED_DATE_TIME_PATTERN = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?(Z|[+-]\d{2}:?\d{2})$/i;

function padNumber(value, length = 2) {
  return String(value).padStart(length, "0");
}

// Java Date 默认使用 ISO-8601 反序列化；按浏览器本地时区补齐毫秒和偏移量，避免与后端解析格式冲突
function formatLocalDateTime(date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
    + `T${padNumber(date.getHours())}:${padNumber(date.getMinutes())}:${padNumber(date.getSeconds())}`
    + `.${padNumber(date.getMilliseconds(), 3)}`
    + `${offsetSign}${padNumber(Math.floor(absoluteOffset / 60))}:${padNumber(absoluteOffset % 60)}`;
}

function normalizeZonedDateTime(text) {
  const match = text.match(ZONED_DATE_TIME_PATTERN);
  if (!match) {
    return null;
  }
  const [, datePart, hourMinute, second, millisecond, zone] = match;
  const normalizedZone = zone.toUpperCase() === "Z"
    ? "Z"
    : zone.includes(":") ? zone : `${zone.slice(0, 3)}:${zone.slice(3)}`;
  return `${datePart}T${hourMinute}:${second || "00"}.${(millisecond || "").padEnd(3, "0")}${normalizedZone}`;
}

// 将日期选择器的本地时间转换为后端 Jackson 可解析的 yyyy-MM-dd'T'HH:mm:ss.SSSX 格式
export function toJacksonDateTime(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : formatLocalDateTime(value);
  }
  if (typeof value === "number") {
    const numericDate = new Date(value);
    return Number.isNaN(numericDate.getTime()) ? null : formatLocalDateTime(numericDate);
  }
  const text = String(value).trim();
  if (!text) {
    return null;
  }
  const zonedDateTime = normalizeZonedDateTime(text);
  if (zonedDateTime) {
    return zonedDateTime;
  }
  const match = text.match(LOCAL_DATE_TIME_PATTERN);
  if (!match) {
    return text;
  }
  const [, year, month, day, hour, minute, second, millisecond] = match;
  const localDate = new Date(0);
  localDate.setFullYear(Number(year), Number(month) - 1, Number(day));
  localDate.setHours(Number(hour), Number(minute), Number(second || 0), Number((millisecond || "").padEnd(3, "0")));
  const isValid = localDate.getFullYear() === Number(year)
    && localDate.getMonth() === Number(month) - 1
    && localDate.getDate() === Number(day)
    && localDate.getHours() === Number(hour)
    && localDate.getMinutes() === Number(minute)
    && localDate.getSeconds() === Number(second || 0);
  return isValid ? formatLocalDateTime(localDate) : text;
}

// 构建空白倍率表单，新增比赛、独立倍率和比赛侧边面板共用
export function buildEmptyOdds() {
  return ODDS_FORM_FIELDS.reduce((form, field) => {
    form[field] = null;
    return form;
  }, {});
}

// 生成 el-form 规则；prefix 用于比赛编排中的 newOdds 嵌套对象
export function buildOddsRules(prefix = "") {
  const path = (field) => `${prefix}${field}`;
  const rules = {
    [path("oddsCode")]: [requiredTextRule("倍率编码", DORTMUND_LIMITS.oddsCode)],
    [path("sourceTime")]: [
      { required: true, message: "来源时间不能为空", trigger: "change" },
    ],
    [path("handicapValue")]: [
      decimalRule("让分值", {
        required: true,
        allowNegative: true,
        maxIntegerDigits: 6,
        maxFractionDigits: 2,
      }),
    ],
    [path("oddsRemark")]: [
      optionalTextRule("记录说明", DORTMUND_LIMITS.oddsRemark),
    ],
  };

  ODDS_MATRIX_ROWS.forEach((row) => {
    rules[path(row.oddsField)] = [
      decimalRule(row.oddsLabel, {
        required: true,
        minExclusive: 0,
        maxIntegerDigits: 6,
        maxFractionDigits: 4,
      }),
    ];
    rules[path(row.weightField)] = [
      decimalRule(row.weightLabel, {
        min: ODDS_WEIGHT_MIN,
        max: ODDS_WEIGHT_MAX,
        maxIntegerDigits: 1,
        maxFractionDigits: 4,
      }),
    ];
  });
  return rules;
}

// 只保留倍率字段并去除首尾空白，避免复制版本时把主键、归属和审计字段带入请求
export function trimOddsFields(source = {}) {
  return ODDS_FORM_FIELDS.reduce((target, field) => {
    target[field] = field === "sourceTime" ? toJacksonDateTime(source[field]) : trimText(source[field]);
    return target;
  }, {});
}
