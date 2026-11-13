<template>
  <div class="plan-link-selector" v-if="hasPlanListPermission && hasPlanQueryPermission">
    <!-- 区域头部：默认折叠，折叠时显示已选条数 -->
    <div class="plan-link-header" @click="handleToggleExpand">
      <div class="plan-link-header-left">
        <i class="el-icon-collection-tag"></i>
        <span class="plan-link-title">关联方案计划（可选）</span>
        <el-tag size="mini" effect="plain" type="success" class="plan-link-count-tag">
          已选 {{ selectedTotal }} 条
        </el-tag>
        <el-tag size="mini" effect="plain" v-if="hiddenPlanCount > 0" type="warning" class="plan-link-count-tag">
          另有 {{ hiddenPlanCount }} 条无权查看
        </el-tag>
      </div>
      <i class="el-icon-arrow-down" :class="{ 'is-expanded': expanded }"></i>
    </div>
    <!-- 折叠展开过渡（高度加透明度，约0.28s） -->
    <transition name="plan-link-expand">
      <div class="plan-link-body" v-if="expanded">
        <!-- 隐藏关联提示（编辑已有记录时） -->
        <div class="plan-link-hidden-tip" v-if="hiddenPlanCount > 0">
          另有 {{ hiddenPlanCount }} 条无权查看的关联，保存不会影响它们
        </div>

        <!-- 已有方案计划：共享侧边抽屉跨页多选，避免长列表挤占对话框 -->
        <div class="plan-link-picker">
          <div class="plan-link-picker-copy">
            <span class="plan-link-picker-label">已有方案计划</span>
            <p>从侧边抽屉筛选并跨页勾选，已选结果会保留。</p>
          </div>
          <el-button type="success" plain size="small" icon="el-icon-finished" class="plan-link-picker-button"
            @click="openPlanSelector">
            {{ selectedPlanIds.length ? `已选 ${selectedPlanIds.length} 条 · 继续选择` : "选择方案计划" }}
          </el-button>
        </div>

        <!-- 已选方案计划标签：可逐条移除 -->
        <div class="plan-link-tags" v-if="selectedPlanList.length > 0">
          <el-tag v-for="plan in selectedPlanList" :key="plan.planId" size="small" closable class="plan-link-tag"
            @close="handleRemovePlan(plan.planId)">
            {{ formatPlanTagText(plan) }}
          </el-tag>
        </div>

        <!-- 当场新建方案计划入口（没有新增权限时不显示） -->
        <div class="plan-link-new-entry" v-if="hasPlanAddPermission">
          <el-button type="text" class="dortmund-theme-text plan-link-new-entry-button"
            icon="el-icon-circle-plus-outline" @click="toggleNewPlanPanel">
            {{ newPlanVisible ? "收起当场新建" : "当场新建方案计划" }}
          </el-button>
        </div>

        <!-- 当场新建方案计划滑出面板（同页面板，不是子弹窗） -->
        <transition name="slide-panel">
          <div class="plan-link-new-panel" v-if="newPlanVisible">
            <div class="plan-link-new-panel-title">
              <i class="el-icon-collection-tag"></i>
              <span>当场新建方案计划（比赛只能选已有正常比赛，与保存同一事务）</span>
            </div>
            <el-form ref="newPlanForm" :model="newPlanForm" :rules="newPlanRules" label-width="110px">
              <el-form-item label="方案计划" prop="planContent">
                <el-input v-model="newPlanForm.planContent" type="textarea" :rows="3" :maxlength="1023" show-word-limit
                  placeholder="请输入方案计划" />
              </el-form-item>
              <el-form-item label="录入倍率" prop="planRate">
                <el-input v-model="newPlanForm.planRate" placeholder="请输入录入倍率（可空，有值时必须大于0）" />
              </el-form-item>
              <el-form-item label="录入金额" prop="planAmount">
                <el-input v-model="newPlanForm.planAmount" placeholder="请输入录入金额（可空，有值时必须大于等于0）" />
              </el-form-item>
              <el-form-item label="其他说明" prop="planRemark">
                <el-input v-model="newPlanForm.planRemark" type="textarea" :rows="2" :maxlength="1023" show-word-limit
                  placeholder="请输入其他说明" />
              </el-form-item>
              <el-form-item label="关联比赛" prop="matchIds">
                <common-enhanced-select ref="newPlanMatchSelect" v-model="newPlanForm.matchIds" valueKey="matchId"
                  labelKey="matchName" :api-func="listMatch" :query-params="{ matchStatus: '0' }" multiple
                  placeholder="请选择已有正常比赛（可多选）" />
              </el-form-item>
              <div class="plan-link-new-actions">
                <el-button type="success" plain icon="el-icon-plus" size="mini" @click="handleAddNewPlan">
                  加入新建列表
                </el-button>
              </div>
              <div class="plan-link-new-tip" v-if="!hasSelectableMatch">
                没有可选的正常比赛，请前往比赛页或方案计划页先创建
              </div>
            </el-form>
            <!-- 已加入的当场新建方案计划 -->
            <div class="plan-link-tags" v-if="newPlanList.length > 0">
              <el-tag v-for="(plan, index) in newPlanList" :key="'new' + index" size="small" type="success" closable
                class="plan-link-tag" @close="handleRemoveNewPlan(index)">
                新建：{{ formatNewPlanTagText(plan) }}
              </el-tag>
            </div>
          </div>
        </transition>

        <!-- 选中方案计划的只读摘要：所达比赛去重 + 最多5场折叠 -->
        <div class="plan-link-summary" v-if="selectedPlanList.length > 0">
          <div class="plan-link-summary-plan" v-for="plan in selectedPlanList" :key="plan.planId">
            <div class="plan-link-summary-plan-header">
              <span class="plan-link-summary-plan-content">{{ formatPlanSummaryText(plan) }}</span>
              <span class="plan-link-summary-plan-extra">
                倍率：{{ plan.planRate || '空' }} 金额：{{ plan.planAmount || '空' }}
              </span>
            </div>
            <!-- 所达比赛（去重后超过5场默认折叠） -->
            <div class="plan-link-summary-matches">
              <el-tag v-for="match in shownMatchesOfPlan(plan)" :key="match.matchId" size="mini" effect="plain"
                class="plan-link-match-tag">
                {{ formatMatchTagText(match) }}
              </el-tag>
              <el-button v-if="needMatchesCollapse(plan)" type="text" size="mini"
                @click="handleTogglePlanMatches(plan.planId)">
                {{ isPlanMatchesExpanded(plan.planId) ? "收起" : "展开全部" }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <dortmund-plan-selector-modal :visible.sync="planSelectorVisible" :selected-items="selectedPlanList"
      @confirm="handlePlanSelected" />
  </div>
</template>

<script>
import { listMatch } from "@/api/fx67ll/dortmund/match";

import { checkPermi } from "@/utils/common/permission";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";
import DortmundPlanSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundPlanSelectorModal/index";

// 所达比赛默认折叠条数
const MATCH_COLLAPSE_COUNT = 5;

export default {
  name: "PlanLinkSelector",
  components: { CommonEnhancedSelect, DortmundPlanSelectorModal },
  props: {
    // 编辑回显的已有关联方案计划主键集合（数组，新增场景为空）
    planIds: {
      type: Array,
      default: () => [],
    },
    // 编辑回显的不可见关联条数（后端 hiddenPlanCount）
    hiddenPlanCount: {
      type: Number,
      default: 0,
    },
    // 编辑回显的可见方案计划详情集合（用于只读摘要展示，可选）
    plans: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    // 倍率有值时必须大于0，十进制字符串校验
    const checkPlanRate = (rule, value, callback) => {
      if (value == null || value === "") {
        callback();
        return;
      }
      if (!/^\d+(\.\d+)?$/.test(String(value))) {
        callback(new Error("录入倍率只能为非负十进制数字"));
        return;
      }
      if (parseFloat(value) <= 0) {
        callback(new Error("录入倍率有值时必须大于0"));
        return;
      }
      callback();
    };
    // 金额有值时必须大于等于0，十进制字符串校验
    const checkPlanAmount = (rule, value, callback) => {
      if (value == null || value === "") {
        callback();
        return;
      }
      if (!/^\d+(\.\d+)?$/.test(String(value))) {
        callback(new Error("录入金额只能为非负十进制数字"));
        return;
      }
      callback();
    };
    return {
      // 区域是否展开（默认折叠）
      expanded: false,
      // 已选的已有方案计划主键集合（提交进 planIds）
      selectedPlanIds: [],
      // 已选方案计划的详情快照（用于只读摘要展示）
      selectedPlanList: [],
      // 当场新建方案计划面板开关
      newPlanVisible: false,
      // 已加入的当场新建方案计划列表（提交进 newPlans）
      newPlanList: [],
      // 当场新建方案计划表单
      newPlanForm: {
        planContent: null,
        planRate: null,
        planAmount: null,
        planRemark: null,
        matchIds: [],
      },
      // 当场新建方案计划表单校验
      newPlanRules: {
        planContent: [
          { required: true, message: "方案计划不能为空", trigger: "blur" }
        ],
        planRate: [
          { validator: checkPlanRate, trigger: "blur" }
        ],
        planAmount: [
          { validator: checkPlanAmount, trigger: "blur" }
        ],
        matchIds: [
          { required: true, type: "array", min: 1, message: "至少要关联一场比赛", trigger: "change" }
        ],
      },
      // 展开全部所达比赛的方案计划主键集合
      expandedPlanMatchIds: [],
      // 是否操作过关联区域（提交规则：没动过不带 planIds、newPlans）
      touched: false,
      // 已选方案计划抽屉开关
      planSelectorVisible: false,
      // 是否已检查正常比赛可用性（只在展开当场新建时检查一次）
      matchAvailabilityChecked: false,
      matchCount: 0,
    };
  },
  computed: {
    // 同时具备方案计划列表与查询权限时才渲染整个区域
    hasPlanListPermission() {
      return checkPermi(["dortmund:plan:list"]);
    },
    hasPlanQueryPermission() {
      return checkPermi(["dortmund:plan:query"]);
    },
    // 是否拥有方案计划新增权限（决定当场新建入口是否显示）
    hasPlanAddPermission() {
      return checkPermi(["dortmund:plan:add"]);
    },
    // 已选条数（已有 + 当场新建）
    selectedTotal() {
      return this.selectedPlanIds.length + this.newPlanList.length;
    },
    // 是否有可选的正常比赛
    hasSelectableMatch() {
      return !this.matchAvailabilityChecked || this.matchCount > 0;
    },
  },
  watch: {
    // 回显主键集合变化时重置关联区域（编辑弹窗每次打开都会传入新的回显集合）
    planIds() {
      this.resetSelection();
    },
  },
  created() {
    // 比赛下拉包装接口：为每个选项拼装 matchName 展示文案（后台比赛数据无 matchName 冗余字段）
    this.listMatch = (query) => {
      return listMatch(query).then((response) => {
        const rows = (response.rows || []).map((match) => ({
          ...match,
          matchName: this.formatMatchOptionLabel(match),
        }));
        return { ...response, rows };
      });
    };

    // 编辑回显：按回显集合初始化已选状态
    this.resetSelection();
  },
  methods: {
    // 打开方案计划侧边抽屉
    openPlanSelector() {
      this.expanded = true;
      this.planSelectorVisible = true;
    },
    // 抽屉确认：同步已选主键与详情快照
    handlePlanSelected(plans) {
      const rows = plans || [];
      this.selectedPlanIds = rows.map(plan => plan.planId);
      this.selectedPlanList = [...rows];
      this.touched = true;
      this.planSelectorVisible = false;
    },
    // 延迟检查是否存在正常比赛，避免弹窗初始化时的空闲请求
    ensureMatchAvailability() {
      if (this.matchAvailabilityChecked) {
        return;
      }
      this.matchAvailabilityChecked = true;
      listMatch({ pageNum: 1, pageSize: 1, matchStatus: "0" }).then(response => {
        this.matchCount = Number(response.total) || (response.rows || []).length;
      }).catch(() => {
        this.matchAvailabilityChecked = false;
      });
    },
    // 重置关联区域的已选与新建状态（回显集合变化或弹窗重新打开时调用）
    resetSelection() {
      this.selectedPlanIds = [...(this.planIds || [])];
      this.newPlanList = [];
      this.newPlanVisible = false;
      this.resetNewPlanForm();
      this.touched = false;
      this.expanded = false;
      this.expandedPlanMatchIds = [];
      this.planSelectorVisible = false;
      this.matchAvailabilityChecked = false;
      this.matchCount = 0;
      this.syncSelectedPlanList();
    },
    // 按已选主键集合同步详情快照（优先使用传入的回显详情）
    syncSelectedPlanList() {
      const plansById = {};
      (this.plans || []).forEach(plan => {
        plansById[plan.planId] = plan;
      });
      this.selectedPlanList = this.selectedPlanIds
        .map(planId => plansById[planId])
        .filter(Boolean);
    },
    // 展开/折叠关联区域
    handleToggleExpand() {
      this.expanded = !this.expanded;
    },
    // 标签移除一条已有方案计划
    handleRemovePlan(planId) {
      this.selectedPlanIds = this.selectedPlanIds.filter(id => id !== planId);
      this.syncSelectedPlanList();
      this.touched = true;
    },
    // 展开/收起当场新建方案计划面板
    toggleNewPlanPanel() {
      this.newPlanVisible = !this.newPlanVisible;
      if (!this.newPlanVisible) {
        this.resetNewPlanForm();
      } else {
        this.ensureMatchAvailability();
      }
      this.$nextTick(() => {
        this.$refs["newPlanForm"] && this.$refs["newPlanForm"].clearValidate();
      });
    },
    // 重置当场新建方案计划表单
    resetNewPlanForm() {
      this.newPlanForm = {
        planContent: null,
        planRate: null,
        planAmount: null,
        planRemark: null,
        matchIds: [],
      };
    },
    // 当场新建方案计划加入新建列表
    handleAddNewPlan() {
      this.$refs["newPlanForm"].validate(valid => {
        if (!valid) {
          return;
        }
        this.newPlanList.push({
          planContent: this.newPlanForm.planContent,
          planRate: this.newPlanForm.planRate,
          planAmount: this.newPlanForm.planAmount,
          planRemark: this.newPlanForm.planRemark,
          // 当场新建的方案计划比赛只能是已有正常比赛，不能带 newMatches
          matchIds: [...this.newPlanForm.matchIds],
        });
        this.resetNewPlanForm();
        this.touched = true;
        this.$nextTick(() => {
          this.$refs["newPlanForm"] && this.$refs["newPlanForm"].clearValidate();
        });
      });
    },
    // 移除一条当场新建方案计划
    handleRemoveNewPlan(index) {
      this.newPlanList.splice(index, 1);
      this.touched = true;
    },
    // 是否需要折叠所达比赛（去重后超过5场）
    needMatchesCollapse(plan) {
      return (plan.matches || []).length > MATCH_COLLAPSE_COUNT;
    },
    // 当前展示的所达比赛（未展开时只显示前5场）
    shownMatchesOfPlan(plan) {
      const matches = plan.matches || [];
      if (this.isPlanMatchesExpanded(plan.planId) || !this.needMatchesCollapse(plan)) {
        return matches;
      }
      return matches.slice(0, MATCH_COLLAPSE_COUNT);
    },
    // 该方案计划的所达比赛是否已展开
    isPlanMatchesExpanded(planId) {
      return this.expandedPlanMatchIds.indexOf(planId) > -1;
    },
    // 切换该方案计划的所达比赛展开状态
    handleTogglePlanMatches(planId) {
      if (this.isPlanMatchesExpanded(planId)) {
        this.expandedPlanMatchIds = this.expandedPlanMatchIds.filter(id => id !== planId);
      } else {
        this.expandedPlanMatchIds.push(planId);
      }
    },
    // 已选标签文案：正文摘要 + 所达场数
    formatPlanTagText(plan) {
      const content = plan.planContent || "";
      const summary = content.length > 23 ? content.slice(0, 23) + "…" : content;
      const matchCount = (plan.matches || []).length || plan.matchCount || 0;
      return `${summary}（${matchCount}场）`;
    },
    // 当场新建标签文案
    formatNewPlanTagText(plan) {
      const content = plan.planContent || "";
      const summary = content.length > 23 ? content.slice(0, 23) + "…" : content;
      return `${summary}（${(plan.matchIds || []).length}场）`;
    },
    // 摘要正文（完整展示）
    formatPlanSummaryText(plan) {
      return plan.planContent || "";
    },
    // 比赛下拉选项展示文案：主队 vs 客队 + 开赛时间（时间为空时只展示对阵）
    formatMatchOptionLabel(match) {
      const matchTime = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}");
      const vsText = `${match.homeTeamName || ""} vs ${match.awayTeamName || ""}`;
      return matchTime ? `${vsText}（${matchTime}）` : vsText;
    },
    // 所达比赛标签文案：主队 vs 客队 + 开赛时间 + 当前赛果
    formatMatchTagText(match) {
      const resultText = match.matchResult ? `（赛果：${match.matchResult}）` : "";
      return `${this.formatMatchOptionLabel(match)}${resultText}`;
    },
    // 对外暴露提交数据：没动过返回 null（不带字段，关联保持不变），动过返回完整集合
    getSubmitData() {
      if (!this.touched) {
        return null;
      }
      return {
        planIds: [...this.selectedPlanIds],
        newPlans: this.newPlanList.map(plan => ({
          planContent: plan.planContent,
          planRate: plan.planRate,
          planAmount: plan.planAmount,
          planRemark: plan.planRemark,
          matchIds: [...(plan.matchIds || [])],
        })),
      };
    },
  }
};
</script>

