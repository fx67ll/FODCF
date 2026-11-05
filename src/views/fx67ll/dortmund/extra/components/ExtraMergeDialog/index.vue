<template>
  <!-- 合并外快盈亏历史记录确认对话框（展示合并结果预览，支持录入合并后新备注） -->
  <el-dialog title="合并历史数据" :visible.sync="dialogVisible" :close-on-click-modal="false" width="560px"
    :style="`top: ${getDialogVerticalOffset(500)}`" append-to-body custom-class="extra-merge-dialog"
    @open="handleDialogOpen">
    <template slot="title">
      <div class="dialog-header">
        <div class="dialog-header-icon">
          <i class="el-icon-magic-stick"></i>
        </div>
        <div class="dialog-header-text">
          <div class="dialog-header-title">合并历史数据</div>
          <div class="dialog-header-sub">所选连续记录合并为一条新记录，原数据将被删除</div>
        </div>
      </div>
    </template>
    <div class="merge-dialog-content">
      <!-- 合并结果预览面板 -->
      <div class="merge-preview">
        <div class="merge-preview-header">
          <div class="merge-preview-title">
            <i class="el-icon-data-analysis"></i>
            <span>合并结果预览</span>
          </div>
          <span class="merge-preview-count">共 {{ mergeCount }} 条</span>
        </div>
        <div class="merge-preview-body" v-if="lastMergeRow">
          <div class="merge-preview-item">
            <span class="merge-preview-label">合并后盈亏金额</span>
            <span class="merge-preview-value" :class="mergedWinMoneyClass">{{ mergedWinMoneyText }}</span>
          </div>
          <div class="merge-preview-item">
            <span class="merge-preview-label">合并后总金额</span>
            <span class="merge-preview-value">{{ lastMergeRow.extraMoney }}</span>
          </div>
          <div class="merge-preview-item">
            <span class="merge-preview-label">创建时间</span>
            <span class="merge-preview-value">{{ parseTime(lastMergeRow.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
          </div>
          <div class="merge-preview-item">
            <span class="merge-preview-label">合并后是否盈利</span>
            <span class="merge-preview-value">
              <dict-tag :options="dict.type.sys_yes_no" :value="previewIsWin" />
            </span>
          </div>
          <div class="merge-preview-item">
            <span class="merge-preview-label">当前本金</span>
            <span class="merge-preview-value">{{ lastMergeRow.seedMoney }}</span>
          </div>
          <div class="merge-preview-item">
            <span class="merge-preview-label">落袋金额</span>
            <span class="merge-preview-value">{{ lastMergeRow.saveMoney }}</span>
          </div>
          <div class="merge-preview-item">
            <span class="merge-preview-label">目标金额</span>
            <span class="merge-preview-value">{{ lastMergeRow.targetMoney }}</span>
          </div>
        </div>
        <div class="merge-preview-tip">
          盈亏金额取所选记录盈亏金额之和并按正负推导是否盈利，总金额、当前本金、落袋金额、目标金额与创建时间取所选范围内最新一条记录的原值；所选记录的方案计划关联会去重合并到新记录上
        </div>
      </div>

      <!-- 合并操作警告横幅 -->
      <div class="merge-warning-banner">
        <div class="merge-warning-icon">
          <i class="el-icon-warning"></i>
        </div>
        <div class="merge-warning-body">
          <div class="merge-warning-title">合并后原数据将被删除且无法恢复</div>
          <div class="merge-warning-desc">合并将删除所选的 {{ mergeCount }} 条原记录并生成一条新记录，请确认无误后再操作！</div>
        </div>
      </div>

      <!-- 合并后备注录入（可不填写） -->
      <el-form class="merge-remark-form" label-width="90px">
        <el-form-item label="合并后备注">
          <el-input v-model="mergeRemark" type="textarea" :rows="3" :maxlength="1023" show-word-limit
            placeholder="请输入合并后新记录的备注，不填写则不保留备注" />
        </el-form-item>
      </el-form>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取 消</el-button>
      <el-button type="warning" :loading="mergeLoading" @click="handleMergeConfirm">确 定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { mergeExtra } from "@/api/fx67ll/dortmund/extra";

import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "ExtraMergeDialog",
  dicts: ["sys_yes_no"],
  props: {
    // 弹窗开关
    visible: {
      type: Boolean,
      default: false,
    },
    // 待合并的所选行数据快照（用于展示合并结果预览）
    mergeRows: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      // 合并后新记录的备注（可不填写）
      mergeRemark: "",
      // 合并请求 loading
      mergeLoading: false,
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
    // 待合并记录条数
    mergeCount() {
      return (this.mergeRows || []).length;
    },
    // 所选记录中创建时间最新的一条（快照类数值与创建时间预览取自该条）
    lastMergeRow() {
      const rows = [...(this.mergeRows || [])].sort((a, b) =>
        (a.createTime || "").localeCompare(b.createTime || "")
      );
      return rows.length > 0 ? rows[rows.length - 1] : null;
    },
    // 合并后盈亏金额预览：所选记录盈亏金额之和
    mergedWinMoney() {
      let total = 0;
      (this.mergeRows || []).forEach((item) => {
        const winMoney = parseFloat(item.winMoney);
        if (!isNaN(winMoney)) {
          total += winMoney;
        }
      });
      return total.toFixed(2);
    },
    // 合并后盈亏金额展示文本（正数带加号，与列表展示习惯一致）
    mergedWinMoneyText() {
      return parseFloat(this.mergedWinMoney) > 0 ? "+" + this.mergedWinMoney : this.mergedWinMoney;
    },
    // 合并后盈亏金额配色（与列表盈亏金额列配色一致）
    mergedWinMoneyClass() {
      const winMoney = parseFloat(this.mergedWinMoney);
      if (winMoney > 0) {
        return "win-money-positive";
      }
      if (winMoney < 0) {
        return "win-money-negative";
      }
      return "win-money-zero";
    },
    // 合并后是否盈利预览：按合并后盈亏金额正负推导（0 按未盈利处理）
    previewIsWin() {
      return parseFloat(this.mergedWinMoney) > 0 ? "Y" : "N";
    },
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    // 弹窗打开时重置备注输入与loading状态
    handleDialogOpen() {
      this.mergeRemark = "";
      this.mergeLoading = false;
    },
    // 确认合并：调用后台事务接口完成合并，成功后关闭弹窗并通知父组件刷新列表
    handleMergeConfirm() {
      const extraIds = (this.mergeRows || []).map((item) => item.extraId);
      // 兜底校验：至少两条记录才允许发起合并
      if (!extraIds || extraIds.length < 2) {
        this.$modal.msgWarning("请至少选择两条记录进行合并！");
        return;
      }
      // 按钮 loading：合并期间防止重复提交
      this.mergeLoading = true;
      // 后台一个事务完成：合并字段 → 新建记录 → 删除旧记录，避免前端多次异步调用产生脏数据
      mergeExtra({
        extraIds: extraIds,
        extraRemark: this.mergeRemark,
      })
        .then(() => {
          this.$modal.msgSuccess("合并成功");
          this.dialogVisible = false;
          this.$emit("success");
        })
        .finally(() => {
          this.mergeLoading = false;
        });
    },
    // 取消按钮：直接关闭弹窗
    handleClose() {
      this.dialogVisible = false;
    },
  },
};
</script>

<style lang="scss" scoped>
/* 弹窗视觉语言：圆角、渐变图标（与 extra/simulate 弹窗同一风格体系） */
::v-deep .extra-merge-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 44px rgba(230, 162, 60, 0.18);
}

.dialog-header {
  display: flex;
  align-items: center;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f0f4f2;
}

.dialog-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  font-size: 20px;
  color: #fff;
  background: linear-gradient(135deg, #e6a23c 0%, #f39c12 100%);
  border-radius: 11px;
  box-shadow: 0 5px 12px rgba(230, 162, 60, 0.3);
}

.dialog-header-title {
  font-size: 16px;
  font-weight: 700;
  color: #2b3a36;
}

.dialog-header-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #7c8b84;
}

