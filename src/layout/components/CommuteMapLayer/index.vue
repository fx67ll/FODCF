<template>
  <!--
    通勤地图持久层：iframe 常驻本组件（keep-alive 与 transition 之外），
    切换标签页只隐藏不卸载，浏览器标签页不关闭就绝不重载。
    显示时以 rAF 每帧同步到 AdminHome 通勤卡片占位框的位置上。
  -->
  <iframe v-show="showLayer" ref="frame" class="commute-map-layer" :src="src" title="日常通勤地图"
    referrerpolicy="no-referrer-when-downgrade" @load="onFrameLoad"></iframe>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "CommuteMapLayer",
  data() {
    return {
      // rAF 循环句柄
      rafId: null,
      // 通勤卡片占位框元素（keep-alive 重新挂载后需重新查找）
      targetEl: null,
      // 本帧是否已完成定位（未定位时保持隐藏，避免闪现在左上角）
      positioned: false,
    };
  },
  computed: {
    ...mapState("commuteMap", ["src", "visible"]),
    showLayer() {
      return !!this.src && this.visible && this.positioned;
    },
  },
  watch: {
    visible: {
      immediate: true,
      handler(val) {
        if (val) {
          this.startLoop();
        } else {
          this.stopLoop();
        }
      },
    },
  },
  mounted() {
    this.$store.commit("commuteMap/SET_AVAILABLE", true);
  },
  beforeDestroy() {
    this.stopLoop();
    // Layout 卸载（退出登录）时整体复位，下次登录重新加载
    this.$store.commit("commuteMap/RESET_COMMUTE_MAP");
  },
  methods: {
    startLoop() {
      if (this.rafId) return;
      const tick = () => {
        this.syncPosition();
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    },
    stopLoop() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.positioned = false;
    },
    // 每帧把 iframe 对齐到首页通勤卡片占位框（覆盖滚动 / 缩放 / 侧栏开合 / 入场动画）
    syncPosition() {
      const frame = this.$refs.frame;
      const el = this.resolveTarget();
      if (!frame || !el) {
        this.positioned = false;
        return;
      }
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        // 占位框不在文档中（首页被 keep-alive 摘下）或不可见：先隐藏
        this.positioned = false;
        return;
      }
      const style = frame.style;
      style.left = `${rect.left}px`;
      style.top = `${rect.top}px`;
      style.width = `${rect.width}px`;
      style.height = `${rect.height}px`;
      this.positioned = true;
    },
    // 解析占位框元素；keep-alive 摘下 / 重挂载后元素引用失效，需重新查找
    resolveTarget() {
      if (this.targetEl && document.contains(this.targetEl)) return this.targetEl;
      this.targetEl = document.querySelector(".admin-home .commute-frame");
      return this.targetEl;
    },
    onFrameLoad() {
      this.$store.commit("commuteMap/SET_FRAME_LOADED", true);
    },
  },
};
</script>

<style lang="scss" scoped>
.commute-map-layer {
  /* 高于面板内容（z auto），低于 fixed-header(9)/侧栏(1001)/el 弹层(2000+)，
     滚动时地图从导航栏下方穿过而不是盖住导航栏 */
  position: fixed;
  z-index: 8;
  /* --home-* 变量作用域在 .home-shell 内，此处不可用，取等值字面量 */
  border: 1px solid #e2eee7;
  border-radius: 12px;
  background: #f2fbf6;
}
</style>