<style lang="scss" scoped>
/* 关联方案计划区域容器 */
.plan-link-selector {
  padding: 12px 16px;
  margin-bottom: 16px;
  background-color: #f8f9fb;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

/* 区域头部（可点击折叠） */
.plan-link-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  margin-bottom: 12px;
}

.plan-link-header-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.plan-link-header-left>i {
  font-size: 16px;
  color: #2ecc71;
}

.plan-link-title {
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  overflow-wrap: anywhere;
}

.plan-link-count-tag {
  max-width: 100%;
  height: auto;
  margin-left: 0;
  padding-top: 2px;
  padding-bottom: 2px;
  line-height: 1.6;
  white-space: normal;
  overflow-wrap: anywhere;
}

.plan-link-header .el-icon-arrow-down {
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 14px;
  color: #909399;
  transition: transform 0.28s ease;
}

.plan-link-header .el-icon-arrow-down.is-expanded {
  transform: rotate(180deg);
}

/* 隐藏关联提示 */
.plan-link-hidden-tip {
  padding: 8px 12px;
  margin-bottom: 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #a0712a;
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  border: 1px solid #f3d19e;
  border-left: 4px solid #e6a23c;
  border-radius: 6px;
}

/* 已有方案计划抽屉入口 */
.plan-link-picker {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 15px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #dcebe3;
  border-left: 3px solid #2ecc71;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(46, 204, 113, 0.06);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.plan-link-picker:hover {
  border-color: #b9decf;
  box-shadow: 0 9px 24px rgba(46, 204, 113, 0.1);
}

