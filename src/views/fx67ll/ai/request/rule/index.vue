<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="规则作用维度" prop="limitRuleDimension">
        <el-input v-model="queryParams.limitRuleDimension" placeholder="请输入规则作用维度" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="规则作用目标ID" prop="limitRuleTargetId">
        <el-input v-model="queryParams.limitRuleTargetId" placeholder="请输入规则作用目标ID" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="流控模式" prop="flowControlMode">
        <el-input v-model="queryParams.flowControlMode" placeholder="请输入流控模式" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="流控效果" prop="flowControlEffect">
        <el-input v-model="queryParams.flowControlEffect" placeholder="请输入流控效果" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="流控阈值" prop="flowThreshold">
        <el-input v-model="queryParams.flowThreshold" placeholder="请输入流控阈值" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="熔断策略" prop="circuitStrategy">
        <el-input v-model="queryParams.circuitStrategy" placeholder="请输入熔断策略" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="熔断触发阈值" prop="circuitThreshold">
        <el-input v-model="queryParams.circuitThreshold" placeholder="请输入熔断触发阈值" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="慢调用判定阈值" prop="circuitGrade">
        <el-input v-model="queryParams.circuitGrade" placeholder="请输入慢调用判定阈值" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="熔断统计窗口时长" prop="circuitWindow">
        <el-input v-model="queryParams.circuitWindow" placeholder="请输入熔断统计窗口时长" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="熔断恢复超时时间" prop="circuitTimeout">
        <el-input v-model="queryParams.circuitTimeout" placeholder="请输入熔断恢复超时时间" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item>
      <el-form-item label="更新时间">
        <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['system:rule:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:rule:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:rule:remove']">删除</el-button>
      </el-col>
      <!-- <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:rule:export']">导出</el-button>
      </el-col> -->
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="ruleList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="规则唯一标识" align="center" prop="limitRuleId" />
      <el-table-column label="规则作用维度" align="center" prop="limitRuleDimension" />
      <el-table-column label="规则作用目标ID" align="center" prop="limitRuleTargetId" />
      <el-table-column label="规则类型" align="center" prop="limitRuleType" />
      <el-table-column label="流控模式" align="center" prop="flowControlMode" />
      <el-table-column label="流控效果" align="center" prop="flowControlEffect" />
      <el-table-column label="流控指标类型" align="center" prop="flowRuleType" />
      <el-table-column label="流控阈值" align="center" prop="flowThreshold" />
      <el-table-column label="熔断策略" align="center" prop="circuitStrategy" />
      <el-table-column label="熔断触发阈值" align="center" prop="circuitThreshold" />
      <el-table-column label="慢调用判定阈值" align="center" prop="circuitGrade" />
      <el-table-column label="熔断统计窗口时长" align="center" prop="circuitWindow" />
      <el-table-column label="熔断恢复超时时间" align="center" prop="circuitTimeout" />
      <el-table-column label="规则启用状态" align="center" prop="limitRuleStatus" />
      <el-table-column label="记录创建者" align="center" prop="createBy" width="90" />
      <el-table-column label="记录创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="记录更新者" align="center" prop="updateBy" width="90" />
      <el-table-column label="记录更新时间" align="center" prop="updateTime" width="160">
        <template slot-scope="scope">
          <span>{{
            parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}")
            }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="140">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['system:rule:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:rule:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改AI Prompt 限流/熔断规则（适配Sentinel框架）对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="规则作用维度" prop="limitRuleDimension">
          <el-input v-model="form.limitRuleDimension" placeholder="请输入规则作用维度" />
        </el-form-item>
        <el-form-item label="规则作用目标ID" prop="limitRuleTargetId">
          <el-input v-model="form.limitRuleTargetId" placeholder="请输入规则作用目标ID" />
        </el-form-item>
        <el-form-item label="流控模式" prop="flowControlMode">
          <el-input v-model="form.flowControlMode" placeholder="请输入流控模式" />
        </el-form-item>
        <el-form-item label="流控效果" prop="flowControlEffect">
          <el-input v-model="form.flowControlEffect" placeholder="请输入流控效果" />
        </el-form-item>
        <el-form-item label="流控阈值" prop="flowThreshold">
          <el-input v-model="form.flowThreshold" placeholder="请输入流控阈值" />
        </el-form-item>
        <el-form-item label="熔断策略" prop="circuitStrategy">
          <el-input v-model="form.circuitStrategy" placeholder="请输入熔断策略" />
        </el-form-item>
        <el-form-item label="熔断触发阈值" prop="circuitThreshold">
          <el-input v-model="form.circuitThreshold" placeholder="请输入熔断触发阈值" />
        </el-form-item>
        <el-form-item label="慢调用判定阈值" prop="circuitGrade">
          <el-input v-model="form.circuitGrade" placeholder="请输入慢调用判定阈值" />
        </el-form-item>
        <el-form-item label="熔断统计窗口时长" prop="circuitWindow">
          <el-input v-model="form.circuitWindow" placeholder="请输入熔断统计窗口时长" />
        </el-form-item>
        <el-form-item label="熔断恢复超时时间" prop="circuitTimeout">
          <el-input v-model="form.circuitTimeout" placeholder="请输入熔断恢复超时时间" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listRule, getRule, delRule, addRule, updateRule } from "@/api/fx67ll/ai/rule";

export default {
  name: "Rule",
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
      // AI Prompt 限流/熔断规则（适配Sentinel框架）表格数据
      ruleList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 创建时间范围
      daterangeCreateTime: [],
      // 更新时间范围
      daterangeUpdateTime: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        limitRuleDimension: null,
        limitRuleTargetId: null,
        limitRuleType: null,
        flowControlMode: null,
        flowControlEffect: null,
        flowRuleType: null,
        flowThreshold: null,
        circuitStrategy: null,
        circuitThreshold: null,
        circuitGrade: null,
        circuitWindow: null,
        circuitTimeout: null,
        limitRuleStatus: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        limitRuleDimension: [
          { required: true, message: "规则作用维度不能为空", trigger: "blur" }
        ],
        limitRuleTargetId: [
          { required: true, message: "规则作用目标ID不能为空", trigger: "blur" }
        ],
        limitRuleType: [
          { required: true, message: "规则类型不能为空", trigger: "change" }
        ],
        flowThreshold: [
          { required: true, message: "流控阈值不能为空", trigger: "blur" }
        ],
      }
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
    /** 查询AI Prompt 限流/熔断规则（适配Sentinel框架）列表 */
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
      listRule(this.queryParams).then(response => {
        this.ruleList = this.formatObjectArrayNullProperty(response.rows);
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        limitRuleId: null,
        limitRuleDimension: null,
        limitRuleTargetId: null,
        limitRuleType: null,
        flowControlMode: null,
        flowControlEffect: null,
        flowRuleType: null,
        flowThreshold: null,
        circuitStrategy: null,
        circuitThreshold: null,
        circuitGrade: null,
        circuitWindow: null,
        circuitTimeout: null,
        limitRuleStatus: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.limitRuleId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加AI Prompt 限流/熔断规则（适配Sentinel框架）";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const limitRuleId = row.limitRuleId || this.ids
      getRule(limitRuleId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改AI Prompt 限流/熔断规则（适配Sentinel框架）";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.limitRuleId != null) {
            updateRule(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addRule(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const limitRuleIds = row.limitRuleId || this.ids;
      this.$modal.confirm('是否确认删除AI Prompt 限流/熔断规则（适配Sentinel框架）编号为"' + limitRuleIds + '"的数据项？').then(function () {
        return delRule(limitRuleIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/rule/export', {
        ...this.queryParams
      }, `rule_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
