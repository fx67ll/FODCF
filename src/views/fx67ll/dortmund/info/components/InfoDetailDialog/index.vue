<template>
  <!-- 信息点详情对话框（只读，数据由父页面拉取后传入，开关由父页面 .sync 维护） -->
  <el-dialog title="信息点详情" :visible.sync="dialogVisible" :close-on-click-modal="false" width="760px"
    :style="`top: ${getDialogVerticalOffset(520)}`" append-to-body custom-class="info-detail-dialog">
    <template slot="title">
      <div class="info-detail-header">
        <div class="info-detail-header-icon">
          <i class="el-icon-document"></i>
        </div>
        <div class="info-detail-header-text">
          <div class="info-detail-header-title">信息点详情</div>
          <div class="info-detail-header-sub">只读详情展示，修改请返回列表点击操作列维护</div>
        </div>
      </div>
    </template>
    <div class="info-detail-body" v-loading="detailLoading">
      <div class="info-detail-info-row">
        <div class="info-detail-info-item">
          <span class="info-detail-info-label">信息点类型</span>
          <span class="info-detail-info-value">
            <dict-tag :options="dict.type.fx67ll_dortmund_info_point_type" :value="detailModel.infoPointType" />
          </span>
        </div>
        <div class="info-detail-info-item" v-if="detailModel.infoPointType === 'T'">
          <span class="info-detail-info-label">所属赛季</span>
          <span class="info-detail-info-value">{{ detailModel.seasonName || '空' }}</span>
        </div>
        <div class="info-detail-info-item" v-if="detailModel.infoPointType === 'M'">
          <span class="info-detail-info-label">所属比赛</span>
          <span class="info-detail-info-value">{{ formatMatchColumnText(detailModel) }}</span>
        </div>
        <div class="info-detail-info-item">
          <span class="info-detail-info-label">信息点状态</span>
          <span class="info-detail-info-value">
            <dict-tag :options="dict.type.sys_normal_disable" :value="detailModel.pointStatus" />
          </span>
        </div>
        <div class="info-detail-info-item">
          <span class="info-detail-info-label">是否可公开</span>
          <span class="info-detail-info-value">
            <dict-tag :options="dict.type.fx67ll_dortmund_allow_public" :value="detailModel.allowPublic" />
          </span>
        </div>
      </div>
      <div class="info-detail-field">
        <div class="info-detail-field-label">信息点标题</div>
        <div class="info-detail-field-value">{{ detailModel.pointTitle || '空' }}</div>
      </div>
      <div class="info-detail-field">
        <div class="info-detail-field-label">信息点内容</div>
        <div class="info-detail-field-value">{{ detailModel.pointContent || '空' }}</div>
      </div>
      <div class="info-detail-field" v-if="detailModel.infoPointType === 'T'">
        <div class="info-detail-field-label">关联球队（含历史停用关系）</div>
        <div class="info-detail-field-value">
          <template v-if="(detailModel.teamRels || []).length">
            <div v-for="rel in detailModel.teamRels" :key="rel.relationId" class="info-detail-team-rel">
              <span>{{ rel.teamName || ('球队' + rel.teamId) }}</span>
              <dict-tag :options="dict.type.sys_normal_disable" :value="rel.relationStatus" />
            </div>
          </template>
          <span v-else>空</span>
        </div>
      </div>
      <div class="info-detail-info-row">
        <div class="info-detail-info-item">
          <span class="info-detail-info-label">信息来源</span>
          <span class="info-detail-info-value">{{ detailModel.sourceName || '空' }}</span>
        </div>
        <div class="info-detail-info-item">
          <span class="info-detail-info-label">来源发布时间</span>
          <span class="info-detail-info-value">{{ parseTime(detailModel.sourcePublishTime,
            "{y}-{m}-{d}{h}:{i}:{s}") || '空' }}</span>
        </div>
        <div class="info-detail-info-item">
          <span class="info-detail-info-label">信息采集时间</span>
          <span class="info-detail-info-value">{{ parseTime(detailModel.collectTime, "{y}-{m}-{d} {h}:{i}:{s}")
            || '空' }}</span>
        </div>
      </div>
      <div class="info-detail-info-row">
        <div class="info-detail-info-item">
          <span class="info-detail-info-label">生效时间</span>
          <span class="info-detail-info-value">{{ parseTime(detailModel.effectiveStartTime,
            "{y}-{m}-{d}{h}:{i}:{s}") || '不限制' }}</span>
        </div>
        <div class="info-detail-info-item">
          <span class="info-detail-info-label">失效时间</span>
          <span class="info-detail-info-value">{{ parseTime(detailModel.effectiveEndTime,
            "{y}-{m}-{d}{h}:{i}:{s}") || '不限制' }}</span>
        </div>
      </div>
      <div class="info-detail-field" v-if="detailModel.pointRemark">
        <div class="info-detail-field-label">备注</div>
        <div class="info-detail-field-value">{{ detailModel.pointRemark }}</div>
      </div>
      <div class="info-detail-info-row">
        <div class="info-detail-info-item">
          <span class="info-detail-info-label">记录创建者</span>
          <span class="info-detail-info-value">{{ detailModel.createBy || '空' }}</span>
        </div>
        <div class="info-detail-info-item">
          <span class="info-detail-info-label">记录创建时间</span>
          <span class="info-detail-info-value">{{ parseTime(detailModel.createTime, "{y}-{m}-{d} {h}:{i}:{s}")
            || '空' }}</span>
        </div>
        <div class="info-detail-info-item">
          <span class="info-detail-info-label">记录更新时间</span>
          <span class="info-detail-info-value">{{ parseTime(detailModel.updateTime, "{y}-{m}-{d} {h}:{i}:{s}")
            || '空' }}</span>
        </div>
      </div>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "InfoDetailDialog",
  dicts: ["sys_normal_disable", "fx67ll_dortmund_info_point_type", "fx67ll_dortmund_allow_public"],
  props: {
    // 对话框开关（父页面 .sync 维护）
    visible: {
      type: Boolean,
      default: false,
    },
    // 完整只读详情（父页面拉取，拉取前为空对象兜底）
    detailModel: {
      type: Object,
      default: () => ({}),
    },
    // 详情加载状态
    detailLoading: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    // 对话框开关双向绑定：透传父页面维护
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    // 比赛对阵展示文案：主队 vs 客队 + 开赛时间（时间为空时只展示对阵）
    formatMatchVsTimeText(match) {
      const matchTime = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}");
      const vsText = `${match.homeTeamName || ""} vs ${match.awayTeamName || ""}`;
      return matchTime ? `${vsText}（${matchTime}）` : vsText;
    },
    // 比赛列展示文案：主队 vs 客队 + 开赛时间
    formatMatchColumnText(row) {
      if (row.infoPointType !== "M" || !row.matchId) {
        return "";
      }
      return this.formatMatchVsTimeText(row);
    },
  },
};
</script>

