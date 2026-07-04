import request from "@/utils/common/request";

// 查询公告列表
export function listNotice(query) {
  return request({
    url: "/system/notice/list",
    method: "get",
    params: query,
  });
}

// 查询公告详细
export function getNotice(noticeId) {
  return request({
    url: "/system/notice/" + noticeId,
    method: "get",
  });
}

// 新增公告
export function addNotice(data) {
  return request({
    url: "/system/notice",
    method: "post",
    data: data,
  });
}

// 修改公告
export function updateNotice(data) {
  return request({
    url: "/system/notice",
    method: "put",
    data: data,
  });
}

// 删除公告
export function delNotice(noticeId) {
  return request({
    url: "/system/notice/" + noticeId,
    method: "delete",
  });
}

// 查询已上架公告列表（面向登录用户）
export function listPublicNotice(query) {
  return request({
    url: "/system/notice/public/list",
    method: "get",
    params: query,
  });
}

// 查询已上架公告详细（面向登录用户）
export function getPublicNotice(noticeId) {
  return request({
    url: "/system/notice/public/" + noticeId,
    method: "get",
  });
}

// 查询最新一条已上架公告
export function latestPublicNotice() {
  return request({
    url: "/system/notice/public/latest",
    method: "get",
  });
}
