<template>
    <el-dialog title="操作安全确认" :visible.sync="dialogVisible" width="500px" :close-on-click-modal="false"
        :style="`top: ${['ban', 'unban'].includes(confirmInfo.type) && confirmInfo.jailName ? 423 : getDialogVerticalOffset(getConfirmTypeHeight())}`"
        append-to-body @open="handleDialogOpen" @close="handleDialogClose">
        <div class="confirm-content">

            <!-- 极度危险操作警告横幅（仅限一键解封类操作） -->
            <div v-if="isDangerousOp" class="extreme-danger-banner">
                <div class="danger-banner-icon">
                    <i class="el-icon-warning"></i>
                </div>
                <div class="danger-banner-body">
                    <div class="danger-banner-title">极度危险操作，请再三确认</div>
                    <div class="danger-banner-desc">{{ dangerBannerDesc }}</div>
                </div>
            </div>

            <!-- 普通提示（非危险操作） -->
            <div v-else class="confirm-warning">
                <i class="el-icon-warning" style="color: #e6a23c; font-size: 20px; margin-right: 8px;"></i>
                <span>请核对以下操作信息，执行后立即生效</span>
            </div>

            <el-descriptions :column="1" border size="small" style="margin-top: 15px;">
                <el-descriptions-item label="操作类型">
                    <el-tag :type="getConfirmTypeTag()" size="small">
                        {{ getConfirmTypeText() }}
                    </el-tag>
                </el-descriptions-item>

                <!-- 单IP操作：展示目标IP -->
                <el-descriptions-item v-if="confirmInfo.ip && ['ban', 'unban'].includes(confirmInfo.type)"
                    label="目标IP地址">
                    <span style="font-family: Consolas; font-weight: bold; font-size: 14px;">{{ confirmInfo.ip }}</span>
                </el-descriptions-item>

                <!-- 批量操作：展示IP数量 -->
                <el-descriptions-item v-if="confirmInfo.ips && confirmInfo.ips.length > 0" label="操作IP数量">
                    <span style="font-family: Consolas; font-weight: bold; font-size: 14px; color: #f56c6c;">
                        {{ confirmInfo.ips.length }} 个
                    </span>
                </el-descriptions-item>

                <!-- 全局一键解封：展示操作范围 -->
                <el-descriptions-item v-if="confirmInfo.type === 'unban-all'" label="操作范围">
                    <span style="color: #f56c6c; font-weight: 600;">所有运行中监狱的全部封禁IP</span>
                </el-descriptions-item>

                <!-- 目标监狱：需要监狱的操作展示 -->
                <el-descriptions-item v-if="confirmInfo.jailName" label="目标监狱">
                    {{ confirmInfo.jailName }}
                </el-descriptions-item>
            </el-descriptions>

            <div class="whitelist-tip">
                <i class="el-icon-info" style="color: #409eff; margin-right: 5px;"></i>
                安全机制：本操作仅系统配置的白名单IP可执行，非授权IP将被拒绝并记录操作日志。
                若执行失败，请确认当前访问IP已加入系统白名单。
            </div>

            <!-- 需要选择监狱的场景：单IP操作/批量操作/单监狱全解封，且未传入监狱名 -->
            <el-form v-if="needSelectJail && !confirmInfo.jailName" style="margin-top: 15px;" size="small">
                <el-form-item label="选择监狱" required style="margin-bottom: 0;">
                    <el-select :value="confirmInfo.jailName" placeholder="请选择要操作的监狱" style="width: 100%;"
                        @change="handleJailNameChange">
                        <el-option v-for="jail in selectableJailList" :key="jail.name" :label="jail.name"
                            :value="jail.name" />
                    </el-select>
                </el-form-item>
            </el-form>

            <!-- 危险操作：倒计时提示 -->
            <div v-if="isDangerousOp && countdown > 0" class="countdown-tip">
                <i class="el-icon-time"></i>
                请仔细阅读以上信息，<span class="countdown-num">{{ countdown }}</span> 秒后方可执行
            </div>
            <div v-if="isDangerousOp && countdown === 0" class="countdown-ready">
                <i class="el-icon-circle-check"></i>
                倒计时结束，请再次核对后点击确认执行
            </div>
        </div>

        <span slot="footer" class="dialog-footer">
            <el-button @click="handleClose">取消</el-button>
            <el-button :type="isDangerousOp ? 'danger' : 'primary'" :loading="confirmLoading"
                :disabled="isConfirmDisabled" @click="handleExecute">
                <span v-if="isDangerousOp && countdown > 0">确认执行（{{ countdown }}s）</span>
                <span v-else>确认执行</span>
            </el-button>
        </span>
    </el-dialog>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
    name: "OperationConfirmDialog",
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        confirmInfo: {
            type: Object,
            default: () => ({ type: 'ban', ip: '', jailName: '', ips: [], jailOptions: null })
        },
        jailList: {
            type: Array,
            default: () => []
        },
        confirmLoading: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            countdown: 10,
            countdownTimer: null
        };
    },
    beforeDestroy() {
        this.stopCountdown();
    },
    computed: {
        dialogVisible: {
            get() {
                return this.visible;
            },
            set(val) {
                this.$emit('update:visible', val);
            }
        },
        /**
         * 是否需要选择监狱
         * 全局一键解封不需要监狱，其余操作均需指定目标监狱
         */
        needSelectJail() {
            const noJailTypes = ['unban-all', 'startService', 'stopService'];
            return !noJailTypes.includes(this.confirmInfo.type);
        },
        /**
         * 监狱选择下拉的可选列表
         * 多监狱共享批量操作时，confirmInfo.jailOptions 限定为共享监狱候选集（字符串数组）
         * 其余场景回退到全部监狱 jailList
         */
        selectableJailList() {
            const opts = this.confirmInfo && this.confirmInfo.jailOptions;
            if (Array.isArray(opts) && opts.length > 0) {
                return opts.map(name => ({ name }));
            }
            return this.jailList;
        },
        isDangerousOp() {
            // 停止类操作（停止服务/停止监狱）与批量封禁解封一样走二次确认流程，启动类操作不需要
            return ['unban-all', 'unban-all-jail', 'unban-batch', 'ban-batch', 'stopService', 'stopJail'].includes(this.confirmInfo.type);
        },
        /**
         * 危险操作横幅的描述文案，根据操作类型动态展示
         */
        dangerBannerDesc() {
            const type = this.confirmInfo.type;
            if (type === 'ban-batch') {
                return '此操作将立即批量封禁IP，请确认后谨慎执行';
            }
            if (type === 'stopService') {
                return '此操作将停止Fail2ban防护服务，停止后所有封禁规则将立即失效，请确认后谨慎执行';
            }
            if (type === 'stopJail') {
                return '此操作将停止该监狱的防护，停止后对应规则将不再生效，请确认后谨慎执行';
            }
            return '此操作将立即解封IP，不可撤销，请确认后谨慎执行';
        },
        isConfirmDisabled() {
            if (this.needSelectJail && !this.confirmInfo.jailName) return true;
            if (this.isDangerousOp && this.countdown > 0) return true;
            return false;
        }
    },
    methods: {
        /**
         * 代理工具函数
         */
        getDialogVerticalOffset(offset) {
            return getDialogVerticalOffset(offset);
        },

        /**
         * 弹窗内监狱选择变更
         * @param {String} val 选中的监狱名称
         */
        handleJailNameChange(val) {
            this.$emit('update:jail-name', val);
        },

        /**
         * 点击确认执行
         */
        handleExecute() {
            if (this.isDangerousOp) {
                // 危险操作走二次确认流程
                this.$emit('need-secondary-confirm');
            } else {
                this.$emit('execute');
            }
        },

        handleClose() {
            this.dialogVisible = false;
        },

        handleDialogOpen() {
            if (this.isDangerousOp) {
                this.startCountdown();
            }
        },

        handleDialogClose() {
            this.stopCountdown();
        },

        startCountdown() {
            this.countdown = 10;
            this.stopCountdown();
            this.countdownTimer = setInterval(() => {
                if (this.countdown > 0) {
                    this.countdown--;
                } else {
                    this.stopCountdown();
                }
            }, 1000);
        },

        stopCountdown() {
            if (this.countdownTimer) {
                clearInterval(this.countdownTimer);
                this.countdownTimer = null;
            }
        },

        getConfirmTypeText() {
            const typeMap = {
                'ban': '封禁IP',
                'unban': '解封IP',
                'ban-batch': '批量封禁IP',
                'unban-batch': '批量解封IP',
                'unban-all-jail': '一键清空监狱封禁IP',
                'unban-all': '全局一键解封所有IP',
                'startService': '启动Fail2ban服务',
                'stopService': '停止Fail2ban服务',
                'startJail': '启动监狱',
                'stopJail': '停止监狱'
            };
            return typeMap[this.confirmInfo.type] || '未知操作';
        },

        /**
         * 获取确认弹窗操作类型标签颜色
         */
        getConfirmTypeTag() {
            const typeMap = {
                'ban': 'danger',
                'unban': 'success',
                'ban-batch': 'danger',
                'unban-batch': 'danger',
                'unban-all-jail': 'danger',
                'unban-all': 'danger',
                'startService': 'success',
                'stopService': 'warning',
                'startJail': 'success',
                'stopJail': 'warning'
            };
            return typeMap[this.confirmInfo.type] || 'info';
        },

        /**
         * 获取确认弹窗的高度用于弹窗居中偏移
         */
        getConfirmTypeHeight() {
            const typeMap = {
                'ban': 467,
                'unban': 467,
                'ban-batch': 510,
                'unban-batch': 510,
                'unban-all-jail': 470,
                'unban-all': 470,
                'startService': 350,
                'stopService': 440,
                'startJail': 350,
                'stopJail': 470
            };
            return typeMap[this.confirmInfo.type] || 350;
        }
    }
};
</script>

<style scoped>
/* ==================== 极度危险操作横幅 ==================== */
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

/* ==================== 倒计时提示 ==================== */
.countdown-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
    padding: 10px 14px;
    background-color: #fff8e1;
    border: 1px solid #ffe082;
    border-radius: 5px;
    font-size: 13px;
    color: #8a6200;
}

.countdown-num {
    display: inline-block;
    font-size: 18px;
    font-weight: 700;
    color: #e6a23c;
    min-width: 22px;
    text-align: center;
}

.countdown-ready {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
    padding: 10px 14px;
    background-color: #f0f9eb;
    border: 1px solid #c2e7b0;
    border-radius: 5px;
    font-size: 13px;
    color: #389e0d;
}

/* ==================== 确认弹窗样式 ==================== */
.confirm-warning {
    display: flex;
    align-items: center;
    font-size: 15px;
    font-weight: 500;
    color: #e6a23c;
    padding: 10px 15px;
    background-color: #fdf6ec;
    border-radius: 4px;
}

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
