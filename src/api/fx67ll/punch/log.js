import request from "@/utils/request";

// 查询打卡记录列表
export function listLog(query) {
  return request({
    url: "/punch/log/list",
    method: "get",
    params: query,
  });
}

// 查询打卡记录详细
export function getLog(punchId) {
  return request({
    url: "/punch/log/" + punchId,
    method: "get",
  });
}

// 查询打卡工时统计
export function listTotal(query) {
  return request({
    url: "/punch/log/getWorkTotalTime",
    method: "get",
    params: query,
  });
}

// 新增打卡记录
export function addLog(data) {
  return request({
    url: "/punch/log",
    method: "post",
    data: data,
  });
}

// 修改打卡记录
export function updateLog(data) {
  return request({
    url: "/punch/log",
    method: "put",
    data: data,
  });
}

// 删除打卡记录
export function delLog(punchId) {
  return request({
    url: "/punch/log/" + punchId,
    method: "delete",
  });
}
