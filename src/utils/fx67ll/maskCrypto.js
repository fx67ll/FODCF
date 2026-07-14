import CryptoJS from "crypto-js";

/**
 * 列表展示遮挡加密（阶段四·4.17，纯遮挡非安全）
 *
 * 用 cryptoSaltKey（吉祥物密钥，前端持有）对列表展示值再加密一层，
 * 纯粹遮挡源数据（不让列表直接显示数据库密文串），不参与任何安全链路。
 *
 * cryptoSaltKey 是前端可见的遮挡密钥，泄露无所谓——它解开的只是"列表展示串"，
 * 真正的明文仍需 transferKey 解密流程（见 transferCrypto.js）。
 */

/**
 * 遮挡加密（列表展示用）
 * @param {string} text 待遮挡的值（数据库密文串）
 * @param {string} cryptoSaltKey 遮挡密钥（吉祥物）
 * @returns {string} 加密后的展示串
 */
export function maskEncrypt(text, cryptoSaltKey) {
  if (!text) {
    return text;
  }
  return CryptoJS.AES.encrypt(text, cryptoSaltKey).toString();
}
