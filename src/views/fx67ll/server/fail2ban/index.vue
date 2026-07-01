<template>
    <div class="app-container">
        <!-- Fail2ban服务状态卡片（始终显示，异常状态显示上锁样式） -->
        <service-status-panel :is-system-locked="isSystemLocked" :is-loading-status="isLoadingStatus"
            :service-status="serviceStatus" :lock-message="lockMessage" :service-info="serviceInfo"
            :is-refreshing="isRefreshing" :last-refresh-time="lastRefreshTime"
            :refresh-interval-seconds="refreshIntervalSeconds" @open-confirm="openConfirmDialog"
            @refresh="handleRefresh" @interval-change="handleIntervalChange" />

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
            :confirm-loading="confirmLoading" @update:jail-name="handleJailNameUpdate" @execute="executeOperation"
            @need-secondary-confirm="handleNeedSecondaryConfirm" />

        <!-- 危险操作二次确认弹窗 -->
        <danger-confirm-dialog :visible.sync="dangerConfirmDialogVisible" :loading="confirmLoading"
            @confirm="executeOperation" />
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
import ServiceStatusPanel from './components/ServiceStatusPanel/ServiceStatusPanel';
import IpOperationPanel from './components/IpOperationPanel/IpOperationPanel';
import JailStatusPanel from './components/JailStatusPanel/JailStatusPanel';
import AttackTrendPanel from './components/AttackTrendPanel/AttackTrendPanel';
import AttackStatsPanel from './components/AttackStatsPanel/AttackStatsPanel';
import BannedIpList from './components/BannedIpList/BannedIpList';
import RecentLogsPanel from './components/RecentLogsPanel/RecentLogsPanel';
import OperationConfirmDialog from './components/OperationConfirmDialog/OperationConfirmDialog';
import DangerConfirmDialog from './components/OperationConfirmDialog/DangerConfirmDialog';

// 定时刷新配置的localStorage key
const REFRESH_INTERVAL_KEY = 'fail2ban-refresh-interval';
const DEFAULT_INTERVAL = 30; // 默认30秒

export default {
    name: "Fail2banManager",
    components: {
        ServiceStatusPanel,
        IpOperationPanel,
        JailStatusPanel,
        AttackTrendPanel,
        AttackStatsPanel,
        BannedIpList,
        RecentLogsPanel,
        OperationConfirmDialog,
        DangerConfirmDialog
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
            dangerConfirmDialogVisible: false,
            // 【修改】增加ips数组存储批量IP列表
            confirmInfo: {
                type: 'ban',
                ip: '',
                jailName: '',
                ips: []
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
         * @param {String} type 操作类型
         * @param {String} ip 单个IP
         * @param {String} jailName 监狱名
         * @param {Array} ips 批量IP数组（可选）
         * @param {Array} jailOptions 可选目标监狱候选集（仅批量操作多监狱共享时传入，未传则使用全部监狱）
         */
        openConfirmDialog(type, ip = '', jailName = '', ips = [], jailOptions = null) {
            if (this.isSystemLocked) {
                this.$message.warning("系统状态异常，无法执行操作");
                return;
            }
            // 【修改】批量IP直接存入confirmInfo，不再依赖ref读取
            this.confirmInfo = {
                type,
                ip,
                jailName,
                ips: Array.isArray(ips) ? ips : [],
                jailOptions: Array.isArray(jailOptions) ? jailOptions : null
            };
            this.confirmDialogVisible = true;
        },

        /**
         * 危险操作（一键解封）进入二次确认流程
         */
        handleNeedSecondaryConfirm() {
            this.dangerConfirmDialogVisible = true;
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
            const { type, ip, jailName, ips } = this.confirmInfo;
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
                        if (!ips || ips.length === 0) {
                            this.$message.warning("未选中任何IP，无法执行批量封禁");
                            this.confirmLoading = false;
                            return;
                        }
                        if (ips.length > 100) {
                            this.$message.warning("单次批量封禁最多支持100个IP");
                            this.confirmLoading = false;
                            return;
                        }
                        res = await banBatchIps(jailName, ips);
                        break;
                    case 'unban-batch':
                        if (!ips || ips.length === 0) {
                            this.$message.warning("未选中任何IP，无法执行批量解封");
                            this.confirmLoading = false;
                            return;
                        }
                        if (ips.length > 100) {
                            this.$message.warning("单次批量解封最多支持100个IP");
                            this.confirmLoading = false;
                            return;
                        }
                        res = await unbanBatchIps(jailName, ips);
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
                this.dangerConfirmDialogVisible = false;

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
                        // 刷新监狱详情弹窗数据（如弹窗处于打开状态）
                        if (this.$refs.jailStatusPanel) {
                            this.$refs.jailStatusPanel.refreshJailDetail();
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
