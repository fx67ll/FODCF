import CryptoJS from "crypto-js";

/**
 * 前后端传输加解密工具（AES-CBC，阶段四·4.17）
 *
 * 与后端 TransferCryptoUtils 对齐：AES/CBC/PKCS5Padding，随机 16 字节 IV 拼接密文前，Base64。
 * transferKey 为 Base64 编码的 256 位裸 key（会话级签发，非 passphrase 派生）。
 *
 * 注意：与数据库加密（后端 AES-GCM）算法隔离，transferKey 仅用于管理端秘钥查看/修改的传输加密。
 */

/**
 * 加密（提交修改时用）
 * @param {string} plainText 明文
 * @param {string} transferKeyBase64 Base64 编码的传输密钥
 * @returns {string} Base64 密文（含前置 IV）
 */
export function transferEncrypt(plainText, transferKeyBase64) {
  const key = CryptoJS.enc.Base64.parse(transferKeyBase64);
  // 随机 16 字节 IV
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  // 后端格式：Base64( IV(16B) || 密文 )，手动拼 IV + ciphertext，与后端对齐
  const combined = iv.concat(encrypted.ciphertext);
  return CryptoJS.enc.Base64.stringify(combined);
}

/**
 * 解密（查看编辑时用）
 * @param {string} cipherTextBase64 Base64 密文（含前置 IV）
 * @param {string} transferKeyBase64 Base64 编码的传输密钥
 * @returns {string} 明文
 */
export function transferDecrypt(cipherTextBase64, transferKeyBase64) {
  const key = CryptoJS.enc.Base64.parse(transferKeyBase64);
  const combined = CryptoJS.enc.Base64.parse(cipherTextBase64);
  // combined.words 是 32 位整数数组，每 4 字节一个 word；前 4 个 word（16 字节）是 IV
  const ivWords = combined.words.slice(0, 4);
  const cipherWords = combined.words.slice(4);
  const iv = CryptoJS.lib.WordArray.create(ivWords, 16);
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.lib.WordArray.create(
      cipherWords,
      combined.sigBytes - 16
    ),
  });
  const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}
