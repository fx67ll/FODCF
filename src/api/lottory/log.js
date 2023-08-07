import request from '@/utils/request'

// 查询每日号码记录列表
export function listLog(query) {
  return request({
    url: '/lottory/log/list',
    method: 'get',
    params: query
  })
}

// 查询每日号码记录详细
export function getLog(lottoryId) {
  return request({
    url: '/lottory/log/' + lottoryId,
    method: 'get'
  })
}

// 新增每日号码记录
export function addLog(data) {
  return request({
    url: '/lottory/log',
    method: 'post',
    data: data
  })
}

// 修改每日号码记录
export function updateLog(data) {
  return request({
    url: '/lottory/log',
    method: 'put',
    data: data
  })
}

// 删除每日号码记录
export function delLog(lottoryId) {
  return request({
    url: '/lottory/log/' + lottoryId,
    method: 'delete'
  })
}
