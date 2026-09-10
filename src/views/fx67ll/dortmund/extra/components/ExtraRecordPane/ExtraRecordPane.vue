<template>
  <div class="extra-record-pane">
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
      <el-form-item label="创建者" prop="createBy" v-if="isMoreQuery">
        <el-input v-model="queryParams.createBy" placeholder="请输入记录创建者" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
      </el-form-item>
      <el-form-item label="更新时间">
        <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
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
      <!-- <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['dortmund:extra:export']">
          导出</el-button>
      </el-col> -->
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="info" plain icon="el-icon-data-line" size="mini"
          @click="handleOpenDataAnalysis">查看外快盈亏历史数据走势图</el-button>
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
          <span style="color: #ff5a5f" v-if="scope.row.isWin !== 'Y' && parseFloat(scope.row.winMoney) < 0">{{
            scope.row.winMoney }}</span>
          <span style="color: #999999" v-if="
            scope.row.isWin !== 'Y' &&
            parseFloat(scope.row.winMoney || 0) === 0
          ">{{ scope.row.winMoney }}</span>
          <span style="color: #2ecc71" v-if="scope.row.isWin === 'Y'">{{
            scope.row.winMoney
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="历史总盈亏金额" align="center" prop="currentMoney" width="120">
        <template slot-scope="scope">
          <span style="color: #ff5a5f" v-if="scope.row.currentMoney < 0">{{
            scope.row.currentMoney.replace(/\.?0+$/, "")
          }}</span>
          <span style="color: #999999" v-if="parseInt(scope.row.currentMoney || 0) === 0">{{
            scope.row.currentMoney.replace(/\.?0+$/, "") }}</span>
          <span style="color: #2ecc71" v-if="scope.row.currentMoney > 0">{{
            scope.row.currentMoney.replace(/\.?0+$/, "")
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="当前投入本金" align="center" prop="seedMoney" width="100" />
      <el-table-column label="已经落袋为安的盈利金额" align="center" prop="saveMoney" width="170" />
      <el-table-column label="目标金额" align="center" prop="targetMoney" width="80" />
      <el-table-column label="外快备注" align="center" prop="extraRemark" width="230" :show-overflow-tooltip="true" />
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

    <!-- 添加或修改外快盈亏记录对话框 -->
    <extra-edit-dialog :visible.sync="open" :extra-id="editExtraId" @success="getList" />

    <!-- 查看外快盈亏历史数据走势图的弹窗 -->
    <extra-history-chart-dialog :visible.sync="historyDataAnalysisOpen" />
  </div>
</template>

<script>
import { listExtra, delExtra } from "@/api/fx67ll/dortmund/extra";

import ExtraEditDialog from "../ExtraEditDialog/ExtraEditDialog.vue";
import ExtraHistoryChartDialog from "../ExtraHistoryChartDialog/ExtraHistoryChartDialog.vue";

export default {
  name: "ExtraRecordPane",
  dicts: ["sys_yes_no"],
  components: { ExtraEditDialog, ExtraHistoryChartDialog },
  data() {
    return {
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
      // 是否显示弹出层
      open: false,
      // 修改的记录ID（新增时为空）
      editExtraId: null,
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
      },
      // 外快盈亏历史数据走势图弹窗开关
      historyDataAnalysisOpen: false,
    };
  },
  created() {
    this.getList();
  },
  methods: {
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
      this.editExtraId = null;
      this.open = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.editExtraId = row.extraId || this.ids;
      this.open = true;
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const extraIds = row.extraId || this.ids;
      this.$modal
        .confirm('是否确认删除外快盈亏记录编号为"' + extraIds + '"的数据项？')
        .then(function () {
          return delExtra(extraIds);
        })
        .then(() => {
          this.getList();
          this.$modal.msgSuccess("删除成功");
        })
        .catch(() => { });
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