::v-deep .extra-merge-dialog .el-dialog__body {
  padding-top: 16px;
}

::v-deep .extra-merge-dialog .el-dialog__footer {
  padding: 14px 20px 18px;
  border-top: 1px solid #f0f4f2;
}

.merge-preview {
  padding: 12px 16px;
  background: linear-gradient(135deg, #fdf9f1 0%, #f8f9fb 100%);
  border: 1px solid #f0e4cf;
  border-radius: 10px;
  animation: mergePreviewFadeUp 0.3s ease 0.05s both;
}

.merge-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.merge-preview-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.merge-preview-title i {
  margin-right: 6px;
  font-size: 15px;
  color: #e6a23c;
}

.merge-preview-count {
  padding: 1px 8px;
  font-size: 12px;
  font-weight: 400;
  color: #b88230;
  background-color: #fdf6ec;
  border: 1px solid #f3d19e;
  border-radius: 10px;
}

.merge-preview-body {
  display: flex;
  flex-wrap: wrap;
}

.merge-preview-item {
  min-width: 96px;
  margin-right: 24px;
  margin-bottom: 10px;
}

.merge-preview-label {
  display: block;
  margin-bottom: 2px;
  font-size: 12px;
  color: #909399;
}

.merge-preview-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.merge-preview-tip {
  padding-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
  border-top: 1px dashed #ebeef5;
}

.win-money-positive {
  color: #2ecc71;
}

.win-money-negative {
  color: #ff5a5f;
}

.win-money-zero {
  color: #999999;
}

.merge-warning-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 14px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  border: 1px solid #f3d19e;
  border-left: 4px solid #e6a23c;
  border-radius: 6px;
  animation: mergePreviewFadeUp 0.3s ease 0.1s both;
}

.merge-warning-icon {
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 20px;
  line-height: 1;
  color: #e6a23c;
}

.merge-warning-body {
  flex: 1;
}

.merge-warning-title {
  font-size: 14px;
  font-weight: 700;
  color: #b88230;
  letter-spacing: 0.5px;
}

.merge-warning-desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #a0712a;
}

.merge-remark-form {
  margin-top: 16px;
  animation: mergePreviewFadeUp 0.3s ease 0.15s both;
}

@keyframes mergePreviewFadeUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
