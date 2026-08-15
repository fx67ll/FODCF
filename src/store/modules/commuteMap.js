/**
 * 通勤地图持久层状态
 *
 * 背景：首页经 keep-alive 缓存，但切换标签页时 keep-alive 会把页面 DOM
 * 从文档中摘下，iframe 一旦脱离文档即丢失浏览上下文、重新挂载必然重载
 * （还会重复触发第三方地图计费接口）。
 *
 * 方案：iframe 常驻在 keep-alive 之外的持久层组件（CommuteMapLayer）中，
 * src 只设置一次、绝不重置，只要项目所在的浏览器标签页不关闭就不重载；
 * AdminHome 的通勤卡片仅保留占位框，由持久层每帧同步位置覆盖其上。
 */
const state = {
  // 持久层组件是否已挂载（AdminHome 据此决定走持久层还是内联 iframe 降级）
  available: false,
  // iframe 地址：只设置一次，设后不清空（清空即触发重载）
  src: "",
  // 首页当前是否处于激活态（keep-alive activated / deactivated 驱动）
  visible: false,
  // iframe 是否已完成首次加载（用于占位框加载态）
  frameLoaded: false,
};

const mutations = {
  SET_AVAILABLE: (state, val) => {
    state.available = !!val;
  },
  SET_SRC: (state, src) => {
    // 只允许由空设为非空，防止任何路径意外触发 iframe 重载
    if (!state.src && src) state.src = src;
  },
  SET_VISIBLE: (state, val) => {
    state.visible = !!val;
  },
  SET_FRAME_LOADED: (state, val) => {
    state.frameLoaded = !!val;
  },
  // 退出登录等 Layout 卸载场景整体复位，下次登录重新加载（等价整页刷新）
  RESET_COMMUTE_MAP: (state) => {
    state.available = false;
    state.src = "";
    state.visible = false;
    state.frameLoaded = false;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
};
