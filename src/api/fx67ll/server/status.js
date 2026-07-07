import request from "@/utils/common/request";

/**
 * 获取公开服务状态总览（游客免登录，脱敏聚合数据）
 * isToken: false 显式声明不带 token，走后端 @Anonymous 白名单接口
 * @returns {Promise} 脱敏状态快照
 */
export function getPublicStatusOverview() {
  return request({
    url: "/public/status/overview",
    method: "get",
    headers: { isToken: false },
  });
}
