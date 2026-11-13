import request from "@/utils/common/request";

// 生成回报组合
export function generateReturnCombination(data) {
  return request({
    url: "/dortmund/return/generate",
    method: "post",
    data: data,
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

// 查询生成批次详细，可指定候选组合排序
export function getGeneration(generationId, params) {
  return request({
    url: "/dortmund/return/generation/" + generationId,
    method: "get",
    params: params,
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

// 批量采用回报组合
export function batchAdoptCombinations(combinationIds) {
  return request({
    url: "/dortmund/return/batch/adopt",
    method: "post",
    data: { combinationIds },
  });
}

// 删除已采用回报组合的图片
export function removeReturnImage(combinationId, imageId) {
  return request({
    url: "/dortmund/return/" + combinationId + "/image/" + imageId,
    method: "delete",
  });
}

// 查询指定日期范围内的孤儿图片
export function listOrphanReturnImages(params) {
  return request({
    url: "/dortmund/return/image/orphans",
    method: "get",
    params,
  });
}

// 批量删除孤儿图片
export function deleteOrphanReturnImages(imageIds) {
  return request({
    url: "/dortmund/return/image/orphans",
    method: "delete",
    data: imageIds,
  });
}
