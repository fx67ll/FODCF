/**
 * 首页面板刷新混入
 * 提供各面板统一的刷新状态、最后刷新时间戳与数据更新闪烁动画。
 * 时间戳只在用户主动刷新（面板按钮 / 欢迎区一键刷新）时更新，静默轮询不算。
 */
export default {
  data() {
    return {
      // 刷新请求进行中（驱动按钮旋转与禁用）
      refreshing: false,
      // 最后一次主动刷新时间戳（MM-DD HH:mm:ss）
      lastRefreshTime: "",
      // 数据更新闪烁动画开关（配合共享样式 .refresh-flash）
      flashing: false,
      // 主动刷新次数：传递给 AnimatedNumber 的 trigger，刷新后即使数值未变也重播滚动动画
      refreshTick: 0,
    };
  },
  beforeDestroy() {
    clearTimeout(this._flashTimer);
  },
  methods: {
    formatRefreshTime() {
      const pad = (value) => String(value).padStart(2, "0");
      const d = new Date();
      return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
        d.getHours()
      )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    },
    // 数据更新后触发一次「轻柔淡入上浮 + 数值主色渐隐」动画，时长与共享样式动画对齐
    flashData() {
      this.flashing = false;
      clearTimeout(this._flashTimer);
      this.$nextTick(() => {
        this.flashing = true;
        this._flashTimer = setTimeout(() => {
          this.flashing = false;
        }, 1100);
      });
    },
    /**
     * 包装一次面板刷新：并发保护 + 完成后更新时间戳并触发动画
     * @param {Function} run 返回 Promise 的取数函数
     * @returns {Promise}
     */
    runRefresh(run) {
      if (this.refreshing) return Promise.resolve();
      this.refreshing = true;
      return Promise.resolve()
        .then(run)
        .catch(() => {})
        .finally(() => {
          this.refreshing = false;
          this.lastRefreshTime = this.formatRefreshTime();
          this.refreshTick += 1;
          this.flashData();
        });
    },
  },
};
