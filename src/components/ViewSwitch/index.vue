<template>
  <!-- 视图切换器：分段胶囊 + 滑动高亮块，支持键盘左右方向键切换 -->
  <div class="view-switch" role="radiogroup" :aria-label="ariaLabel"
    :style="{ '--vs-count': options.length, '--vs-index': activeIndex }" @keydown.left.prevent="move(-1)"
    @keydown.right.prevent="move(1)">
    <span class="view-switch-thumb" aria-hidden="true"></span>
    <button v-for="item in options" :key="item.value" type="button" role="radio" class="view-switch-item"
      :class="{ active: item.value === value }" :aria-checked="item.value === value ? 'true' : 'false'"
      :tabindex="item.value === value ? 0 : -1" @click="select(item.value)">
      <i :class="item.icon"></i>
      <span class="view-switch-label">{{ item.label }}</span>
    </button>
  </div>
</template>

<script>
export default {
  name: "ViewSwitch",
  props: {
    // 当前选中值（配合 v-model 使用）
    value: {
      type: String,
      default: "card",
    },
    // 选项列表 [{ value, label, icon }]，默认卡片视图 / 列表视图
    options: {
      type: Array,
      default: () => [
        { value: "card", label: "卡片", icon: "el-icon-s-grid" },
        { value: "list", label: "列表", icon: "el-icon-tickets" },
      ],
    },
    ariaLabel: {
      type: String,
      default: "展示视图切换",
    },
  },
  computed: {
    // 当前选中项下标（驱动高亮块位移）
    activeIndex() {
      const index = this.options.findIndex(item => item.value === this.value);
      return index < 0 ? 0 : index;
    },
  },
  methods: {
    // 选中某一项：值变化时才触发事件，避免重复写缓存
    select(val) {
      if (val === this.value) {
        return;
      }
      this.$emit("input", val);
      this.$emit("change", val);
    },
    // 键盘方向键切换并把焦点移动到新选中项
    move(step) {
      const next = this.activeIndex + step;
      if (next < 0 || next >= this.options.length) {
        return;
      }
      this.select(this.options[next].value);
      this.$nextTick(() => {
        const buttons = this.$el.querySelectorAll(".view-switch-item");
        if (buttons[next]) {
          buttons[next].focus();
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
$vs-pad: 3px;

.view-switch {
  position: relative;
  display: inline-grid;
  grid-template-columns: repeat(var(--vs-count, 2), 1fr);
  padding: $vs-pad;
  background: #eef4f0;
  border: 1px solid #e0ebe4;
  border-radius: 999px;
  user-select: none;
}

/* 滑动高亮块：按选中下标位移，带轻微回弹 */
.view-switch-thumb {
  position: absolute;
  top: $vs-pad;
  bottom: $vs-pad;
  left: $vs-pad;
  width: calc((100% - #{$vs-pad * 2}) / var(--vs-count, 2));
  background: var(--current-color, #2ecc71);
  border-radius: 999px;
  box-shadow: 0 4px 10px rgba(46, 204, 113, 0.35);
  transform: translateX(calc(var(--vs-index, 0) * 100%));
  transition: transform 0.36s cubic-bezier(0.34, 1.35, 0.64, 1);
}

.view-switch-item {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 68px;
  padding: 0 14px;
  height: 26px;
  font-size: 12px;
  line-height: 26px;
  color: #6b7c74;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 999px;
  outline: none;
  transition: color 0.25s ease;

  i {
    margin-right: 4px;
    font-size: 13px;
    transition: transform 0.3s ease;
  }

  &:hover:not(.active) {
    color: var(--current-color, #2ecc71);
  }

  &.active {
    font-weight: 600;
    color: #fff;

    i {
      transform: scale(1.15);
    }
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--current-color, #2ecc71);
  }
}

@media (prefers-reduced-motion: reduce) {

  .view-switch-thumb,
  .view-switch-item,
  .view-switch-item i {
    transition: none;
  }
}
</style>
