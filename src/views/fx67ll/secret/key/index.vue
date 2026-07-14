<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="秘钥键" prop="secretKey">
        <el-input v-model="queryParams.secretKey" placeholder="请输入秘钥键" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">
          搜索
        </el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['secret:key:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['secret:key:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['secret:key:remove']">删除</el-button>
      </el-col>
      <!-- <el-col :span="1.5" style="margin-bottom: 10px;">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['secret:key:export']">导出</el-button>
      </el-col> -->
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="keyList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" :selectable="(record) => {
        return record.secretKey !== 'cryptoSaltKey';
      }
        " />
      <!-- <el-table-column label="秘钥主键" align="center" prop="secretId" /> -->
      <el-table-column label="秘钥键" align="center" prop="secretKey" width="120" />
      <el-table-column label="秘钥值" align="center" prop="secretValueEncrypt">
        <template slot-scope="scope">
          <!-- cryptoSaltKey：遮挡展示，悬浮 tooltip 显示明文（吉祥物密钥，非安全用途） -->
          <el-tooltip v-if="scope.row.secretKey === 'cryptoSaltKey'" effect="dark" :content="scope.row.secretValue"
            placement="bottom">
            <span>{{ scope.row.secretValueEncrypt }}</span>
          </el-tooltip>
          <!-- 其他键：直接展示遮挡串，无 tooltip -->
          <span v-else>{{ scope.row.secretValueEncrypt }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="140">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-lock" v-if="scope.row.secretKey === 'cryptoSaltKey'"
            disabled>禁止操作</el-button>
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['secret:key:edit']" v-if="scope.row.secretKey !== 'cryptoSaltKey'">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['secret:key:remove']" v-if="scope.row.secretKey !== 'cryptoSaltKey'">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改秘钥配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="500px"
      :style="`top: ${getDialogVerticalOffset(376)}`" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="秘钥键" prop="secretKey">
          <el-input v-model="form.secretKey" placeholder="请输入秘钥键" />
        </el-form-item>
        <el-form-item label="秘钥值" prop="secretValue">
          <el-input v-model="form.secretValue" type="textarea" :rows="5" :maxlength="1023" show-word-limit
            placeholder="请输入秘钥值" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 查看明文第一次确认（倒计时+风险说明） -->
    <view-secret-confirm-dialog :visible.sync="viewConfirmVisible" :confirmInfo="viewConfirmInfo" scene="view"
      @need-secondary-confirm="handleViewNeedSecondary" />
    <!-- 查看明文第二次确认（手动输入"确认查看"） -->
    <secret-danger-confirm-dialog :visible.sync="viewDangerVisible" scene="view" @confirm="handleConfirmView" />

    <!-- 提交修改第一次确认（倒计时+风险说明） -->
    <view-secret-confirm-dialog :visible.sync="submitConfirmVisible" :confirmInfo="submitConfirmInfo" scene="submit"
      @need-secondary-confirm="handleSubmitNeedSecondary" />
    <!-- 提交修改第二次确认（手动输入"确认提交"） -->
    <secret-danger-confirm-dialog :visible.sync="submitDangerVisible" scene="submit" @confirm="handleConfirmSubmit" />
  </div>
</template>

<script>
import { listKey, getKey, delKey, addKey, updateKey, getTransferKey } from "@/api/fx67ll/secret/key";

import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";
import { transferEncrypt, transferDecrypt } from "@/utils/fx67ll/transferCrypto";
import { maskEncrypt } from "@/utils/fx67ll/maskCrypto";
import ViewSecretConfirmDialog from "./components/ViewSecretConfirmDialog.vue";
import SecretDangerConfirmDialog from "./components/SecretDangerConfirmDialog.vue";

export default {
  name: "Key",
  components: { ViewSecretConfirmDialog, SecretDangerConfirmDialog },
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
        secretKey: [
          { required: true, message: "秘钥键不能为空", trigger: "blur" },
        ],
        secretValue: [
          { required: true, message: "秘钥值不能为空", trigger: "blur" },
        ],
      },
      // 传输密钥（阶段四·4.17，管理端查看/修改时签发，5分钟短时效）
      transferKey: null,
      // 遮挡密钥（吉祥物，前端持有，仅列表展示遮挡用，非安全用途）
      cryptoSaltKey: null,
      // 查看明文二次确认弹窗
      viewConfirmVisible: false,
      viewConfirmInfo: { secretKey: "" },
      // 待查看的行（确认通过后走解密流程）
      pendingViewRow: null,
      // 提交修改二次确认弹窗
      submitConfirmVisible: false,
      submitConfirmInfo: { secretKey: "" },
      // 查看明文二次确认（手动输入）
      viewDangerVisible: false,
      // 提交修改二次确认（手动输入）
      submitDangerVisible: false,
    };
  },
  created() {
    this.qryCryptoSaltKey();
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    // 获取遮挡密钥 cryptoSaltKey（吉祥物，仅列表展示遮挡用，非安全用途）
    // 后端 list 对 cryptoSaltKey 那条返回明文，其他返回数据库密文
    qryCryptoSaltKey() {
      listKey({ secretKey: "cryptoSaltKey" }).then((res) => {
        if (res && res?.rows && res?.rows.length > 0) {
          this.cryptoSaltKey = res.rows[0].secretValue;
          this.getList();
        }
      });
    },
    // 列表展示遮挡：用 cryptoSaltKey 对 secret_value 再加密一层（纯遮挡源数据，非安全）
    encryptSecretKeyList(datalist) {
      const formatList = [];
      datalist.forEach((item) => {
        formatList.push({
          ...item,
          secretValueEncrypt: maskEncrypt(item?.secretValue, this.cryptoSaltKey),
        });
      });
      return formatList;
    },
    /** 查询秘钥配置列表（后端返回数据库密文，前端用 cryptoSaltKey 遮挡加密后展示） */
    getList() {
      this.loading = true;
      listKey(this.queryParams).then((response) => {
        this.keyList = this.encryptSecretKeyList(response.rows);
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
    /** 修改按钮操作：先弹二次确认，确认后才走解密流程加载明文（避免误触暴露明文） */
    handleUpdate(row) {
      // 顶部工具栏点击时不传 row，从选中行取
      if (!row) {
        const selected = this.keyList.filter((item) => this.ids.includes(item.secretId));
        row = selected.length > 0 ? selected[0] : null;
      }
      if (!row) {
        this.$modal.msgWarning("请先选择要修改的记录");
        return;
      }
      this.pendingViewRow = row;
      this.viewConfirmInfo = { secretKey: row.secretKey };
      this.viewConfirmVisible = true;
    },
    /** 查看第一次确认通过 → 弹二次确认（手动输入） */
    handleViewNeedSecondary() {
      this.viewDangerVisible = true;
    },
    /** 查看二次确认通过 → 签 transferKey，再 getKey 拿密文，前端 transferKey 解密回明文填表 */
    handleConfirmView() {
      this.viewDangerVisible = false;
      const row = this.pendingViewRow;
      this.pendingViewRow = null;
      if (!row) {
        return;
      }
      this.reset();
      const secretId = row.secretId || this.ids;
      // 先签发 transferKey（5分钟短时效），再拉详情密文
      getTransferKey().then((tkRes) => {
        const transferKey = tkRes?.transferKey;
        if (!transferKey) {
          this.$modal.msgError("签发传输密钥失败，请重试");
          return;
        }
        this.transferKey = transferKey;
        getKey(secretId).then((response) => {
          this.form = response?.data;
          // cryptoSaltKey 不加密，明文展示；其他用 transferKey 解密
          if (response?.data?.secretKey !== "cryptoSaltKey" && response?.data?.secretValue) {
            this.form.secretValue = transferDecrypt(
              response?.data?.secretValue,
              transferKey
            );
          }
          this.open = true;
          this.title = "修改秘钥配置";
        });
      });
    },
    /** 提交按钮：表单校验通过后，修改走二次确认，新增直接提交 */
    submitForm() {
      this.$refs["form"].validate((valid) => {
        if (valid) {
          if (this.form.secretId != null) {
            // 修改：敏感操作走两步确认
            this.submitConfirmInfo = { secretKey: this.form.secretKey };
            this.submitConfirmVisible = true;
          } else {
            // 新增：直接提交
            this.doSubmit();
          }
        }
      });
    },
    /** 提交第一次确认通过 → 弹二次确认（手动输入） */
    handleSubmitNeedSecondary() {
      this.submitDangerVisible = true;
    },
    /** 提交二次确认通过后执行提交（仅修改走此路径） */
    handleConfirmSubmit() {
      this.submitDangerVisible = false;
      this.doSubmit();
    },
    /**
     * 实际提交：secret_value 用 transferKey 加密后提交，后端解密入库；cryptoSaltKey 明文提交。
     * 用临时副本提交，不改 form.secretValue，避免界面短暂显示密文。
     */
    doSubmit() {
      // 构造提交副本，cryptoSaltKey 明文，其他用 transferKey 加密
      const buildPayload = () => {
        const payload = { ...this.form };
        if (payload.secretKey !== "cryptoSaltKey" && this.transferKey) {
          payload.secretValue = transferEncrypt(payload.secretValue, this.transferKey);
        }
        return payload;
      };
      if (this.form.secretId != null) {
        // 修改（transferKey 在查看时已签发）
        if (this.form.secretKey !== "cryptoSaltKey" && !this.transferKey) {
          this.$modal.msgError("传输密钥已过期，请重新点击修改查看明文后再提交");
          return;
        }
        updateKey(buildPayload()).then((response) => {
          this.$modal.msgSuccess("修改成功");
          this.open = false;
          this.getList();
        });
      } else {
        // 新增：需先签 transferKey（若已有复用，否则签发）
        const doAdd = () => {
          addKey(buildPayload()).then((response) => {
            this.$modal.msgSuccess("新增成功");
            this.open = false;
            this.getList();
          });
        };
        if (this.form.secretKey !== "cryptoSaltKey" && !this.transferKey) {
          getTransferKey().then((tkRes) => {
            this.transferKey = tkRes?.transferKey;
            doAdd();
          });
        } else {
          doAdd();
        }
      }
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
        .catch(() => { });
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