<style lang="scss" scoped>
/* 详情对话框 */
/* 弹窗视觉语言：圆角、渐变图标（与 extra/simulate 弹窗同一风格体系） */
::v-deep .info-detail-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 44px rgba(46, 204, 113, 0.18);
}

.info-detail-header {
  display: flex;
  align-items: center;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f0f4f2;
}

.info-detail-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  font-size: 20px;
  color: #fff;
  background: linear-gradient(135deg, #2ecc71 0%, #27ad60 100%);
  border-radius: 11px;
  box-shadow: 0 5px 12px rgba(46, 204, 113, 0.3);
}

.info-detail-header-title {
  font-size: 16px;
  font-weight: 700;
  color: #2b3a36;
}

.info-detail-header-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #7c8b84;
}

::v-deep .info-detail-dialog .el-dialog__body {
  padding-top: 16px;
}

::v-deep .info-detail-dialog .el-dialog__footer {
  padding: 14px 20px 18px;
  border-top: 1px solid #f0f4f2;
}

.info-detail-body {
  min-height: 120px;
}

.info-detail-info-row {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.info-detail-info-item {
  min-width: 180px;
  margin-right: 32px;
  margin-bottom: 8px;
  padding: 6px 10px;
  background: #f7faf8;
  border: 1px solid #e8f2ec;
  border-radius: 8px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #bfe8cf;
  }
}

.info-detail-info-label {
  display: block;
  margin-bottom: 2px;
  font-size: 12px;
  color: #909399;
}

.info-detail-info-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.info-detail-field {
  margin-bottom: 12px;
}

.info-detail-field-label {
  margin-bottom: 4px;
  font-size: 12px;
  color: #909399;
}

.info-detail-field-value {
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
  background-color: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #bfe8cf;
  }
}

.info-detail-team-rel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  margin-bottom: 4px;
  font-size: 13px;
  color: #303133;
  background-color: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #bfe8cf;
  }
}
</style>
