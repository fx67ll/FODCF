// 货币类型选项
export const modelTokenCurrencyOptions = [
  { value: "CNY", label: "人民币" },
  { value: "USD", label: "美元" },
  { value: "EUR", label: "欧元" },
  { value: "GBP", label: "英镑" },
  { value: "JPY", label: "日元" },
];

// HTTP状态码选项（可根据需要增删）
export const httpStatusOptions = [
  // 1xx 信息性状态码
  { value: "100", label: "100 Continue" },
  { value: "101", label: "101 Switching Protocols" },
  { value: "102", label: "102 Processing" },
  
  // 2xx 成功状态码
  { value: "200", label: "200 OK" },
  { value: "201", label: "201 Created" },
  { value: "202", label: "202 Accepted" },
  { value: "203", label: "203 Non-Authoritative Information" },
  { value: "204", label: "204 No Content" },
  { value: "205", label: "205 Reset Content" },
  { value: "206", label: "206 Partial Content" },
  
  // 3xx 重定向状态码
  { value: "300", label: "300 Multiple Choices" },
  { value: "301", label: "301 Moved Permanently" },
  { value: "302", label: "302 Found" },
  { value: "303", label: "303 See Other" },
  { value: "304", label: "304 Not Modified" },
  { value: "305", label: "305 Use Proxy" },
  { value: "307", label: "307 Temporary Redirect" },
  { value: "308", label: "308 Permanent Redirect" },
  
  // 4xx 客户端错误状态码
  { value: "400", label: "400 Bad Request" },
  { value: "401", label: "401 Unauthorized" },
  { value: "402", label: "402 Payment Required" },
  { value: "403", label: "403 Forbidden" },
  { value: "404", label: "404 Not Found" },
  { value: "405", label: "405 Method Not Allowed" },
  { value: "406", label: "406 Not Acceptable" },
  { value: "407", label: "407 Proxy Authentication Required" },
  { value: "408", label: "408 Request Timeout" },
  { value: "409", label: "409 Conflict" },
  { value: "410", label: "410 Gone" },
  { value: "411", label: "411 Length Required" },
  { value: "412", label: "412 Precondition Failed" },
  { value: "413", label: "413 Payload Too Large" },
  { value: "414", label: "414 URI Too Long" },
  { value: "415", label: "415 Unsupported Media Type" },
  { value: "416", label: "416 Range Not Satisfiable" },
  { value: "417", label: "417 Expectation Failed" },
  { value: "418", label: "418 I'm a teapot" },
  { value: "422", label: "422 Unprocessable Entity" },
  { value: "425", label: "425 Too Early" },
  { value: "426", label: "426 Upgrade Required" },
  { value: "428", label: "428 Precondition Required" },
  { value: "429", label: "429 Too Many Requests" },
  { value: "431", label: "431 Request Header Fields Too Large" },
  { value: "451", label: "451 Unavailable For Legal Reasons" },
  
  // 5xx 服务器错误状态码
  { value: "500", label: "500 Internal Server Error" },
  { value: "501", label: "501 Not Implemented" },
  { value: "502", label: "502 Bad Gateway" },
  { value: "503", label: "503 Service Unavailable" },
  { value: "504", label: "504 Gateway Timeout" },
  { value: "505", label: "505 HTTP Version Not Supported" },
  { value: "506", label: "506 Variant Also Negotiates" },
  { value: "507", label: "507 Insufficient Storage" },
  { value: "508", label: "508 Loop Detected" },
  { value: "510", label: "510 Not Extended" },
  { value: "511", label: "511 Network Authentication Required" },
];

// 请求业务状态选项
export const callStatusOptions = [
  { value: "00", label: "成功" },
  { value: "01", label: "业务失败" },
  { value: "02", label: "限流拦截" },
  { value: "03", label: "熔断拦截" },
];

// 规则维度选项
export const limitRuleDimensionOptions = [
  { value: "1", label: "模板" },
  { value: "2", label: "分组" },
  { value: "3", label: "场景" },
  { value: "4", label: "模型" },
];

// 规则类型选项
export const limitRuleTypeOptions = [
  { value: "1", label: "流量控制" },
  { value: "2", label: "熔断保护" },
];

// 流控模式选项
export const flowControlModeOptions = [
  { value: "D", label: "直接拒绝" },
  { value: "A", label: "关联控制" },
  { value: "L", label: "链路流控" },
];

// 流控效果选项
export const flowControlEffectOptions = [
  { value: "F", label: "快速失败" },
  { value: "W", label: "预热启动" },
  { value: "Q", label: "匀速排队" },
];

// 流控类型选项
export const flowRuleTypeOptions = [
  { value: "Q", label: "QPS阈值" },
  { value: "C", label: "并发线程数" },
];

// 熔断策略选项
export const circuitStrategyOptions = [
  { value: "S", label: "慢调用比例" },
  { value: "E", label: "异常比例" },
  { value: "N", label: "异常数" },
];
