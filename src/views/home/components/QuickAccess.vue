<template>
  <section class="panel quick-panel">
    <div class="panel-head">
      <div>
        <span class="eyebrow">SMART SHORTCUTS</span>
        <h3>常用入口</h3>
      </div>
      <span class="range-tag">近 7 天 · 本机</span>
    </div>

    <div v-if="items.length" class="quick-grid">
      <button v-for="(item, index) in items" :key="item.path" type="button" class="quick-item"
        @click="openMenu(item.path)">
        <span class="quick-index">{{ String(index + 1).padStart(2, "0") }}</span>
        <span class="quick-icon">
          <i v-if="isElIcon(item.icon)" :class="item.icon"></i>
          <svg-icon v-else :icon-class="item.icon || 'menu'" />
        </span>
        <span class="quick-copy">
          <strong>{{ item.title }}</strong>
          <small>{{ item.count ? `本周打开 ${item.count} 次` : "快捷访问" }}</small>
        </span>
        <i class="el-icon-right quick-arrow"></i>
      </button>
    </div>

    <home-empty-state v-else class="quick-empty" icon="el-icon-mouse" title="还没有常用入口"
      desc="访问过的菜单会按使用频率自动排列在这里，方便一键直达" />
  </section>
</template>

<script>
import HomeEmptyState from "./EmptyState.vue";

/**
 * 常用入口（对应需求 #2：根据最近 7 天访问频率提供快捷入口）
 */
export default {
  name: "HomeQuickAccess",
  components: { HomeEmptyState },
  props: {
    items: { type: Array, default: () => [] },
  },
  methods: {
    // 兼容 Element 字体图标：以 "el-icon-" 开头时按字体类渲染，否则走 SVG 体系
    // 与侧边栏 Item.vue 保持一致，避免公告、服务状态等字体图标入口出现空白
    isElIcon(icon) {
      return /^el-icon-/.test(icon || "");
    },
    openMenu(path) {
      if (!path) return;
      if (/^(https?:)?\/\//.test(path)) {
        window.open(path, "_blank");
        return;
      }
      this.$router.push(path).catch(() => { });
    },
  },
};
</script>

<style lang="scss" scoped>
.quick-panel {
  height: 100%;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.quick-item {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 14px;
  overflow: hidden;
  color: var(--home-ink, #2b3a36);
  text-align: left;
  background: var(--home-primary-softer, #f2fbf6);
  border: 1px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;

  &:hover {
    background: #fff;
    border-color: var(--home-primary, #2ecc71);
    box-shadow: 0 8px 18px rgba(46, 204, 113, 0.14);
    transform: translateY(-2px);

    .quick-arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &:active {
    transform: translateY(0);
  }
}

.quick-index {
  position: absolute;
  top: 4px;
  right: 10px;
  color: rgba(46, 204, 113, 0.18);
  font-size: 28px;
  font-weight: 700;
}

.quick-icon {
  display: flex;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin-right: 12px;
  color: #fff;
  background: var(--home-primary, #2ecc71);
  border-radius: 11px;
  font-size: 18px;
}

.quick-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 14px;
  }

  small {
    margin-top: 5px;
    color: var(--home-muted, #7c8b84);
    font-size: 11px;
  }
}

.quick-arrow {
  margin-left: 6px;
  color: var(--home-primary, #2ecc71);
  opacity: 0;
  transform: translateX(-6px);
  transition: all 0.2s ease;
}

.quick-empty {
  border: 1px dashed var(--home-border, #e2eee7);
  border-radius: 14px;
  background: var(--home-primary-softer, #f2fbf6);
}

.panel-head {
  i {
    cursor: pointer;
  }
}

@media (max-width: 600px) {
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
