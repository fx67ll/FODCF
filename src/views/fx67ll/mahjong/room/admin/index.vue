<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryForm"
      size="small"
      :inline="true"
      v-show="showSearch"
      label-width="68px"
      label-position="right"
    >
      <el-form-item label="管理员" prop="userName" style="margin-left: -10px">
        <el-input
          v-model="queryParams.userName"
          placeholder="请输入管理员名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item
        label="麻将室"
        prop="mahjongRoomName"
        style="margin-left: 5px"
      >
        <el-input
          v-model="queryParams.mahjongRoomName"
          placeholder="请输入麻将室名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item
        label="状态"
        prop="mahjongRoomStatus"
        style="margin-left: -10px"
      >
        <el-select
          v-model="queryParams.mahjongRoomStatus"
          placeholder="请选择麻将室状态"
          clearable
        >
          <el-option
            v-for="dict in dict.type.sys_normal_disable"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" style="margin-left: 20px">
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
      <el-form-item label="更新时间" style="margin-left: 2px">
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
      <el-form-item style="margin-left: 20px">
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
          v-hasPermi="['mahjong:room:add']"
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
          v-hasPermi="['mahjong:room:edit']"
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
          v-hasPermi="['mahjong:room:remove']"
          >删除</el-button
        >
      </el-col>
      <!-- <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['mahjong:room:export']"
          >导出</el-button
        >
      </el-col> -->
      <right-toolbar
        :showSearch.sync="showSearch"
        @queryTable="getList"
      ></right-toolbar>
    </el-row>

    <el-table
      v-loading="loading"
      :data="roomList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="管理员" align="center" prop="userName" />
      <el-table-column
        label="麻将室名称"
        align="center"
        prop="mahjongRoomName"
      />
      <el-table-column
        label="对外描述"
        align="center"
        prop="mahjongRoomDescription"
      />
      <el-table-column
        label="容纳人数"
        align="center"
        prop="mahjongRoomCapacity"
      />
      <el-table-column
        label="计费配置"
        align="center"
        prop="mahjongRoomPriceConfig"
      />
      <el-table-column
        label="麻将室状态"
        align="center"
        prop="mahjongRoomStatus"
        width="100"
      >
        <template slot-scope="scope">
          <dict-tag
            :options="dict.type.sys_normal_disable"
            :value="scope.row.mahjongRoomStatus"
          />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="mahjongRoomRemark" />
      <el-table-column
        label="记录创建者"
        align="center"
        prop="createBy"
        width="100"
      />
      <el-table-column
        label="记录创建时间"
        align="center"
        prop="createTime"
        width="160"
      >
        <template slot-scope="scope">
          <span
            >{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}
          </span>
        </template>
      </el-table-column>
      <el-table-column
        label="记录更新者"
        align="center"
        prop="updateBy"
        width="100"
      />
      <el-table-column
        label="记录更新时间"
        align="center"
        prop="updateTime"
        width="160"
      >
        <template slot-scope="scope">
          <span>{{
            parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}")
          }}</span>
        </template>
      </el-table-column>
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
            v-hasPermi="['mahjong:room:edit']"
            >修改</el-button
          >
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['mahjong:room:remove']"
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

    <!-- 添加或修改麻将室对话框 -->
    <el-dialog
      :title="title"
      :visible.sync="open"
      :close-on-click-modal="false"
      width="800px"
      append-to-body
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="form.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="名称" prop="mahjongRoomName">
          <el-input
            v-model="form.mahjongRoomName"
            placeholder="请输入麻将室名称"
          />
        </el-form-item>
        <el-form-item label="对外描述" prop="mahjongRoomDescription">
          <editor v-model="form.mahjongRoomDescription" :min-height="192" />
        </el-form-item>
        <el-form-item label="容纳人数" prop="mahjongRoomCapacity">
          <el-input
            v-model="form.mahjongRoomCapacity"
            placeholder="请输入容纳人数"
          />
        </el-form-item>
        <!-- 预留：计费配置（未来存储分时段/包夜规则等JSON数据） -->
        <!-- <el-form-item label="计费配置" prop="mahjongRoomPriceConfig">
          <editor v-model="form.mahjongRoomPriceConfig" :min-height="192" />
        </el-form-item> -->
        <el-form-item label="状态" prop="mahjongRoomStatus">
          <el-select
            v-model="form.mahjongRoomStatus"
            placeholder="请选择麻将室状态"
            clearable
          >
            <el-option
              v-for="dict in dict.type.sys_normal_disable"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="mahjongRoomRemark">
          <el-input
            v-model="form.mahjongRoomRemark"
            type="textarea"
            placeholder="请输入备注内容"
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
  listRoom,
  getRoom,
  delRoom,
  addRoom,
  updateRoom,
} from "@/api/fx67ll/mahjong/room";

export default {
  name: "mahjongRoom",
  dicts: ["sys_normal_disable"],
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
      // 麻将室表格数据
      roomList: [],
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
        userName: null,
        mahjongRoomName: null,
        mahjongRoomStatus: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        mahjongRoomName: [
          { required: true, message: "麻将室名称不能为空", trigger: "blur" },
        ],
        mahjongRoomDescription: [
          { required: true, message: "麻将室描述不能为空", trigger: "blur" },
        ],
        mahjongRoomCapacity: [
          { required: true, message: "容纳人数不能为空", trigger: "blur" },
        ],
        mahjongRoomStatus: [
          { required: true, message: "状态不能为空", trigger: "change" },
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
    /** 查询麻将室列表 */
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
      listRoom(this.queryParams).then((response) => {
        this.roomList = this.formatObjectArrayNullProperty(response.rows);
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
        mahjongRoomId: null,
        userId: null,
        mahjongRoomName: null,
        mahjongRoomDescription: null,
        mahjongRoomCapacity: null,
        // 预留：计费配置（未来存储分时段/包夜规则等JSON数据）
        // mahjongRoomPriceConfig: null,
        mahjongRoomStatus: null,
        mahjongRoomRemark: null,
        delFlag: null,
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
      this.ids = selection.map((item) => item.mahjongRoomId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加麻将室";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const mahjongRoomId = row.mahjongRoomId || this.ids;
      getRoom(mahjongRoomId).then((response) => {
        this.form = response.data;
        this.open = true;
        this.title = "修改麻将室";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate((valid) => {
        if (valid) {
          if (this.form.mahjongRoomId != null) {
            updateRoom(this.form).then((response) => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addRoom(this.form).then((response) => {
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
      const mahjongRoomIds = row.mahjongRoomId || this.ids;
      this.$modal
        .confirm('是否确认删除麻将室编号为"' + mahjongRoomIds + '"的数据项？')
        .then(function () {
          return delRoom(mahjongRoomIds);
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
    //     "mahjong/room/export",
    //     {
    //       ...this.queryParams,
    //     },
    //     `room_${new Date().getTime()}.xlsx`
    //   );
    // },
  },
};
</script>
