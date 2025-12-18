<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryForm"
      size="small"
      :inline="true"
      v-show="showSearch"
      label-width="100px"
    >
      <el-form-item label="预约用户" prop="createBy">
        <el-input
          v-model="queryParams.createBy"
          placeholder="请输入预约用户名"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="麻将室" prop="mahjongRoomId">
        <el-input
          v-model="queryParams.mahjongRoomName"
          placeholder="请输入预约的麻将室名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item
        label="联系方式"
        prop="reservationContact"
        style="margin-left: 12px"
      >
        <el-input
          v-model="queryParams.reservationContact"
          placeholder="请输入预约用户联系方式"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item
        label="订单备注"
        prop="reservationRemark"
        style="margin-left: 12px"
      >
        <el-input
          v-model="queryParams.reservationRemark"
          placeholder="请输入订单备注"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="订单状态" prop="reservationStatus">
        <el-select
          v-model="queryParams.reservationStatus"
          placeholder="请选择订单状态"
          clearable
          @keyup.enter.native="handleQuery"
        >
          <el-option
            v-for="dict in dict.type.fx67ll_order_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- 订单开始时间范围搜索 -->
      <el-form-item label="订单开始时间" style="margin-left: 12px">
        <el-date-picker
          v-model="daterangeStartTime"
          style="width: 240px"
          value-format="yyyy-MM-dd HH:mm:ss"
          type="datetimerange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          clearable
          @keyup.enter.native="handleQuery"
        ></el-date-picker>
      </el-form-item>
      <!-- 订单结束时间范围搜索 -->
      <el-form-item label="订单结束时间" style="margin-left: 12px">
        <el-date-picker
          v-model="daterangeEndTime"
          style="width: 240px"
          value-format="yyyy-MM-dd HH:mm:ss"
          type="datetimerange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          clearable
          @keyup.enter.native="handleQuery"
        ></el-date-picker>
      </el-form-item>
      <!-- <el-form-item label="创建时间" style="margin-left: 12px">
        <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd HH:mm:ss" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item> -->
      <!-- <el-form-item label="更新时间" style="margin-left: 12px">
        <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd HH:mm:ss" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item> -->
      <el-form-item style="margin-left: 12px">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="mini"
          @click="handleQuery"
          >搜索</el-button
        >
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery"
          >重置</el-button
        >
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
          v-hasPermi="['mahjong:reservation:log:add']"
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
          v-hasPermi="['mahjong:reservation:log:edit']"
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
          v-hasPermi="['mahjong:reservation:log:remove']"
          >删除</el-button
        >
      </el-col>
      <!-- 导出按钮，无法使用，也不开放商用，后期再说吧 -->
      <!-- <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['mahjong:reservation:log:export']">导出</el-button>
      </el-col> -->
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-data-line"
          size="mini"
          @click="handleLogViewOpen"
          v-hasPermi="['mahjong:reservation:log:total']"
        >
          {{ prettyTimesDialogTitle }}
        </el-button>
      </el-col>
      <right-toolbar
        :showSearch.sync="showSearch"
        @queryTable="getList"
      ></right-toolbar>
    </el-row>

    <el-table
      v-loading="loading"
      :data="logList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <!-- <el-table-column label="订单编号" align="center" prop="orderId" width="130" /> -->
      <el-table-column label="预约用户" align="center" prop="createBy" />
      <el-table-column label="预约用户备注" align="center" prop="userRemark" />
      <!-- <el-table-column label="麻将室" align="center" prop="mahjongRoomName" width="80" /> -->
      <el-table-column
        label="预约开始时间"
        align="center"
        prop="reservationStartTime"
        width="160"
        sortable
        :sort-method="sortStartTime"
      >
        <template slot-scope="scope">
          <span>{{
            parseTime(scope.row.reservationStartTime, "{y}-{m}-{d} {h}:{i}:{s}")
          }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="预约结束时间"
        align="center"
        prop="reservationEndTime"
        width="160"
        sortable
        :sort-method="sortEndTime"
      >
        <template slot-scope="scope">
          <span>{{
            parseTime(scope.row.reservationEndTime, "{y}-{m}-{d} {h}:{i}:{s}")
          }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="联系方式"
        align="center"
        prop="reservationContact"
      />
      <el-table-column
        label="订单状态"
        align="center"
        prop="reservationStatus"
        width="80"
      >
        <template slot-scope="scope">
          <dict-tag
            :options="dict.type.fx67ll_order_status"
            :value="scope.row.reservationStatus"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="订单备注"
        align="center"
        prop="reservationRemark"
      />
      <!-- <el-table-column label="订单创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}
          </span>
        </template>
      </el-table-column> -->
      <!-- <el-table-column label="订单更新用户" align="center" prop="updateBy" width="100" /> -->
      <!-- <el-table-column label="订单更新时间" align="center" prop="updateTime" width="160">
        <template slot-scope="scope">
          <span>{{
            parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}")
          }}</span>
        </template>
      </el-table-column> -->
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
        fixed="right"
      >
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['mahjong:reservation:log:edit']"
            >修改</el-button
          >
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['mahjong:reservation:log:remove']"
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

    <!-- 添加或修改麻将室预约记录对话框 -->
    <el-dialog
      :title="title"
      :visible.sync="open"
      :close-on-click-modal="false"
      width="800px"
      append-to-body
      style="top: 130px"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              label="用户ID"
              prop="userId"
              v-if="nowUserName === 'fx67ll'"
            >
              <el-input v-model="form.userId" placeholder="请输入预约用户ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              label="麻将室ID"
              prop="mahjongRoomId"
              v-if="nowUserName === 'fx67ll'"
            >
              <el-input
                v-model="form.mahjongRoomId"
                placeholder="请输入预约的麻将室ID"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开始时间" prop="reservationStartTime">
              <el-date-picker
                clearable
                v-model="form.reservationStartTime"
                type="datetime"
                format="yyyy-MM-dd HH:mm:ss"
                value-format="yyyy-MM-dd HH:00:00"
                placeholder="请选择预约开始时间"
                style="width: 270px"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="reservationEndTime">
              <el-date-picker
                clearable
                v-model="form.reservationEndTime"
                type="datetime"
                format="yyyy-MM-dd HH:mm:ss"
                value-format="yyyy-MM-dd HH:00:00"
                placeholder="请选择预约结束时间"
                style="width: 270px"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单状态" prop="reservationStatus">
              <el-select
                v-model="form.reservationStatus"
                placeholder="请选择订单状态"
                clearable
                style="width: 270px"
              >
                <el-option
                  v-for="dict in dict.type.fx67ll_order_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系方式" prop="reservationContact">
              <el-input
                v-model="form.reservationContact"
                placeholder="请输入预约用户联系方式"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="reservationRemark">
              <el-input
                v-model="form.reservationRemark"
                type="textarea"
                placeholder="请输入预约备注内容"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <el-dialog
      :title="prettyTimesDialogTitle"
      :visible.sync="prettyTimesDialogOpen"
      :close-on-click-modal="false"
      width="700px"
      append-to-body
      style="top: 0px"
    >
      <prettyTimes
        ref="prettyTimes"
        :showOvernight="appointConfig.showOvernight"
        :beginTime="appointConfig.allowBeginTime"
        :endTime="appointConfig.allowEndTime"
        :timeInterval="appointConfig.allowTimeInterval"
        :appointTime="appointConfig.appointTime"
        :isSection="true"
        :disableTimeSlot="appointConfig.disableTimeSlot"
        :myAppointTimeSlot="appointConfig.myAppointTimeSlot"
        @date-change="handleDateChange"
        @ready="handleComponentReady"
      >
        <!-- <prettyTimes
        ref="prettyTimes"
        :showOvernight="appointConfig.showOvernight"
        :beginTime="appointConfig.allowBeginTime"
        :endTime="appointConfig.allowEndTime"
        :timeInterval="appointConfig.allowTimeInterval"
        :appointTime="appointConfig.appointTime"
        :isSection="true"
        :disableTimeSlot="appointConfig.disableTimeSlot"
        :myAppointTimeSlot="appointConfig.myAppointTimeSlot"
        :formParams="prettyTimesFormParams"
        @change="handleTimeChange"
        @date-change="handleDateChange"
        @ready="handleComponentReady"
        @overnight-change="handleOvernightChange"
        @overnight-submit="handleOvernightSubmit"
      > -->
      </prettyTimes>
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
  listMahjongReservationLog,
} from "@/api/fx67ll/mahjong/log";
import moment from "moment";
import prettyTimes from "../../components/pretty-times/pretty-times.vue";

