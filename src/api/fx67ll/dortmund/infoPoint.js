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

// 删除统一信息点
export function delInfoPoint(infoPointIds) {
  return request({
    url: "/dortmund/info/point/" + infoPointIds,
    method: "delete",
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

// 批量导入前端预览并确认的信息点 JSON；后端统一解析赛季、球队和比赛引用并整批事务写入。
export function importInfoPointJson(infoPoints) {
  return request({
    url: "/dortmund/info/point/importJson",
    method: "post",
    data: infoPoints,
    timeout: 120000,
    repeatSubmit: false,
  });
}

// 查询比赛的有效信息点（只读，按比赛分出将进入分析与被排除）
export function listValidInfoPoint(matchId) {
  return request({
    url: "/dortmund/info/point/valid/" + matchId,
    method: "get",
  });
}
