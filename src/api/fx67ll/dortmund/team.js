import request from "@/utils/common/request";

// 查询球队主场、地区/联赛与标签选项（后端内置目录 + 球队表去重值）
export function getTeamOptions() {
  return request({
    url: "/dortmund/team/options",
    method: "get",
  });
}

// 查询球队管理列表
export function listTeam(query) {
  return request({
    url: "/dortmund/team/list",
    method: "get",
    params: query,
  });
}

// 查询球队管理详细
export function getTeam(teamId) {
  return request({
    url: "/dortmund/team/" + teamId,
    method: "get",
  });
}

// 新增球队管理
export function addTeam(data) {
  return request({
    url: "/dortmund/team",
    method: "post",
    data: data,
  });
}

// 修改球队管理
export function updateTeam(data) {
  return request({
    url: "/dortmund/team",
    method: "put",
    data: data,
  });
}

// 删除球队管理
export function delTeam(teamId) {
  return request({
    url: "/dortmund/team/" + teamId,
    method: "delete",
  });
}
