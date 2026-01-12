import request from "@/utils/common/request";

// 获取路由
export const getRouters = () => {
  return request({
    url: "/getRouters",
    method: "get",
  });
};
