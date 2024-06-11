import request from '@/utils/request'

// 查询秘钥配置列表
export function listKey(query) {
  return request({
    url: '/secret/key/list',
    method: 'get',
    params: query
  })
}

// 查询秘钥配置详细
export function getKey(secretId) {
  return request({
    url: '/secret/key/' + secretId,
    method: 'get'
  })
}

// 新增秘钥配置
export function addKey(data) {
  return request({
    url: '/secret/key',
    method: 'post',
    data: data
  })
}

// 修改秘钥配置
export function updateKey(data) {
  return request({
    url: '/secret/key',
    method: 'put',
    data: data
  })
}

// 删除秘钥配置
export function delKey(secretId) {
  return request({
    url: '/secret/key/' + secretId,
    method: 'delete'
  })
}

// 查询秘钥配置列表
export function getSecretConfig(query) {
  return request({
    url: '/secret/key/getSecretKeyConfigForApp',
    method: 'get',
    params: query,
  });
}
