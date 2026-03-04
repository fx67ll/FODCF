import request from '@/utils/common/request'

// 查询比赛AI分析原始结果列表
export function listAnalysis(query) {
  return request({
    url: '/dortmund/match/analysis/list',
    method: 'get',
    params: query
  })
}

// 查询比赛AI分析原始结果详细
export function getAnalysis(analysisId) {
  return request({
    url: '/dortmund/match/analysis/' + analysisId,
    method: 'get'
  })
}

// 新增比赛AI分析原始结果
export function addAnalysis(data) {
  return request({
    url: '/dortmund/match/analysis',
    method: 'post',
    data: data
  })
}

// 修改比赛AI分析原始结果
export function updateAnalysis(data) {
  return request({
    url: '/dortmund/match/analysis',
    method: 'put',
    data: data
  })
}

// 删除比赛AI分析原始结果
export function delAnalysis(analysisId) {
  return request({
    url: '/dortmund/match/analysis/' + analysisId,
    method: 'delete'
  })
}
