<template>
  <section class="panel recent-panel">
    <div class="panel-head">
      <div>
        <span class="eyebrow">RECENT FLOW</span>
        <h3>最近活动</h3>
      </div>
      <span class="range-tag"><i class="el-icon-lock"></i> 仅本机</span>
    </div>

    <div v-if="visibleItems.length" class="recent-timeline">
      <button v-for="item in visibleItems" :key="item.path" type="button" class="recent-row"
        :title="`打开「${item.title}」`" @click="$emit('navigate', item.path)">
        <span class="recent-dot"></span>
        <div class="recent-main">
          <div class="recent-top">
            <strong class="recent-title">{{ item.title || "未命名菜单" }}</strong>
            <span v-if="Number(item.count) > 1" class="recent-count">{{ item.count }} 次</span>
          </div>
          <div class="recent-meta">
            <span v-if="item.category && item.category !== item.title" class="recent-cat">
              <i class="el-icon-folder-opened"></i>{{ item.category }}
            </span>
            <small class="recent-time">
              <i class="el-icon-time"></i>{{ relativeTime(item.lastVisitedAt) }}
            </small>
            <!-- 需求 #4：智能角色标签（基于访问频次派生） -->
            <span v-if="roleText(item)" class="recent-role" :class="roleClass(item)">{{ roleText(item) }}</span>
          </div>
        </div>
        <!-- 需求 #4：右侧 7 天迷你频次图，填充原本空旷的右侧 -->
        <div class="recent-insight" :title="`近 7 天访问 ${item.count || 0} 次`">
          <div class="recent-spark">
            <span v-for="(bar, i) in sparkBars(item)" :key="i" class="recent-spark-bar"
              :class="{ active: bar.active, today: i === 6 }" :style="{ height: bar.height + '%' }"></span>
          </div>
          <small class="recent-spark-caption">近 7 天</small>
        </div>
        <i class="el-icon-arrow-right recent-arrow"></i>
      </button>
    </div>

    <home-empty-state v-else inline icon="el-icon-time" title="还没有活动记录" desc="打开任意业务菜单后，这里会形成最近活动时间线" />
  </section>
</template>

<script>
import HomeEmptyState from "./EmptyState.vue";

/**
 * 最近活动时间线卡片（仅本机 localStorage 数据）
 * 与「常用入口」（按频率）形成互补：本卡片按最近访问时间排序，
 * 额外展示相对时间、访问次数与所属分组，便于回溯近期操作（需求 #3）。
 * 供管理员首页（#3）与访客首页（#4，置于技术架构卡片下方）复用。
 */
export default {
  name: "HomeRecentActivity",
  components: { HomeEmptyState },
  props: {
    // 已按 lastVisitedAt 倒序的菜单聚合数组（来自 menu-frequency 的 recentMenus）
    items: {
      type: Array,
      default: () => [],
    },
    // 最多展示条数（超出在固定高度内滚动）
    limit: {
      type: Number,
      default: 10,
    },
  },
  computed: {
    visibleItems() {
      return (this.items || []).slice(0, this.limit);
    },
    // 需求 #4：当前可见项中的最大访问次数，用于派生「本周主力」角色
    maxCount() {
      return this.visibleItems.reduce(
        (max, item) => Math.max(max, Number(item.count) || 0),
        0
      );
    },
  },
  methods: {
    /**
     * 需求 #4：根据访问频次派生一句话角色描述
     * 本周主力（最高频且≥3）/ 高频访问（≥5）/ 常用（≥2），单次访问不展示
     */
    roleText(item) {
      const count = Number(item.count) || 0;
      if (this.maxCount >= 3 && count === this.maxCount) return "本周主力";
      if (count >= 5) return "高频访问";
      if (count >= 2) return "常用";
      return "";
    },
    roleClass(item) {
      const count = Number(item.count) || 0;
      if (this.maxCount >= 3 && count === this.maxCount) return "lead";
      return "";
    },
    /** 需求 #4：把 item.daily（7 元数组）归一化为迷你频次图柱高 */
    sparkBars(item) {
      const source = Array.isArray(item.daily) ? item.daily.slice(0, 7) : [];
      const daily = source.slice();
      while (daily.length < 7) daily.push(0); // 补齐到 7 根，保证横轴连续
      const max = Math.max(1, ...daily);
      return daily.map((d) => ({
        height: d === 0 ? 14 : Math.max(24, Math.round((d / max) * 100)),
        active: d > 0,
      }));
    },
    /** 把时间戳格式化为「刚刚 / X 分钟前 / X 小时前 / 昨天 HH:mm / M月D日 HH:mm」 */
    relativeTime(timestamp) {
      if (!timestamp) return "暂无时间";
      const now = Date.now();
      const diff = Math.max(0, now - timestamp);
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;
      const pad = (value) => String(value).padStart(2, "0");

      if (diff < minute) return "刚刚";
      if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
      if (diff < day) return `${Math.floor(diff / hour)} 小时前`;

      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
      if (date.toDateString() === yesterday.toDateString()) return `昨天 ${timeStr}`;
      return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
    },
  },
};
</script>

