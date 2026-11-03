<template>
  <!-- 方案计划回顾场景（整页只读详情，数据由父页面拉取后传入） -->
  <div class="plan-review-scene">
    <div class="plan-edit-header">
      <div class="plan-edit-header-left">
        <el-button type="text" icon="el-icon-back" @click="handleBackToList">返回总览</el-button>
        <span class="plan-edit-title">方案计划回顾</span>
      </div>
    </div>

    <div class="plan-review-body" v-loading="reviewLoading">
      <!-- 完整正文与摘要信息 -->
      <div class="plan-review-card">
        <div class="plan-review-info-row">
          <div class="plan-review-info-item">
            <span class="plan-review-info-label">录入倍率</span>
            <span class="plan-review-info-value">{{ detailModel.planRate || '空' }}</span>
          </div>
          <div class="plan-review-info-item">
            <span class="plan-review-info-label">录入金额</span>
            <span class="plan-review-info-value">{{ detailModel.planAmount || '空' }}</span>
          </div>
          <div class="plan-review-info-item">
            <span class="plan-review-info-label">更新时间</span>
            <span class="plan-review-info-value">{{ parseTime(detailModel.updateTime, "{y}-{m}-{d} {h}:{i}:{s}")
            }}</span>
          </div>
        </div>
        <div class="plan-review-content">{{ detailModel.planContent }}</div>
        <div class="plan-review-remark" v-if="detailModel.planRemark">其他说明：{{ detailModel.planRemark }}</div>
      </div>

      <!-- 全部比赛（每场当前赛果只读） -->
      <div class="plan-review-card">
        <div class="plan-review-card-title">关联比赛（共 {{ (detailModel.matches || []).length }} 场）</div>
        <el-table :data="detailModel.matches || []" empty-text="暂无关联比赛">
          <el-table-column label="所属赛季" align="center" prop="seasonName" width="120" />
          <el-table-column label="主队" align="center" prop="homeTeamName" min-width="140" />
          <el-table-column label="客队" align="center" prop="awayTeamName" min-width="140" />
          <el-table-column label="比赛时间" align="center" prop="matchTime" width="160">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.matchTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
            </template>
          </el-table-column>
          <el-table-column label="比赛状态" align="center" prop="matchStatus" width="90">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.sys_notice_status" :value="scope.row.matchStatus" />
            </template>
          </el-table-column>
          <el-table-column label="比赛结果" align="center" prop="matchResult" width="90">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.fx67ll_match_result" :value="scope.row.matchResult" />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 图片（有权限时，最多两张，只读） -->
      <div class="plan-review-card" v-if="hasImageQueryPermission">
        <div class="plan-review-card-title">方案计划图片（{{ (detailModel.planImageObjectKeys || []).length }} / 2）</div>
        <div class="plan-review-image-list">
          <el-image v-for="(objectKey, index) in detailModel.planImageObjectKeys || []" :key="index"
            :src="baseUrl + objectKey" fit="cover"
            style="width: 120px; height: 120px; border-radius: 6px; margin-right: 10px;"
            :preview-src-list="imagePreviewList" />
          <span class="plan-review-image-empty" v-if="!(detailModel.planImageObjectKeys || []).length">暂无图片</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PlanReviewScene",
  dicts: ["sys_notice_status", "fx67ll_match_result"],
  props: {
    // 回顾详情数据（父页面拉取，拉取前为空对象兜底）
    detailModel: {
      type: Object,
      default: () => ({}),
    },
    // 回顾场景加载状态
    reviewLoading: {
      type: Boolean,
      default: false,
    },
    // 是否拥有图片查询权限（决定图片区是否渲染）
    hasImageQueryPermission: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // 图片预览基础地址
      baseUrl: process.env.VUE_APP_BASE_API,
    };
  },
  computed: {
    // 回顾场景图片预览集合（完整地址）
    imagePreviewList() {
      return (this.detailModel.planImageObjectKeys || []).map((objectKey) => this.baseUrl + objectKey);
    },
  },
  methods: {
    // 返回总览（交由父页面切回列表场景并刷新）
    handleBackToList() {
      this.$emit("back");
    },
  },
};
</script>

<style lang="scss" scoped>
/* 回顾场景头部（沿用旧结构） */
.plan-edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.plan-edit-header-left {
  display: flex;
  align-items: center;
}

.plan-edit-title {
  margin-left: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 回顾场景 */
.plan-review-body {
  min-height: 200px;
}

.plan-review-card {
  margin-bottom: 16px;
  padding: 18px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.plan-review-card-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.plan-review-info-row {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.plan-review-info-item {
  min-width: 140px;
  margin-right: 32px;
}

.plan-review-info-label {
  display: block;
  margin-bottom: 2px;
  font-size: 12px;
  color: #909399;
}

.plan-review-info-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.plan-review-content {
  padding: 12px 14px;
  font-size: 14px;
  line-height: 1.7;
  color: #303133;
  white-space: pre-wrap;
  background-color: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.plan-review-remark {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.5;
  color: #909399;
}

.plan-review-image-list {
  display: flex;
  align-items: center;
}

.plan-review-image-empty {
  font-size: 13px;
  color: #909399;
}
</style>