.plan-link-picker-copy {
  flex: 1 1 240px;
  min-width: 0;
}

.plan-link-picker-label {
  display: block;
  margin-bottom: 3px;
  font-size: 13px;
  font-weight: 600;
  color: #2b3a36;
}

.plan-link-picker-copy p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #8a9791;
  overflow-wrap: anywhere;
}

.plan-link-picker-button {
  flex-shrink: 0;
  margin-left: auto;
  border-radius: 8px;
}

/* 已选标签 */
.plan-link-tags {
  margin: 4px 0 12px 0;
}

.plan-link-tag {
  max-width: 100%;
  height: auto;
  margin-right: 4px;
  margin-bottom: 4px;
  padding-top: 3px;
  padding-bottom: 3px;
  line-height: 1.6;
  white-space: normal;
  overflow-wrap: anywhere;
}

/* 当场新建入口 */
.plan-link-new-entry {
  margin-bottom: 8px;
}

/* 当场新建方案计划滑出面板 */
.plan-link-new-panel {
  padding: 14px 14px 14px 4px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-left: 4px solid #2ecc71;
  border-radius: 8px;
}

.plan-link-new-panel-title {
  display: flex;
  align-items: flex-start;
  margin-bottom: 14px;
  padding-left: 14px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  color: #303133;
  overflow-wrap: anywhere;
}

