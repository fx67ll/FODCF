<template>
    <div class="app-container">
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
                        @click="openConfirmDialog('stopService', '')" class="startstop-btn" style="color: #f56c6c;"
                        :disabled="isSystemLocked">
                        停止服务
                    </el-button>
                    <el-button v-else type="text" icon="el-icon-video-play"
                        @click="openConfirmDialog('startService', '')" class="startstop-btn" style="color: #67c23a;"
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
                                <el-select v-model="refreshIntervalSeconds" size="small" style="width: 150px;"
                                    @change="handleIntervalChange">
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
                    <el-button type="text" icon="el-icon-refresh" @click="handleRefresh" :loading="isRefreshing"
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

        <!-- 以下所有卡片仅在系统正常时显示 -->
        <template v-if="!isSystemLocked">
            <!-- IP防护操作台卡片 -->
            <ip-operation-panel :jail-list="jailList" :current-ip="currentIp" @open-confirm="openConfirmDialog"
                ref="ipOperationPanel" />

            <!-- 监狱防护状态（含详情弹窗） -->
            <jail-status-panel :jail-list="jailList" :loading="isLoadingJails" :last-refresh-time="lastRefreshTime"
                @open-confirm="openConfirmDialog" @refresh="handleRefreshJails" ref="jailStatusPanel" />

            <!-- 最近24小时攻击趋势卡片 -->
            <attack-trend-panel :trend-data="trendData" :max-trend-count="maxTrendCount"
                :total-trend-attacks="totalTrendAttacks" :loading="isLoadingAttackData"
                :last-refresh-time="lastRefreshTime" :all-banned-ips="allBannedIps"
                :banned-ips-by-jail="bannedIpsByJail" :jail-list="jailList" @refresh="handleRefreshAttackData"
                @open-confirm="openConfirmDialog" ref="attackTrendPanel" />

            <!-- 攻击来源统计卡片 -->
            <attack-stats-panel :top-attack-ips="topAttackIps" :all-banned-ips="allBannedIps"
                :banned-ips-by-jail="bannedIpsByJail" :baseline-max-retry="baselineMaxRetry" :jail-list="jailList"
                :loading="isLoadingAttackData" :last-refresh-time="lastRefreshTime" :top-ip-limit.sync="topIpLimit"
                :stats-log-lines.sync="statsLogLines" @open-confirm="openConfirmDialog"
                @refresh="handleRefreshAttackData" ref="attackStatsPanel" />

            <!-- 全量封禁IP列表卡片 -->
            <banned-ip-list :all-banned-ips="allBannedIps" :loading="isLoadingBannedIps"
                :last-refresh-time="lastRefreshTime" @open-confirm="openConfirmDialog" @refresh="handleRefreshBannedIps"
                ref="bannedIpList" />

            <!-- 最近攻击日志卡片 -->
            <recent-logs-panel :jail-list="jailList" :last-refresh-time="lastRefreshTime" ref="recentLogsPanel" />
        </template>

        <!-- 统一操作确认弹窗 -->
        <operation-confirm-dialog :visible.sync="confirmDialogVisible" :confirm-info="confirmInfo" :jail-list="jailList"
            :confirm-loading="confirmLoading" @update:jail-name="handleJailNameUpdate" @execute="executeOperation" />
    </div>
</template>

<script>
// 导入所有Fail2ban相关API
import {
    getFail2banStatus,
    getJailList,
    getAttackStats,
    getAllBannedIps,
    banIp,
    unbanIp,
    banBatchIps,
    unbanBatchIps,
    unbanAllJailIps,
    unbanAllJailsAllIps,
    getCurrentIp,
    startService,
    stopService,
    startJail,
    stopJail
} from "@/api/fx67ll/server/fail2ban";

import { getToken } from "@/utils/common/auth";

// 导入子组件
import IpOperationPanel from './components/IpOperationPanel/IpOperationPanel';
import JailStatusPanel from './components/JailStatusPanel/JailStatusPanel';
import AttackTrendPanel from './components/AttackTrendPanel/AttackTrendPanel';
import AttackStatsPanel from './components/AttackStatsPanel/AttackStatsPanel';
import BannedIpList from './components/BannedIpList/BannedIpList';
import RecentLogsPanel from './components/RecentLogsPanel/RecentLogsPanel';
import OperationConfirmDialog from './components/OperationConfirmDialog/OperationConfirmDialog';

// 定时刷新配置的localStorage key
const REFRESH_INTERVAL_KEY = 'fail2ban-refresh-interval';
const DEFAULT_INTERVAL = 30; // 默认30秒

