<template>
    <!-- Fail2ban服务状态卡片（始终显示，异常状态显示上锁样式） -->
    <div class="status-card" :class="{ 'locked-card': isSystemLocked }" v-loading="isLoadingStatus"
        element-loading-text="数据加载中..." element-loading-background="rgba(255, 255, 255, 0.8)">
        <!-- 上锁遮罩 -->
        <div v-if="isSystemLocked" class="lock-overlay">
            <div class="lock-icon" :class="lockIconClass">
                <i class="el-icon-lock"></i>
            </div>
            <div class="lock-text">
                <div class="lock-title">{{ serviceStatus }}</div>
                <div class="lock-desc">{{ lockMessage }}</div>
            </div>
        </div>

        <div class="status-header">
            <h2>Fail2ban 防护状态</h2>
            <div class="refresh-container">
                <el-button v-if="serviceStatus === '运行中'" type="text" icon="el-icon-video-pause"
                    @click="$emit('open-confirm', 'stopService', '')" class="startstop-btn" style="color: #f56c6c;"
                    :disabled="isSystemLocked">
                    停止服务
                </el-button>
                <el-button v-else type="text" icon="el-icon-video-play"
                    @click="$emit('open-confirm', 'startService', '')" class="startstop-btn" style="color: #67c23a;"
                    :disabled="isSystemLocked">
                    启动服务
                </el-button>
                <!-- 定时刷新设置 -->
                <el-popover placement="bottom-end" width="280" trigger="click"
                    popper-class="refresh-config-popover">
                    <div class="refresh-config">
                        <div class="config-title">
                            <i class="el-icon-time"></i>
                            定时刷新设置
                        </div>
                        <div class="config-row">
                            <span class="config-label">刷新间隔</span>
                            <el-select :value="refreshIntervalSeconds" size="small" style="width: 150px;"
                                @change="val => $emit('interval-change', val)">
                                <el-option label="10 秒" :value="10" />
                                <el-option label="30 秒（默认）" :value="30" />
                                <el-option label="1 分钟" :value="60" />
                                <el-option label="2 分钟" :value="120" />
                                <el-option label="5 分钟" :value="300" />
                                <el-option label="10 分钟" :value="600" />
                                <el-option label="关闭" :value="0" />
                            </el-select>
                        </div>
                        <div class="config-status">
                            <span v-if="refreshIntervalSeconds > 0" class="status-active">
                                <span class="status-dot active"></span>
                                每 {{ formatInterval(refreshIntervalSeconds) }} 自动刷新
                            </span>
                            <span v-else class="status-inactive">
                                <span class="status-dot inactive"></span>
                                已关闭定时刷新
                            </span>
                        </div>
                        <div class="config-desc">
                            <i class="el-icon-info"></i>
                            配置仅在当前登录会话有效，登录过期后自动恢复默认
                        </div>
                    </div>
                    <el-button slot="reference" type="text" icon="el-icon-setting" class="setting-btn"
                        :disabled="isSystemLocked">
                    </el-button>
                </el-popover>
                <el-button type="text" icon="el-icon-refresh" @click="$emit('refresh')" :loading="isRefreshing"
                    class="refresh-btn" :disabled="isSystemLocked">
                    手动刷新
                </el-button>
                <span v-if="lastRefreshTime" class="refresh-time">最后刷新: {{ lastRefreshTime }}</span>
            </div>
        </div>

        <div class="status-content">
            <div class="status-indicator">
                <div class="indicator-dot"
                    :class="serviceStatus === '运行中' ? 'running' : serviceStatus === '系统不匹配' ? 'unknown' : serviceStatus === '未安装' ? 'unknown' : 'stopped'">
                </div>
                <div class="status-text">{{ serviceStatus }}</div>
            </div>

            <div class="service-info">
                <div class="info-item">
                    <span class="info-label">版本号：</span>
                    <span class="info-value">{{ serviceInfo.version }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">运行时间：</span>
                    <span class="info-value">{{ serviceInfo.uptime }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">防火墙：</span>
                    <span class="info-value"
                        :class="serviceInfo.firewallStatus.startsWith('运行中') ? 'text-success' : 'text-danger'">
                        {{ serviceInfo.firewallStatus }}
                    </span>
                </div>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">{{ serviceInfo.totalJails }}</div>
                <div class="stat-label">防护监狱</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ serviceInfo.totalBannedIps }}</div>
                <div class="stat-label">当前封禁IP</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{{ serviceInfo.totalFailedAttempts }}</div>
                <div class="stat-label">总攻击次数</div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "ServiceStatusPanel",
    props: {
        // ==================== 系统检测状态 ====================
        isSystemLocked: {
            type: Boolean,
            default: false
        },
        // 服务状态是否加载中
        isLoadingStatus: {
            type: Boolean,
            default: false
        },
        // ==================== 服务状态 ====================
        serviceStatus: {
            type: String,
            default: "加载中..."
        },
        lockMessage: {
            type: String,
            default: ""
        },
        serviceInfo: {
            type: Object,
            default: () => ({
                version: "未知",
                totalJails: 0,
                totalBannedIps: 0,
                totalFailedAttempts: 0,
                uptime: "未知",
                firewallStatus: "未知"
            })
        },
        // ==================== 页面级刷新状态 ====================
        isRefreshing: {
            type: Boolean,
            default: false
        },
        lastRefreshTime: {
            type: String,
            default: ""
        },
        // ==================== 定时刷新配置 ====================
        refreshIntervalSeconds: {
            type: Number,
            default: 30
        }
    },
    computed: {
        /**
         * 锁定状态图标颜色类
         */
        lockIconClass() {
            if (this.serviceStatus === "系统不匹配") {
                return "warning-icon";
            } else if (this.serviceStatus === "未安装") {
                return "info-icon";
            }
            return "";
        }
    },
    methods: {
        /**
         * 格式化刷新间隔为可读文本
         * @param {Number} seconds 秒数
         * @returns {String} 可读文本
         */
        formatInterval(seconds) {
            if (seconds >= 60) {
                const minutes = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return secs > 0 ? `${minutes}分${secs}秒` : `${minutes}分钟`;
            }
            return `${seconds}秒`;
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

/* ==================== 上锁状态卡片样式 ==================== */
.locked-card {
    filter: grayscale(50%);
    opacity: 0.9;
}

.lock-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.85);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10;
}

