<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryForm"
      size="small"
      :inline="true"
      v-show="showSearch"
      label-width="68px"
    >
      <el-form-item label="打卡类型" prop="punchType">
        <el-select v-model="queryParams.punchType" placeholder="请选择打卡类型" clearable>
          <el-option
            v-for="dict in dict.type.fx67ll_punch_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- <el-form-item label="删除标志" prop="delFlag">
        <el-select v-model="queryParams.delFlag" placeholder="请选择删除标志" clearable>
          <el-option
            v-for="dict in dict.type.sys_yes_no"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item> -->
      <!-- <el-form-item label="用户ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item> -->
      <el-form-item label="打卡人" prop="updateBy">
        <el-input
          v-model="queryParams.updateBy"
          placeholder="请输入打卡人"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="打卡时间">
        <el-date-picker
          v-model="daterangeUpdateTime"
          style="width: 240px"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="创建者" prop="createBy">
        <el-input
          v-model="queryParams.createBy"
          placeholder="请输入记录创建者"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="daterangeCreateTime"
          style="width: 240px"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery"
          >搜索</el-button
        >
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['punch:log:add']"
          >新增</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['punch:log:edit']"
          >修改</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['punch:log:remove']"
          >删除</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['punch:log:export']"
          >导出</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-data-line"
          size="mini"
          @click="handleLogTotalOpen"
          >查看月度工时统计</el-button
        >
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table
      v-loading="loading"
      :data="logList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <!-- <el-table-column label="打卡记录主键" align="center" prop="punchId" /> -->
      <el-table-column label="打卡类型" align="center" prop="punchType">
        <template slot-scope="scope">
          <!-- <dict-tag :options="dict.type.fx67ll_punch_type" :value="scope.row.punchType" /> -->
          <span style="color: #2ecc71" v-if="scope.row.punchType === '1'">上班打卡</span>
          <span style="color: #ff5a5f" v-if="scope.row.punchType === '2'">下班打卡</span>
          <span
            style="color: #999999"
            v-if="scope.row.punchType !== '1' && scope.row.punchType !== '2'"
            >{{ scope.row.winMoney }}</span
          >
        </template>
      </el-table-column>
      <el-table-column label="打卡人" align="center" prop="updateBy" />
      <el-table-column label="打卡时间" align="center" prop="updateTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="打卡记录备注" align="center" prop="punchRemark" />
      <el-table-column label="记录创建者" align="center" prop="createBy" />
      <el-table-column label="记录创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['punch:log:edit']"
            >修改</el-button
          >
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['punch:log:remove']"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改打卡记录对话框 -->
    <el-dialog
      :title="title"
      :visible.sync="open"
      width="500px"
      style="top: 130px"
      append-to-body
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="打卡类型" prop="punchType">
          <el-select
            v-model="form.punchType"
            style="width: 100%"
            placeholder="请选择打卡类型"
          >
            <el-option
              v-for="dict in dict.type.fx67ll_punch_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="打卡时间" prop="updateTime">
          <el-date-picker
            v-model="form.updateTime"
            type="datetime"
            style="width: 100%"
            placeholder="请选择日期打卡时间"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item label="打卡备注" prop="punchRemark">
          <el-input
            v-model="form.punchRemark"
            type="textarea"
            placeholder="请输入打卡备注"
            :autosize="{ minRows: 4 }"
          />
        </el-form-item>
        <!-- <el-form-item label="删除标志" prop="delFlag">
          <el-select v-model="form.delFlag" placeholder="请选择删除标志">
            <el-option
              v-for="dict in dict.type.sys_yes_no"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item> -->
        <!-- <el-form-item label="用户ID" prop="userId">
          <el-input v-model="form.userId" placeholder="请输入用户ID" />
        </el-form-item> -->
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 查看工时统计数据的弹窗 -->
    <el-dialog
      title="月度工时统计"
      :visible.sync="logTotalOpen"
      width="800px"
      style="top: 130px"
      append-to-body
    >
      <div id="logTotalContainer">
        <el-table v-loading="logTotalLoading" :data="logTotalList">
          <el-table-column label="打卡人" align="center" prop="punchUser" />
          <el-table-column label="统计月份" align="center" prop="punchMonth" />
          <el-table-column
            label="当月总工时 (小时)"
            align="center"
            prop="totalWorkHours"
            width="140"
          >
            <template slot-scope="scope">
              {{ scope.row.totalWorkHours.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column
            label="当月已打卡天数"
            align="center"
            prop="totalPunchDays"
            width="140"
          />
          <el-table-column label="当月缺卡天数" align="center" prop="totalWorkDays">
            <template slot-scope="scope">
              <span
                style="color: #2ecc71"
                v-if="scope.row.totalPunchDays - scope.row.totalWorkDays === 0"
                >0
              </span>
              <span
                style="color: #ff5a5f"
                v-if="scope.row.totalPunchDays - scope.row.totalWorkDays > 0"
                >{{ scope.row.totalPunchDays - scope.row.totalWorkDays }}
              </span>
            </template>
          </el-table-column>
          <el-table-column
            label="当月日均工时 (小时)"
            align="center"
            prop="workHoursPerDay"
            width="140"
          >
            <template slot-scope="scope">
              <span
                style="color: #2ecc71"
                v-if="scope.row.workHoursPerDay.toFixed(2) >= 8.5"
                >{{ scope.row.workHoursPerDay.toFixed(2) }}
              </span>
              <span
                style="color: #ff5a5f"
                v-if="scope.row.workHoursPerDay.toFixed(2) < 8.5"
                >{{ scope.row.workHoursPerDay.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleLogTotalClose">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import moment from "moment";
import {
  listLog,
  getLog,
  delLog,
  addLog,
  updateLog,
  listTotal,
} from "@/api/fx67ll/punch/log";

export default {
  name: "Log",
  dicts: ["sys_yes_no", "fx67ll_punch_type"],
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
      // 打卡记录表格数据
      logList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 用户ID时间范围
      daterangeCreateTime: [],
      // 用户ID时间范围
      daterangeUpdateTime: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        punchType: null,
        punchRemark: null,
        delFlag: null,
        userId: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        punchType: [{ required: true, message: "打卡类型不能为空", trigger: "change" }],
        updateTime: [{ required: true, message: "打卡时间不能为空", trigger: "change" }],
      },
      // 工时统计相关参数
      logTotalOpen: false,
      logTotalList: [],
      logTotalLoading: false,
    };
  },
  created() {
    this.getList();
  },
  methods: {
    // 查询打卡记录列表
    getWorkTotalTime() {
      const self = this;
      self.logTotalLoading = true;
      const paramsTmp = {
        pageNum: 1,
        pageSize: 999999999,
      };
      listTotal(paramsTmp).then((response) => {
        self.logTotalList = self.formatObjectArrayNullProperty(response.rows);
        self.logTotalLoading = false;
      });
    },
    // 打开工时统计弹窗
    handleLogTotalOpen() {
      this.getWorkTotalTime();
      this.logTotalOpen = true;
    },
    // 关闭工时统计弹窗
    handleLogTotalClose() {
      this.logTotalOpen = false;
    },
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
      this.queryParams.beginUpdateTime = null;
      this.queryParams.endUpdateTime = null;
    },
    /** 查询打卡记录列表 */
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
      listLog(this.queryParams).then((response) => {
        this.logList = this.formatObjectArrayNullProperty(response.rows);
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
        punchId: null,
        punchType: null,
        delFlag: null,
        userId: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: moment(),
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
      this.daterangeCreateTime = [];
      this.daterangeUpdateTime = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map((item) => item.punchId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加打卡记录";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const punchId = row.punchId || this.ids;
      getLog(punchId).then((response) => {
        this.form = response.data;
        this.open = true;
        this.title = "修改打卡记录";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate((valid) => {
        if (valid) {
          this.form.updateTime = moment(this.form.updateTime).format(
            "yyyy-MM-DD HH:mm:ss"
          );
          if (this.form.punchId != null) {
            updateLog(this.form).then((response) => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addLog(this.form).then((response) => {
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
      const punchIds = row.punchId || this.ids;
      this.$modal
        .confirm('是否确认删除打卡记录编号为"' + punchIds + '"的数据项？')
        .then(function () {
          return delLog(punchIds);
        })
        .then(() => {
          this.getList();
          this.$modal.msgSuccess("删除成功");
        })
        .catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download(
        "punch/log/export",
        {
          ...this.queryParams,
        },
        `log_${new Date().getTime()}.xlsx`
      );
    },
  },
};
</script>
