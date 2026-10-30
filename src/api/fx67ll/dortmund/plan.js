import request from "@/utils/common/request";

// 查询方案计划列表
export function listPlan(query) {
  return request({
    url: "/dortmund/plan/list",
    method: "get",
    params: query,
  });
}

// 查询方案计划详细
export function getPlan(planId) {
  return request({
    url: "/dortmund/plan/" + planId,
    method: "get",
  });
}

// 新增方案计划
export function addPlan(data) {
  return request({
    url: "/dortmund/plan",
    method: "post",
    data: data,
  });
}

// 修改方案计划
export function updatePlan(data) {
  return request({
    url: "/dortmund/plan",
    method: "put",
    data: data,
  });
}

// 删除方案计划
export function delPlan(planId) {
  return request({
    url: "/dortmund/plan/" + planId,
    method: "delete",
  });
}

// 上传方案计划图片（仅指定用户调用，返回相对对象键）
export function uploadPlanImage(data) {
  return request({
    url: "/dortmund/plan/image/upload",
    method: "post",
    data: data,
  });
}
