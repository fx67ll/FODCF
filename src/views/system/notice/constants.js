/**
 * 通知公告相关公共配置
 * 路由地址统一在此维护，便于后续整体调整
 */

// 超级管理员用户名（与 store user.name 判断保持一致）
export const SUPER_ADMIN_NAME = "fx67ll";

// 通知公告管理页路由（超级管理员跳转，对应动态路由 /ruoyi/system/notice）
export const NOTICE_MANAGE_PATH = "/ruoyi/system/notice";

// 通知公告公开列表页路由（普通用户跳转，对应动态路由 /fx67ll/user/notice/public）
export const NOTICE_PUBLIC_PATH = "/fx67ll/user/notice/public";

/**
 * 按当前用户名返回对应的通知公告路由
 * 超级管理员进公告管理页，其他人进公开公告列表页
 */
export function getNoticePath(userName) {
  return userName && userName === SUPER_ADMIN_NAME ? NOTICE_MANAGE_PATH : NOTICE_PUBLIC_PATH;
}
