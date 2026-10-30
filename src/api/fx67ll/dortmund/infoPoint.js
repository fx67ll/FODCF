import request from "@/utils/common/request";

// 查询统一信息点列表
export function listInfoPoint(query) {
  return request({
    url: "/dortmund/info/point/list",
    method: "get",
    params: query,
  });
}

// 查询统一信息点详细
export function getInfoPoint(infoPointId) {
  return request({
    url: "/dortmund/info/point/" + infoPointId,
    method: "get",
  });
}

// 新增统一信息点
export function addInfoPoint(data) {
  return request({
    url: "/dortmund/info/point",
    method: "post",
    data: data,
  });
}

// 修改统一信息点
export function updateInfoPoint(data) {
  return request({
    url: "/dortmund/info/point",
    method: "put",
    data: data,
  });
}

// 启用/停用统一信息点
export function changeInfoPointStatus(data) {
  return request({
    url: "/dortmund/info/point/changeStatus",
    method: "put",
    data: data,
  });
}

// 查询比赛的有效信息点（只读，按比赛分出将进入分析与被排除）
export function listValidInfoPoint(matchId) {
  return request({
    url: "/dortmund/info/point/valid/" + matchId,
    method: "get",
  });
}