export default {
    name: "Fail2banManager",
    components: {
        IpOperationPanel,
        JailStatusPanel,
        AttackTrendPanel,
        AttackStatsPanel,
        BannedIpList,
        RecentLogsPanel,
        OperationConfirmDialog
    },
    data() {
        return {
            // ==================== 系统检测状态 ====================
            isSystemLocked: false,
            lockMessage: "",

            // ==================== 服务状态 ====================
            serviceStatus: "加载中...",
            serviceInfo: {
                version: "未知",
                totalJails: 0,
                totalBannedIps: 0,
                totalFailedAttempts: 0,
                uptime: "未知",
                firewallStatus: "未知"
            },

            // ==================== 监狱管理 ====================
            jailList: [],

            // ==================== 攻击统计（趋势+来源共享同一API） ====================
            topAttackIps: [],
            trendData: [],
            maxTrendCount: 1,
            totalTrendAttacks: 0,
            baselineMaxRetry: 5,
            statsLogLines: 10000,
            topIpLimit: 20,

            // ==================== 全量封禁IP ====================
            allBannedIps: [],
            bannedIpsByJail: {},

            // ==================== 当前客户端IP ====================
            currentIp: '获取中...',

            // ==================== 统一确认弹窗 ====================
            confirmDialogVisible: false,
            confirmLoading: false,
            confirmInfo: {
                type: 'ban',
                ip: '',
                jailName: ''
            },

            // ==================== 各卡片加载计数器（并发刷新互不干扰） ====================
            loadingStatusCount: 0,
            loadingJailsCount: 0,
            loadingAttackDataCount: 0,
            loadingBannedIpsCount: 0,

            // ==================== 页面级刷新状态 ====================
            isRefreshing: false,

            // ==================== 定时刷新配置 ====================
            refreshIntervalSeconds: DEFAULT_INTERVAL,   // 当前刷新间隔（秒），0=关闭
            refreshInterval: null,                       // 定时器ID

            // ==================== 其他 ====================
            lastRefreshTime: ""
        };
    },
    computed: {
        /**
         * 服务状态是否加载中
         */
        isLoadingStatus() {
            return this.loadingStatusCount > 0;
        },

        /**
         * 监狱列表是否加载中
         */
        isLoadingJails() {
            return this.loadingJailsCount > 0;
        },

        /**
         * 攻击数据是否加载中
         */
        isLoadingAttackData() {
            return this.loadingAttackDataCount > 0;
        },

        /**
         * 封禁IP列表是否加载中
         */
        isLoadingBannedIps() {
            return this.loadingBannedIpsCount > 0;
        },

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
    mounted() {
        // 初始化刷新间隔配置
        this.initRefreshInterval();
        // 首次加载数据（不显示loading）
        this.loadAllData(false);
        // 启动定时刷新
        this.startAutoRefresh();
    },
    beforeDestroy() {
        this.stopAutoRefresh();
    },
    methods: {
        // ==================== 定时刷新配置 ====================

        /**
         * 初始化刷新间隔：从localStorage读取，无token时清除配置
         */
        initRefreshInterval() {
            if (!getToken()) {
                // 无登录凭证，清除本地配置并使用默认值
                localStorage.removeItem(REFRESH_INTERVAL_KEY);
                this.refreshIntervalSeconds = DEFAULT_INTERVAL;
            } else {
                const stored = localStorage.getItem(REFRESH_INTERVAL_KEY);
                this.refreshIntervalSeconds = stored !== null ? Number(stored) : DEFAULT_INTERVAL;
            }
        },

        /**
         * 启动定时刷新
         */
        startAutoRefresh() {
            this.stopAutoRefresh();
            if (this.refreshIntervalSeconds > 0) {
                this.refreshInterval = setInterval(() => {
                    this.loadAllData(true);
                }, this.refreshIntervalSeconds * 1000);
            }
        },

        /**
         * 停止定时刷新
         */
        stopAutoRefresh() {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
        },

        /**
         * 刷新间隔变更处理
         * @param {Number} val 新的间隔秒数
         */
        handleIntervalChange(val) {
            localStorage.setItem(REFRESH_INTERVAL_KEY, val);
            this.startAutoRefresh();
        },

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
        },

        // ==================== 数据加载方法 ====================

        /**
         * 加载所有数据
         * @param {Boolean} showLoading 是否在子卡片上显示loading效果
         */
        async loadAllData(showLoading = false) {
            if (showLoading) {
                this.loadingStatusCount++;
                this.loadingJailsCount++;
                this.loadingAttackDataCount++;
                this.loadingBannedIpsCount++;
            }
            try {
                // 优先加载服务状态（包含系统检测）
                await this.loadServiceStatus();

                // 只有系统正常时才加载其他数据
                if (!this.isSystemLocked) {
                    await Promise.all([
                        this.loadJailList(),
                        this.loadAttackStats(),
                        this.loadAllBannedIps(),
                        this.loadCurrentIp()
                    ]);

                    // 触发日志子组件刷新
                    this.$nextTick(() => {
                        if (this.$refs.recentLogsPanel) {
                            this.$refs.recentLogsPanel.refresh(showLoading);
                        }
                    });
                }

                this.lastRefreshTime = this.formatDateTime(new Date());
            } catch (error) {
                if (!error._isHandled) {
                    this.$message.error("加载数据失败：" + (error.msg || error.message));
                }
            } finally {
                if (showLoading) {
                    if (this.loadingStatusCount > 0) this.loadingStatusCount--;
                    if (this.loadingJailsCount > 0) this.loadingJailsCount--;
                    if (this.loadingAttackDataCount > 0) this.loadingAttackDataCount--;
                    if (this.loadingBannedIpsCount > 0) this.loadingBannedIpsCount--;
                }
            }
        },

        /**
         * 手动刷新所有数据（页面级刷新按钮）
         */
        handleRefresh() {
            this.isRefreshing = true;
            this.loadAllData(true).finally(() => {
                this.isRefreshing = false;
            });
        },

        /**
         * 刷新监狱列表（子组件刷新按钮）
         */
        handleRefreshJails() {
            this.loadingJailsCount++;
            this.loadJailList().finally(() => {
                if (this.loadingJailsCount > 0) this.loadingJailsCount--;
            });
        },

        /**
         * 刷新攻击数据（趋势+来源共享）
         */
        handleRefreshAttackData() {
            this.loadingAttackDataCount++;
            this.loadAttackStats().finally(() => {
                if (this.loadingAttackDataCount > 0) this.loadingAttackDataCount--;
            });
        },

        /**
         * 刷新封禁IP列表
         */
        handleRefreshBannedIps() {
            this.loadingBannedIpsCount++;
            this.loadAllBannedIps().finally(() => {
                if (this.loadingBannedIpsCount > 0) this.loadingBannedIpsCount--;
            });
        },

        /**
         * 加载Fail2ban服务状态
         */
        async loadServiceStatus() {
            const response = await getFail2banStatus();
            const data = response.data || {};
            this.serviceStatus = data.status || "未知";
            this.serviceInfo = data;

            // 检测系统是否需要锁定
            if (data.status === "系统不匹配" || data.status === "未安装") {
                this.isSystemLocked = true;
                this.lockMessage = data.error || "该功能不可用";
            } else {
                this.isSystemLocked = false;
                this.lockMessage = "";
            }
        },

        /**
         * 获取当前客户端IP
         */
        async loadCurrentIp() {
            try {
                const res = await getCurrentIp();
                this.currentIp = res.data || '获取失败';
            } catch (e) {
                this.currentIp = '获取失败';
            }
        },

        /**
         * 加载监狱列表
         */
        async loadJailList() {
            const response = await getJailList();
            this.jailList = response.data || [];
        },

        /**
         * 加载攻击统计数据（趋势+来源共享同一API）
         */
        async loadAttackStats() {
            const response = await getAttackStats({
                logLines: this.statsLogLines,
                topIpLimit: this.topIpLimit
            });
            this.topAttackIps = response.data.topAttackIps || [];
            this.baselineMaxRetry = response.data.baselineMaxRetry || 5;

            // 转换趋势数据格式（适配后端结构：每个时段包含count + topIps）
            const trend = response.data.hourlyTrend || {};
            const now = new Date();
            const entries = Object.entries(trend);

            this.trendData = entries.map(([hour, data], index) => {
                const date = new Date(now.getTime() - (23 - index) * 60 * 60 * 1000);
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return {
                    dateTime: `${month}-${day} ${hour}`,
                    count: data.count || 0,
                    topIps: data.topIps || []
                };
            }).reverse();

            // 计算24小时内最大攻击次数和总攻击次数
            this.maxTrendCount = Math.max(...this.trendData.map(item => item.count), 1);
            this.totalTrendAttacks = this.trendData.reduce((sum, item) => sum + item.count, 0);
        },

        /**
         * 加载全量封禁IP列表
         */
        async loadAllBannedIps() {
            const response = await getAllBannedIps();
            const data = response.data || {};
            const bannedIpsByJail = data.bannedIpsByJail || {};
            this.bannedIpsByJail = bannedIpsByJail;
            // 合并所有监狱的IP并去重
            const allIps = new Set();
            Object.values(bannedIpsByJail).forEach(ips => {
                ips.forEach(ip => allIps.add(ip));
            });
            this.allBannedIps = Array.from(allIps);
        },

        // ==================== 封禁解封核心方法 ====================

        /**
         * 打开统一确认弹窗
         */
        openConfirmDialog(type, ip = '', jailName = '') {
            if (this.isSystemLocked) {
                this.$message.warning("系统状态异常，无法执行操作");
                return;
            }
            this.confirmInfo = { type, ip, jailName };
            this.confirmDialogVisible = true;
        },

        /**
         * 确认弹窗内监狱名称更新
         */
        handleJailNameUpdate(val) {
            this.confirmInfo.jailName = val;
        },

        /**
         * 执行确认后的操作
         */
        async executeOperation() {
            const { type, ip, jailName } = this.confirmInfo;
            this.confirmLoading = true;

            try {
                let res;
                switch (type) {
                    case 'ban':
                        res = await banIp(jailName, ip);
                        break;
                    case 'unban':
                        res = await unbanIp(jailName, ip);
                        break;
                    case 'ban-batch':
                        res = await banBatchIps(jailName, this.confirmInfo.ips);
                        break;
                    case 'unban-batch':
                        res = await unbanBatchIps(jailName, this.confirmInfo.ips);
                        break;
                    case 'unban-all-jail':
                        res = await unbanAllJailIps(jailName);
                        break;
                    case 'unban-all':
                        // 全局一键解封不需要监狱、ip参数
                        res = await unbanAllJailsAllIps();
                        break;
                    case 'startService':
                        res = await startService();
                        break;
                    case 'stopService':
                        res = await stopService();
                        break;
                    case 'startJail':
                        res = await startJail(jailName);
                        break;
                    case 'stopJail':
                        res = await stopJail(jailName);
                        break;
                    default:
                        throw new Error('未知操作类型');
                }

                this.$message.success(res.msg || '操作成功');
                this.confirmDialogVisible = false;

                // 操作成功后刷新相关数据（带loading）
                this.loadingStatusCount++;
                this.loadingJailsCount++;
                this.loadingAttackDataCount++;
                this.loadingBannedIpsCount++;
                try {
                    await Promise.all([
                        this.loadServiceStatus(),
                        this.loadJailList(),
                        this.loadAllBannedIps(),
                        this.loadAttackStats()
                    ]);
                    this.$nextTick(() => {
                        if (this.$refs.recentLogsPanel) {
                            this.$refs.recentLogsPanel.refresh(true);
                        }
                    });
                } finally {
                    if (this.loadingStatusCount > 0) this.loadingStatusCount--;
                    if (this.loadingJailsCount > 0) this.loadingJailsCount--;
                    if (this.loadingAttackDataCount > 0) this.loadingAttackDataCount--;
                    if (this.loadingBannedIpsCount > 0) this.loadingBannedIpsCount--;
                }

                // 清空操作台IP输入
                if (this.$refs.ipOperationPanel) {
                    this.$refs.ipOperationPanel.clearIp();
                }
            } catch (err) {
                if (!err._isHandled) {
                    this.$message.error(err.msg || '操作失败，请检查权限');
                }
            } finally {
                this.confirmLoading = false;
            }
        },

        // ==================== 工具方法 ====================

        /**
         * 格式化日期时间为字符串
         */
        formatDateTime(date) {
            const year = date.getFullYear();
            const month = this.padZero(date.getMonth() + 1);
            const day = this.padZero(date.getDate());
            const hour = this.padZero(date.getHours());
            const minute = this.padZero(date.getMinutes());
            const second = this.padZero(date.getSeconds());
            return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        },

        /**
         * 数字补零函数
         */
        padZero(num) {
            return num < 10 ? `0${num}` : num;
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
}

.startstop-btn {
    font-size: 12px;
    padding: 4px 8px;
    position: relative;
    left: 16px;
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
    transition: color 0.2s;
    position: relative;
    left: 8px;
}

.setting-btn:hover {
    color: #409eff;
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

    .refresh-container {
        flex-wrap: wrap;
    }
}
</style>
