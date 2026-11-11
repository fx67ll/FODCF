<template>
  <!-- 信息点卡片视图（总览列表的另一种展示形式，数据与操作均来自父页面） -->
  <div class="info-card-pane" v-loading="loading">
    <template v-if="rows.length > 0">
      <div class="info-card-item" v-for="(point, index) in rows" :key="point.infoPointId"
        :style="{ animationDelay: (index % 12) * 0.04 + 's' }">
        <div class="info-card-head">
          <span class="info-card-type" :class="point.infoPointType === 'T' ? 'type-t' : 'type-m'">
            {{ point.infoPointType === 'T' ? '赛季球队' : '比赛临时' }}
          </span>
          <span class="info-card-title" :title="point.pointTitle || '-'">{{ point.pointTitle || '-' }}</span>
          <dict-tag class="info-card-status" :options="dict.type.sys_normal_disable" :value="point.pointStatus" />
        </div>
        <div class="info-card-content">{{ point.pointContent || '-' }}</div>
        <div class="info-card-tags">
          <el-tag v-if="point.infoPointType === 'T' && point.seasonName" size="mini" effect="plain"
            class="info-card-season-tag">{{ point.seasonName }}</el-tag>
          <el-tag v-for="team in visibleTeamRels(point).slice(0, 3)" :key="team.teamId" size="mini" effect="plain"
            class="info-card-team-tag">{{ team.teamName || ('球队' + team.teamId) }}</el-tag>
          <span class="info-card-team-more" v-if="visibleTeamRels(point).length > 3">+{{ visibleTeamRels(point).length -
            3
            }}支</span>
        </div>
        <div class="info-card-meta">
          <span v-if="point.infoPointType === 'M' && formatMatchText(point)">比赛：{{ formatMatchText(point) }}</span>
          <span v-if="point.sourceName">来源：{{ point.sourceName }}</span>
          <span v-if="point.sourcePublishTime">发布：{{ parseTime(point.sourcePublishTime, "{y}-{m}-{d}") }}</span>
          <span class="info-card-public">可公开：
            <dict-tag :options="dict.type.fx67ll_dortmund_allow_public" :value="point.allowPublic" /></span>
        </div>
        <div class="info-card-footer">
          <span class="info-card-actions">
            <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-view"
              @click="$emit('detail', point)" v-hasPermi="['dortmund:info:point:query']">详情</el-button>
            <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-edit"
              @click="$emit('update', point)" v-hasPermi="['dortmund:info:point:edit']">修改</el-button>
            <el-button size="mini" type="text" class="dortmund-theme-text"
              :icon="point.pointStatus === '0' ? 'el-icon-close' : 'el-icon-open'" @click="$emit('changeStatus', point)"
              v-hasPermi="['dortmund:info:point:changeStatus']">{{
                point.pointStatus === '0' ? '停用' : '启用'
              }}</el-button>
          </span>
        </div>
      </div>
    </template>
    <!-- 空数据占位 -->
    <div class="info-card-empty" v-else-if="!loading">
      <i class="el-icon-document"></i>
      <p>暂无信息点数据</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "InfoCardPane",
  dicts: ["sys_normal_disable", "fx67ll_dortmund_allow_public"],
  props: {
    // 信息点列表数据（与列表视图同一份，父页面持有）
    rows: {
      type: Array,
      default: () => [],
    },
    // 列表加载状态
    loading: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    // 卡片可见的关联球队集合（仅T类型有效，取不到关系时兜底空数组）
    visibleTeamRels(point) {
      if (point.infoPointType !== "T") {
        return [];
      }
      return point.teamRels || [];
    },
    // M类型卡片所属比赛摘要：主队 vs 客队（取不到球队名时兜底占位）
    formatMatchText(point) {
      const homeText = point.homeTeamName || (point.matchId ? "主队" : "");
      const awayText = point.awayTeamName || (point.matchId ? "客队" : "");
      if (!homeText && !awayText) {
        return "";
      }
      return `${homeText} vs ${awayText}`;
    },
  },
};
</script>

<style lang="scss" scoped>
/* 卡片视图：清新浅绿风格，与功能总览页同一视觉体系 */
.info-card-pane {
  min-height: 120px;
}

.info-card-item {
  display: flex;
  flex-direction: column;
  padding: 16px 18px;
  margin-bottom: 14px;
  background: #fff;
  border: 1px solid #e2eee7;
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(46, 204, 113, 0.09);
  animation: infoCardFadeUp 0.3s ease both;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: #2ecc71;
    box-shadow: 0 16px 34px rgba(46, 204, 113, 0.16);
  }
}

.info-card-head {
  display: flex;
  align-items: center;
}

.info-card-type {
  flex-shrink: 0;
  margin-right: 8px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;

  &.type-t {
    color: #27ad60;
    background: #e7f8ee;
  }

  &.type-m {
    color: #5a7d9a;
    background: #ecf3f8;
  }
}

.info-card-title {
  flex: 1;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  color: #2b3a36;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-card-status {
  flex-shrink: 0;
  margin-left: 10px;
}

.info-card-content {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #44604f;
  text-overflow: ellipsis;
  word-break: break-all;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.info-card-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 8px;
}

.info-card-season-tag,
.info-card-team-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.info-card-team-more {
  font-size: 12px;
  color: #7c8b84;
}

.info-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: #7c8b84;
}

.info-card-public {
  display: flex;
  align-items: center;
}

.info-card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px dashed #e2eee7;
}

.info-card-actions {
  white-space: nowrap;
}

/* 空数据占位 */
.info-card-empty {
  padding: 48px 0;
  text-align: center;

  i {
    font-size: 42px;
    color: #c6d1cb;
  }

  p {
    margin: 10px 0 0;
    font-size: 13px;
    color: #9aa8a1;
  }
}

@keyframes infoCardFadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式：宽屏双列，窄屏单列 */
@media screen and (min-width: 1100px) {
  .info-card-item {
    display: inline-flex;
    vertical-align: top;
    width: calc(50% - 7px);
    margin-right: 14px;
  }

  .info-card-item:nth-of-type(2n) {
    margin-right: 0;
  }
}
</style>
