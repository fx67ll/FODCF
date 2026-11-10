import request from "@/utils/common/request";

// 生成回报组合
export function generateReturnCombination(data) {
  return request({
    url: "/dortmund/return/generate",
    method: "post",
    data: data,
    timeout: 60000,
  });
}

// 查询生成批次列表
export function listGeneration(query) {
  return request({
    url: "/dortmund/return/generation/list",
    method: "get",
    params: query,
  });
}

// 查询生成批次详细
export function getGeneration(generationId) {
  return request({
    url: "/dortmund/return/generation/" + generationId,
    method: "get",
  });
}

// 查询回报组合列表
export function listCombination(query) {
  return request({
    url: "/dortmund/return/list",
    method: "get",
    params: query,
  });
}

// 查询回报组合详细
export function getCombination(combinationId) {
  return request({
    url: "/dortmund/return/" + combinationId,
    method: "get",
  });
}

// 采用回报组合
export function adoptCombination(combinationId) {
  return request({
    url: "/dortmund/return/" + combinationId + "/adopt",
    method: "post",
  });
}

// 不采用回报组合
export function rejectCombination(combinationId) {
  return request({
    url: "/dortmund/return/" + combinationId + "/reject",
    method: "post",
  });
}

// 上传回报组合图片
export function uploadReturnImage(data) {
  return request({
    url: "/dortmund/return/image/upload",
    method: "post",
    data: data,
  });
}

// 删除尚未固化的回报组合图片
export function removeReturnImage(objectKey) {
  return request({
    url: "/dortmund/return/image",
    method: "delete",
    params: { objectKey },
  });
}
