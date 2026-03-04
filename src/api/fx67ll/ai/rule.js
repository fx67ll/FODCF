import request from '@/utils/common/request'

// 查询AI Prompt 限流/熔断规则（适配Sentinel框架）列表
export function listRule(query) {
  return request({
    url: '/ai/request/rule/list',
    method: 'get',
    params: query
  })
}

// 查询AI Prompt 限流/熔断规则（适配Sentinel框架）详细
export function getRule(limitRuleId) {
  return request({
    url: '/ai/request/rule/' + limitRuleId,
    method: 'get'
  })
}

// 新增AI Prompt 限流/熔断规则（适配Sentinel框架）
export function addRule(data) {
  return request({
    url: '/ai/request/rule',
    method: 'post',
    data: data
  })
}

// 修改AI Prompt 限流/熔断规则（适配Sentinel框架）
export function updateRule(data) {
  return request({
    url: '/ai/request/rule',
    method: 'put',
    data: data
  })
}

// 删除AI Prompt 限流/熔断规则（适配Sentinel框架）
export function delRule(limitRuleId) {
  return request({
    url: '/ai/request/rule/' + limitRuleId,
    method: 'delete'
  })
}
