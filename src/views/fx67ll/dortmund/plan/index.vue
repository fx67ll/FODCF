<template>
  <div class="app-container dl-page">
    <!-- 场景切换：总览列表 / 编写 / 回顾 -->
    <transition name="scene-switch" mode="out-in">

      <!-- 总览列表场景 -->
      <div key="list" v-if="pageScene === 'list'">
        <transition name="dl-filter">
          <el-form class="dl-filter" :model="queryParams" ref="queryForm" size="small" :inline="true"
            v-show="showSearch" label-width="84px">
            <el-form-item label="方案计划" prop="planContent">
              <el-input v-model="queryParams.planContent" placeholder="请输入方案计划关键字" clearable
                @keyup.enter.native="handleQuery" />
            </el-form-item>
            <el-form-item label="关联比赛" prop="matchId">
              <el-input :value="formatSelectedMatch(selectedMatch)" readonly placeholder="请选择关联比赛"
                @focus="matchSelectorVisible = true" />
            </el-form-item>
            <el-form-item label="创建时间" v-if="isMoreQuery">
              <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd"
                type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"
                clearable></el-date-picker>
            </el-form-item>
            <el-form-item label="更新时间" v-if="isMoreQuery">
              <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd"
                type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"
                clearable></el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
              <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
              <el-button class="dl-more-btn" :icon="isMoreQuery ? 'el-icon-zoom-out' : 'el-icon-zoom-in'" size="mini"
                @click="handleMoreQuery">
                {{ isMoreQuery ? "关闭高级搜索" : "使用高级搜索" }}
              </el-button>
            </el-form-item>
          </el-form>
        </transition>

        <div class="dl-toolbar">
          <div class="dl-toolbar-actions">
            <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
              v-hasPermi="['dortmund:plan:add']">新增</el-button>
            <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
              v-hasPermi="['dortmund:plan:edit']">修改</el-button>
            <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
              v-hasPermi="['dortmund:plan:remove']">删除</el-button>
            <!-- <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
              v-hasPermi="['dortmund:plan:export']">导出</el-button> -->
            <transition name="dl-chip">
              <span class="dl-selected-chip" v-if="ids.length > 0"><i class="el-icon-circle-check"></i>已选 {{ ids.length
              }} 项</span>
            </transition>
          </div>
          <div class="dl-toolbar-side">
            <!-- 展示视图切换：卡片视图为默认，偏好持久化到本地缓存 -->
            <view-switch v-model="viewMode" @change="handleViewModeChange" />
            <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
          </div>
        </div>

        <!-- 卡片视图（默认）/ 列表视图（原总览列表），切换带过渡 -->
        <transition name="dl-view" mode="out-in">
          <plan-card-pane v-if="viewMode === 'card'" key="card" :rows="planList" :loading="loading"
            @review="handleReview" @update="handleUpdate" @delete="handleDelete" />
          <div v-else key="list" class="dl-list-card">
            <plan-list-pane :rows="planList" :loading="loading" @selection-change="handleSelectionChange"
              @review="handleReview" @update="handleUpdate" @delete="handleDelete" />
          </div>
        </transition>

        <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize" @pagination="getList" />
      </div>

      <!-- 编写场景：创建/修改共用整页（组件内持有表单副本与当场新建面板） -->
      <plan-edit-scene key="edit" v-else-if="pageScene === 'edit'" :edit-mode="editMode" :initial-form="editForm"
        :readonly-matches="readonlyMatchList" :edit-loading="editLoading" :submitting="submitting"
        @back="handleSceneBack" @save="handleSceneSave" />

      <!-- 回顾场景：整页只读 -->
      <plan-review-scene key="review" v-else :detail-model="detailModel" :review-loading="reviewLoading"
        :has-summary-permission="hasSummaryPermission" :summary-loading="summaryLoading"
        @copy-summary="handleCopySummary" @back="handleSceneBack" />
    </transition>

    <dortmund-match-selector-modal :visible.sync="matchSelectorVisible" :selected-items="[selectedMatch]"
      @confirm="handleMatchSelectorConfirm" />
  </div>
</template>

<script>
import { listPlan, getPlan, addPlan, updatePlan, delPlan } from "@/api/fx67ll/dortmund/plan";
import { refreshPlanSummary } from "@/api/fx67ll/dortmund/plan";
import { checkPermi } from "@/utils/common/permission";

