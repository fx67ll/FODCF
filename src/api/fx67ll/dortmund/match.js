import request from '@/utils/common/request'

// 查询比赛记录列表
export function listMatch(query) {
  return request({
    url: '/dortmund/match/list',
    method: 'get',
    params: query
  })
}

// 查询比赛记录详细
export function getMatch(matchId) {
  return request({
    url: '/dortmund/match/' + matchId,
    method: 'get'
  })
}

// 新增比赛记录
export function addMatch(data) {
  return request({
    url: '/dortmund/match',
    method: 'post',
    data: data
  })
}

// 修改比赛记录
export function updateMatch(data) {
  return request({
    url: '/dortmund/match',
    method: 'put',
    data: data
  })
}

// 删除比赛记录
export function delMatch(matchId) {
  return request({
    url: '/dortmund/match/' + matchId,
    method: 'delete'
  })
}