export default {
  name: "mahjongReservationLog",
  components: { prettyTimes },
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
      // 订单开始时间范围（数组：[开始时间, 结束时间]）
      daterangeStartTime: [],
      // 订单结束时间范围（数组：[开始时间, 结束时间]）
      daterangeEndTime: [],
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
        beginReservationStartTime: null, // 订单开始时间-起始
        endReservationStartTime: null, // 订单开始时间-结束
        beginReservationEndTime: null, // 订单结束时间-起始
        endReservationEndTime: null, // 订单结束时间-结束
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

      // =============== prettyTimes组件参数开始 ===============
      appointConfig: {
        showOvernight: true,
        allowBeginTime: "10:00:00",
        allowEndTime: "22:00:00",
        allowTimeInterval: 1,
        appointTime: [],
        disableTimeSlot: [],
        myAppointTimeSlot: [],
      },
      // prettyTimesFormParams: {
      //   mahjongRoomId: 1,
      //   reservationStartTime: null,
      //   reservationEndTime: null,
      //   reservationStatus: null,
      // },
      // prettyTimesDialogLogList: [],
      prettyTimesDialogTitle: "预约记录可视化查询",
      prettyTimesDialogOpen: false,
      // =============== prettyTimes组件参数结束 ===============
    };
  },
  created() {
    this.getList();
  },
  methods: {
    // 预约开始时间排序方法
    sortStartTime(a, b) {
      const timeA = new Date(a.reservationStartTime).getTime();
      const timeB = new Date(b.reservationStartTime).getTime();
      return timeA - timeB;
    },
    // 预约结束时间排序方法
    sortEndTime(a, b) {
      const timeA = new Date(a.reservationEndTime).getTime();
      const timeB = new Date(b.reservationEndTime).getTime();
      return timeA - timeB;
    },
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginReservationStartTime = null;
      this.queryParams.endReservationStartTime = null;
      this.queryParams.beginReservationEndTime = null;
      this.queryParams.endReservationEndTime = null;

      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
      this.queryParams.beginUpdateTime = null;
      this.queryParams.endUpdateTime = null;
    },
    /** 查询麻将室预约记录列表 */
    getList() {
      this.loading = true;
      this.clearDateQueryParams();
      // 处理订单开始时间范围（若选择了时间，则赋值给查询参数）
      if (this.daterangeStartTime && this.daterangeStartTime.length > 0) {
        this.queryParams.beginReservationStartTime = this.daterangeStartTime[0];
        this.queryParams.endReservationStartTime = this.daterangeStartTime[1];
      }
      // 处理订单结束时间范围（若选择了时间，则赋值给查询参数）
      if (this.daterangeEndTime && this.daterangeEndTime.length > 0) {
        this.queryParams.beginReservationEndTime = this.daterangeEndTime[0];
        this.queryParams.endReservationEndTime = this.daterangeEndTime[1];
      }
      if (null != this.daterangeCreateTime && "" != this.daterangeCreateTime) {
        this.queryParams.beginCreateTime = this.daterangeCreateTime[0];
        this.queryParams.endCreateTime = this.daterangeCreateTime[1];
      }
      if (null != this.daterangeUpdateTime && "" != this.daterangeUpdateTime) {
        this.queryParams.beginUpdateTime = this.daterangeUpdateTime[0];
        this.queryParams.endUpdateTime = this.daterangeUpdateTime[1];
      }
      listLog(this.queryParams).then((response) => {
        const rowsTmpList = this.formatObjectArrayNullProperty(response.rows);
        this.logList = rowsTmpList.map((item) => {
          const timeStamp = new Date(item.createTime).getTime();
          const rowObjTmp = {
            ...item,
            orderId: timeStamp + (item?.mahjongReservationLogId || 0),
          };
          return rowObjTmp;
        });
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
      this.daterangeStartTime = [];
      this.daterangeEndTime = [];
      this.daterangeCreateTime = [];
      this.daterangeUpdateTime = [];
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
          if (self.nowUserName !== "fx67ll") {
            this.form.nowUserId = self.nowUserId;
          }
          if (self.nowUserName !== "fx67ll") {
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
        .catch(() => {});
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

    // =============== prettyTimes组件方法开始 ===============
    //  prettyTimes组件：打开预约可视化记录查询弹窗
    handleLogViewOpen() {
      this.prettyTimesDialogOpen = true;
    },
    // prettyTimes组件：查询预约历史记录 - 修改为返回Promise
    queryLogList(isNeedAll = true) {
      const self = this;

      // // 新增：开始查询时显示加载状态（如果还没显示的话）
      // if (!this.loading) {
      //   this.loading = true;
      // }

      this.queryParams.pageNum = 1;
      this.queryParams.pageSize = 999;
      this.queryParams.isNeedAll = isNeedAll;

      // 返回Promise，便于外部等待
      return new Promise((resolve, reject) => {
        listMahjongReservationLog(self.queryParams)
          .then((res) => {
            if (res?.code === 200) {
              if (res?.rows && res?.rows?.length > 0) {
                // self.prettyTimesDialogLogList = res?.rows || [];
                const targetTimeSlot =
                  (res?.rows || [])
                    // 第一步：过滤出 reservationStatus 等于 '0' 的数据
                    ?.filter((item) => item.reservationStatus === "0")
                    // 第二步：对过滤后的数据处理时间，生成禁用时间段
                    ?.map((item) => {
                      const startTime = moment(
                        item.reservationStartTime
                      ).format("YYYY-MM-DD HH:mm:ss");
                      let endTime = moment(item.reservationEndTime);
                      const currentTime = moment();
                      // 如果结束时间晚于当前时间前1小时，则调整为当前时间前1小时
                      if (endTime.isAfter(currentTime.subtract(1, "hours"))) {
                        endTime = endTime.subtract(1, "hours");
                      }
                      return [startTime, endTime.format("YYYY-MM-DD HH:mm:ss")];
                    }) || [];

                // 根据查询类型更新对应配置
                if (isNeedAll) {
                  this.appointConfig.disableTimeSlot = targetTimeSlot;
                } else {
                  this.appointConfig.myAppointTimeSlot = targetTimeSlot;
                }
              }
              //  else {
              //   // 只有当isNeedAll为true时才清空（避免两次请求互相清空）
              //   if (isNeedAll) {
              //     self.clearLogList();
              //   }
              // }
              resolve(res);
            } else {
              // // 只有当isNeedAll为true时才清空（避免两次请求互相清空）
              // if (isNeedAll) {
              //   self.clearLogList();
              // }
              // uni.showToast({
              //   title: "查询预约订单记录失败！",
              //   icon: "none",
              //   duration: 1998,
              // });
              resolve(res); // 即使失败也resolve，让Promise.all能继续执行
            }
          })
          .catch((res) => {
            // // 只有当isNeedAll为true时才清空（避免两次请求互相清空）
            // if (isNeedAll) {
            //   self.clearLogList();
            // }
            reject(res);
          })
          .finally(() => {
            // 只有当两次请求都完成后才隐藏加载状态（在initData的finally中处理）
          });
      });
    },
    // prettyTimes组件：时间范围点击监听
    handleTimeChange(timeArr) {
      //   const self = this;
      //   // 选择普通时间时，取消包夜标记
      //   this.isOvernightSelected = false;
      //   let startTime = timeArr?.beginTime || "";
      //   let endTime = timeArr?.endTime || "";
      //   this.formParams = {
      //     ...self.formParams,
      //     reservationStartTime: startTime,
      //     reservationEndTime: endTime,
      //   };
    },
    // prettyTimes组件：日期切换监听
    handleDateChange(dateInfo) {
      this.nowDateInfo = dateInfo;
      // console.log('当前选中的日期：',dateInfo.selectedDate);
      // console.log('当前选中的星期：', dateInfo.selectedWeek);
      // console.log('选中日期的索引：', dateInfo.activeIndex);
      const dateStr = dateInfo?.selectedDate?.replace(/-/g, "") || "";
      this.queryParams.isNeedAll = true;
      this.queryParams.reservationDate = dateStr;

      // 日期切换时也等待两次请求完成
      // this.loading = true;
      Promise.all([this.queryLogList(true), this.queryLogList(false)]).finally(
        () => {
          // this.loading = false;
        }
      );
    },
    // prettyTimes组件：子组件渲染完成后，同步初始日期到父组件 nowDateInfo
    handleComponentReady() {
      // 子组件的 dateArr 是生成的日期列表，取第一个（默认选中的当日）
      const initDate = this?.$refs?.prettyTimes?.dateArr?.[0] || null;
      if (initDate) {
        this.nowDateInfo = {
          selectedDate: initDate.date,
          selectedWeek: initDate.week,
          activeIndex: 0,
        };
        this.handleDateChange({
          selectedDate: initDate.date,
          selectedWeek: initDate.week,
          activeIndex: 0,
        });
      }
    },
    // prettyTimes组件：包夜变化事件处理
    handleOvernightChange(overnightData) {
      //   if (overnightData) {
      //     this.isOvernightSelected = true;
      //     this.formParams.reservationStartTime = overnightData.start;
      //     this.formParams.reservationEndTime = moment(overnightData.end)
      //       .subtract(1, "h")
      //       .format("YYYY-MM-DD HH:mm:ss");
      //   } else {
      //     this.isOvernightSelected = false;
      //     this.formParams.reservationStartTime = null;
      //     this.formParams.reservationEndTime = null;
      //   }
      // },
      // prettyTimes组件：包夜提交事件处理
      // handleOvernightSubmit(overnightData) {
      //   if (overnightData) {
      //     this.formParams.reservationStartTime = overnightData.start;
      //     this.formParams.reservationEndTime = overnightData.end;
      //     this.submitReservation();
      //   }
    },
    // =============== prettyTimes组件方法结束 ===============
  },
};
</script>
