import request from "@/utils/common/request";

/**
 * 获取Fail2ban服务整体状态
 */
export function getFail2banStatus() {
  return request({
    url: "/server/fail2ban/status",
    method: "get",
  });
}

/**
 * 获取所有监狱的状态列表
 */
export function getJailList() {
  return request({
    url: "/server/fail2ban/jails",
    method: "get",
  });
}

/**
 * 获取单个监狱的详细信息
 * @param {String} jailName 监狱名称
 */
export function getJailDetail(jailName) {
  return request({
    url: `/server/fail2ban/jail/${jailName}`,
    method: "get",
  });
}

/**
 * 获取所有被封禁的IP（跨所有监狱）
 */
export function getAllBannedIps() {
  return request({
    url: "/server/fail2ban/all-banned-ips",
    method: "get",
  });
}

/**
 * 获取最近的Fail2ban日志（支持参数化）
 * @param {Object} params 查询参数
 * @param {Number} params.limit 返回日志条数（1-1000，默认200）
 * @param {String} params.level 日志级别筛选（ERROR/WARN/INFO/DEBUG）
 * @param {String} params.jail 监狱名称筛选
 */
export function getRecentLogs(params) {
  return request({
    url: "/server/fail2ban/logs",
    method: "get",
    params: params,
  });
}

/**
 * 获取攻击统计数据
 * 包含按监狱统计的攻击次数、攻击来源Top 20和最近24小时攻击趋势
 */
export function getAttackStats() {
  return request({
    url: "/server/fail2ban/stats",
    method: "get",
  });
}
