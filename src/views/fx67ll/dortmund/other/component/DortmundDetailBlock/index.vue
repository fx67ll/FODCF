<template>
  <div class='dortmund-detail-block' :data-variant='variant' :data-tone='tone'>
    <div v-if='variant === "metric"' class='metric-grid'>
      <div v-for='(item, index) in items' :key='index' class='metric-item' :data-state='item.state'
        :class='{ "is-clickable": item.clickable }' :role='item.clickable ? "button" : null'
        :tabindex='item.clickable ? 0 : null' @click='handleItemClick(item)' @keyup.enter='handleItemClick(item)'>
        <span class='metric-label'><i v-if='item.icon' :class='item.icon'></i>{{ item.label }}</span>
        <strong class='metric-value'>{{ displayValue(item.value, item.emptyText || '-') }}</strong>
        <span v-if='item.hint' class='metric-hint'>{{ item.hint }}</span>
      </div>
    </div>

    <el-timeline v-else-if='variant === "timeline"' class='dortmund-detail-timeline'>
      <el-timeline-item v-for='(item, index) in items' :key='index' :color='timelineColor(item.state)'
        :icon='item.icon || "el-icon-time"'>
        <div class='timeline-copy' :data-state='item.state'>
          <span class='timeline-label'>{{ item.label }}</span>
          <strong class='timeline-value'>{{ displayValue(item.value, item.emptyText || '-') }}</strong>
          <span v-if='item.hint' class='timeline-hint'>{{ item.hint }}</span>
        </div>
      </el-timeline-item>
    </el-timeline>

    <div v-else-if='variant === "versus"' class='versus'>
      <div class='versus-side'>
        <span class='versus-tag'>主队</span>
        <strong>{{ displayValue(home, '主队待定') }}</strong>
      </div>
      <div class='versus-divider'><strong>{{ displayValue(center, 'VS') }}</strong></div>
      <div class='versus-side'>
        <span class='versus-tag'>客队</span>
        <strong>{{ displayValue(away, '客队待定') }}</strong>
      </div>
      <div class='versus-fields'>
        <div v-for='(item, index) in items' :key='index' class='versus-field'>
          <span>{{ item.label }}</span>
          <strong>{{ displayValue(item.value, item.emptyText || '-') }}</strong>
        </div>
      </div>
    </div>

    <div v-else-if='variant === "profile"' class='profile'>
      <div class='profile-identity'>
        <span class='profile-avatar'>
          <el-image v-if='avatar' :src='avatar' fit='cover' :preview-src-list='[avatar]'
            error-icon='el-icon-picture-outline' />
          <i v-else class='el-icon-postcard'></i>
        </span>
        <div class='profile-copy'>
          <strong>{{ displayValue(name, '未命名') }}</strong>
          <span>{{ displayValue(subtitle, '暂无补充说明') }}</span>
        </div>
      </div>
      <div v-if='tags && tags.length' class='profile-tags'>
        <el-tag v-for='tag in tags' :key='tag' size='mini' effect='plain' type='success'>{{ tag }}</el-tag>
      </div>
      <div class='profile-fields'>
        <div v-for='(item, index) in items' :key='index' class='profile-field'>
          <span>{{ item.label }}</span>
          <strong>{{ displayValue(item.value, item.emptyText || '-') }}</strong>
        </div>
      </div>
    </div>

    <div v-else-if='variant === "evidence"' class='evidence'>
      <div v-for='(item, index) in items' :key='index' class='evidence-node'>
        <span class='evidence-index'>{{ indexLabel(index) }}</span>
        <div class='evidence-copy'>
          <span>{{ item.label }}</span>
          <strong>{{ displayValue(item.value, item.emptyText || '-') }}</strong>
          <p v-if='item.hint'>{{ item.hint }}</p>
        </div>
      </div>
    </div>

    <div v-else-if='variant === "ledger"' class='ledger'>
      <div v-for='(item, index) in items' :key='index' class='ledger-row' :data-state='item.state'>
        <div class='ledger-copy'>
          <span class='ledger-label'><i v-if='item.icon' :class='item.icon'></i>{{ item.label }}</span>
          <strong class='ledger-value'>{{ displayValue(item.value, item.emptyText || '-') }}</strong>
        </div>
        <el-progress v-if='item.percent != null' class='ledger-progress' :percentage='ledgerPercent(item)'
          :show-text='false' :stroke-width='5' :color='ledgerColor(item.state)' />
        <span v-if='item.hint' class='ledger-hint'>{{ item.hint }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DortmundDetailBlock',
  props: {
    variant: {
      type: String,
      required: true,
    },
    tone: {
      type: String,
      default: 'green',
    },
    items: {
      type: Array,
      default: () => [],
    },
    home: {
      type: String,
      default: '',
    },
    away: {
      type: String,
      default: '',
    },
    center: {
      type: String,
      default: 'VS',
    },
    avatar: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      default: '',
    },
    subtitle: {
      type: String,
      default: '',
    },
    tags: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    // 指标项可由业务页面标记为可点击，统一向宿主抛出事件，避免组件耦合具体业务动作。
    handleItemClick(item) {
      if (item && item.clickable) {
        this.$emit('item-click', item);
      }
    },
    displayValue(value, fallback = '-') {
      if (value === null || value === undefined) {
        return fallback;
      }
      const normalized = String(value).trim();
      return normalized === '' ? fallback : normalized;
    },
    indexLabel(index) {
      return String(index + 1).padStart(2, '0');
    },
    ledgerPercent(item) {
      return Math.round(Math.max(0, Math.min(100, Number(item.percent) || 0)));
    },
    ledgerColor(state) {
      if (state === 'danger') return '#b25b64';
      if (state === 'warning') return '#b07a4e';
      return '#3f8f77';
    },
    timelineColor(state) {
      if (state === 'success') return '#3f8f77';
      if (state === 'warning') return '#b07a4e';
      if (state === 'danger') return '#b25b64';
      return '#b8c3bd';
    },
  },
};
</script>

