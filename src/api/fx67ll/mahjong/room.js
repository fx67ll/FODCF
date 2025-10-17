import request from '@/utils/request'

// 查询麻将室列表
export function listRoom(query) {
  return request({
    url: '/mahjong/room/list',
    method: 'get',
    params: query
  })
}

// 查询麻将室详细
export function getRoom(mahjongRoomId) {
  return request({
    url: '/mahjong/room/' + mahjongRoomId,
    method: 'get'
  })
}

// 新增麻将室
export function addRoom(data) {
  return request({
    url: '/mahjong/room',
    method: 'post',
    data: data
  })
}

// 修改麻将室
export function updateRoom(data) {
  return request({
    url: '/mahjong/room',
    method: 'put',
    data: data
  })
}

// 删除麻将室
export function delRoom(mahjongRoomId) {
  return request({
    url: '/mahjong/room/' + mahjongRoomId,
    method: 'delete'
  })
}
