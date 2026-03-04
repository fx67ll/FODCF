import request from '@/utils/common/request'

// 查询AI Prompt模板管理列表
export function listTemplate(query) {
  return request({
    url: '/ai/prompt/template/list',
    method: 'get',
    params: query
  })
}

// 查询AI Prompt模板管理详细
export function getTemplate(promptId) {
  return request({
    url: '/ai/prompt/template/' + promptId,
    method: 'get'
  })
}

// 新增AI Prompt模板管理
export function addTemplate(data) {
  return request({
    url: '/ai/prompt/template',
    method: 'post',
    data: data
  })
}

// 修改AI Prompt模板管理
export function updateTemplate(data) {
  return request({
    url: '/ai/prompt/template',
    method: 'put',
    data: data
  })
}

// 删除AI Prompt模板管理
export function delTemplate(promptId) {
  return request({
    url: '/ai/prompt/template/' + promptId,
    method: 'delete'
  })
}
