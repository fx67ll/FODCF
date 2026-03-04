import request from "@/utils/common/request";

// 查询AI 调用请求日志列表
export function listLog(query) {
  return request({
    url: "/ai/request/log/list",
    method: "get",
    params: query,
  });
}

// 查询AI 调用请求日志详细
export function getLog(dailyLogDate) {
  return request({
    url: "/ai/request/log/" + dailyLogDate,
    method: "get",
  });
}

// 新增AI 调用请求日志
export function addLog(data) {
  return request({
    url: "/ai/request/log",
    method: "post",
    data: data,
  });
}

// 修改AI 调用请求日志
export function updateLog(data) {
  return request({
    url: "/ai/request/log",
    method: "put",
    data: data,
  });
}

// 删除AI 调用请求日志
export function delLog(dailyLogDate) {
  return request({
    url: "/ai/request/log/" + dailyLogDate,
    method: "delete",
  });
}

// 查询AI 调用请求日请求日志列表
export function listDailyLog(query) {
  return request({
    url: "/ai/request/daily/log/list",
    method: "get",
    params: query,
  });
}

// 查询AI 调用请求月请求日志列表
export function listMonthlyLog(query) {
  return request({
    url: "/ai/request/monthly/log/list",
    method: "get",
    params: query,
  });
}

// 查询AI 调用请求年请求日志列表
export function listYearlyLog(query) {
  return request({
    url: "/ai/request/yearly/log/list",
    method: "get",
    params: query,
  });
}
