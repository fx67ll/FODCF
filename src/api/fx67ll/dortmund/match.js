import request from "@/utils/common/request";

// 查询比赛记录列表
export function listMatch(query) {
  return request({
    url: "/dortmund/match/list",
    method: "get",
    params: query,
  });
}

// 查询比赛记录详细
export function getMatch(matchId) {
  return request({
    url: "/dortmund/match/" + matchId,
    method: "get",
  });
}

// 新增比赛记录
export function addMatch(data) {
  return request({
    url: "/dortmund/match",
    method: "post",
    data: data,
  });
}

// 修改比赛记录
export function updateMatch(data) {
  return request({
    url: "/dortmund/match",
    method: "put",
    data: data,
  });
}

// 删除比赛记录
export function delMatch(matchId) {
  return request({
    url: "/dortmund/match/" + matchId,
    method: "delete",
  });
}

// 导入用户在预览中确认勾选的标准化比赛 JSON；后端执行当前用户引用解析、全局唯一性校验和整批事务写入。
export function importMatchJson(matches) {
  return request({
    url: "/dortmund/match/importJson",
    method: "post",
    data: matches,
    timeout: 120000,
    repeatSubmit: false,
  });
}