<style lang='scss' scoped>
.dortmund-detail-block {
  --block-accent: #2ecc71;
  --block-accent-soft: #e9f9f0;
  --block-border: #e8eee9;
  --block-secondary: #7e8b84;
}

.dortmund-detail-block[data-tone='green'] {
  --block-accent: #2ecc71;
  --block-accent-soft: #e9f9f0;
}

.dortmund-detail-block[data-tone='blue'] {
  --block-accent: #2f9e85;
  --block-accent-soft: #eaf8f3;
}

.dortmund-detail-block[data-tone='amber'] {
  --block-accent: #6f9f58;
  --block-accent-soft: #f1f8ec;
}

.dortmund-detail-block[data-tone='violet'] {
  --block-accent: #4f8f76;
  --block-accent-soft: #edf8f2;
}

.dortmund-detail-block[data-tone='cyan'] {
  --block-accent: #2f9e8c;
  --block-accent-soft: #eaf8f4;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 18px 24px;
}

.metric-item,
.versus-field,
.profile-field,
.ledger-row {
  min-width: 0;
}

.metric-item {
  padding: 1px 0 1px 13px;
  background: transparent;
  border: 0;
  border-left: 2px solid var(--block-accent);
  border-radius: 0;
}

.metric-item.is-clickable {
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.metric-item.is-clickable:hover,
.metric-item.is-clickable:focus-visible {
  background: var(--block-accent-soft);
  transform: translateX(2px);
}

.metric-label,
.timeline-label,
.versus-tag,
.profile-field span,
.evidence-copy span,
.ledger-label {
  display: block;
  margin-bottom: 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .06em;
  color: var(--block-secondary);
  text-transform: uppercase;
}

.metric-label i,
.ledger-label i {
  margin-right: 5px;
  color: var(--block-accent);
}

.metric-value,
.timeline-value,
.versus-side strong,
.profile-copy strong,
.profile-field strong,
.evidence-copy strong,
.ledger-value {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 15px;
  font-weight: 720;
  line-height: 1.45;
  color: #1f2d28;
}

.metric-value {
  font-size: 17px;
}

.metric-hint,
.timeline-hint,
.ledger-hint,
.evidence-copy p {
  margin: 5px 0 0;
  font-size: 11px;
  line-height: 1.45;
  color: #8b9791;
  overflow-wrap: anywhere;
}

.metric-item[data-state='success'] .metric-value,
.ledger-row[data-state='success'] .ledger-value {
  color: #3f8f77;
}

.metric-item[data-state='warning'] .metric-value,
.ledger-row[data-state='warning'] .ledger-value {
  color: #a26e4d;
}

.metric-item[data-state='danger'] .metric-value,
.ledger-row[data-state='danger'] .ledger-value {
  color: #a95e67;
}

.dortmund-detail-timeline {
  padding: 2px 0 0 2px;
  margin: 0;

  ::v-deep .el-timeline-item__tail {
    border-left-color: #e9efeb;
  }

  ::v-deep .el-timeline-item__node {
    background: #fff;
  }

  ::v-deep .el-timeline-item__icon {
    font-size: 12px;
  }

  ::v-deep .el-timeline-item__wrapper {
    top: -3px;
  }
}

.timeline-copy {
  min-width: 0;
  padding: 0 0 13px;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.versus {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  align-items: center;
  padding: 6px 0 0;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.versus-side {
  min-width: 0;
  text-align: center;
}

.versus-side strong {
  font-size: 20px;
  line-height: 1.35;
}

.versus-tag {
  display: inline-block;
  padding: 2px 7px;
  color: var(--block-accent);
  background: var(--block-accent-soft);
  border-radius: 999px;
}

.versus-divider strong {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  color: #fff;
  font-size: 12px;
  background: var(--block-accent);
  border-radius: 50%;
  box-shadow: none;
}

.versus-fields {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px 22px;
  padding: 18px 0 0;
  border-top: 1px solid var(--block-border);
}

.profile {
  padding: 4px 0 0;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.profile-identity {
  display: flex;
  gap: 16px;
  align-items: center;
}

.profile-avatar {
  display: grid;
  flex: 0 0 56px;
  place-items: center;
  width: 56px;
  height: 56px;
  overflow: hidden;
  color: var(--block-accent);
  background: var(--block-accent-soft);
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: none;

  i {
    font-size: 24px;
  }

  .el-image {
    width: 100%;
    height: 100%;
  }
}

.profile-copy {
  min-width: 0;

  strong {
    display: block;
    font-size: 17px;
    font-weight: 750;
    color: #1f2d28;
    overflow-wrap: anywhere;
  }

  span {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: #788780;
    overflow-wrap: anywhere;
  }
}

.profile-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.profile-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px 22px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--block-border);
}

.evidence {
  display: grid;
  gap: 0;
}

.evidence-node {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #eef2ef;
  border-radius: 0;
}

.evidence-node:last-child {
  border-bottom: 0;
}

.evidence-index {
  display: grid;
  flex: 0 0 24px;
  height: 24px;
  place-items: center;
  color: var(--block-accent);
  font-size: 10px;
  background: var(--block-accent-soft);
  border-radius: 7px;
}

.evidence-copy {
  min-width: 0;
}

.ledger {
  display: grid;
  gap: 0;
}

.ledger-row {
  padding: 12px 0;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #eef2ef;
  border-radius: 0;
}

.ledger-row:last-child {
  border-bottom: 0;
}

.ledger-progress {
  margin-top: 10px;

  ::v-deep .el-progress-bar__outer {
    background: #eef2ef;
  }
}

@media (max-width: 640px) {
  .versus {
    grid-template-columns: 1fr;
  }

  .versus-divider {
    justify-self: center;
  }
}
</style>
