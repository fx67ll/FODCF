import request from '@/utils/request'

// 查询富文本记录列表
export function listNoteLog(query) {
  return request({
    url: '/note/log/list',
    method: 'get',
    params: query
  })
}

// 查询富文本记录详细
export function getNoteLog(noteId) {
  return request({
    url: '/note/log/' + noteId,
    method: 'get'
  })
}

// 新增富文本记录
export function addNoteLog(data) {
  return request({
    url: '/note/log',
    method: 'post',
    data: data
  })
}

// 修改富文本记录
export function updateNoteLog(data) {
  return request({
    url: '/note/log',
    method: 'put',
    data: data
  })
}

// 删除富文本记录
export function delNoteLog(noteId) {
  return request({
    url: '/note/log/' + noteId,
    method: 'delete'
  })
}
