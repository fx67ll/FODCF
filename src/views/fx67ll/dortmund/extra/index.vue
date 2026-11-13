<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="总金额" prop="extraMoney" v-if="isMoreQuery">
        <el-input v-model="queryParams.extraMoney" placeholder="请输入当前外快总金额" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="是否盈利" prop="isWin">
        <el-select v-model="queryParams.isWin" placeholder="请选择是否盈利" clearable>
          <el-option v-for="dict in dict.type.sys_yes_no" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="盈亏金额" prop="winMoney" v-if="isMoreQuery">
        <el-input v-model="queryParams.winMoney" placeholder="请输入外快盈亏金额" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="当前本金" prop="seedMoney" v-if="isMoreQuery">
        <el-input v-model="queryParams.seedMoney" placeholder="请输入当前投入本金" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="落袋金额" prop="saveMoney" v-if="isMoreQuery">
        <el-input v-model="queryParams.saveMoney" placeholder="请输入已经落袋为安的盈利金额" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="目标金额" prop="targetMoney" v-if="isMoreQuery">
        <el-input v-model="queryParams.targetMoney" placeholder="请输入目标金额" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="是否关联" prop="hasPlan" v-if="isMoreQuery">
        <el-select v-model="queryParams.hasPlan" placeholder="请选择是否关联方案计划" clearable style="width: 160px">
          <el-option label="已关联" value="1" />
          <el-option label="未关联" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="方案计划" prop="planId" v-if="isMoreQuery">
        <common-enhanced-select ref="planIdSelect" v-model="queryParams.planId" valueKey="planId" labelKey="planContent"
          :api-func="listPlan" placeholder="请选择方案计划" :enter-callback="handleQuery" width="240px" />
      </el-form-item>
      <el-form-item label="创建者" prop="createBy" v-if="isMoreQuery">
        <el-input v-model="queryParams.createBy" placeholder="请输入记录创建者" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="创建时间" v-if="isMoreQuery">
        <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item>
      <el-form-item label="更新时间" v-if="isMoreQuery">
        <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">
          搜索
        </el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">
          重置
        </el-button>
        <el-button type="info" :icon="isMoreQuery ? 'el-icon-zoom-out' : 'el-icon-zoom-in'" size="mini"
          @click="handleMoreQuery">
          {{ isMoreQuery ? "关闭高级搜索" : "使用高级搜索" }}
        </el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['dortmund:extra:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['dortmund:extra:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['dortmund:extra:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="warning" plain icon="el-icon-magic-stick" size="mini" :disabled="ids.length < 2"
          @click="handleMerge" v-hasPermi="['dortmund:extra:merge']">合并</el-button>
      </el-col>
      <!-- <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['dortmund:extra:export']">
          导出</el-button>
      </el-col> -->
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="info" plain icon="el-icon-data-line" size="mini"
          @click="handleOpenDataAnalysis">查看外快盈亏历史数据走势图</el-button>
      </el-col>
      <!-- 扩展功能：数值模拟（右侧抽屉滑入）与组合回报（预留，开发中） -->
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="success" plain icon="el-icon-cpu" size="mini" @click="handleOpenSimulate">数值模拟</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="extraList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="外快总金额" align="center" prop="extraMoney" fixed="left" width="90" />
      <el-table-column label="是否盈利" align="center" prop="isWin" fixed="left" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_yes_no" :value="scope.row.isWin" />
        </template>
      </el-table-column>
      <el-table-column label="本次外快盈亏金额" align="center" prop="winMoney" fixed="left" width="130">
        <template slot-scope="scope">
          <span :class="['money-text', getMoneyClass(scope.row.isWin === 'Y' ? 1 : parseFloat(scope.row.winMoney))]">{{
            formatMoneyDisplay(scope.row.winMoney) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="历史总盈亏金额" align="center" prop="currentMoney" width="120">
        <template slot-scope="scope">
          <span :class="['money-text', getMoneyClass(parseFloat(scope.row.currentMoney))]">{{
            formatMoneyDisplay(scope.row.currentMoney) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="当前投入本金" align="center" prop="seedMoney" width="100">
        <template slot-scope="scope">
          <span>{{ formatMoneyDisplay(scope.row.seedMoney) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="已经落袋为安的盈利金额" align="center" prop="saveMoney" width="170">
        <template slot-scope="scope">
          <span>{{ formatMoneyDisplay(scope.row.saveMoney) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="目标金额" align="center" prop="targetMoney" width="80">
        <template slot-scope="scope">
          <span>{{ formatMoneyDisplay(scope.row.targetMoney) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="外快备注" align="center" prop="extraRemark" width="230" :show-overflow-tooltip="true" />
      <el-table-column label="关联方案计划" align="center" prop="planCount" width="110">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.planCount > 0" size="small" effect="plain" type="success" class="plan-link-column-tag"
            @click.native="handleViewRowPlans(scope.row)">{{ scope.row.planCount
            }} 条</el-tag>
          <span v-else>未关联</span>
        </template>
      </el-table-column>
      <el-table-column label="记录更新者" align="center" prop="updateBy" width="90" />
      <el-table-column label="记录更新时间" align="center" prop="updateTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="记录创建者" align="center" prop="createBy" width="90" />
      <el-table-column label="记录创建时间" align="center" prop="createTime" fixed="right" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="140">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['dortmund:extra:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['dortmund:extra:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      :page-sizes="[5, 10, 23, 50, 100]" @pagination="getList" />

    <!-- 数值模拟抽屉（外快盈亏记录页的扩展功能） -->
    <simulate-drawer :visible.sync="simulateOpen" />

    <!-- 查看外快盈亏历史数据走势图的弹窗 -->
    <extra-history-chart-dialog :visible.sync="historyDataAnalysisOpen" />

    <!-- 合并外快盈亏历史记录的确认弹窗 -->
    <extra-merge-dialog :visible.sync="mergeOpen" :merge-rows="mergeRows" @success="getList" />

    <!-- 关联方案计划只读摘要弹窗（点击列表关联列打开） -->
    <plan-summary-dialog :visible.sync="rowPlansOpen" title="关联方案计划" :loading="rowPlansLoading" :plans="rowPlansList"
      :hidden-count="rowPlansHiddenCount" />
  </div>
</template>

<script>
import { listExtra, getExtra, delExtra } from "@/api/fx67ll/dortmund/extra";
import { listPlan } from "@/api/fx67ll/dortmund/plan";

import { formatMoneyDisplay } from "@/utils/fx67ll/utils";

import { checkPermi } from "@/utils/common/permission";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";

import ExtraHistoryChartDialog from "./components/ExtraHistoryChartDialog/index.vue";
import ExtraMergeDialog from "./components/ExtraMergeDialog/index.vue";
import PlanSummaryDialog from "./components/PlanSummaryDialog/index.vue";
import SimulateDrawer from "./components/SimulateDrawer/index.vue";

// 二级录入页固定路由
const EXTRA_EDIT_ROUTE_PATH = "/dortmund/extra-edit/index";

// 二级录入页保存成功后通知列表页刷新（仅当前浏览器会话有效）
const EXTRA_EDIT_REFRESH_KEY = "dortmund-extra-edit-refresh-required";

// 入口预置标记的本地缓存key（总览页/流程图页写入，与 overview/workflow 页保持一致）
const PAGE_MODE_KEY = "dortmund-extra-page-mode";

export default {
  name: "DortmundExtra",
  dicts: ["sys_yes_no"],
  components: { CommonEnhancedSelect, ExtraHistoryChartDialog, ExtraMergeDialog, PlanSummaryDialog, SimulateDrawer },
  data() {
    return {
      // 数值模拟抽屉开关
      simulateOpen: false,
      // 遮罩层
      loading: true,
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
      // 外快盈亏记录表格数据
      extraList: [],
      // 创建时间范围
      daterangeCreateTime: [],
      // 更新时间范围
      daterangeUpdateTime: [],
      // 是否使用高级搜索
      isMoreQuery: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 5,
        extraMoney: null,
        isWin: null,
        winMoney: null,
        seedMoney: null,
        saveMoney: null,
        targetMoney: null,
        extraRemark: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        planId: null,
        hasPlan: null,
      },
      // 外快盈亏历史数据走势图弹窗开关
      historyDataAnalysisOpen: false,
      // 合并确认弹窗开关
      mergeOpen: false,
      // 待合并的所选行数据快照（供合并确认弹窗展示合并结果预览）
      mergeRows: [],
      // 关联方案计划只读摘要弹窗开关
      rowPlansOpen: false,
      // 关联方案计划摘要加载状态
      rowPlansLoading: false,
      // 关联方案计划摘要数据（当前用户可见的集合）
      rowPlansList: [],
      // 关联方案计划不可见关联条数
      rowPlansHiddenCount: 0,
    };
  },
  created() {
    // 将导入的函数挂载到实例，以便模板中使用
    this.listPlan = listPlan;

    // 若从二级录入页返回，created 已会重新查询，这里只清理刷新标记避免重复请求
    this.consumeEditRefreshFlag();
    this.getList();
  },
  mounted() {
    this.consumePresetMode();
  },
  // 路由缓存复用时同样消费入口预置标记
  activated() {
    this.consumePresetMode();
    if (this.consumeEditRefreshFlag()) {
      this.getList();
    }
  },
  methods: {
    // 消费二级录入页保存后的刷新标记（会话级，避免跨标签页误刷新）
    consumeEditRefreshFlag() {
      if (sessionStorage.getItem(EXTRA_EDIT_REFRESH_KEY) !== "1") {
        return false;
      }
      sessionStorage.removeItem(EXTRA_EDIT_REFRESH_KEY);
      return true;
    },
    // 读取并复位入口预置标记（总览页/流程图页的"数值模拟"入口写入simulate），命中则打开数值模拟抽屉
    consumePresetMode() {
      if (localStorage.getItem(PAGE_MODE_KEY) !== "simulate") {
        return;
      }
      localStorage.setItem(PAGE_MODE_KEY, "extra");
      this.$nextTick(() => {
        this.handleOpenSimulate();
      });
    },
    // 打开数值模拟抽屉（也供父页面按预置入口调用）
    handleOpenSimulate() {
      this.simulateOpen = true;
    },
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
      this.queryParams.beginUpdateTime = null;
      this.queryParams.endUpdateTime = null;
    },
    /** 查询外快盈亏记录列表 */
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
      listExtra(this.queryParams).then((response) => {
        this.extraList = this.countCurrentMoney(
          this.formatObjectArrayNullProperty(response.rows)
        );
        this.total = response.total;
      }).finally(() => {
        this.loading = false;
      });
    },
    countCurrentMoney(list) {
      const listResult = [];
      list.forEach((item) => {
        const objTmp = {
          ...item,
          currentMoney: (
            parseFloat(item.extraMoney || 0) - parseFloat(item.seedMoney || 0)
          ).toFixed(2),
        };
        listResult.push(objTmp);
      });
      return listResult;
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
    // 金额展示代理（空值/非法值返回占位符，数值原样展示）
    formatMoneyDisplay(value) {
      return formatMoneyDisplay(value);
    },
    // 金额正负配色：正数绿、负数红、零灰
    getMoneyClass(value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue === 0) {
        return "money-zero";
      }
      return numValue > 0 ? "money-win" : "money-lose";
    },
    // 是否拥有方案计划查询权限（决定关联摘要是否拉取详情）
    hasPlanQueryPermission() {
      return checkPermi(["dortmund:plan:query"]);
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.daterangeCreateTime = [];
      this.daterangeUpdateTime = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map((item) => item.extraId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.openExtraEditPage("add");
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      const extraId = (row && row.extraId) || this.ids[0];
      if (!extraId) {
        return;
      }
      this.openExtraEditPage("edit", extraId);
    },
    // 进入独立二级录入页，携带来源路径用于保存或取消后回到原筛选状态
    openExtraEditPage(mode, extraId) {
      const query = {
        mode,
        from: this.$route.fullPath,
      };
      if (extraId != null) {
        query.id = extraId;
      }
      this.$router.push({ path: EXTRA_EDIT_ROUTE_PATH, query });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const extraIds = row.extraId || this.ids;
      // 该记录有关联方案计划时追加提示：解除关联但不删除方案计划本身（列表派生值，无关联时为0或占位符）
      const planCount = row.planCount || 0;
      let confirmText = '是否确认删除外快盈亏记录编号为"' + extraIds + '"的数据项？';
      if (planCount > 0) {
        confirmText += `同时解除 ${planCount} 条方案计划关联，方案计划本身不会删除`;
      }
      this.$modal
        .confirm(confirmText)
        .then(function () {
          return delExtra(extraIds);
        })
        .then(() => {
          this.getList();
          this.$modal.msgSuccess("删除成功");
        })
        .catch(() => { });
    },
    // 点击列表关联方案计划列：只读弹出当前用户可见的方案计划摘要
    handleViewRowPlans(row) {
      this.rowPlansList = [];
      this.rowPlansHiddenCount = 0;
      this.rowPlansOpen = true;
      // 无方案计划查询权限时仅按列表条数展示，不拉详情
      if (!this.hasPlanQueryPermission()) {
        return;
      }
      this.rowPlansLoading = true;
      getExtra(row.extraId).then((response) => {
        this.rowPlansList = response?.data?.plans || [];
        this.rowPlansHiddenCount = response?.data?.hiddenPlanCount || 0;
      }).finally(() => {
        this.rowPlansLoading = false;
      });
    },
    /** 合并按钮操作：校验通过后打开合并确认弹窗，弹窗内录入备注并确认后由后台事务完成合并+删除旧数据 */
    handleMerge() {
      // 前置校验：至少选择两条记录
      if (!this.ids || this.ids.length < 2) {
        this.$modal.msgWarning("请至少选择两条记录进行合并！");
        return;
      }
      // 前置校验：单次合并数量上限（与后台 MERGE_MAX_INPUT_COUNT 保持一致）
      if (this.ids.length > 23) {
        this.$modal.msgWarning("单次最多合并23条记录！");
        return;
      }
      // 前置校验：所选记录在当前列表中必须连续（后台仍会按全量历史数据校验）
      const selectedIndexList = [];
      this.extraList.forEach((item, index) => {
        if (this.ids.indexOf(item.extraId) > -1) {
          selectedIndexList.push(index);
        }
      });
      for (let i = 1; i < selectedIndexList.length; i++) {
        if (selectedIndexList[i] !== selectedIndexList[i - 1] + 1) {
          this.$modal.msgWarning("待合并的历史数据必须连续！");
          return;
        }
      }
      // 传入所选行数据快照供合并确认弹窗展示预览，弹窗内录入备注并确认后调用后台事务接口完成合并
      this.mergeRows = this.extraList.filter((item) => this.ids.indexOf(item.extraId) > -1);
      this.mergeOpen = true;
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download(
        "dortmund/extra/export",
        {
          ...this.queryParams,
        },
        `extra_${new Date().getTime()}.xlsx`
      );
    },
    // 打开外快盈亏历史数据走势图弹窗
    handleOpenDataAnalysis() {
      this.historyDataAnalysisOpen = true;
    },
  },
};
</script>

<style lang="scss" scoped>
/* 金额列配色：正数绿、负数红、零灰 */
.money-text {

  &.money-win,
  &.money-lose {
    font-weight: 600;
  }

  &.money-win {
    color: #2ecc71;
  }

  &.money-lose {
    color: #ff5a5f;
  }

  &.money-zero {
    color: #999999;
  }
}

.plan-link-column-tag {
  cursor: pointer;
}
</style>
