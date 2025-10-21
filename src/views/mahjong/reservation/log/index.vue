<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="预约用户" prop="createBy">
        <el-input v-model="queryParams.createBy" placeholder="请输入预约用户名" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="麻将室" prop="mahjongRoomId">
        <el-input v-model="queryParams.mahjongRoomName" placeholder="请输入预约的麻将室名称" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="联系方式" prop="reservationContact" style="margin-left: 12px">
        <el-input v-model="queryParams.reservationContact" placeholder="请输入预约用户联系方式" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="订单备注" prop="reservationRemark" style="margin-left: 12px">
        <el-input v-model="queryParams.reservationRemark" placeholder="请输入订单备注" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="订单状态" prop="reservationStatus">
        <el-select v-model="queryParams.reservationStatus" placeholder="请选择订单状态" clearable>
          <el-option v-for="dict in dict.type.fx67ll_order_status" :key="dict.value" :label="dict.label"
            :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" style="margin-left: 12px">
        <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item>
      <el-form-item label="更新时间" style="margin-left: 12px">
        <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item>
      <el-form-item style="margin-left: 12px">
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['mahjong:reservation:log:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['mahjong:reservation:log:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['mahjong:reservation:log:remove']">删除</el-button>
      </el-col>
      <!-- 导出按钮，无法使用，也不开放商用，后期再说吧 -->
      <!-- <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['mahjong:reservation:log:export']">导出</el-button>
      </el-col> -->
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="logList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="预约用户" align="center" prop="createBy" />
      <el-table-column label="麻将室" align="center" prop="mahjongRoomName" />
      <el-table-column label="预约开始时间" align="center" prop="reservationStartTime" width="160">
        <template slot-scope="scope">
          <span>{{
            parseTime(scope.row.reservationStartTime, "{y}-{m}-{d} {h}:{i}:{s}")
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预约结束时间" align="center" prop="reservationEndTime" width="160">
        <template slot-scope="scope">
          <span>{{
            parseTime(scope.row.reservationEndTime, "{y}-{m}-{d} {h}:{i}:{s}")
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="联系方式" align="center" prop="reservationContact" />
      <el-table-column label="订单状态" align="center" prop="reservationStatus" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.fx67ll_order_status" :value="scope.row.reservationStatus" />
        </template>
      </el-table-column>
      <el-table-column label="订单备注" align="center" prop="reservationRemark" />
      <el-table-column label="订单创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="订单更新用户" align="center" prop="updateBy" width="100" />
      <el-table-column label="订单更新时间" align="center" prop="updateTime" width="160">
        <template slot-scope="scope">
          <span>{{
            parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}")
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['mahjong:reservation:log:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['mahjong:reservation:log:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改麻将室预约记录对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="800px" append-to-body
      style="top: 130px">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户ID" prop="userId" v-if="nowUserName === 'fx67ll'">
              <el-input v-model="form.userId" placeholder="请输入预约用户ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="麻将室ID" prop="mahjongRoomId" v-if="nowUserName === 'fx67ll'">
              <el-input v-model="form.mahjongRoomId" placeholder="请输入预约的麻将室ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开始时间" prop="reservationStartTime">
              <el-date-picker clearable v-model="form.reservationStartTime" type="datetime" value-format="yyyy-MM-dd"
                placeholder="请选择预约开始时间" style="width: 270px">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="reservationEndTime">
              <el-date-picker clearable v-model="form.reservationEndTime" type="datetime" value-format="yyyy-MM-dd"
                placeholder="请选择预约结束时间" style="width: 270px">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单状态" prop="reservationStatus">
              <el-select v-model="form.reservationStatus" placeholder="请选择订单状态" clearable style="width: 270px">
                <el-option v-for="dict in dict.type.fx67ll_order_status" :key="dict.value" :label="dict.label"
                  :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系方式" prop="reservationContact">
              <el-input v-model="form.reservationContact" placeholder="请输入预约用户联系方式" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="reservationRemark">
              <el-input v-model="form.reservationRemark" type="textarea" placeholder="请输入预约备注内容" />
            </el-form-item>
          </el-col>
        </el-row>
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
  listLog,
  getLog,
  delLog,
  addLog,
  updateLog,
} from "@/api/fx67ll/mahjong/log";

export default {
  name: "mahjongReservationLog",
  dicts: ["fx67ll_order_status"],
  data() {
    return {
      // 当前登录用户ID
      nowUserId: this.$store.state.user.nowUserId,
      // 当前登录用户名
      nowUserName: this.$store.state.user.name,
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
      // 麻将室预约记录表格数据
      logList: [],
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
        createBy: null,
        mahjongRoomName: null,
        reservationContact: null,
        reservationStatus: null,
        reservationRemark: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        reservationStartTime: [
          { required: true, message: "预约开始时间不能为空", trigger: "blur" },
        ],
        reservationEndTime: [
          { required: true, message: "预约结束时间不能为空", trigger: "blur" },
        ],
        reservationStatus: [
          { required: true, message: "预约状态不能为空", trigger: "change" },
        ],
      },
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
    /** 查询麻将室预约记录列表 */
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
        mahjongReservationLogId: null,
        userId: null,
        createBy: null,
        mahjongRoomId: null,
        mahjongRoomName: null,
        reservationStartTime: null,
        reservationEndTime: null,
        reservationStatus: null,
        // 预留：费用金额（未来存储实际费用）
        // reservationAmount: null,
        reservationContact: null,
        reservationRemark: null,
        delFlag: null,
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
      this.ids = selection.map((item) => item.mahjongReservationLogId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加麻将室预约记录";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const mahjongReservationLogId = row.mahjongReservationLogId || this.ids;
      getLog(mahjongReservationLogId).then((response) => {
        this.form = response.data;
        this.open = true;
        this.title = "修改麻将室预约记录";
      });
    },
    /** 提交按钮 */
    submitForm() {
      const self = this;
      this.$refs["form"].validate((valid) => {
        if (valid) {
          if (self.nowUserName !== 'fx67ll') {
            this.form.nowUserId = self.nowUserId;
          }
          if (self.nowUserName !== 'fx67ll') {
            this.form.mahjongRoomId = 1;
          }
          if (this.form.mahjongReservationLogId != null) {
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
      const mahjongReservationLogIds = row.mahjongReservationLogId || this.ids;
      this.$modal
        .confirm(
          '是否确认删除麻将室预约记录编号为"' +
          mahjongReservationLogIds +
          '"的数据项？'
        )
        .then(function () {
          return delLog(mahjongReservationLogIds);
        })
        .then(() => {
          this.getList();
          this.$modal.msgSuccess("删除成功");
        })
        .catch(() => { });
    },
    /** 导出按钮操作，无法使用，也不开放商用，后期再说吧 */
    // handleExport() {
    //   this.download(
    //     "mahjong/reservation/log/export",
    //     {
    //       ...this.queryParams,
    //     },
    //     `log_${new Date().getTime()}.xlsx`
    //   );
    // },
  },
};
</script>