<style lang="scss" scoped>
$primary: #2ecc71;
$primary-dark: #27ad60;
$ink: #2b3a36;
$muted: #7c8b84;

.recent-panel {
  display: flex;
  flex-direction: column;
}

/* 时间线滚动容器：固定高度，超出纵向滚动 */
.recent-timeline {
  position: relative;
  max-height: 360px;
  padding-left: 6px;
  overflow-y: auto;

  /* 贯穿所有节点的浅色时间轴 */
  &::before {
    position: absolute;
    top: 14px;
    bottom: 14px;
    left: 11px;
    width: 2px;
    content: "";
    background: linear-gradient(var(--home-primary-soft), rgba(46, 204, 113, 0.06));
    border-radius: 2px;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--home-primary-soft);
    border-radius: 99px;
  }
}

.recent-row {
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
  padding: 10px 6px 10px 24px;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: var(--home-primary-softer);

    .recent-arrow {
      opacity: 1;
      transform: translateX(2px);
    }
  }
}

.recent-dot {
  position: absolute;
  top: 16px;
  left: 5px;
  z-index: 1;
  box-sizing: content-box;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 3px solid $primary;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.12);
}

.recent-main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
}

.recent-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recent-title {
  overflow: hidden;
  color: $ink;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-count {
  flex: 0 0 auto;
  padding: 1px 8px;
  color: $primary-dark;
  background: var(--home-primary-softer);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
}

.recent-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 4px;
  color: $muted;
  font-size: 11px;
}

.recent-cat,
.recent-time {
  display: inline-flex;
  align-items: center;
  gap: 3px;

  i {
    color: $primary;
    font-size: 11px;
  }
}

.recent-arrow {
  margin-left: 10px;
  color: $primary;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

/* 需求 #4：智能角色标签 */
.recent-role {
  flex: 0 0 auto;
  padding: 1px 7px;
  color: $primary-dark;
  background: var(--home-primary-softer);
  border: 1px solid var(--home-border);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;

  &.lead {
    color: #fff;
    background: linear-gradient(135deg, $primary, $primary-dark);
    border-color: transparent;
  }
}

/* 需求 #4：右侧 7 天迷你频次图，填充原本空旷的右侧 */
.recent-insight {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-end;
  margin-left: 12px;
}

.recent-spark {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 22px;
}

.recent-spark-bar {
  display: block;
  width: 4px;
  min-height: 3px;
  background: var(--home-primary-soft);
  border-radius: 2px;
  transition: height 0.3s ease, background 0.2s ease;

  &.active {
    background: #a8ddc4;
  }

  /* 今天（末位）高亮主色 */
  &.today {
    background: $primary;
  }
}

.recent-spark-caption {
  margin-top: 3px;
  color: $muted;
  font-size: 9px;
  letter-spacing: 0.04em;
}

.panel-head {
  i {
    cursor: pointer;
  }
}

@media (max-width: 520px) {
  .recent-timeline {
    max-height: 300px;
  }

  /* 窄屏隐藏迷你频次图，避免与文字挤压 */
  .recent-insight {
    display: none;
  }
}
</style>
