<template>
    <el-dialog title="二次安全确认" :visible.sync="dialogVisible" width="500px" :close-on-click-modal="false"
        :style="`top: ${getDialogVerticalOffset(424)}`" append-to-body @open="handleDialogOpen" @close="handleCancel">
        <div class="confirm-content">

            <!-- 极度危险操作警告横幅（与第一个组件视觉1:1对齐） -->
            <div class="extreme-danger-banner">
                <div class="danger-banner-icon">
                    <i class="el-icon-warning"></i>
                </div>
                <div class="danger-banner-body">
                    <div class="danger-banner-title">极度危险操作 · 最终确认</div>
                    <div class="danger-banner-desc">操作不可逆且立即生效，请完成下方验证后谨慎执行</div>
                </div>
            </div>

            <!-- 验证说明 -->
            <div class="verify-desc">
                为防止误操作，请在下方输入框中输入
                <span class="confirm-keyword">确认执行</span>
                完成安全验证。
            </div>

            <!-- 输入验证区（与第一个组件表单风格统一） -->
            <div class="verify-input-wrap">
                <el-form size="small">
                    <el-form-item label="安全验证" required style="margin-bottom: 0;">
                        <el-input v-model="inputValue" placeholder="请输入：确认执行"
                            :class="['verify-input', inputError ? 'is-error' : '']" @input="inputError = false"
                            @keyup.enter.native="handleConfirm" ref="confirmInput" clearable />
                    </el-form-item>
                </el-form>
                <div v-if="inputError" class="input-error-tip">
                    <i class="el-icon-close-circle"></i>
                    输入内容不匹配，请输入"确认执行"
                </div>
            </div>

            <!-- 安全提示（复用第一个组件白名单提示样式） -->
            <div class="whitelist-tip">
                <i class="el-icon-info" style="color: #409eff; margin-right: 5px;"></i>
                系统将全程记录本次操作日志，包含操作人、操作时间与访问IP
            </div>
        </div>

        <span slot="footer" class="dialog-footer">
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="danger" :loading="loading" :disabled="inputValue.trim() !== '确认执行'" @click="handleConfirm">
                确认执行
            </el-button>
        </span>
    </el-dialog>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
    name: "DangerConfirmDialog",
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            inputValue: '',
            inputError: false
        };
    },
    computed: {
        dialogVisible: {
            get() {
                return this.visible;
            },
            set(val) {
                this.$emit('update:visible', val);
            }
        }
    },
    watch: {
        visible(val) {
            if (val) {
                this.inputValue = '';
                this.inputError = false;
            }
        }
    },
    methods: {
        /**
         * 代理工具函数
         */
        getDialogVerticalOffset(offset) {
            return getDialogVerticalOffset(offset);
        },

        handleDialogOpen() {
            this.$nextTick(() => {
                if (this.$refs.confirmInput) {
                    this.$refs.confirmInput.focus();
                }
            });
        },

        handleConfirm() {
            if (this.inputValue.trim() !== '确认执行') {
                this.inputError = true;
                return;
            }
            this.$emit('confirm');
        },

        handleCancel() {
            this.dialogVisible = false;
            this.inputValue = '';
            this.inputError = false;
        }
    }
};
</script>

<style scoped>
/* ==================== 极度危险操作横幅（与第一个组件完全复用） ==================== */
.extreme-danger-banner {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    background: linear-gradient(135deg, #fff1f0 0%, #ffe4e4 100%);
    border: 1px solid #ffb3b3;
    border-left: 4px solid #f56c6c;
    border-radius: 6px;
}

.danger-banner-icon {
    flex-shrink: 0;
    color: #f56c6c;
    font-size: 22px;
    line-height: 1;
    margin-top: 1px;
}

.danger-banner-body {
    flex: 1;
}

.danger-banner-title {
    font-size: 14px;
    font-weight: 700;
    color: #c0392b;
    letter-spacing: 0.5px;
}

.danger-banner-desc {
    font-size: 12px;
    color: #e74c3c;
    margin-top: 4px;
    line-height: 1.5;
}

/* ==================== 验证说明 ==================== */
.verify-desc {
    margin-top: 18px;
    font-size: 13px;
    color: #606266;
    line-height: 1.6;
}

.confirm-keyword {
    display: inline-block;
    font-weight: 700;
    color: #f56c6c;
    background-color: #fff1f0;
    border: 1px solid #ffb3b3;
    border-radius: 3px;
    padding: 0 6px;
    font-size: 12px;
}

/* ==================== 输入验证区 ==================== */
.verify-input-wrap {
    margin-top: 15px;
}

.input-error-tip {
    margin-top: 6px;
    font-size: 12px;
    color: #f56c6c;
    display: flex;
    align-items: center;
    gap: 4px;
}

::v-deep .verify-input.is-error .el-input__inner {
    border-color: #f56c6c;
    background-color: #fff5f5;
}

/* ==================== 安全提示（与第一个组件白名单提示完全一致） ==================== */
.whitelist-tip {
    margin-top: 15px;
    padding: 10px 12px;
    background-color: #ecf5ff;
    border-radius: 4px;
    font-size: 12px;
    color: #409eff;
    line-height: 1.6;
}
</style>
