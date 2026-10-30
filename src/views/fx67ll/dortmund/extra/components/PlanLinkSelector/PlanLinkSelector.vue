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

        <!-- 已有方案计划多选：选项展示正文摘要与所达场数 -->
        <el-form-item label="已有方案计划" label-width="110px">
          <common-enhanced-select ref="planSelect" v-model="selectedPlanIds" valueKey="planId" labelKey="planContent"
            :api-func="listPlan" multiple placeholder="请选择已有方案计划（可多选）" @change="handlePlanIdsChange" />
        </el-form-item>

        <!-- 已选方案计划标签：可逐条移除 -->
        <div class="plan-link-tags" v-if="selectedPlanList.length > 0">
          <el-tag v-for="plan in selectedPlanList" :key="plan.planId" size="small" closable class="plan-link-tag"
            @close="handleRemovePlan(plan.planId)">
            {{ formatPlanTagText(plan) }}
          </el-tag>
        </div>

        <!-- 当场新建方案计划入口（没有新增权限时不显示） -->
        <div class="plan-link-new-entry" v-if="hasPlanAddPermission">
          <el-button type="text" icon="el-icon-circle-plus-outline" @click="toggleNewPlanPanel">
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
              <el-form-item label="方案计划正文" prop="planContent">
                <el-input v-model="newPlanForm.planContent" type="textarea" :rows="3" :maxlength="1023" show-word-limit
                  placeholder="请输入方案计划正文" />
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

        <!-- 选中方案计划的只读摘要：所达比赛去重 + 最多5场折叠 + 图片（有权限时） -->
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
            <!-- 图片（有查询权限时只读显示，本页不能上传） -->
            <div class="plan-link-summary-images" v-if="hasImageQueryPermission">
              <el-image v-for="(objectKey, imgIndex) in plan.planImageObjectKeys || []" :key="imgIndex"
                :src="baseUrl + objectKey" fit="cover"
                style="width: 72px; height: 72px; border-radius: 4px; margin-right: 8px;"
                :preview-src-list="imagePreviewListOfPlan(plan)" />
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { listPlan } from "@/api/fx67ll/dortmund/plan";
import { listMatch } from "@/api/fx67ll/dortmund/match";

import { checkPermi } from "@/utils/common/permission";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";

// 所达比赛默认折叠条数
const MATCH_COLLAPSE_COUNT = 5;

export default {
  name: "PlanLinkSelector",
  components: { CommonEnhancedSelect },
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
          { required: true, message: "方案计划正文不能为空", trigger: "blur" }
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
      // 下拉选项缓存（判断是否有可选比赛、按主键补全摘要）
      planOptions: [],
      matchOptions: [],
      // 图片预览基础地址
      baseUrl: process.env.VUE_APP_BASE_API,
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
    // 是否拥有方案计划图片查询权限（决定摘要图片是否显示）
    hasImageQueryPermission() {
      return checkPermi(["dortmund:plan:image:query"]);
    },
    // 已选条数（已有 + 当场新建）
    selectedTotal() {
      return this.selectedPlanIds.length + this.newPlanList.length;
    },
    // 是否有可选的正常比赛
    hasSelectableMatch() {
      return this.matchOptions.length > 0;
    },
  },
  watch: {
    // 回显主键集合变化时重置关联区域（编辑弹窗每次打开都会传入新的回显集合）
    planIds() {
      this.resetSelection();
    },
  },
  created() {
    // 将导入的函数挂载到实例，以便模板中使用
    this.listPlan = listPlan;
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
    this.loadPlanOptions();
    this.loadMatchOptions();
  },
  methods: {
    // 加载方案计划下拉选项（只读快照，用于按主键补全摘要）
    loadPlanOptions() {
      listPlan({ pageNum: 1, pageSize: 1023 }).then(response => {
        this.planOptions = response.rows || [];
        this.syncSelectedPlanList();
      });
    },
    // 加载正常比赛下拉选项（用于判断是否有可选比赛）
    loadMatchOptions() {
      listMatch({ pageNum: 1, pageSize: 1023, matchStatus: "0" }).then(response => {
        this.matchOptions = response.rows || [];
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
      this.syncSelectedPlanList();
    },
    // 按已选主键集合同步详情快照（优先使用传入的回显详情）
    syncSelectedPlanList() {
      const plansById = {};
      (this.plans || []).forEach(plan => {
        plansById[plan.planId] = plan;
      });
      (this.planOptions || []).forEach(plan => {
        if (!plansById[plan.planId]) {
          plansById[plan.planId] = plan;
        }
      });
      this.selectedPlanList = this.selectedPlanIds
        .map(planId => plansById[planId])
        .filter(Boolean);
    },
    // 展开/折叠关联区域
    handleToggleExpand() {
      this.expanded = !this.expanded;
    },
    // 已有方案计划多选变化：同步摘要并标记已操作
    handlePlanIdsChange(val) {
      this.selectedPlanIds = val || [];
      this.syncSelectedPlanList();
      this.touched = true;
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
      return `${summary}（${(plan.matches || []).length}场）`;
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
    // 摘要图片预览集合（完整地址）
    imagePreviewListOfPlan(plan) {
      return (plan.planImageObjectKeys || []).map(objectKey => this.baseUrl + objectKey);
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
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.plan-link-header-left {
  display: flex;
  align-items: center;
}

.plan-link-header-left>i {
  margin-right: 8px;
  font-size: 16px;
  color: #2ecc71;
}

.plan-link-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.plan-link-count-tag {
  margin-left: 10px;
}

.plan-link-header .el-icon-arrow-down {
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

/* 已选标签 */
.plan-link-tags {
  margin: 4px 0 12px 0;
}

.plan-link-tag {
  margin-right: 4px;
  margin-bottom: 4px;
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
  align-items: center;
  margin-bottom: 14px;
  padding-left: 14px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.plan-link-new-panel-title i {
  margin-right: 6px;
  color: #2ecc71;
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
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}

.plan-link-summary-plan-content {
  flex: 1;
  font-size: 13px;
  color: #303133;
  word-break: break-all;
}

.plan-link-summary-plan-extra {
  flex-shrink: 0;
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

.plan-link-summary-matches {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.plan-link-match-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.plan-link-summary-images {
  display: flex;
  align-items: center;
  margin-top: 6px;
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
