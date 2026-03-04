import request from '@/utils/common/request'

// 查询AI Prompt模型配置列表
export function listModel(query) {
  return request({
    url: '/ai/prompt/model/list',
    method: 'get',
    params: query
  })
}

// 查询AI Prompt模型配置详细
export function getModel(modelId) {
  return request({
    url: '/ai/prompt/model/' + modelId,
    method: 'get'
  })
}

// 新增AI Prompt模型配置
export function addModel(data) {
  return request({
    url: '/ai/prompt/model',
    method: 'post',
    data: data
  })
}

// 修改AI Prompt模型配置
export function updateModel(data) {
  return request({
    url: '/ai/prompt/model',
    method: 'put',
    data: data
  })
}

// 删除AI Prompt模型配置
export function delModel(modelId) {
  return request({
    url: '/ai/prompt/model/' + modelId,
    method: 'delete'
  })
}