.lock-icon {
    font-size: 64px;
    color: #909399;
    margin-bottom: 20px;
}

.lock-icon.warning-icon {
    color: #e6a23c;
}

.lock-icon.info-icon {
    color: #409eff;
}

.lock-text {
    text-align: center;
    line-height: 1.6;
    max-width: 80%;
}

.lock-title {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
}

.lock-desc {
    font-size: 14px;
    color: #606266;
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

.refresh-container {
    display: flex;
    align-items: center;
    gap: 10px;
}

.refresh-btn {
    color: #409eff;
    font-size: 12px;
    padding: 4px 8px;
    transition: all 0.25s ease;
}

/* ==================== 按钮悬浮动画（手动刷新 / 启动 / 停止服务） ==================== */
/* 统一过渡，图标在 hover 时触发对应动画，提升交互反馈 */
.refresh-btn:hover,
.startstop-btn:hover {
    opacity: 0.85;
}

/* 手动刷新图标：hover 时旋转一圈 */
.refresh-btn ::v-deep .el-icon-refresh {
    transition: transform 0.5s ease;
}

.refresh-btn:hover ::v-deep .el-icon-refresh {
    transform: rotate(360deg);
}

/* 启动/停止图标：hover 时轻微放大跳动 */
.startstop-btn ::v-deep .el-icon-video-play,
.startstop-btn ::v-deep .el-icon-video-pause {
    transition: transform 0.25s ease;
}

.startstop-btn:hover ::v-deep .el-icon-video-play,
.startstop-btn:hover ::v-deep .el-icon-video-pause {
    transform: scale(1.25);
}

.startstop-btn {
    font-size: 12px;
    padding: 4px 8px;
    position: relative;
    left: 16px;
    transition: all 0.25s ease;
}

.refresh-time {
    font-size: 12px;
    color: #8392a5;
}

/* ==================== 定时刷新设置按钮 ==================== */
.setting-btn {
    color: #909399;
    font-size: 14px;
    padding: 4px 8px;
    transition: all 0.25s ease;
    position: relative;
    left: 8px;
}

.setting-btn:hover {
    color: #409eff;
    opacity: 0.85;
}

/* 设置图标：hover 时齿轮上下弹跳，活泼而不重复刷新的旋转 */
.setting-btn ::v-deep .el-icon-setting {
    transition: transform 0.25s ease;
}

.setting-btn:hover ::v-deep .el-icon-setting {
    animation: setting-bounce 0.6s ease;
}

@keyframes setting-bounce {

    0%,
    100% {
        transform: translateY(0);
    }

    30% {
        transform: translateY(-4px);
    }

    60% {
        transform: translateY(0);
    }

    80% {
        transform: translateY(-2px);
    }
}

/* ==================== 定时刷新设置弹窗 ==================== */
.refresh-config {
    padding: 4px 0;
}

.config-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.config-title i {
    color: #409eff;
}

.config-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
}

