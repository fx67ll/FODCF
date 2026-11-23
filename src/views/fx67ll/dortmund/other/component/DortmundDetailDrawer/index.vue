<template>
  <el-drawer :visible.sync='drawerVisible' :size='drawerSize' :with-header='false' append-to-body destroy-on-close
    :wrapper-closable='false' :custom-class='drawerClass' @opened='handleOpened' @closed='handleClosed'>
    <div class='dortmund-detail-shell' :data-tone='tone' :data-feature='feature'>
      <span class='dortmund-detail-accent'></span>
      <header class='dortmund-detail-hero'>
        <span class='dortmund-detail-mark'><i :class='icon'></i></span>
        <div class='dortmund-detail-title'>
          <span class='dortmund-detail-eyebrow'>{{ featureLabel }}</span>
          <h2>{{ title }}</h2>
          <p v-if='subtitle'>{{ subtitle }}</p>
        </div>
        <el-button type='text' class='dortmund-detail-close' icon='el-icon-close' aria-label='关闭详情'
          @click='closeDrawer' />
      </header>

      <div ref='content' v-loading='loading' class='dortmund-detail-content' element-loading-text='正在加载详情'>
        <div class='dortmund-detail-content-inner'>
          <slot></slot>
        </div>
      </div>

      <footer v-if='$slots.footer' class='dortmund-detail-footer'>
        <slot name='footer'></slot>
      </footer>
    </div>
  </el-drawer>
</template>

<script>
import { DORTMUND_DRAWER_LAYOUT } from '@/views/fx67ll/dortmund/other/config/moduleConfig';

const featureLabels = {
  season: '赛季',
  team: '球队',
  match: '比赛',
  odds: '倍率',
  info: '信息点',
  extra: '外快',
  plan: '方案',
  return: '回报组合',
};

export default {
  name: 'DortmundDetailDrawer',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '详情',
    },
    subtitle: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'el-icon-document',
    },
    tone: {
      type: String,
      default: 'green',
    },
    size: {
      type: String,
      default: '640px',
    },
    loading: {
      type: Boolean,
      default: false,
    },
    feature: {
      type: String,
      default: '',
    },
    /** 当前抽屉层级：1 为页面直接打开，2、3 为详情抽屉内的嵌套层。 */
    level: {
      type: [Number, String],
      default: 1,
    },
    /** 子抽屉打开时由父级置为 true，使父抽屉向左错位显示层级。 */
    shifted: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    drawerVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit('update:visible', value);
      },
    },
    featureLabel() {
      return featureLabels[this.feature] || '详情';
    },
    normalizedLevel() {
      const numericLevel = Number.parseInt(this.level, 10);
      if (!Number.isFinite(numericLevel)) {
        return 1;
      }
      return Math.min(DORTMUND_DRAWER_LAYOUT.maxLevel, Math.max(1, numericLevel));
    },
    // 仅对像素宽度做逐级扩展；百分比等响应式宽度继续沿用调用方配置。
    drawerSize() {
      const sizeText = String(this.size || '').trim();
      const pixelMatch = sizeText.match(/^(\d+(?:\.\d+)?)px$/i);
      if (!pixelMatch) {
        return sizeText;
      }
      const extraWidth = (this.normalizedLevel - 1) * DORTMUND_DRAWER_LAYOUT.levelWidthStep;
      return `${Number(pixelMatch[1]) + extraWidth}px`;
    },
    drawerClass() {
      const levelClass = `dortmund-detail-level-${this.normalizedLevel}`;
      return `dortmund-detail-drawer ${levelClass}${this.shifted ? ' is-shifted' : ''}`;
    },
  },
  methods: {
    closeDrawer() {
      this.drawerVisible = false;
    },
    handleOpened() {
      if (this.$refs.content) {
        this.$refs.content.scrollTop = 0;
      }
    },
    handleClosed() {
      this.$emit('closed');
    },
  },
};
</script>

<style lang='scss' scoped>
.dortmund-detail-shell {
  position: relative;
  --detail-accent: #2ecc71;
  --detail-accent-soft: #e9f9f0;
  --detail-border: #e5ece8;

  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  background: #fff;
}

.dortmund-detail-accent {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 3;
  height: 2px;
  background: linear-gradient(90deg, var(--detail-accent) 0%, transparent 100%);
}

.dortmund-detail-shell[data-tone='green'] {
  --detail-accent: #2ecc71;
  --detail-accent-soft: #e9f9f0;
}

.dortmund-detail-shell[data-tone='blue'] {
  --detail-accent: #2f9e78;
  --detail-accent-soft: #eaf8f1;
}

.dortmund-detail-shell[data-tone='amber'] {
  --detail-accent: #6f9f58;
  --detail-accent-soft: #f1f8ec;
}

.dortmund-detail-shell[data-tone='violet'] {
  --detail-accent: #2ecc71;
  --detail-accent-soft: #e9f9f0;
}

.dortmund-detail-shell[data-tone='cyan'] {
  --detail-accent: #2f9e78;
  --detail-accent-soft: #eaf8f1;
}

.dortmund-detail-hero {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px 12px;
  background: #fff;
  border-bottom: 1px solid var(--detail-border);
}

.dortmund-detail-mark {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  color: var(--detail-accent);
  font-size: 16px;
  background: var(--detail-accent-soft);
  border: 1px solid #dcefe4;
  border-radius: 9px;
  place-items: center;
}

.dortmund-detail-title {
  min-width: 0;
  flex: 1;

  .dortmund-detail-eyebrow {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 3px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .1em;
    color: var(--detail-accent);
    text-transform: uppercase;
  }

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 750;
    line-height: 1.3;
    color: #1f2d28;
    overflow-wrap: anywhere;
  }

  p {
    margin: 3px 0 0;
    font-size: 12px;
    line-height: 1.45;
    color: #6f7e77;
    overflow-wrap: anywhere;
  }
}

.dortmund-detail-close {
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  padding: 0;
  margin: 0;
  color: #75817b;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
  transition: color .16s ease, background-color .16s ease;

  &:hover {
    color: #384940;
    background: #f2f5f3;
  }
}

.dortmund-detail-content {
  flex: 1;
  min-height: 0;
  padding: 4px 24px 22px;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-color: #cbd8d1 transparent;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 7px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd8d1;
    border: 2px solid transparent;
    border-radius: 999px;
    background-clip: padding-box;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.dortmund-detail-content-inner {
  width: 100%;
  max-width: 100%;
}

.dortmund-detail-footer {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 8px 24px 10px;
  background: #fff;
  border-top: 1px solid var(--detail-border);

  ::v-deep .el-button {
    min-height: 30px;
    padding: 7px 13px;
    font-size: 12px;
  }
}

@media (max-width: 720px) {
  .dortmund-detail-hero {
    padding: 14px 18px 12px;
  }

  .dortmund-detail-content {
    padding: 4px 18px 20px;
  }

  .dortmund-detail-footer {
    padding: 8px 18px 10px;
  }
}

@media (max-width: 520px) {
  .dortmund-detail-hero {
    gap: 10px;
    padding: 12px 16px 10px;
  }

  .dortmund-detail-title h2 {
    font-size: 17px;
  }

  .dortmund-detail-content {
    padding: 2px 16px 18px;
  }

  .dortmund-detail-footer {
    padding: 8px 16px 10px;
  }
}
</style>
