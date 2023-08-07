import request from '@/utils/request'

// 查询固定追号配置列表
export function listChase(query) {
  return request({
    url: '/lottory/chase/list',
    method: 'get',
    params: query
  })
}

// 查询固定追号配置详细
export function getChase(chaseId) {
  return request({
    url: '/lottory/chase/' + chaseId,
    method: 'get'
  })
}

// 新增固定追号配置
export function addChase(data) {
  return request({
    url: '/lottory/chase',
    method: 'post',
    data: data
  })
}

// 修改固定追号配置
export function updateChase(data) {
  return request({
    url: '/lottory/chase',
    method: 'put',
    data: data
  })
}

// 删除固定追号配置
export function delChase(chaseId) {
  return request({
    url: '/lottory/chase/' + chaseId,
    method: 'delete'
  })
}
