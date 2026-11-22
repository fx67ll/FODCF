import request from "@/utils/common/request";

// 路径参数只接受正整数，避免空值或页面占位文本被拼进后端路径后触发类型转换错误。
function normalizePositiveId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// 已在调用前拦截的无效编号不再交由全局拦截器弹窗，避免重复打扰用户。
function createInvalidIdError(message) {
  const error = new Error(message);
  error._isHandled = true;
  return error;
}

// 查询后端预定义回报组合业务目标（只读，用于分析页固定约束提示）
export function getReturnBusinessObjectives() {
  return request({
    url: "/dortmund/return/business-objectives",
    method: "get",
    // 预定义目标是页面提示的增强信息，接口不可用时使用本地兜底，不打断用户填写分析条件。
    silentError: true,
  });
}

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
  const normalizedId = normalizePositiveId(generationId);
  if (!normalizedId) {
    return Promise.reject(createInvalidIdError("回报组合批次编号无效"));
  }
  return request({
    url: "/dortmund/return/generation/" + normalizedId,
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
export function importManualResult(
  generationId,
  responseContent,
  importMode = "REPLACE"
) {
  return request({
    url: "/dortmund/return/generation/" + generationId + "/manual-import",
    method: "post",
    data: { responseContent: responseContent, importMode: importMode },
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
  const normalizedId = normalizePositiveId(combinationId);
  if (!normalizedId) {
    return Promise.reject(createInvalidIdError("回报组合编号无效"));
  }
  return request({
    url: "/dortmund/return/" + normalizedId,
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

// 按人工登记的比赛结果核验一条已采用回报组合
export function verifyCombination(combinationId) {
  const normalizedId = normalizePositiveId(combinationId);
  if (!normalizedId) {
    return Promise.reject(createInvalidIdError("回报组合编号无效"));
  }
  return request({
    url: "/dortmund/return/" + normalizedId + "/verify",
    method: "post",
  });
}

// 批量核验已采用回报组合的赛果命中情况
export function batchVerifyCombinations(combinationIds) {
  return request({
    url: "/dortmund/return/batch/verify",
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
