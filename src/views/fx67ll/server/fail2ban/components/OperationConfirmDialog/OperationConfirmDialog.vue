<template>
    <el-dialog title="操作安全确认" :visible.sync="dialogVisible" width="480px" :close-on-click-modal="false"
        :style="`top: ${['ban', 'unban', 'ban-batch', 'unban-batch'].includes(confirmInfo.type) && confirmInfo.jailName ? 423 : getDialogVerticalOffset(getConfirmTypeHeight())}`"
        append-to-body>
        <div class="confirm-content">
            <div class="confirm-warning">
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
                    <span style="color: #e6a23c; font-weight: 500;">所有运行中监狱的全部封禁IP</span>
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
                        <el-option v-for="jail in jailList" :key="jail.name" :label="jail.name" :value="jail.name" />
                    </el-select>
                </el-form-item>
            </el-form>
        </div>
        <span slot="footer" class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="confirmLoading" :disabled="needSelectJail && !confirmInfo.jailName"
                @click="handleExecute">
                确认执行
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
            default: () => ({ type: 'ban', ip: '', jailName: '', ips: [] })
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
            this.$emit('execute');
        },

        /**
         * 获取确认弹窗操作类型文本
         */
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
                'unban-batch': 'success',
                'unban-all-jail': 'warning',
                'unban-all': 'warning',
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
                'ban-batch': 480,
                'unban-batch': 480,
                'unban-all-jail': 380,
                'unban-all': 360,
                'startService': 350,
                'stopService': 350,
                'startJail': 350,
                'stopJail': 350
            };
            return typeMap[this.confirmInfo.type] || 350;
        }
    }
};
</script>

<style scoped>
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
