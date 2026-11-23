/**
 * 统一格式化记录审计人。
 * 第三方导入或历史数据的用户名字段可能为空，此时明确标记为“系统导入”，不伪造具体用户。
 */
export function formatAuditActor(value, fallback = "系统导入") {
  const normalized =
    value === null || value === undefined ? "" : String(value).trim();
  return normalized || fallback;
}
