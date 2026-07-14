import request from "@/utils/common/request";

// 查询秘钥配置列表
export function listKey(query) {
  return request({
    url: "/secret/key/list",
    method: "get",
    params: query,
  });
}

// 查询秘钥配置详细
export function getKey(secretId) {
  return request({
    url: "/secret/key/" + secretId,
    method: "get",
  });
}

// 签发传输密钥 transferKey（阶段四·4.17，管理端秘钥查看/修改前调用）
export function getTransferKey() {
  return request({
    url: "/secret/key/transferKey",
    method: "get",
  });
}

// 新增秘钥配置
export function addKey(data) {
  return request({
    url: "/secret/key",
    method: "post",
    data: data,
  });
}

// 修改秘钥配置
export function updateKey(data) {
  return request({
    url: "/secret/key",
    method: "put",
    data: data,
  });
}

// 删除秘钥配置
export function delKey(secretId) {
  return request({
    url: "/secret/key/" + secretId,
    method: "delete",
  });
}

// 查询秘钥配置列表
export function getSecretConfig(query) {
  return request({
    url: "/secret/key/getSecretKeyConfigForApp",
    method: "get",
    params: query,
  });
}

/**
 * 下发第三方凭据密文 + 一次性令牌（阶段四·4.5）
 * @param {string} credentialType 凭据类型 lotteryReward / ocr
 * @returns {Promise} { cipherCredential, credentialToken }
 */
export function credentialForApp(credentialType) {
  return request({
    url: "/secret/key/credentialForApp",
    method: "post",
    data: { credentialType: credentialType, fingerprint: "web" },
  });
}

/**
 * 一次性令牌换取明文凭据（阶段四·4.5）
 * @param {string} credentialToken 凭据令牌
 * @returns {Promise} { plainCredential } plainCredential 为 JSON 字符串 {appId, appSecret}
 */
export function decryptForApp(credentialToken) {
  return request({
    url: "/secret/key/decryptForApp",
    method: "post",
    data: { credentialToken: credentialToken, fingerprint: "web" },
  });
}

/**
 * 一站式获取第三方凭据明文（credentialForApp → decryptForApp，阶段四封装）
 * @param {string} credentialType 凭据类型 lotteryReward / ocr
 * @returns {Promise<{appId:string, appSecret:string}>} 明文凭据对象
 */
export function getCredential(credentialType) {
  return credentialForApp(credentialType).then((res) => {
    if (!res || !res.cipherCredential || !res.credentialToken) {
      return Promise.reject({ msg: "获取凭据密文失败" });
    }
    return decryptForApp(res.credentialToken).then((decRes) => {
      if (!decRes || !decRes.plainCredential) {
        return Promise.reject({ msg: "解密凭据失败" });
      }
      try {
        return JSON.parse(decRes.plainCredential);
      } catch (e) {
        return Promise.reject({ msg: "凭据格式错误" });
      }
    });
  });
}
