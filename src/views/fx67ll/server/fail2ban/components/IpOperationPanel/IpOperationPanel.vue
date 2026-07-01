<template>
    <div class="status-card operation-card">
        <div class="status-header">
            <h2>IP防护操作台</h2>
            <el-tag size="small" type="info" effect="plain">仅白名单授权IP可执行操作</el-tag>
        </div>

        <div class="operation-panel">
            <!-- 操作类型：卡片切换 -->
            <div class="type-card-group">
                <div class="type-card ban-card" :class="{ active: operationForm.type === 'ban' }"
                    @click="operationForm.type = 'ban'">
                    <i class="el-icon-close"></i>
                    <div class="card-text">
                        <div class="card-title">封禁IP</div>
                        <div class="card-desc">加入黑名单，拒绝访问</div>
                    </div>
                </div>
                <div class="type-card unban-card" :class="{ active: operationForm.type === 'unban' }"
                    @click="operationForm.type = 'unban'">
                    <i class="el-icon-check"></i>
                    <div class="card-text">
                        <div class="card-title">解封IP</div>
                        <div class="card-desc">移出黑名单，恢复访问</div>
                    </div>
                </div>
            </div>

            <div class="input-row">
                <!-- 当前操作IP显示 -->
                <div class="current-ip-wrap">
                    <span class="ip-label">当前操作台 IP：</span>
                    <span class="ip-value">{{ currentIp }}</span>
                    <el-button type="text" icon="el-icon-document-copy" size="mini" @click="copySingleIp(currentIp)"
                        class="ip-copy-btn" :disabled="currentIp === '获取中...'">
                    </el-button>
                </div>

                <el-select v-model="operationForm.jailName" placeholder="选择目标监狱" prefix-icon="el-icon-menu"
                    style="width: 180px;">
                    <el-option v-for="jail in jailList" :key="jail.name" :label="jail.name" :value="jail.name" />
                </el-select>

                <el-input v-model="operationForm.ip" placeholder="请输入IPv4地址" prefix-icon="el-icon-monitor"
                    style="width: 260px;" clearable>
                </el-input>

                <el-button :type="operationForm.type === 'ban' ? 'danger' : 'success'" icon="el-icon-caret-right"
                    @click="submitOperation" :disabled="!canSubmitOperation" class="execute-btn-v2">
                    立即执行
                </el-button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "IpOperationPanel",
    props: {
        jailList: {
            type: Array,
            default: () => []
        },
        currentIp: {
            type: String,
            default: '获取中...'
        }
    },
    data() {
        return {
            // ==================== IP防护操作台 ====================
            operationForm: {
                type: 'ban',
                jailName: '',
                ip: ''
            }
        };
    },
    computed: {
        /**
         * 操作台提交按钮是否可用
         */
        canSubmitOperation() {
            const ipReg = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            return this.operationForm.jailName && ipReg.test(this.operationForm.ip);
        }
    },
    methods: {
        /**
         * 操作台提交操作
         */
        submitOperation() {
            this.$emit('open-confirm', this.operationForm.type, this.operationForm.ip, this.operationForm.jailName);
        },

        /**
         * 清空操作台IP输入（供父组件通过ref调用）
         */
        clearIp() {
            this.operationForm.ip = '';
        },

        /**
         * 复制单个IP到剪贴板
         * @param {String} ip IP地址
         */
        async copySingleIp(ip) {
            await this.copyToClipboard(ip);
            this.$message.success(`已复制IP: ${ip}`);
        },

        /**
         * 通用剪贴板复制方法（兼容现代Clipboard API + 旧浏览器降级）
         * @param {String} text 要复制的文本
         */
        async copyToClipboard(text) {
            try {
                // 现代浏览器优先
                await navigator.clipboard.writeText(text);
            } catch (err) {
                // 降级兼容方案
                const textarea = document.createElement("textarea");
                textarea.value = text;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }
        }
    }
};
</script>

<style scoped>
/* ==================== 全局卡片样式 ==================== */
.status-card {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin-bottom: 20px;
    position: relative;
    transition: all 0.3s ease;
}

.status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 1px solid #f5f5f5;
}

.status-header h2 {
    margin: 0;
    font-size: 18px;
    color: #1f2d3d;
}

/* ==================== IP防护操作台样式 ==================== */
.operation-card .status-header {
    margin-bottom: 18px;
}

.operation-panel {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 8px;
    padding: 20px 24px;
    border: 1px solid #e2e8f0;
}

.type-card-group {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
}

.type-card {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: #fff;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.25s ease;
}

.type-card:hover {
    border-color: #cbd5e1;
    transform: translateY(-1px);
}

.type-card i {
    font-size: 24px;
    width: 40px;
    height: 40px;
    line-height: 40px;
    text-align: center;
    border-radius: 8px;
    background: #f1f5f9;
}

.ban-card i {
    color: #f56c6c;
    background: #fef0f0;
}

.unban-card i {
    color: #67c23a;
    background: #f0f9eb;
}

.card-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2d3d;
    margin-bottom: 2px;
}

.card-desc {
    font-size: 12px;
    color: #8392a5;
}

/* 选中状态 */
.type-card.active {
    border-color: #409eff;
    background: #ecf5ff;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.ban-card.active {
    border-color: #f56c6c;
    background: #fef0f0;
    box-shadow: 0 2px 12px rgba(245, 108, 108, 0.15);
}

.unban-card.active {
    border-color: #67c23a;
    background: #f0f9eb;
    box-shadow: 0 2px 12px rgba(103, 194, 58, 0.15);
}

.input-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.execute-btn-v2 {
    padding-left: 24px;
    padding-right: 24px;
    border-radius: 4px;
}

/* 当前操作IP显示样式（简约版） */
.current-ip-wrap {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0 14px;
    height: 36px;
    background: #f5f7fa;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    font-size: 13px;
}

.ip-label {
    color: #303133;
    font-weight: 600;
}

.ip-value {
    font-family: Consolas, Monaco, monospace;
    color: #606266;
    letter-spacing: 0.3px;
}

.ip-copy-btn {
    margin-left: 2px;
    padding: 0;
    color: #909399;
    transition: color 0.2s;
}

.ip-copy-btn:hover {
    color: #409eff;
}

/* 响应式 */
@media (max-width: 1040px) {
    .type-card-group {
        flex-direction: column;
    }

    .input-row {
        flex-wrap: wrap;
    }

    .input-row .el-select,
    .input-row .el-input {
        flex: 1;
        min-width: 160px;
    }
}
</style>