import DortmundMatchSelectorModal from "@/views/fx67ll/dortmund/other/component/DortmundMatchSelectorModal/index";
import ViewSwitch from "@/components/ViewSwitch/index.vue";
import PlanCardPane from "./components/PlanCardPane/index.vue";
import PlanListPane from "./components/PlanListPane/index.vue";
import PlanEditScene from "./components/PlanEditScene/index.vue";
import PlanReviewScene from "./components/PlanReviewScene/index.vue";

// 总览列表展示视图偏好本地持久缓存的key（card卡片视图 list列表视图）
const VIEW_MODE_KEY = "dortmund-plan-view-mode";

export default {
  name: "Plan",
  components: { ViewSwitch, PlanCardPane, PlanListPane, PlanEditScene, PlanReviewScene, DortmundMatchSelectorModal },
  data() {
    return {
      // 页面场景（list总览列表 edit编写 review回顾）
      pageScene: "list",
      // 总览列表展示视图（card卡片视图默认 list列表视图），偏好持久化到本地缓存
      viewMode: "card",
      // 编写场景模式（add新增 update修改）
      editMode: "add",
      // 遮罩层
      loading: true,
      // 编写场景表单遮罩层
      editLoading: false,
      // 编写场景提交中状态
      submitting: false,
      // 回顾场景加载状态
      reviewLoading: false,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 方案计划表格数据
      planList: [],
      // 创建时间范围
      daterangeCreateTime: [],
      // 更新时间范围
      daterangeUpdateTime: [],
      selectedMatch: null,
      matchSelectorVisible: false,
      // 是否使用高级搜索
      isMoreQuery: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        planContent: null,
        matchId: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 完整只读详情（回顾场景展示）
      detailModel: {},
      // 编写场景初始表单（进入编写场景前由父页面构建，场景组件复制出可编辑副本）
      editForm: {},
      // 修改时已关联、后来被关闭的比赛（只读展示传入编写场景，后端保持原关联不动）
      readonlyMatchList: [],
      summaryLoading: false,
    };
  },
  computed: {
    // 方案计划摘要仅对授权用户开放
    hasSummaryPermission() {
      return checkPermi(["dortmund:plan:summary"]);
    },
  },
  created() {
    // 读取本地缓存的展示视图偏好（非法值兜底为卡片视图）
    this.viewMode = localStorage.getItem(VIEW_MODE_KEY) === "list" ? "list" : "card";
    // 比赛下拉包装接口：为每个选项拼装 matchName 展示文案（后台比赛数据无 matchName 冗余字段）
    this.listMatch = (query) => {
      return listMatch(query).then((response) => {
        const rows = (response.rows || []).map((match) => ({
          ...match,
          matchName: this.formatMatchLabel(match),
        }));
        return { ...response, rows };
      });
    };

    this.getList();
  },
  activated() {
    // 路由缓存复用时同步本地缓存的展示视图偏好，保持切换即时生效
    const cachedMode = localStorage.getItem(VIEW_MODE_KEY) === "list" ? "list" : "card";
    if (cachedMode !== this.viewMode) {
      this.viewMode = cachedMode;
    }
  },
  methods: {
    // 展示视图切换：偏好写入本地缓存，仅切换展示不重新拉取数据
    handleViewModeChange(mode) {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    },
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
      this.queryParams.beginUpdateTime = null;
      this.queryParams.endUpdateTime = null;
    },
    /** 查询方案计划列表 */
    getList() {
      this.loading = true;
      this.clearDateQueryParams();
      if (null != this.daterangeCreateTime && "" != this.daterangeCreateTime) {
        this.queryParams.beginCreateTime = this.daterangeCreateTime[0];
        this.queryParams.endCreateTime = this.daterangeCreateTime[1];
      }
      if (null != this.daterangeUpdateTime && "" != this.daterangeUpdateTime) {
        this.queryParams.beginUpdateTime = this.daterangeUpdateTime[0];
        this.queryParams.endUpdateTime = this.daterangeUpdateTime[1];
      }
      listPlan(this.queryParams).then(response => {
        this.planList = this.formatObjectArrayNullProperty(response.rows || []);
        this.total = response.total;
      }).finally(() => {
        this.loading = false;
      });
    },
    /** 高级搜索按钮操作 */
    handleMoreQuery() {
      this.isMoreQuery = !this.isMoreQuery;
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.selectedMatch = null;
      this.handleQuery();
    },
    formatSelectedMatch(match) {
      const matchTime = this.parseTime(match?.matchTime, "{y}-{m}-{d} {h}:{i}");
      const teams = [match?.homeTeamName, match?.awayTeamName].filter(Boolean).join(" vs ");
      return teams ? `${teams}${matchTime ? `（${matchTime}）` : ""}` : (match?.matchCode || "");
    },
    handleMatchSelectorConfirm(match) {
      this.selectedMatch = match || null;
      this.queryParams.matchId = match ? match.matchId : null;
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.planId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作：进入编写场景 */
    handleAdd() {
      this.editMode = "add";
      this.resetEditScene();
      this.pageScene = "edit";
    },
    /** 修改按钮操作：拉取详情后进入编写场景 */
    handleUpdate(row) {
      this.editMode = "update";
      this.resetEditScene();
      const planId = row.planId || this.ids
      this.editLoading = true;
      getPlan(planId).then(response => {
        const detail = response.data || {};
        this.readonlyMatchList = detail.matches || [];
        // 从详情中挑选允许修改的字段构建初始表单，后台字段不进入可编辑控件
        this.editForm = {
          planId: detail.planId,
          planContent: detail.planContent,
          planRate: detail.planRate,
          planAmount: detail.planAmount,
          planRemark: detail.planRemark,
          combinationIds: detail.combinationIds || [],
        };
        this.pageScene = "edit";
      }).finally(() => {
        this.editLoading = false;
      });
    },
    /** 回顾按钮操作：进入只读回顾场景 */
    handleReview(row) {
      this.reviewLoading = true;
      this.detailModel = {};
      this.pageScene = "review";
      getPlan(row.planId).then(response => {
        this.detailModel = response.data || {};
      }).finally(() => {
        this.reviewLoading = false;
      });
    },
    // 先刷新保存摘要，再把服务端最新文本写入剪贴板
    handleCopySummary() {
      const planId = this.detailModel.planId;
      if (!planId) {
        return;
      }
      this.summaryLoading = true;
      refreshPlanSummary(planId).then((response) => {
        const content = (response.data && response.data.content) || "";
        if (!content) {
          this.$modal.msgWarning("暂无可复制的方案摘要");
          return;
        }
        this.copyText(content, () => {
          this.$modal.msgSuccess("摘要已复制");
        });
      }).catch(() => {
      }).finally(() => {
        this.summaryLoading = false;
      });
    },
    // 优先使用异步剪贴板，非安全上下文降级为临时输入框
    copyText(text, done) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done).catch(() => this.fallbackCopyText(text, done));
        return;
      }
      this.fallbackCopyText(text, done);
    },
    fallbackCopyText(text, done) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        if (document.execCommand("copy")) {
          done();
        } else {
          throw new Error("copy failed");
        }
      } finally {
        document.body.removeChild(textarea);
      }
    },
    // 重置编写场景初始表单与历史派生比赛列表
    resetEditScene() {
      this.editForm = {
        planId: null,
        planContent: null,
        planRate: null,
        planAmount: null,
        planRemark: null,
        combinationIds: [],
      };
      this.readonlyMatchList = [];
    },
    // 场景返回总览并刷新列表
    handleSceneBack() {
      this.pageScene = "list";
      this.getList();
    },
    // 场景保存：编写场景校验并构建请求体后回传，父页面负责提交
    handleSceneSave(data) {
      const isAdd = this.editMode === "add";
      this.submitting = true;
      const request = isAdd ? addPlan(data) : updatePlan(data);
      request.then(() => {
        this.$modal.msgSuccess(isAdd ? "新增成功" : "修改成功");
        this.handleSceneBack();
      }).catch(() => {
        // 保存失败时保留场景已填文字、选择与图片，可直接重试
      }).finally(() => {
        this.submitting = false;
      });
    },
    // 比赛下拉展示文案：主队 vs 客队 + 开赛时间（时间为空时只展示对阵）
    formatMatchLabel(match) {
      const matchTime = this.parseTime(match.matchTime, "{y}-{m}-{d} {h}:{i}");
      const vsText = `${match.homeTeamName || ""} vs ${match.awayTeamName || ""}`;
      return matchTime ? `${vsText}（${matchTime}）` : vsText;
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const planIds = row.planId || this.ids;
      this.$modal.confirm('是否确认删除方案计划编号为"' + planIds + '"的数据项？').then(function () {
        return delPlan(planIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('dortmund/plan/export', {
        ...this.queryParams
      }, `plan_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style lang="scss" scoped>
/* 场景切换过渡动画 */
.scene-switch-enter-active,
.scene-switch-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.scene-switch-enter,
.scene-switch-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
