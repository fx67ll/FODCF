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
      <el-form-item label="固定追号" prop="chaseNumber">
        <el-input
          v-model="queryParams.chaseNumber"
          placeholder="请输入每日固定追号"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="彩票类型" prop="numberType">
        <el-select
          v-model="queryParams.numberType"
          placeholder="请选择固定追号的彩票类型"
          clearable
        >
          <el-option
            v-for="dict in dict.type.fx67ll_lottery_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="追号周期" prop="weekType">
        <el-select
          v-model="queryParams.weekType"
          placeholder="请选择星期几的固定追号"
          clearable
        >
          <el-option
            v-for="dict in dict.type.sys_week_type"
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
          clearable
        ></el-date-picker>
      </el-form-item>
      <!-- <el-form-item label="更新者" prop="updateBy">
        <el-input
          v-model="queryParams.updateBy"
          placeholder="请输入记录更新者"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item> -->
      <el-form-item label="更新时间">
        <el-date-picker
          v-model="daterangeUpdateTime"
          style="width: 240px"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          clearable
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
          v-hasPermi="['lottery:chase:add']"
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
          v-hasPermi="['lottery:chase:edit']"
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
          v-hasPermi="['lottery:chase:remove']"
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
          v-hasPermi="['lottery:chase:export']"
          >导出</el-button
        >
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table
      v-loading="loading"
      :data="chaseList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <!-- <el-table-column label="固定追号主键" align="center" prop="chaseId" width="120" /> -->
      <el-table-column label="每日固定追号" align="center" prop="chaseNumber" />
      <el-table-column label="彩票类型" align="center" prop="numberType" width="90">
        <template slot-scope="scope">
          <dict-tag
            :options="dict.type.fx67ll_lottery_type"
            :value="scope.row.numberType"
          />
        </template>
      </el-table-column>
      <el-table-column label="追号周期" align="center" prop="weekType" width="90">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_week_type" :value="scope.row.weekType" />
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sort" width="120" sortable />
      <el-table-column label="记录创建者" align="center" prop="createBy" width="120" />
      <el-table-column label="记录创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="记录更新者" align="center" prop="updateBy" width="120" />
      <el-table-column label="记录更新时间" align="center" prop="updateTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
        fixed="right"
        width="140"
      >
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['lottery:chase:edit']"
            >修改</el-button
          >
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['lottery:chase:remove']"
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

    <!-- 添加或修改固定追号配置对话框 -->
    <el-dialog
      :title="title"
      :visible.sync="open"
      :close-on-click-modal="false"
      width="500px"
      style="top: 110px"
      append-to-body
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="固定追号" prop="chaseNumber">
          <el-input
            v-model="form.chaseNumber"
            placeholder="请输入每日固定追号"
            clearable
          />
        </el-form-item>
        <el-form-item label="彩票类型" prop="numberType">
          <el-select
            v-model="form.numberType"
            style="width: 100%"
            placeholder="请选择固定追号的彩票类型"
            @change="handleNumberTypeChange"
          >
            <el-option
              v-for="dict in dict.type.fx67ll_lottery_type"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="追号周期" prop="weekType" v-if="form.numberType">
          <el-select
            v-model="form.weekType"
            style="width: 100%"
            placeholder="请选择星期几的固定追号"
          >
            <el-option
              v-for="dict in noUsingWeekList"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="1" placeholder="请输入排序" />
        </el-form-item>
        <!-- <el-form-item label="删除标志" prop="delFlag">
          <el-select
            v-model="form.delFlag"
            style="width: 100%"
            placeholder="请选择删除标志"
          >
            <el-option
              v-for="dict in dict.type.sys_yes_no"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item> -->
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listChase,
  getChase,
  delChase,
  addChase,
  updateChase,
} from "@/api/lottery/chase";

