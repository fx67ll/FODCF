import request from "@/utils/request";

// 查询麻将室预约记录列表
export function listLog(query) {
  return request({
    url: "/mahjong/reservation/log/list",
    method: "get",
    params: query,
  });
}

// 查询麻将室预约记录详细
export function getLog(mahjongReservationLogId) {
  return request({
    url: "/mahjong/reservation/log/" + mahjongReservationLogId,
    method: "get",
  });
}

// 新增麻将室预约记录
export function addLog(data) {
  return request({
    url: "/mahjong/reservation/log",
    method: "post",
    data: data,
  });
}

// 修改麻将室预约记录
export function updateLog(data) {
  return request({
    url: "/mahjong/reservation/log",
    method: "put",
    data: data,
  });
}

// 删除麻将室预约记录
export function delLog(mahjongReservationLogId) {
  return request({
    url: "/mahjong/reservation/log/" + mahjongReservationLogId,
    method: "delete",
  });
}

// 查询麻将室预约记录列表
export function listMahjongReservationLog(data) {
  const pageNum = data.pageNum;
  const pageSize = data.pageSize;
  delete data.pageNum;
  delete data.pageSize
  return request({
    url: `/mahjong/reservation/log/getReservationLogListForApp?pageNum=${pageNum}&pageSize=${pageSize}`,
    method: "post",
    data: data,
  });
}
