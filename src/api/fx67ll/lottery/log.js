import request from '@/utils/request'

// 查询每日号码记录列表
export function listLog(query) {
  return request({
    url: '/lottery/log/list',
    method: 'get',
    params: query
  })
}

// 查询每日号码记录详细
export function getLog(lotteryId) {
  return request({
    url: '/lottery/log/' + lotteryId,
    method: 'get'
  })
}

// 新增每日号码记录
export function addLog(data) {
  return request({
    url: '/lottery/log',
    method: 'post',
    data: data
  })
}

// 修改每日号码记录
export function updateLog(data) {
  return request({
    url: '/lottery/log',
    method: 'put',
    data: data
  })
}

// 删除每日号码记录
export function delLog(lotteryId) {
  return request({
    url: '/lottery/log/' + lotteryId,
    method: 'delete'
  })
}

// 查询历史号码记录中奖数据统计
export function listTotalReward(query) {
  return request({
    url: '/lottery/log/getLotteryTotalReward',
    method: 'get',
    params: query
  })
}
