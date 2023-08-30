import request from '@/utils/request'

// 查询固定追号配置列表
export function listSetting(query) {
  return request({
    url: '/lottery/setting/list',
    method: 'get',
    params: query
  })
}

// 查询固定追号配置详细
export function getSetting(settingId) {
  return request({
    url: '/lottery/setting/' + settingId,
    method: 'get'
  })
}

// 新增固定追号配置
export function addSetting(data) {
  return request({
    url: '/lottery/setting',
    method: 'post',
    data: data
  })
}

// 修改固定追号配置
export function updateSetting(data) {
  return request({
    url: '/lottery/setting',
    method: 'put',
    data: data
  })
}

// 删除固定追号配置
export function delSetting(settingId) {
  return request({
    url: '/lottery/setting/' + settingId,
    method: 'delete'
  })
}
