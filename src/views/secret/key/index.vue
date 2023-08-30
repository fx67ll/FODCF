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
      <el-form-item label="秘钥键" prop="secretKey">
        <el-input
          v-model="queryParams.secretKey"
          placeholder="请输入秘钥键"
          clearable
          @keyup.enter.native="handleQuery"
        />
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
          v-hasPermi="['secret:key:add']"
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
          v-hasPermi="['secret:key:edit']"
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
          v-hasPermi="['secret:key:remove']"
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
          v-hasPermi="['secret:key:export']"
          >导出</el-button
        >
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table
      v-loading="loading"
      :data="keyList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <!-- <el-table-column label="秘钥主键" align="center" prop="secretId" /> -->
      <el-table-column label="秘钥键" align="center" prop="secretKey" width="120" />
      <el-table-column label="秘钥值" align="center" prop="secretValue" />
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
        width="140"
      >
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['secret:key:edit']"
            >修改</el-button
          >
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['secret:key:remove']"
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

    <!-- 添加或修改秘钥配置对话框 -->
    <el-dialog
      :title="title"
      :visible.sync="open"
      :close-on-click-modal="false"
      width="500px"
      style="top: 150px"
      append-to-body
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="秘钥键" prop="secretKey">
          <el-input v-model="form.secretKey" placeholder="请输入秘钥键" />
        </el-form-item>
        <el-form-item label="秘钥值" prop="secretValue">
          <el-input
            v-model="form.secretValue"
            type="textarea"
            :rows="5"
            :maxlength="1023"
            show-word-limit
            placeholder="请输入秘钥值"
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
import { listKey, getKey, delKey, addKey, updateKey } from "@/api/fx67ll/secret/key";
import { encryptString, decryptString } from "@/utils/index";

export default {
  name: "Key",
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
      // 秘钥配置表格数据
      keyList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        secretKey: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        secretKey: [{ required: true, message: "秘钥键不能为空", trigger: "blur" }],
        secretValue: [{ required: true, message: "秘钥值不能为空", trigger: "blur" }],
      },
      cryptoSaltKey: null,
    };
  },
  created() {
    this.getList();
    this.getCryptoSaltKey();
  },
  methods: {
    getCryptoSaltKey() {
      listKey({ secretKey: "cryptoSaltKey" }).then((res) => {
        if (res && res?.rows && res?.rows.length > 0) {
          this.cryptoSaltKey = res.rows[0].secretValue;
        }
      });
    },
    formatListData(list) {
      const resList = [];
      list.forEach((item) => {
        resList.push({
          ...item,
          secretValue: decryptString(item?.secretValue, this.cryptoSaltKey),
          secretValueEncrypt: item?.secretValue,
        });
      });
    },
    /** 查询秘钥配置列表 */
    getList() {
      this.loading = true;
      listKey(this.queryParams).then((response) => {
        this.keyList = response.rows;
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
        secretId: null,
        secretKey: null,
        secretValue: null,
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
      this.ids = selection.map((item) => item.secretId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加秘钥配置";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const secretId = row.secretId || this.ids;
      getKey(secretId).then((response) => {
        this.form = response.data;
        this.form.secretValue = decryptString(this.form.secretValue, this.cryptoSaltKey);
        this.open = true;
        this.title = "修改秘钥配置";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate((valid) => {
        if (valid) {
          this.form.secretValue = encryptString(
            this.form.secretValue,
            this.cryptoSaltKey
          );
          if (this.form.secretId != null) {
            updateKey(this.form).then((response) => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addKey(this.form).then((response) => {
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
      const secretIds = row.secretId || this.ids;
      this.$modal
        .confirm('是否确认删除秘钥配置编号为"' + secretIds + '"的数据项？')
        .then(function () {
          return delKey(secretIds);
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
        "secret/key/export",
        {
          ...this.queryParams,
        },
        `key_${new Date().getTime()}.xlsx`
      );
    },
  },
};
</script>
