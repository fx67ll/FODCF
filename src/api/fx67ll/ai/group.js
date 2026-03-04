import request from '@/utils/common/request'

// 查询AI Prompt模板分组列表
export function listGroup(query) {
  return request({
    url: '/ai/prompt/group/list',
    method: 'get',
    params: query
  })
}

// 查询AI Prompt模板分组详细
export function getGroup(groupId) {
  return request({
    url: '/ai/prompt/group/' + groupId,
    method: 'get'
  })
}

// 新增AI Prompt模板分组
export function addGroup(data) {
  return request({
    url: '/ai/prompt/group',
    method: 'post',
    data: data
  })
}

// 修改AI Prompt模板分组
export function updateGroup(data) {
  return request({
    url: '/ai/prompt/group',
    method: 'put',
    data: data
  })
}

// 删除AI Prompt模板分组
export function delGroup(groupId) {
  return request({
    url: '/ai/prompt/group/' + groupId,
    method: 'delete'
  })
}
