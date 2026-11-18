import request from "@/utils/common/request";

// 生成回报组合
export function generateReturnCombination(data) {
  return request({
    url: "/dortmund/return/generate",
    method: "post",
    data: data,
  });
}

// 创建人工AI处理任务并冻结业务快照
export function createManualTask(data) {
  return request({
    url: "/dortmund/return/manual-task",
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

// 查询可人工处理批次的AI任务
export function getManualTask(generationId) {
  return request({
    url: "/dortmund/return/generation/" + generationId + "/manual-task",
    method: "get",
  });
}

// 查询人工AI任务与标准化结果的可复制模板
export function getManualTemplate() {
  return request({
    url: "/dortmund/return/manual-template",
    method: "get",
  });
}

// 导入第三方AI标准化结果并完成人工AI处理批次
export function importManualResult(generationId, responseContent) {
  return request({
    url: "/dortmund/return/generation/" + generationId + "/manual-import",
    method: "post",
    data: { responseContent: responseContent },
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
