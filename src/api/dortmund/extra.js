import request from '@/utils/request'

// 查询外快盈亏记录列表
export function listExtra(query) {
  return request({
    url: '/dortmund/extra/list',
    method: 'get',
    params: query
  })
}

// 查询外快盈亏记录详细
export function getExtra(extraId) {
  return request({
    url: '/dortmund/extra/' + extraId,
    method: 'get'
  })
}

// 新增外快盈亏记录
export function addExtra(data) {
  return request({
    url: '/dortmund/extra',
    method: 'post',
    data: data
  })
}

// 修改外快盈亏记录
export function updateExtra(data) {
  return request({
    url: '/dortmund/extra',
    method: 'put',
    data: data
  })
}

// 删除外快盈亏记录
export function delExtra(extraId) {
  return request({
    url: '/dortmund/extra/' + extraId,
    method: 'delete'
  })
}
