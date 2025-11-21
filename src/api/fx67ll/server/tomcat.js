import request from '@/utils/request'

// 查询Tomcat状态
export function getTomcatStatus() {
  return request({
    url: '/server/tomcat/status',
    method: 'get'
  })
}

// 启动Tomcat
export function startTomcat() {
  return request({
    url: '/server/tomcat/start',
    method: 'post'
  })
}

// 停止Tomcat
export function stopTomcat() {
  return request({
    url: '/server/tomcat/stop',
    method: 'post'
  })
}

// 查询Github连接状态
export function testConnectToGithubByTcp() {
  return request({
    url: '/server/tomcat/testConnectToGithubByTcp',
    method: 'get'
  })
}

// 查询Github连接状态
export function testConnectToGithubByHttp() {
  return request({
    url: '/server/tomcat/testConnectToGithubByHttp',
    method: 'get'
  })
}