<template>
  <div class='dortmund-record-trail'>
    <div v-if='visibleItems.length' class='record-trail-list'>
      <article v-for='(item, index) in visibleItems' :key='item.key || index' class='record-trail-item'
        :data-state='item.state || "default"'>
        <div class='record-trail-axis'>
          <span class='record-trail-node'><i :class='item.icon || "el-icon-time"'></i></span>
          <span v-if='index !== visibleItems.length - 1' class='record-trail-line'></span>
        </div>
        <div class='record-trail-content'>
          <div class='record-trail-heading'>
            <strong>{{ item.label }}</strong>
            <span v-if='item.badge' class='record-trail-badge'>{{ item.badge }}</span>
          </div>
          <p class='record-trail-value'>{{ displayValue(item.value, item.emptyValue || "未记录") }}</p>
          <span v-if='item.hint' class='record-trail-hint'>{{ item.hint }}</span>
        </div>
      </article>
    </div>
    <div v-else class='record-trail-empty'>
      <i class='el-icon-time'></i>
      <span>{{ emptyText }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DortmundRecordTrail',
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    emptyText: {
      type: String,
      default: '暂无可追溯的记录信息',
    },
  },
  computed: {
    // 仅保留实际有内容的轨迹项，避免空字段把记录区撑成无意义的时间轴
    visibleItems() {
      return (this.items || []).filter((item) => this.hasContent(item && item.value)
        || this.hasContent(item && item.hint)
        || (item && item.alwaysShow));
    },
  },
  methods: {
    // 空值处理保留数字 0，避免真实统计值被误判为缺失
    hasContent(value) {
      if (value === null || value === undefined) {
        return false;
      }
      return String(value).trim() !== '';
    },
    displayValue(value, fallback) {
      return this.hasContent(value) ? String(value).trim() : fallback;
    },
  },
};
</script>

<style lang='scss' scoped>
.dortmund-record-trail {
  width: 100%;
}

.record-trail-list {
  display: grid;
}

.record-trail-item {
  display: flex;
  gap: 14px;
  min-width: 0;
}

.record-trail-axis {
  display: flex;
  flex: 0 0 28px;
  flex-direction: column;
  align-items: center;
}

.record-trail-node {
  display: grid;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  color: #2e9b68;
  font-size: 12px;
  background: #eef8f2;
  border: 1px solid #dbeee3;
  border-radius: 50%;
  place-items: center;
}

.record-trail-line {
  flex: 1;
  width: 1px;
  min-height: 22px;
  margin: 5px 0;
  background: linear-gradient(180deg, #dcebe2 0%, #edf3ef 100%);
}

.record-trail-content {
  min-width: 0;
  padding: 2px 0 20px;
}

.record-trail-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
}

.record-trail-heading strong {
  font-size: 12px;
  font-weight: 700;
  color: #627069;
  letter-spacing: .03em;
}

.record-trail-badge {
  padding: 1px 7px;
  font-size: 10px;
  font-weight: 700;
  color: #2e9264;
  background: #edf8f1;
  border-radius: 999px;
}

.record-trail-value {
  margin: 5px 0 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.55;
  color: #26362e;
  overflow-wrap: anywhere;
}

.record-trail-hint {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.5;
  color: #87948d;
  overflow-wrap: anywhere;
}

.record-trail-item[data-state='success'] .record-trail-node {
  color: #25885b;
  background: #eaf8f0;
  border-color: #cfeadd;
}

.record-trail-item[data-state='warning'] .record-trail-node {
  color: #7c8d46;
  background: #f4f8e9;
  border-color: #e5eed2;
}

.record-trail-empty {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 13px 14px;
  font-size: 12px;
  color: #8a9790;
  background: #f7faf8;
  border-left: 2px solid #dbe9e0;
  border-radius: 0 8px 8px 0;

  i {
    font-size: 14px;
  }
}
</style>
