import request from "@/utils/common/request";

// 查询倍率记录列表
export function listOdds(query) {
  return request({
    url: "/dortmund/odds/list",
    method: "get",
    params: query,
  });
}

// 查询倍率记录详细
export function getOdds(oddsId) {
  return request({
    url: "/dortmund/odds/" + oddsId,
    method: "get",
  });
}

// 查询比赛当前有效倍率记录
export function getActiveOdds(matchId) {
  return request({
    url: "/dortmund/odds/active/" + matchId,
    method: "get",
  });
}

// 新增倍率记录
export function addOdds(data) {
  return request({
    url: "/dortmund/odds",
    method: "post",
    data: data,
  });
}

// 修改倍率记录
export function updateOdds(data) {
  return request({
    url: "/dortmund/odds",
    method: "put",
    data: data,
  });
}

// 切换比赛当前有效倍率记录
export function activateOdds(oddsId) {
  return request({
    url: "/dortmund/odds/" + oddsId + "/activate",
    method: "post",
  });
}

// 删除倍率记录
export function delOdds(oddsId) {
  return request({
    url: "/dortmund/odds/" + oddsId,
    method: "delete",
  });
}