.plan-link-new-panel-title i {
  flex-shrink: 0;
  margin-top: 3px;
  margin-right: 6px;
  color: #2ecc71;
}

.plan-link-new-panel-title span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.plan-link-new-actions {
  padding-left: 110px;
}

.plan-link-new-tip {
  padding: 6px 0 0 110px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}

/* 选中方案计划只读摘要 */
.plan-link-summary {
  margin-top: 4px;
}

.plan-link-summary-plan {
  padding: 10px 12px;
  margin-bottom: 8px;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.plan-link-summary-plan-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 4px 12px;
  margin-bottom: 6px;
}

.plan-link-summary-plan-content {
  flex: 1 1 260px;
  min-width: 0;
  font-size: 13px;
  color: #303133;
  white-space: normal;
  overflow-wrap: anywhere;
}

.plan-link-summary-plan-extra {
  flex-shrink: 0;
  font-size: 12px;
  color: #909399;
  white-space: normal;
  overflow-wrap: anywhere;
}

.plan-link-summary-matches {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.plan-link-match-tag {
  max-width: 100%;
  height: auto;
  margin-right: 4px;
  margin-bottom: 4px;
  line-height: 1.5;
  white-space: normal;
  overflow-wrap: anywhere;
}

@media screen and (max-width: 767px) {
  .plan-link-header {
    gap: 8px;
  }

  .plan-link-picker-button {
    margin-left: 0;
  }

  .plan-link-new-actions {
    padding-left: 0;
  }

  .plan-link-new-tip {
    padding-left: 0;
  }

  .plan-link-summary-plan-content,
  .plan-link-summary-plan-extra {
    flex-basis: 100%;
  }
}

/* 折叠展开过渡（高度加透明度，约0.28s） */
.plan-link-expand-enter-active,
.plan-link-expand-leave-active {
  transition: all 0.28s ease;
  max-height: 1200px;
  overflow: hidden;
}

.plan-link-expand-enter,
.plan-link-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* 面板滑出过渡动画 */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.slide-panel-enter,
.slide-panel-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
