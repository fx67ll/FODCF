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
      <el-form-item label="总金额" prop="extraMoney">
        <el-input
          v-model="queryParams.extraMoney"
          placeholder="请输入当前外快总金额"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="是否盈利" prop="isWin">
        <el-select v-model="queryParams.isWin" placeholder="请选择是否盈利" clearable>
          <el-option
            v-for="dict in dict.type.sys_yes_no"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="盈亏金额" prop="winMoney">
        <el-input
          v-model="queryParams.winMoney"
          placeholder="请输入外快盈亏金额"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="当前本金" prop="seedMoney">
        <el-input
          v-model="queryParams.seedMoney"
          placeholder="请输入当前投入本金"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>

      <el-form-item label="落袋金额" prop="saveMoney">
        <el-input
          v-model="queryParams.saveMoney"
          placeholder="请输入已经落袋为安的盈利金额"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="目标金额" prop="targetMoney">
        <el-input
          v-model="queryParams.targetMoney"
          placeholder="请输入目标金额"
          clearable
          @keyup.enter.native="handleQuery"
        />
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
      <el-form-item label="更新时间">
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
          v-hasPermi="['dortmund:extra:add']"
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
          v-hasPermi="['dortmund:extra:edit']"
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
          v-hasPermi="['dortmund:extra:remove']"
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
          v-hasPermi="['dortmund:extra:export']"
          >导出</el-button
        >
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table
      v-loading="loading"
      :data="extraList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="外快总金额" align="center" prop="extraMoney" width="130" />
      <el-table-column label="是否盈利" align="center" prop="isWin" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_yes_no" :value="scope.row.isWin" />
        </template>
      </el-table-column>
      <el-table-column
        label="本次外快盈亏金额"
        align="center"
        prop="winMoney"
        width="130"
      >
        <template slot-scope="scope">
          <span
            style="color: #ff5a5f"
            v-if="scope.row.isWin !== 'Y' && parseFloat(scope.row.winMoney) < 0"
            >{{ scope.row.winMoney }}</span
          >
          <span
            style="color: #999999"
            v-if="scope.row.isWin !== 'Y' && parseFloat(scope.row.winMoney || 0) === 0"
            >{{ scope.row.winMoney }}</span
          >
          <span style="color: #2ecc71" v-if="scope.row.isWin === 'Y'">{{
            scope.row.winMoney
          }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="历史总盈亏金额"
        align="center"
        prop="currentMoney"
        width="130"
      >
        <template slot-scope="scope">
          <span style="color: #ff5a5f" v-if="scope.row.currentMoney < 0">{{
            scope.row.currentMoney.replace(/\.?0+$/, "")
          }}</span>
          <span
            style="color: #999999"
            v-if="parseInt(scope.row.currentMoney || 0) === 0"
            >{{ scope.row.currentMoney.replace(/\.?0+$/, "") }}</span
          >
          <span style="color: #2ecc71" v-if="scope.row.currentMoney > 0">{{
            scope.row.currentMoney.replace(/\.?0+$/, "")
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="当前投入本金" align="center" prop="seedMoney" width="130" />
      <el-table-column
        label="已经落袋为安的盈利金额"
        align="center"
        prop="saveMoney"
        width="180"
      />
      <el-table-column label="目标金额" align="center" prop="targetMoney" width="130" />
      <el-table-column label="备注" align="center" prop="extraRemark" />
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
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['dortmund:extra:edit']"
            >修改</el-button
          >
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['dortmund:extra:remove']"
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

    <!-- 添加或修改外快盈亏记录对话框 -->
    <el-dialog
      :title="title"
      :visible.sync="open"
      :close-on-click-modal="false"
      width="500px"
      style="top: 40px"
      append-to-body
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="总金额" prop="extraMoney">
          <el-input v-model="form.extraMoney" placeholder="请输入当前外快总金额" />
        </el-form-item>
        <el-form-item label="是否盈利" prop="isWin">
          <el-select
            v-model="form.isWin"
            style="width: 100%"
            placeholder="请选择是否盈利"
          >
            <el-option
              v-for="dict in dict.type.sys_yes_no"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="盈亏金额" prop="winMoney">
          <el-input v-model="form.winMoney" placeholder="请输入外快盈亏金额" />
        </el-form-item>
        <el-form-item label="当前本金" prop="seedMoney">
          <el-input v-model="form.seedMoney" placeholder="请输入当前投入本金" />
        </el-form-item>
        <el-form-item label="落袋金额" prop="saveMoney">
          <el-input v-model="form.saveMoney" placeholder="请输入已经落袋为安的盈利金额" />
        </el-form-item>
        <el-form-item label="目标金额" prop="targetMoney">
          <el-input v-model="form.targetMoney" placeholder="请输入目标金额" />
        </el-form-item>
        <el-form-item label="备注" prop="extraRemark">
          <el-input
            v-model="form.extraRemark"
            type="textarea"
            :rows="3"
            :maxlength="1023"
            show-word-limit
            placeholder="请输入内容"
          />
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
import {
  listExtra,
  getExtra,
  delExtra,
  addExtra,
  updateExtra,
} from "@/api/fx67ll/dortmund/extra";

export default {
  name: "Extra",
  dicts: ["sys_yes_no"],
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
        extraMoney: null,
        isWin: null,
        winMoney: null,
        seedMoney: null,
        saveMoney: null,
        targetMoney: null,
        extraRemark: null,
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
        extraMoney: [
          { required: true, message: "当前外快总金额不能为空", trigger: "blur" },
        ],
        isWin: [{ required: true, message: "是否盈利不能为空", trigger: "change" }],
        winMoney: [{ required: true, message: "外快盈亏金额不能为空", trigger: "blur" }],
        seedMoney: [{ required: true, message: "当前投入本金不能为空", trigger: "blur" }],
        saveMoney: [
          { required: true, message: "已经落袋为安的盈利金额不能为空", trigger: "blur" },
        ],
        targetMoney: [{ required: true, message: "目标金额不能为空", trigger: "blur" }],
      },
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询外快盈亏记录列表 */
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
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        extraId: null,
        extraMoney: null,
        isWin: null,
        winMoney: null,
        seedMoney: null,
        targetMoney: null,
        extraRemark: null,
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
      this.ids = selection.map((item) => item.extraId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加外快盈亏记录";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const extraId = row.extraId || this.ids;
      getExtra(extraId).then((response) => {
        this.form = response.data;
        this.open = true;
        this.title = "修改外快盈亏记录";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate((valid) => {
        if (valid) {
          if (this.form.extraId != null) {
            updateExtra(this.form).then((response) => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addExtra(this.form).then((response) => {
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
        .catch(() => {});
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
  },
};
</script>