export default {
  name: "Chase",
  dicts: ["fx67ll_lottery_type", "sys_yes_no", "sys_week_type"],
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
      // 固定追号配置表格数据
      chaseList: [],
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
        chaseId: null,
        chaseNumber: null,
        numberType: null,
        weekType: null,
        sort: null,
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
        chaseNumber: [
          { required: true, message: "每日固定追号不能为空", trigger: "blur" },
        ],
        numberType: [
          { required: true, message: "固定追号的彩票类型不能为空", trigger: "change" },
        ],
        weekType: [
          { required: true, message: "星期几的固定追号不能为空", trigger: "change" },
        ],
        sort: [{ required: true, message: "排序不能为空", trigger: "blur" }],
      },
      // 顶部表格查询的周期下拉
      noUsingWeekList: [],
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询固定追号配置列表 */
    getList() {
      this.loading = true;
      this.queryParams.params = {};
      if (null != this.daterangeCreateTime && "" != this.daterangeCreateTime) {
        this.queryParams.params["beginCreateTime"] = this.daterangeCreateTime[0];
        this.queryParams.params["endCreateTime"] = this.daterangeCreateTime[1];
      }
      if (null != this.daterangeUpdateTime && "" != this.daterangeUpdateTime) {
        this.queryParams.params["beginUpdateTime"] = this.daterangeUpdateTime[0];
        this.queryParams.params["endUpdateTime"] = this.daterangeUpdateTime[1];
      }
      listChase(this.queryParams).then((response) => {
        this.chaseList = this.formatObjectArrayNullProperty(response.rows);
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
        chaseId: null,
        chaseNumber: null,
        numberType: null,
        weekType: null,
        sort: null,
        delFlag: null,
        userId: null,
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
      this.daterangeCreateTime = [];
      this.daterangeUpdateTime = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map((item) => item.chaseId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    // 提取已经使用的追号周期
    getUsingWeekList(record) {
      this.noUsingWeekList = [];
      const enumWeekList = [...this.dict.type.sys_week_type];
      let dataList = [...this.chaseList] || [];
      if (dataList && dataList.length > 0 && record && record?.weekType) {
        dataList = dataList.filter(
          (item) => item?.weekType?.toString() !== record?.weekType?.toString()
        );
      }
      if (dataList.length > 0) {
        dataList.forEach((obj) => {
          enumWeekList.forEach((item, index) => {
            if (obj?.weekType?.toString() === item?.value?.toString()) {
              enumWeekList.splice(index, 1);
            }
          });
        });
      }
      if (enumWeekList && enumWeekList.length > 0) {
        this.noUsingWeekList = enumWeekList;
      }
    },
    // 根据彩票类型动态修改可配置的追号周期
    handleNumberTypeChange(type, record) {
      this.getUsingWeekList(record);
      if (type?.toString() === "1") {
        this.noUsingWeekList = this.noUsingWeekList.filter((item) => {
          const val = item?.value?.toString();
          return val !== "2" && val !== "4" && val !== "7";
        });
      }
      if (type?.toString() === "2") {
        this.noUsingWeekList = this.noUsingWeekList.filter((item) => {
          const val = item?.value?.toString();
          return val !== "1" && val !== "3" && val !== "6";
        });
      }
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.getUsingWeekList();
      this.reset();
      this.open = true;
      this.title = "添加固定追号配置";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const chaseId = row.chaseId || this.ids;
      getChase(chaseId).then((response) => {
        this.handleNumberTypeChange(response?.data?.numberType, response?.data);
        this.form = response.data;
        this.open = true;
        this.title = "修改固定追号配置";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate((valid) => {
        if (valid) {
          if (this.form.chaseId != null) {
            updateChase(this.form).then((response) => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addChase(this.form).then((response) => {
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
      const chaseIds = row.chaseId || this.ids;
      this.$modal
        .confirm("删除后数据无法恢复，请确认是否删除该数据项？")
        .then(function () {
          return delChase(chaseIds);
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
        "lottery/chase/export",
        {
          ...this.queryParams,
        },
        `chase_${new Date().getTime()}.xlsx`
      );
    },
  },
};
</script>
