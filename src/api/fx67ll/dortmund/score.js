import request from '@/utils/common/request'

// 查询比赛标准化评分列表
export function listScore(query) {
  return request({
    url: '/dortmund/match/score/list',
    method: 'get',
    params: query
  })
}

// 查询比赛标准化评分详细
export function getScore(scoreId) {
  return request({
    url: '/dortmund/match/score/' + scoreId,
    method: 'get'
  })
}

// 新增比赛标准化评分
export function addScore(data) {
  return request({
    url: '/dortmund/match/score',
    method: 'post',
    data: data
  })
}

// 修改比赛标准化评分
export function updateScore(data) {
  return request({
    url: '/dortmund/match/score',
    method: 'put',
    data: data
  })
}

// 删除比赛标准化评分
export function delScore(scoreId) {
  return request({
    url: '/dortmund/match/score/' + scoreId,
    method: 'delete'
  })
}
