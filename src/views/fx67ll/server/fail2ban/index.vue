<template>
    <div class="app-container">
        <!-- Fail2ban服务状态卡片 -->
        <div class="status-card">
            <div class="status-header">
                <h2>Fail2ban 防护状态</h2>
                <div class="refresh-container">
                    <el-button type="text" icon="el-icon-refresh" @click="handleRefresh" :loading="isRefreshing"
                        class="refresh-btn">
                        手动刷新
                    </el-button>
                    <span class="refresh-time">最后刷新: {{ lastRefreshTime }}</span>
                </div>
            </div>

            <div class="status-content">
                <div class="status-indicator">
                    <div class="indicator-dot" :class="serviceStatus === '运行中' ? 'running' : 'stopped'"></div>
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
                            :class="serviceInfo.firewallStatus === '运行中' ? 'text-success' : 'text-danger'">
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

        <!-- 最近24小时攻击趋势卡片 -->
        <div class="status-card">
            <div class="status-header">
                <h2>最近24小时攻击趋势</h2>
            </div>
            <div class="chart-container">
                <el-table :data="trendData" border stripe style="width: 100%" size="small">
                    <el-table-column prop="hour" label="时间" width="80" align="center" />
                    <el-table-column prop="count" label="攻击次数" align="center">
                        <template v-slot="scope">
                            <el-progress :percentage="Math.min(scope.row.count * 2, 100)" :show-text="true"
                                :stroke-width="10" :status="scope.row.count > 50 ? 'exception' : 'warning'" />
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>

        <!-- 监狱状态列表卡片 -->
        <div class="status-card">
            <div class="status-header">
                <h2>监狱防护状态</h2>
                <div class="filter-container">
                    <el-input v-model="jailFilter" placeholder="搜索监狱" size="small" style="width: 200px;"
                        prefix-icon="el-icon-search" />
                </div>
            </div>

            <el-table :data="filteredJailList" border stripe style="width: 100%" @row-click="toggleJailDetail">
                <el-table-column prop="name" label="监狱名称" width="150" />
                <el-table-column prop="currentlyBanned" label="当前封禁" width="100" align="center" />
                <el-table-column prop="totalBanned" label="累计封禁" width="100" align="center" />
                <el-table-column prop="totalFailed" label="失败尝试" width="100" align="center" />
                <el-table-column label="操作" width="80" align="center">
                    <template v-slot="scope">
                        <el-button type="text"
                            :icon="expandedJails.includes(scope.row.name) ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"
                            @click.stop="toggleJailDetail(scope.row)">
                            {{ expandedJails.includes(scope.row.name) ? '收起' : '展开' }}
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 监狱详情展开区域 -->
            <div v-for="jail in expandedJailDetails" :key="jail.name" class="jail-detail-expand">
                <el-divider content-position="left">{{ jail.name }} 详细信息</el-divider>

                <el-descriptions :column="4" border size="small">
                    <el-descriptions-item label="当前封禁">{{ jail.currentlyBanned }}</el-descriptions-item>
                    <el-descriptions-item label="累计封禁">{{ jail.totalBanned }}</el-descriptions-item>
                    <el-descriptions-item label="失败尝试">{{ jail.totalFailed }}</el-descriptions-item>
                    <el-descriptions-item label="封禁时间">{{ jail.config.bantime || '未知' }}秒</el-descriptions-item>
                    <el-descriptions-item label="检测窗口">{{ jail.config.findtime || '未知' }}秒</el-descriptions-item>
                    <el-descriptions-item label="最大失败">{{ jail.config.maxretry || '未知' }}</el-descriptions-item>
                    <el-descriptions-item label="监控端口">{{ jail.config.port || '未知' }}</el-descriptions-item>
                    <el-descriptions-item label="日志路径">{{ jail.config.logpath || '未知' }}</el-descriptions-item>
                </el-descriptions>

                <div class="banned-ips-section">
                    <div class="section-header">
                        <h4>当前被封禁IP ({{ jail.bannedIps.length || 0 }})</h4>
                        <div class="ip-actions">
                            <el-button type="primary" size="small" icon="el-icon-document-copy"
                                @click="copyAllIps(jail.bannedIps)"
                                :disabled="!jail.bannedIps || jail.bannedIps.length === 0">
                                复制全部
                            </el-button>
                            <el-button type="success" size="small" icon="el-icon-check" @click="copySelectedIps"
                                :disabled="selectedIps.length === 0">
                                复制选中 ({{ selectedIps.length }})
                            </el-button>
                        </div>
                    </div>

                    <div class="banned-ips-list">
                        <el-checkbox v-for="ip in jail.bannedIps" :key="ip" v-model="selectedIps" :label="ip"
                            class="ip-checkbox">
                            {{ ip }}
                            <el-button type="text" icon="el-icon-document-copy" size="mini"
                                @click.stop="copySingleIp(ip)" class="copy-btn">
                                复制
                            </el-button>
                        </el-checkbox>
                    </div>

                    <div v-if="!jail.bannedIps || jail.bannedIps.length === 0" class="empty-text">
                        暂无被封禁的IP
                    </div>
                </div>
            </div>
        </div>

        <!-- 攻击来源统计卡片 -->
        <div class="status-card">
            <div class="status-header">
                <h2>攻击来源统计 (Top 20)</h2>
                <div class="ip-actions">
                    <el-button type="primary" size="small" icon="el-icon-document-copy" @click="copyAllTopIps"
                        :disabled="topAttackIps.length === 0">
                        复制全部
                    </el-button>
                    <el-button type="success" size="small" icon="el-icon-check" @click="copySelectedTopIps"
                        :disabled="selectedTopIps.length === 0">
                        复制选中 ({{ selectedTopIps.length }})
                    </el-button>
                </div>
            </div>

            <el-table :data="topAttackIps" border stripe style="width: 100%">
                <el-table-column width="50" align="center">
                    <template v-slot="scope">
                        <el-checkbox v-model="selectedTopIps" :label="scope.row.ip" @change="handleTopIpSelect" />
                    </template>
                </el-table-column>
                <el-table-column prop="ip" label="攻击IP" width="150" />
                <el-table-column prop="count" label="攻击次数" width="100" align="center" />
                <el-table-column label="威胁等级" width="120" align="center">
                    <template v-slot="scope">
                        <el-tag :type="getThreatLevel(scope.row.count)">
                            {{ getThreatLevelText(scope.row.count) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100" align="center">
                    <template v-slot="scope">
                        <el-button type="text" icon="el-icon-document-copy" @click="copySingleIp(scope.row.ip)">
                            复制IP
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- 全量封禁IP列表卡片 -->
        <div class="status-card">
            <div class="status-header">
                <h2>全量封禁IP列表 (共 {{ allBannedIps.length }} 个)</h2>
                <el-button type="primary" size="small" icon="el-icon-document-copy" @click="copyAllBannedIps"
                    :disabled="allBannedIps.length === 0">
                    复制全部封禁IP
                </el-button>
            </div>

            <div class="all-banned-ips">
                <el-tag v-for="ip in paginatedBannedIps" :key="ip" type="danger" closable @close="removeIpFromList(ip)"
                    style="margin: 5px;">
                    {{ ip }}
                    <el-button type="text" icon="el-icon-document-copy" size="mini" @click.stop="copySingleIp(ip)"
                        class="copy-btn" />
                </el-tag>
                <div v-if="allBannedIps.length === 0" class="empty-text">
                    暂无被封禁的IP
                </div>
            </div>

            <!-- 全量IP分页 -->
            <div class="pagination-container" v-if="allBannedIps.length > ipPageSize">
                <el-pagination @size-change="handleIpSizeChange" @current-change="handleIpCurrentChange"
                    :current-page="ipCurrentPage" :page-sizes="[50, 100, 200]" :page-size="ipPageSize"
                    layout="total, sizes, prev, pager, next, jumper" :total="allBannedIps.length" background>
                </el-pagination>
            </div>
        </div>

        <!-- 最近攻击日志卡片（已移除pre标签） -->
        <div class="status-card">
            <div class="status-header">
                <h2>最近攻击日志</h2>
                <div class="filter-container">
                    <el-select v-model="logLevelFilter" placeholder="日志级别" size="small" style="width: 120px;">
                        <el-option label="全部" value="" />
                        <el-option label="ERROR" value="ERROR" />
                        <el-option label="WARN" value="WARN" />
                        <el-option label="INFO" value="INFO" />
                    </el-select>
                    <el-select v-model="logJailFilter" placeholder="监狱" size="small" style="width: 120px;">
                        <el-option label="全部" value="" />
                        <el-option v-for="jail in jailList" :key="jail.name" :label="jail.name" :value="jail.name" />
                    </el-select>
                    <el-select v-model="logLimit" placeholder="日志条数" size="small" style="width: 120px;">
                        <el-option label="50条" :value="50" />
                        <el-option label="100条" :value="100" />
                        <el-option label="200条" :value="200" />
                        <el-option label="500条" :value="500" />
                        <el-option label="1000条" :value="1000" />
                    </el-select>
                    <el-button type="text" icon="el-icon-refresh" @click="refreshLogs" :loading="isLoadingLogs"
                        class="refresh-btn">
                        刷新日志
                    </el-button>
                </div>
            </div>

            <div class="log-container">
                <!-- 替换pre为普通行容器，使用div+span实现等宽日志 -->
                <div v-for="(log, index) in paginatedLogs" :key="index" class="log-line"
                    :class="getLogClass(log.level)">
                    <span>[{{ log.date }} {{ log.time }}] [{{ log.level }}] {{ log.message }}</span>
                    <el-button v-if="log.ip" type="text" icon="el-icon-document-copy" size="mini"
                        @click="copySingleIp(log.ip)" class="copy-btn-inline">
                        复制IP
                    </el-button>
                </div>
                <div v-if="filteredLogs.length === 0" class="empty-text">
                    暂无符合条件的日志
                </div>
            </div>

            <!-- 日志分页 -->
            <div class="pagination-container" v-if="filteredLogs.length > logPageSize">
                <el-pagination @size-change="handleLogSizeChange" @current-change="handleLogCurrentChange"
                    :current-page="logCurrentPage" :page-sizes="[20, 50, 100]" :page-size="logPageSize"
                    layout="total, sizes, prev, pager, next, jumper" :total="filteredLogs.length" background>
                </el-pagination>
            </div>
        </div>
    </div>
</template>

<script>
import {
    getFail2banStatus,
    getJailList,
    getJailDetail,
    getRecentLogs,
    getAttackStats,
    getAllBannedIps
} from "@/api/fx67ll/server/fail2ban";

export default {
    name: "Fail2banManager",
    data() {
        return {
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
            jailFilter: "", // 监狱搜索过滤
            expandedJails: [], // 已展开的监狱名称列表
            expandedJailDetails: [], // 已展开的监狱详情数据

            // ==================== 攻击统计 ====================
            topAttackIps: [], // 攻击来源Top 20
            trendData: [], // 24小时攻击趋势数据

            // ==================== 全量封禁IP ====================
            allBannedIps: [], // 所有被封禁的IP（去重后）
            ipCurrentPage: 1, // IP列表当前页码
            ipPageSize: 100, // IP列表每页条数

            // ==================== 日志管理 ====================
            recentLogs: [], // 原始日志数据
            logLevelFilter: "", // 日志级别筛选
            logJailFilter: "", // 监狱筛选
            logLimit: 200, // 日志返回条数（参数化）
            logCurrentPage: 1, // 日志当前页码
            logPageSize: 50, // 日志每页条数

            // ==================== IP选择 ====================
            selectedIps: [], // 监狱内选中的IP
            selectedTopIps: [], // Top攻击IP中选中的IP

            // ==================== 加载状态 ====================
            isRefreshing: false, // 整体刷新状态
            isLoadingLogs: false, // 日志刷新状态

            // ==================== 其他 ====================
            lastRefreshTime: "", // 最后刷新时间
            refreshInterval: null // 自动刷新定时器
        };
    },
    computed: {
        /**
         * 过滤后的监狱列表（支持搜索）
         */
        filteredJailList() {
            if (!this.jailFilter) return this.jailList;
            return this.jailList.filter(jail =>
                jail.name.toLowerCase().includes(this.jailFilter.toLowerCase())
            );
        },

        /**
         * 过滤后的日志列表（支持级别和监狱筛选）
         */
        filteredLogs() {
            let logs = this.recentLogs;
            if (this.logLevelFilter) {
                logs = logs.filter(log => log.level === this.logLevelFilter);
            }
            if (this.logJailFilter) {
                logs = logs.filter(log => log.message.includes("[" + this.logJailFilter + "]"));
            }
            return logs;
        },

        /**
         * 分页后的日志列表
         */
        paginatedLogs() {
            const start = (this.logCurrentPage - 1) * this.logPageSize;
            const end = start + this.logPageSize;
            return this.filteredLogs.slice(start, end);
        },

        /**
         * 分页后的全量封禁IP列表
         */
        paginatedBannedIps() {
            const start = (this.ipCurrentPage - 1) * this.ipPageSize;
            const end = start + this.ipPageSize;
            return this.allBannedIps.slice(start, end);
        }
    },
    created() {
        // 组件创建时加载所有数据
        this.loadAllData();
        // 设置自动刷新，每30秒更新一次
        this.refreshInterval = setInterval(() => {
            this.loadAllData();
        }, 30000);
    },
    beforeDestroy() {
        // 组件销毁时清除定时器，防止内存泄漏
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    },
    methods: {
        /**
         * 加载所有数据
         * 并行加载所有接口，提升加载速度
         */
        async loadAllData() {
            try {
                await Promise.all([
                    this.loadServiceStatus(),
                    this.loadJailList(),
                    this.loadAttackStats(),
                    this.loadRecentLogs(),
                    this.loadAllBannedIps()
                ]);
                this.lastRefreshTime = this.formatDateTime(new Date());
            } catch (error) {
                this.$message.error("加载数据失败：" + (error.msg || error.message));
            }
        },

        /**
         * 手动刷新所有数据
         */
        handleRefresh() {
            this.isRefreshing = true;
            this.loadAllData().finally(() => {
                this.isRefreshing = false;
            });
        },

        /**
         * 刷新日志数据
         */
        refreshLogs() {
            this.isLoadingLogs = true;
            this.loadRecentLogs().finally(() => {
                this.isLoadingLogs = false;
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
        },

        /**
         * 加载监狱列表
         */
        async loadJailList() {
            const response = await getJailList();
            this.jailList = response.data || [];
        },

        /**
         * 加载攻击统计数据
         */
        async loadAttackStats() {
            const response = await getAttackStats();
            this.topAttackIps = response.data.topAttackIps || [];

            // 转换趋势数据格式为表格所需格式
            const trend = response.data.hourlyTrend || {};
            this.trendData = Object.entries(trend).map(([hour, count]) => ({ hour, count }));
        },

        /**
         * 加载全量封禁IP列表
         */
        async loadAllBannedIps() {
            const response = await getAllBannedIps();
            const data = response.data || {};
            const bannedIpsByJail = data.bannedIpsByJail || {};

            // 合并所有监狱的IP并去重
            const allIps = new Set();
            Object.values(bannedIpsByJail).forEach(ips => {
                ips.forEach(ip => allIps.add(ip));
            });
            this.allBannedIps = Array.from(allIps);
            // 重置IP分页
            this.ipCurrentPage = 1;
        },

        /**
         * 加载最近日志（支持参数化）
         */
        async loadRecentLogs() {
            const response = await getRecentLogs({
                limit: this.logLimit,
                level: this.logLevelFilter,
                jail: this.logJailFilter
            });
            this.recentLogs = response.data || [];
            // 重置日志分页
            this.logCurrentPage = 1;
        },

        /**
         * 切换监狱详情展开/收起
         * param {Object} row 监狱行数据
         */
        async toggleJailDetail(row) {
            const index = this.expandedJails.indexOf(row.name);
            if (index > -1) {
                // 收起详情
                this.expandedJails.splice(index, 1);
                this.expandedJailDetails = this.expandedJailDetails.filter(
                    jail => jail.name !== row.name
                );
                // 清空选中的IP
                this.selectedIps = [];
            } else {
                // 展开详情
                try {
                    const response = await getJailDetail(row.name);
                    this.expandedJails.push(row.name);
                    this.expandedJailDetails.push(response.data);
                } catch (error) {
                    this.$message.error("获取监狱详情失败：" + (error.msg || error.message));
                }
            }
        },

        // ==================== IP复制功能 ====================

        /**
         * 复制单个IP到剪贴板
         * param {String} ip IP地址
         */
        async copySingleIp(ip) {
            await this.copyToClipboard(ip);
            this.$message.success(`已复制IP: ${ip}`);
        },

        /**
         * 复制全部IP到剪贴板
         * param {Array} ips IP地址数组
         */
        async copyAllIps(ips) {
            if (!ips || ips.length === 0) {
                this.$message.warning("没有可复制的IP");
                return;
            }
            const ipText = ips.join("\n");
            await this.copyToClipboard(ipText);
            this.$message.success(`已复制 ${ips.length} 个IP`);
        },

        /**
         * 复制选中的IP到剪贴板
         */
        async copySelectedIps() {
            if (this.selectedIps.length === 0) {
                this.$message.warning("请先选择要复制的IP");
                return;
            }
            const ipText = this.selectedIps.join("\n");
            await this.copyToClipboard(ipText);
            this.$message.success(`已复制 ${this.selectedIps.length} 个选中的IP`);
        },

        /**
         * 复制全部Top攻击IP到剪贴板
         */
        copyAllTopIps() {
            const ips = this.topAttackIps.map(item => item.ip);
            return this.copyAllIps(ips);
        },

        /**
         * 复制选中的Top攻击IP到剪贴板
         */
        async copySelectedTopIps() {
            if (this.selectedTopIps.length === 0) {
                this.$message.warning("请先选择要复制的IP");
                return;
            }
            const ipText = this.selectedTopIps.join("\n");
            await this.copyToClipboard(ipText);
            this.$message.success(`已复制 ${this.selectedTopIps.length} 个选中的IP`);
        },

        /**
         * 复制所有封禁IP到剪贴板
         */
        copyAllBannedIps() {
            return this.copyAllIps(this.allBannedIps);
        },

        /**
         * 通用剪贴板复制方法（兼容现代Clipboard API + 旧浏览器降级）
         * param {String} text 要复制的文本
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
        },

        /**
         * 处理Top IP选择事件（自动去重）
         */
        handleTopIpSelect() {
            this.selectedTopIps = [...new Set(this.selectedTopIps)];
        },

        /**
         * 从列表中移除IP（仅前端显示，不影响实际封禁）
         * param {String} ip IP地址
         */
        removeIpFromList(ip) {
            this.allBannedIps = this.allBannedIps.filter(item => item !== ip);
        },

        // ==================== 分页事件处理 ====================

        /**
         * 日志每页条数改变事件
         * param {Number} size 新的每页条数
         */
        handleLogSizeChange(size) {
            this.logPageSize = size;
            this.logCurrentPage = 1;
        },

        /**
         * 日志页码改变事件
         * param {Number} page 新的页码
         */
        handleLogCurrentChange(page) {
            this.logCurrentPage = page;
            // 滚动到日志容器顶部
            this.$el.querySelector('.log-container').scrollTop = 0;
        },

        /**
         * IP列表每页条数改变事件
         * param {Number} size 新的每页条数
         */
        handleIpSizeChange(size) {
            this.ipPageSize = size;
            this.ipCurrentPage = 1;
        },

        /**
         * IP列表页码改变事件
         * param {Number} page 新的页码
         */
        handleIpCurrentChange(page) {
            this.ipCurrentPage = page;
        },

        // ==================== 工具方法 ====================

        /**
         * 根据攻击次数获取威胁等级类型
         * param {Number} count 攻击次数
         * returns {String} ElementUI标签类型
         */
        getThreatLevel(count) {
            if (count > 200) return "danger";
            if (count > 100) return "warning";
            return "info";
        },

        /**
         * 根据攻击次数获取威胁等级文本
         * param {Number} count 攻击次数
         * returns {String} 威胁等级文本
         */
        getThreatLevelText(count) {
            if (count > 200) return "极高危";
            if (count > 100) return "高危";
            if (count > 50) return "中危";
            return "低危";
        },

        /**
         * 根据日志级别获取对应的CSS类
         * param {String} level 日志级别
         * returns {String} CSS类名
         */
        getLogClass(level) {
            const classMap = {
                "ERROR": "log-error",
                "WARN": "log-warn",
                "INFO": "log-info",
                "DEBUG": "log-debug"
            };
            return classMap[level] || "log-info";
        },

        /**
         * 格式化日期时间为字符串
         * param {Date} date 日期对象
         * returns {String} 格式化后的日期字符串
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
         * 数字补零函数（用于日期格式化）
         * param {Number} num 数字
         * returns {String} 补零后的两位字符串
         */
        padZero(num) {
            return num < 10 ? `0${num}` : num;
        }
    }
};
</script>

<style scoped>
/* 完全沿用Tomcat管理界面的基础样式 */
.status-card {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin-bottom: 20px;
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

.filter-container {
    display: flex;
    align-items: center;
    gap: 10px;
}

.refresh-btn {
    color: #409eff;
    font-size: 12px;
    padding: 4px 8px;
}

.refresh-time {
    font-size: 12px;
    color: #8392a5;
}

/* 状态指示器 */
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

/* 统计卡片网格 */
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

/* 图表容器 */
.chart-container {
    margin-top: 20px;
}

/* 监狱详情展开区域 */
.jail-detail-expand {
    margin-top: 20px;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
}

.banned-ips-section {
    margin-top: 20px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.section-header h4 {
    margin: 0;
    font-size: 16px;
    color: #1f2d3d;
}

.ip-actions {
    display: flex;
    gap: 10px;
}

.banned-ips-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 15px;
}

.ip-checkbox {
    margin: 5px;
    padding: 5px 10px;
    background-color: #fff;
    border-radius: 4px;
    border: 1px solid #e6e6e6;
}

.copy-btn {
    margin-left: 5px;
    padding: 2px 4px;
}

.copy-btn-inline {
    margin-left: 10px;
    color: #409eff;
}

/* 全量封禁IP列表 */
.all-banned-ips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
}

/* 日志容器（替换pre后的样式） */
.log-container {
    background-color: #1f2d3d;
    border-radius: 4px;
    padding: 15px;
    max-height: 400px;
    overflow-y: auto;
    font-family: "Consolas", "Monaco", monospace;
    font-size: 12px;
}

.log-line {
    line-height: 1.6;
    word-break: break-all;
    padding: 2px 0;
    display: flex;
    align-items: center;
}

.log-error {
    color: #ff4d4f;
}

.log-warn {
    color: #faad14;
}

.log-info {
    color: #52c41a;
}

.log-debug {
    color: #8392a5;
}

.empty-text {
    color: #8392a5;
    font-size: 14px;
    text-align: center;
    padding: 20px;
}

/* 分页容器 */
.pagination-container {
    margin-top: 20px;
    text-align: right;
}

/* 响应式设计 */
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

    .filter-container {
        flex-wrap: wrap;
        margin-top: 10px;
    }

    .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .ip-actions {
        width: 100%;
        justify-content: flex-start;
    }
}
</style>