.config-label {
    font-size: 13px;
    color: #606266;
}

.config-status {
    margin-bottom: 12px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.status-dot.active {
    background-color: #67c23a;
    box-shadow: 0 0 4px rgba(103, 194, 58, 0.6);
}

.status-dot.inactive {
    background-color: #909399;
}

.status-active {
    color: #67c23a;
}

.status-inactive {
    color: #909399;
}

.config-desc {
    font-size: 11px;
    color: #909399;
    line-height: 1.5;
    padding-top: 10px;
    border-top: 1px solid #f0f0f0;
}

.config-desc i {
    margin-right: 2px;
}

/* ==================== 状态指示器 ==================== */
.status-content {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.status-indicator {
    display: flex;
    align-items: center;
    margin-right: 30px;
    margin-bottom: 15px;
}

.indicator-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 10px;
    transition: all 0.3s ease;
}

.indicator-dot.running {
    background-color: #52c41a;
    box-shadow: 0 0 10px rgba(82, 196, 26, 0.5);
}

.indicator-dot.stopped {
    background-color: #f5222d;
    box-shadow: 0 0 10px rgba(245, 34, 45, 0.5);
}

.indicator-dot.unknown {
    background-color: #909399;
    box-shadow: 0 0 10px rgba(144, 147, 153, 0.5);
}

.status-text {
    font-size: 24px;
    font-weight: 500;
    color: #1f2d3d;
}

.service-info {
    display: flex;
    gap: 30px;
    margin-left: 20px;
    flex-wrap: wrap;
}

.info-item {
    font-size: 14px;
}

.info-label {
    color: #8392a5;
}

.info-value {
    color: #1f2d3d;
    font-weight: 500;
}

.text-success {
    color: #52c41a !important;
}

.text-danger {
    color: #f5222d !important;
}

/* ==================== 统计卡片网格 ==================== */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-top: 20px;
}

.stat-card {
    background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    transition: all 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    cursor: pointer;
}

.stat-value {
    font-size: 36px;
    font-weight: 700;
    color: #409eff;
    margin-bottom: 8px;
}

.stat-label {
    font-size: 14px;
    color: #8392a5;
}

/* ==================== 响应式适配 ==================== */
@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }

    .status-content {
        flex-direction: column;
        align-items: flex-start;
    }

    .service-info {
        flex-direction: column;
        gap: 10px;
        margin-left: 0;
        margin-top: 15px;
    }
}
</style>
