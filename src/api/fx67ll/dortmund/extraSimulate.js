import request from "@/utils/common/request";

// 查询数值模拟版本记录列表
export function listExtraSimulateVersion(query) {
  return request({
    url: "/dortmund/extra/simulate/version/list",
    method: "get",
    params: query,
  });
}

// 新增数值模拟版本记录
export function addExtraSimulateVersion(data) {
  return request({
    url: "/dortmund/extra/simulate/version",
    method: "post",
    data: data,
  });
}

// 修改数值模拟版本记录（用于版本启用停用）
export function updateExtraSimulateVersion(data) {
  return request({
    url: "/dortmund/extra/simulate/version",
    method: "put",
    data: data,
  });
}

// 查询数值模拟轮次记录列表
export function listExtraSimulate(query) {
  return request({
    url: "/dortmund/extra/simulate/list",
    method: "get",
    params: query,
  });
}

// 新增数值模拟轮次记录
export function addExtraSimulate(data) {
  return request({
    url: "/dortmund/extra/simulate",
    method: "post",
    data: data,
  });
}

// 删除数值模拟轮次记录
export function delExtraSimulate(simId) {
  return request({
    url: "/dortmund/extra/simulate/" + simId,
    method: "delete",
  });
}
