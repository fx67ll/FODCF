<template>
  <!-- 数值模拟记录本轮结果弹窗 -->
  <el-dialog title="记录本轮结果" :visible.sync="dialogVisible" :close-on-click-modal="false" width="480px"
    :style="`top: ${getDialogVerticalOffset(420)}`" append-to-body @open="handleDialogOpen">
    <el-form ref="simRecordForm" :model="simRecordForm" :rules="simRecordRules" label-width="110px">
      <el-form-item label="本轮结果">
        <span :style="{ color: isHit === 'Y' ? '#2ecc71' : '#ff5a5f' }">{{
          isHit === "Y" ? "达成" : "未达成" }}</span>
      </el-form-item>
      <el-form-item label="本轮开始数值">
        <span>{{ formatSimNumber(nextStartValue) }}</span>
      </el-form-item>
      <el-form-item label="本轮参与数值">
        <span>{{ formatSimNumber(joinValue) }}</span>
      </el-form-item>
      <el-form-item label="实际回收数值" prop="returnValue">
        <el-input-number v-model="simRecordForm.returnValue" :controls="false" :precision="2" :min="0"
          style="width: 200px" placeholder="请输入实际回收数值" />
        <span class="sim-record-tip">默认按系数计算，可按实际数值修改，支持部分回本</span>
      </el-form-item>
      <el-form-item label="本轮结束数值">
        <span class="sim-record-end-value">{{ formatSimNumber(endValue) }}</span>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" :loading="submitting" @click="submitSimRound">确 定</el-button>
      <el-button @click="cancelSimRecord">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
  name: "SimRecordDialog",
  props: {
    // 弹窗开关
    visible: {
      type: Boolean,
      default: false,
    },
    // 本轮是否达成（Y是 N否）
    isHit: {
      type: String,
      default: "Y",
    },
    // 模拟模式（full全量滚动 half半量滚动）
    simMode: {
      type: String,
      default: "full",
    },
    // 本轮使用系数
    coefficient: {
      type: Number,
      default: 2,
    },
    // 本轮开始数值
    nextStartValue: {
      type: Number,
      default: 0,
    },
    // 保存中状态
    submitting: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // 本轮结果表单（实际回收数值支持部分回本）
      simRecordForm: {
        returnValue: 0,
      },
      // 本轮结果表单校验
      simRecordRules: {
        returnValue: [
          {
            required: true,
            message: "实际回收数值不能为空",
            trigger: "blur",
          },
        ],
      },
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
    // 本轮参与数值（半量滚动为开始数值的一半）
    joinValue() {
      return this.simMode === "half"
        ? parseFloat((this.nextStartValue / 2).toFixed(2))
        : this.nextStartValue;
    },
    // 本轮结束数值（半量滚动保留另一半，全量滚动即实际回收数值）
    endValue() {
      const keepValue = this.simMode === "half" ? this.nextStartValue / 2 : 0;
      return parseFloat(
        (keepValue + parseFloat(this.simRecordForm.returnValue || 0)).toFixed(2)
      );
    },
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    // 弹窗打开时按系数预填实际回收数值，可按实际数值修改
    handleDialogOpen() {
      this.simRecordForm.returnValue =
        this.isHit === "Y"
          ? parseFloat(
              (
                this.joinValue * parseFloat(this.coefficient || 0)
              ).toFixed(2)
            )
          : 0;
      this.$nextTick(() => {
        this.$refs["simRecordForm"] && this.$refs["simRecordForm"].clearValidate();
      });
    },
    // 确认提交，交由父组件保存
    submitSimRound() {
      this.$refs["simRecordForm"].validate((valid) => {
        if (!valid) {
          return;
        }
        this.$emit("confirm", {
          isHit: this.isHit,
          returnValue: this.simRecordForm.returnValue,
          joinValue: this.joinValue,
          endValue: this.endValue,
        });
      });
    },
    // 取消记录本轮结果
    cancelSimRecord() {
      this.dialogVisible = false;
    },
    // 数值模拟金额格式化，保留两位小数
    formatSimNumber(value) {
      return parseFloat(value || 0).toFixed(2);
    },
  },
};
</script>

<style lang="scss" scoped>
.sim-record-tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.sim-record-end-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
</style>
