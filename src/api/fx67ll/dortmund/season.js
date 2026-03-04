import request from '@/utils/common/request'

// 查询赛季管理列表
export function listSeason(query) {
  return request({
    url: '/dortmund/season/list',
    method: 'get',
    params: query
  })
}

// 查询赛季管理详细
export function getSeason(seasonId) {
  return request({
    url: '/dortmund/season/' + seasonId,
    method: 'get'
  })
}

// 新增赛季管理
export function addSeason(data) {
  return request({
    url: '/dortmund/season',
    method: 'post',
    data: data
  })
}

// 修改赛季管理
export function updateSeason(data) {
  return request({
    url: '/dortmund/season',
    method: 'put',
    data: data
  })
}

// 删除赛季管理
export function delSeason(seasonId) {
  return request({
    url: '/dortmund/season/' + seasonId,
    method: 'delete'
  })
}
