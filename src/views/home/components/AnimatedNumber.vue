<template>
  <!-- 数值滚动动画：值更新时从 0 计数到最新值 -->
  <span class="animated-number">{{ displayText }}</span>
</template>

<script>
/**
 * 纯展示数值滚动组件
 * - 挂载与值更新时从 0 以 easeOutCubic 滚动到目标值
 * - 目标值为整数时过程值取整，否则保留一位小数
 * - 产品决策：滚动效果在所有设备保持一致，主动忽略系统「减少动态效果」设置，
 *   避免该设置开启时滚动失效（与 Navbar 头像动效决策一致）
 */
export default {
  name: "AnimatedNumber",
  props: {
    value: { type: Number, default: 0 },
    // 滚动时长（ms）
    duration: { type: Number, default: 800 },
    // 外部触发器（如 refreshTick）：自增时无论数值是否变化都重播滚动
    trigger: { type: Number, default: 0 },
    // 值变化时直接落位不滚动（用于高频静默轮询的数值），trigger 触发时仍完整滚动
    snapOnChange: { type: Boolean, default: false },
    // 自定义展示格式化（如 1.2万 / 3.4k 紧凑格式），传入时过程值与落位值均经其格式化
    format: { type: Function, default: null },
  },
  data() {
    return {
      displayValue: 0,
      rafId: null,
    };
  },
  computed: {
    isIntegerTarget() {
      return Number.isInteger(Number(this.value));
    },
    displayText() {
      const v = this.displayValue;
      if (this.format) return this.format(v);
      if (this.isIntegerTarget) return String(Math.round(v));
      return String(Math.round(v * 10) / 10);
    },
  },
  watch: {
    value() {
      if (this.snapOnChange) {
        this.snap();
      } else {
        this.start();
      }
    },
    trigger() {
      this.start();
    },
  },
  mounted() {
    this.start();
  },
  beforeDestroy() {
    this.cancel();
  },
  methods: {
    cancel() {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    },
    // 跳过动画直接展示当前目标值
    snap() {
      this.cancel();
      this.displayValue = Number(this.value) || 0;
    },
    start() {
      this.cancel();
      const target = Number(this.value) || 0;
      // 产品决策：不检测系统「减少动态效果」，所有设备均播放滚动动画
      if (this.duration <= 0) {
        this.displayValue = target;
        return;
      }
      let startTime = null;
      const step = (now) => {
        // rAF 时间戳以页面加载为原点，须以首帧为基准计时，
        // 不能与 Date.now() 等 Unix 时间戳混用，否则进度为巨大负数导致数值异常
        if (startTime === null) {
          startTime = now;
        }
        const t = Math.min(1, (now - startTime) / this.duration);
        // easeOutCubic：先快后慢，落位从容
        const eased = 1 - Math.pow(1 - t, 3);
        this.displayValue = target * eased;
        if (t < 1) {
          this.rafId = requestAnimationFrame(step);
        } else {
          this.displayValue = target;
          this.rafId = null;
        }
      };
      this.rafId = requestAnimationFrame(step);
    },
  },
};
</script>
