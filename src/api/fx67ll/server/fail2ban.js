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
 * @param {Number} params.limit 返回日志条数（1-1023，默认200）
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
 * @param {Object} params 查询参数
 * @param {Number} params.logLines 统计日志行数（默认10000）
 * @param {Number} params.topIpLimit 攻击IP展示Top数量，可选范围1-100，默认20
 */
export function getAttackStats(params) {
  return request({
    url: "/server/fail2ban/stats",
    method: "get",
    params: params,
  });
}

/**
 * 手动封禁指定IP
 * 【安全限制】仅超级管理员且IP在白名单中可执行
 * @param {String} jailName 监狱名称
 * @param {String} ip 要封禁的IP地址
 */
export function banIp(jailName, ip) {
  return request({
    url: `/server/fail2ban/jail/${jailName}/ban`,
    method: "post",
    params: { ip },
  });
}

/**
 * 手动解封指定IP
 * 【安全限制】仅超级管理员且IP在白名单中可执行
 * @param {String} jailName 监狱名称
 * @param {String} ip 要解封的IP地址
 */
export function unbanIp(jailName, ip) {
  return request({
    url: `/server/fail2ban/jail/${jailName}/unban`,
    method: "post",
    params: { ip },
  });
}

/**
 * 批量封禁指定IP列表（单次上限100个）
 * 【安全限制】仅超级管理员且IP在白名单中可执行
 * @param {String} jailName 监狱名称
 * @data {Array<String>} ips IP地址数组
 */
export function banBatchIps(jailName, ips) {
  return request({
    url: `/server/fail2ban/jail/${jailName}/ban-batch`,
    method: "post",
    // 核心修改：数组放请求体，不再放URL参数
    data: ips,
  });
}

/**
 * 批量解封指定IP列表（单次上限100个）
 * 【安全限制】仅超级管理员且IP在白名单中可执行
 * @param {String} jailName 监狱名称
 * @data {Array<String>} ips IP地址数组
 */
export function unbanBatchIps(jailName, ips) {
  return request({
    url: `/server/fail2ban/jail/${jailName}/unban-batch`,
    method: "post",
    data: ips,
  });
}

/**
 * 一键解封当前监狱全部封禁IP（单监狱清空）
 * 【安全限制】仅超级管理员且IP在白名单中可执行
 * @param {String} jailName 监狱名称
 */
export function unbanAllJailIps(jailName) {
  return request({
    url: `/server/fail2ban/jail/${jailName}/unban-all`,
    method: "post",
  });
}

/**
 * 全局一键解封所有监狱的所有封禁IP
 * 【安全限制】仅超级管理员且IP在白名单中可执行
 */
export function unbanAllJailsAllIps() {
  return request({
    url: "/server/fail2ban/unban-all",
    method: "post",
  });
}

/**
 * 获取当前访问IP
 */
export function getCurrentIp() {
  return request({
    url: "/server/fail2ban/current-ip",
    method: "get",
  });
}

/**
 * 启动Fail2ban服务
 * 【安全限制】仅超级管理员且IP在白名单中可执行
 */
export function startService() {
  return request({
    url: "/server/fail2ban/service/start",
    method: "post",
  });
}

/**
 * 停止Fail2ban服务
 * 【安全限制】仅超级管理员且IP在白名单中可执行
 */
export function stopService() {
  return request({
    url: "/server/fail2ban/service/stop",
    method: "post",
  });
}

/**
 * 启动指定监狱
 * 【安全限制】仅超级管理员且IP在白名单中可执行
 * @param {String} jailName 监狱名称
 */
export function startJail(jailName) {
  return request({
    url: `/server/fail2ban/jail/${jailName}/start`,
    method: "post",
  });
}

/**
 * 停止指定监狱
 * 【安全限制】仅超级管理员且IP在白名单中可执行
 * @param {String} jailName 监狱名称
 */
export function stopJail(jailName) {
  return request({
    url: `/server/fail2ban/jail/${jailName}/stop`,
    method: "post",
  });
}

/**
 * 统一修改监狱运行时临时配置
 * 仅修改内存运行态参数，重启Fail2ban服务自动恢复配置文件默认值
 * 支持配置项：bantime/findtime/maxretry/ignoreip（增删白名单IP）
 * 【安全限制】仅fx67ll角色+指定白名单IP可执行
 * @param {String} jailName 监狱名称
 * @param {Object} data 请求体参数
 * @param {String} data.configKey 配置项名称：bantime/findtime/maxretry/ignoreip
 * @param {Number|String} data.value 配置值：数值(秒/次数) 或 IPv4地址
 * @param {String} [data.action] ignoreip专用，add=添加白名单 / delete=删除白名单
 */
export function updateJailConfig(jailName, data) {
  return request({
    url: "/server/fail2ban/jail/" + jailName + "/config/update",
    method: "post",
    data: data,
  });
}
