import request from '@/utils/request'

// 查询备忘记录列表
export function listNoteLog(query) {
  return request({
    url: '/note/log/list',
    method: 'get',
    params: query
  })
}

// 查询备忘记录详细
export function getNoteLog(noteId) {
  return request({
    url: '/note/log/' + noteId,
    method: 'get'
  })
}

// 新增备忘记录
export function addNoteLog(data) {
  return request({
    url: '/note/log',
    method: 'post',
    data: data
  })
}

// 修改备忘记录
export function updateNoteLog(data) {
  return request({
    url: '/note/log',
    method: 'put',
    data: data
  })
}

// 删除备忘记录
export function delNoteLog(noteId) {
  return request({
    url: '/note/log/' + noteId,
    method: 'delete'
  })
}
