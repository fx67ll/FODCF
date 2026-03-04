import request from '@/utils/common/request'

// 查询AI Prompt场景管理列表
export function listScene(query) {
  return request({
    url: '/ai/prompt/scene/list',
    method: 'get',
    params: query
  })
}

// 查询AI Prompt场景管理详细
export function getScene(sceneId) {
  return request({
    url: '/ai/prompt/scene/' + sceneId,
    method: 'get'
  })
}

// 新增AI Prompt场景管理
export function addScene(data) {
  return request({
    url: '/ai/prompt/scene',
    method: 'post',
    data: data
  })
}

// 修改AI Prompt场景管理
export function updateScene(data) {
  return request({
    url: '/ai/prompt/scene',
    method: 'put',
    data: data
  })
}

// 删除AI Prompt场景管理
export function delScene(sceneId) {
  return request({
    url: '/ai/prompt/scene/' + sceneId,
    method: 'delete'
  })
}
