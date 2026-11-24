<template>
  <!-- 使用次数：统一处理空值、纯数字展示和超高使用提示，颜色由调用方按列语义固定指定。 -->
  <button v-if="clickable" type="button" class="dortmund-usage-heat" :class="toneClass" :title="countTitle"
    @click.stop="$emit('click')">
    {{ displayValue }}<span v-if="isHot" class="dortmund-usage-heat-fire" aria-hidden="true">🔥</span>
  </button>
  <span v-else class="dortmund-usage-heat" :class="toneClass" :title="countTitle">
    {{ displayValue }}<span v-if="isHot" class="dortmund-usage-heat-fire" aria-hidden="true">🔥</span>
  </span>
</template>

<script>
import { DORTMUND_USAGE_HOT_THRESHOLD } from "@/views/fx67ll/dortmund/other/config/moduleConfig";

export default {
  name: "DortmundUsageHeatBadge",
  props: {
    value: {
      type: [Number, String],
      default: null,
    },
    interactive: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: "使用次数",
    },
    tone: {
      type: String,
      default: "green",
      validator: (value) => ["green", "red"].includes(value),
    },
  },
  computed: {
    count() {
      const parsed = Number(this.value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    },
    displayValue() {
      return this.count;
    },
    isHot() {
      return this.count > DORTMUND_USAGE_HOT_THRESHOLD;
    },
    toneClass() {
      return this.tone === "red" ? "is-red" : "is-green";
    },
    // 0 只表示当前没有关联数据，不提供可点击外观，避免用户误以为可以打开空列表。
    clickable() {
      return this.interactive && this.count > 0;
    },
    countTitle() {
      return `${this.label} ${this.count}${this.isHot ? "，使用次数较高" : ""}`;
    },
  },
};
</script>

<style lang="scss" scoped>
.dortmund-usage-heat {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 20px;
  padding: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  background: transparent;
  border: 0;
  transition: color .18s ease, opacity .18s ease, transform .18s ease;

  &.is-green {
    color: #2ecc71;
  }

  &.is-red {
    color: #f56c6c;
  }
}

button.dortmund-usage-heat {
  min-width: 34px;
  min-height: 28px;
  padding: 4px 9px;
  cursor: pointer;
  border-radius: 8px;
  outline: none;
  transition: color .18s ease, background-color .18s ease, box-shadow .18s ease, transform .18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(46, 204, 113, .14);
  }

  &.is-green:hover:not(:disabled) {
    background: rgba(46, 204, 113, .11);
  }

  &.is-red:hover:not(:disabled) {
    background: rgba(245, 108, 108, .11);
    box-shadow: 0 4px 10px rgba(245, 108, 108, .13);
  }

  &:active:not(:disabled) {
    transform: scale(.94);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px rgba(46, 204, 113, .22);
  }
}

.dortmund-usage-heat-fire {
  margin-left: 1px;
  font-size: 13px;
  line-height: 1;
}
</style>
