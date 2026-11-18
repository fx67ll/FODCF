/**
 * Dortmund 业务编码生成器。
 *
 * 生成值保持在数据库 23 位长度限制内，由可读前缀、本地业务日期和随机后缀组成。
 * 全局唯一性仍由后端校验；发生冲突时可直接在表单中重新生成，不改变手工录入规则。
 */

const CODE_PREFIXES = Object.freeze({
  season: "SEA",
  team: "TEAM",
  match: "MATCH",
  odds: "ODDS",
});

const CODE_SUFFIX_LENGTH = 6;
const CODE_SUFFIX_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatLocalDateToken(date) {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(
    date.getDate()
  )}`;
}

// 从业务日期中提取 yyyyMMdd；无法识别时回退到当前本地日期
export function formatBusinessDateToken(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatLocalDateToken(value);
  }
  const text = value == null ? "" : String(value).trim();
  const dateMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    return `${dateMatch[1]}${dateMatch[2]}${dateMatch[3]}`;
  }
  return formatLocalDateToken(new Date());
}

// 优先使用浏览器安全随机源；不支持时回退到 Math.random，不阻塞表单录入
function createRandomSuffix() {
  const result = [];
  const cryptoApi = typeof window !== "undefined" ? window.crypto : null;
  if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
    const randomBytes = new Uint8Array(CODE_SUFFIX_LENGTH);
    cryptoApi.getRandomValues(randomBytes);
    randomBytes.forEach((byte) => {
      result.push(CODE_SUFFIX_ALPHABET[byte % CODE_SUFFIX_ALPHABET.length]);
    });
    return result.join("");
  }
  for (let index = 0; index < CODE_SUFFIX_LENGTH; index += 1) {
    result.push(
      CODE_SUFFIX_ALPHABET[
        Math.floor(Math.random() * CODE_SUFFIX_ALPHABET.length)
      ]
    );
  }
  return result.join("");
}

/**
 * 生成符合 Dortmund 基础资料编码规则的值。
 *
 * @param {"season"|"team"|"match"|"odds"} kind 业务类型
 * @param {string|Date|null} dateValue 业务日期，例如赛季开始日、比赛时间、来源时间
 * @returns {string} 例如 MATCH-20261118-7K2F9A
 */
export function generateBusinessCode(kind, dateValue) {
  const prefix = CODE_PREFIXES[kind];
  if (!prefix) {
    throw new Error(`Unsupported Dortmund code kind: ${kind}`);
  }
  return `${prefix}-${formatBusinessDateToken(
    dateValue
  )}-${createRandomSuffix()}`;
}

export default generateBusinessCode;
