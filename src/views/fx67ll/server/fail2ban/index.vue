<template>
    <div class="app-container">
        <!-- Fail2ban服务状态卡片 -->
        <div class="status-card">
            <div class="status-header">
                <h2>Fail2ban 防护状态</h2>
                <div class="refresh-container">
                    <el-button v-if="serviceStatus === '运行中'" type="text" icon="el-icon-video-pause"
                        @click="openConfirmDialog('stopService', '')" class="startstop-btn" style="color: #f56c6c;">
                        停止服务
                    </el-button>
                    <el-button v-else type="text" icon="el-icon-video-play"
                        @click="openConfirmDialog('startService', '')" class="startstop-btn" style="color: #67c23a;">
                        启动服务
                    </el-button>
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

        <!-- IP防护操作台卡片 -->
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

        <!-- 最近24小时攻击趋势卡片 -->
        <div class="status-card">
            <div class="status-header">
                <h2>最近24小时攻击趋势</h2>
            </div>
            <div class="chart-container">
                <el-table :data="trendData" border stripe style="width: 100%" size="small">
                    <el-table-column prop="dateTime" label="时间" width="130" align="center" />
                    <el-table-column label="攻击进度" align="center">
                        <template v-slot="scope">
                            <div style="display:flex;align-items:center;gap:10px;width:100%;">
                                <el-progress :percentage="Math.round((scope.row.count / maxTrendCount) * 100)"
                                    :show-text="false" :stroke-width="10"
                                    :status="scope.row.count > maxTrendCount * 0.5 ? 'exception' : 'warning'"
                                    style="flex:1" />
                                <span style="width:60px;text-align:right;font-weight:bold;">
                                    {{ scope.row.count }} 次
                                </span>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>

        <!-- ==================== 监狱防护状态列表 ==================== -->
        <div class="status-card">
            <div class="status-header">
                <h2>监狱防护状态</h2>
                <div class="filter-container">
                    <el-input v-model="jailFilter" placeholder="搜索监狱" size="small" style="width: 200px;"
                        prefix-icon="el-icon-search" />
                </div>
            </div>

            <el-table :data="filteredJailList" border stripe style="width: 100%">
                <el-table-column prop="name" label="监狱名称" width="150" />
                <el-table-column label="运行状态" width="100" align="center">
                    <template v-slot="scope">
                        <el-tag :type="scope.row.status === '运行中' ? 'success' : 'info'" size="small">
                            {{ scope.row.status }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="currentlyFailed" label="当前失败" width="100" align="center" />
                <el-table-column prop="currentlyBanned" label="当前封禁" width="100" align="center" />
                <el-table-column prop="totalBanned" label="累计封禁" width="100" align="center" />
                <el-table-column prop="totalFailed" label="失败尝试" width="100" align="center" />
                <el-table-column label="操作" width="180" align="center">
                    <template v-slot="scope">
                        <el-button type="primary" size="small" @click="openJailDetail(scope.row)">
                            详情
                        </el-button>
                        <el-button v-if="scope.row.status === '运行中'" type="danger" size="small"
                            @click="openConfirmDialog('stopJail', scope.row.name)">
                            停止
                        </el-button>
                        <el-button v-else type="success" size="small"
                            @click="openConfirmDialog('startJail', scope.row.name)">
                            启动
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- ==================== 监狱详情弹窗（新增配置区域） ==================== -->
        <el-dialog :title="'监狱详情 - ' + (currentJailDetail ? currentJailDetail.name : '')" :visible.sync="dialogVisible"
            width="700px" :close-on-click-modal="false" @close="dialogVisible = false; dialogSelectedIps = []"
            custom-class="jail-detail-dialog" :style="`top: ${getDialogVerticalOffset(570)}`" append-to-body>
            <div v-if="currentJailDetail">
                <!-- 监狱基本信息 -->
                <div class="config-section">
                    <div class="section-title">监狱基本信息</div>
                    <el-descriptions :column="4" border size="small">
                        <el-descriptions-item label="运行状态">
                            <el-tag :type="currentJailDetail.status === '运行中' ? 'success' : 'info'" size="small">
                                {{ currentJailDetail.status }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="当前失败">
                            {{ currentJailDetail.currentlyFailed || '0' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="当前封禁">
                            {{ currentJailDetail.currentlyBanned || '0' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="累计封禁">
                            {{ currentJailDetail.totalBanned || '0' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="总失败尝试">
                            {{ currentJailDetail.totalFailed || '0' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="日志路径" :span="3">
                            {{ currentJailDetail.logPath || '未知' }}
                        </el-descriptions-item>
                    </el-descriptions>
                </div>

                <!-- 监狱只读配置信息 -->
                <div class="config-section">
                    <div class="section-title">监狱配置参数</div>
                    <el-descriptions :column="4" border size="small">
                        <el-descriptions-item label="封禁时长">
                            {{ currentJailDetail.config.bantime || '未知' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="检测窗口">
                            {{ currentJailDetail.config.findtime || '未知' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="最大重试次数">
                            {{ currentJailDetail.config.maxretry || currentJailDetail.config.maxretry === 0 ?
                                `${currentJailDetail.config.maxretry}次` : '未知' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="白名单IP数量">
                            {{ (currentJailDetail.config.ignoreIpList || []).length }} 个
                        </el-descriptions-item>
                        <el-descriptions-item label="监狱白名单" :span="2">
                            <el-tag v-for="ip in (currentJailDetail.config.ignoreIpList || [])" :key="ip" size="mini"
                                style="margin: 3px;">
                                {{ ip }}
                            </el-tag>
                            <span v-if="!currentJailDetail.config.ignoreIpList.length" style="color: #909399;">
                                无白名单配置
                            </span>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>

                <!-- 封禁IP列表区域 -->
                <div class="banned-ips-section">
                    <div class="section-header">
                        <h4>当前被封禁IP ({{ (currentJailDetail.bannedIps || []).length }})</h4>
                        <div class="ip-actions">
                            <el-button type="primary" size="small" icon="el-icon-document-copy"
                                @click="copyDialogAllIps"
                                :disabled="!currentJailDetail.bannedIps || currentJailDetail.bannedIps.length === 0">
                                复制全部
                            </el-button>
                            <el-button type="success" size="small" icon="el-icon-check" @click="copyDialogSelectedIps"
                                :disabled="dialogSelectedIps.length === 0">
                                复制选中 ({{ dialogSelectedIps.length }})
                            </el-button>
                        </div>
                    </div>

                    <div class="banned-ips-list">
                        <el-checkbox v-for="ip in (currentJailDetail.bannedIps || [])" :key="ip"
                            v-model="dialogSelectedIps" :label="ip" class="ip-checkbox">
                            {{ ip }}
                            <el-button type="text" icon="el-icon-document-copy" size="mini"
                                @click.stop="copySingleIp(ip)" class="copy-btn">
                                复制
                            </el-button>
                            <el-button type="text" icon="el-icon-check" size="mini"
                                @click.stop="openConfirmDialog('unban', ip, currentJailDetail.name)" class="copy-btn">
                                解封
                            </el-button>
                        </el-checkbox>
                    </div>

                    <div v-if="!currentJailDetail.bannedIps || currentJailDetail.bannedIps.length === 0"
                        class="empty-text">
                        暂无被封禁的IP
                    </div>
                </div>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false; dialogSelectedIps = []">关闭</el-button>
            </span>
        </el-dialog>

        <!-- 攻击来源统计卡片 -->
        <div class="status-card">
            <div class="status-header">
                <h2>攻击来源统计 (Top 20)</h2>
                <div class="ip-actions">
                    <!-- 新增：统计行数选择 -->
                    <el-select v-model="statsLogLines" size="small" style="width: 140px;" @change="loadAttackStats">
                        <el-option label="最近5千行" :value="5000" />
                        <el-option label="最近1万行" :value="10000" />
                        <el-option label="最近5万行" :value="50000" />
                        <el-option label="最近10万行" :value="100000" />
                    </el-select>
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
                <el-table-column width="35" align="center">
                    <template v-slot="scope">
                        <el-checkbox v-model="selectedTopIps" :label="scope.row.ip" @change="handleTopIpSelect">
                        </el-checkbox>
                    </template>
                </el-table-column>
                <el-table-column prop="ip" label="攻击IP" width="150" />
                <el-table-column prop="count" label="攻击次数" width="100" align="center" />
                <!-- 新增：来源监狱列 -->
                <el-table-column label="来源监狱" width="160" align="center">
                    <template v-slot="scope">
                        <el-tag v-for="jail in scope.row.jails.split(', ')" :key="jail" size="mini" type="info"
                            style="margin: 2px;">
                            {{ jail }}
                        </el-tag>
                        <span v-if="!scope.row.jails" style="color: #909399;">未知</span>
                    </template>
                </el-table-column>
                <el-table-column label="威胁等级" width="120" align="center">
                    <template v-slot="scope">
                        <el-tag :type="getThreatLevel(scope.row.count)">
                            {{ getThreatLevelText(scope.row.count) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="封禁状态" width="90" align="center">
                    <template v-slot="scope">
                        <el-tag :type="isIpBanned(scope.row.ip) ? 'danger' : 'success'" size="small">
                            {{ isIpBanned(scope.row.ip) ? '已封禁' : '未封禁' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="120" align="center">
                    <template v-slot="scope">
                        <el-button v-if="!isIpBanned(scope.row.ip)" type="danger" size="mini" icon="el-icon-close"
                            @click="openConfirmDialog('ban', scope.row.ip)">
                            封禁
                        </el-button>
                        <el-button v-else type="success" size="mini" icon="el-icon-check"
                            @click="openConfirmDialog('unban', scope.row.ip)">
                            解封
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
                <el-tag v-for="ip in paginatedBannedIps" :key="ip" type="danger" style="margin: 5px;">
                    {{ ip }}
                    <el-button type="text" icon="el-icon-check" size="mini" @click.stop="openConfirmDialog('unban', ip)"
                        class="copy-btn">
                        解封
                    </el-button>
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

        <!-- 最近攻击日志卡片 -->
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
                    <span class="refresh-time">日志刷新: {{ logLastRefreshTime }}</span>
                </div>
            </div>

            <div class="log-container">
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

        <!-- 统一操作确认弹窗 -->
        <el-dialog title="操作安全确认" :visible.sync="confirmDialogVisible" width="480px" :close-on-click-modal="false"
            :style="`top: ${['ban', 'unban'].includes(confirmInfo.type) && confirmInfo.jailName ? 423 : getDialogVerticalOffset(getConfirmTypeHeight())}`"
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
                    <el-descriptions-item v-if="confirmInfo.ip" label="目标IP地址">
                        <span style="font-family: Consolas; font-weight: bold; font-size: 14px;">{{ confirmInfo.ip
                            }}</span>
                    </el-descriptions-item>
                    <el-descriptions-item v-if="confirmInfo.jailName" label="目标监狱">
                        {{ confirmInfo.jailName }}
                    </el-descriptions-item>
                </el-descriptions>

                <div class="whitelist-tip">
                    <i class="el-icon-info" style="color: #409eff; margin-right: 5px;"></i>
                    安全机制：本操作仅系统配置的白名单IP可执行，非授权IP将被拒绝并记录操作日志。
                    若执行失败，请确认当前访问IP已加入系统白名单。
                </div>

                <el-form v-if="confirmInfo.type === 'ban' && !confirmInfo.jailName" style="margin-top: 15px;"
                    size="small">
                    <el-form-item label="选择监狱" required style="margin-bottom: 0;">
                        <el-select v-model="confirmInfo.jailName" placeholder="请选择要操作的监狱" style="width: 100%;">
                            <el-option v-for="jail in jailList" :key="jail.name" :label="jail.name"
                                :value="jail.name" />
                        </el-select>
                    </el-form-item>
                </el-form>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="confirmDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="confirmLoading"
                    :disabled="confirmInfo.type !== 'startService' && confirmInfo.type !== 'stopService' && !confirmInfo.jailName"
                    @click="executeOperation">
                    确认执行
                </el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
// 导入所有Fail2ban相关API
import {
    getFail2banStatus,
    getJailList,
    getJailDetail,
    getRecentLogs,
    getAttackStats,
    getAllBannedIps,
    banIp,
    unbanIp,
    getCurrentIp,
    startService,
    stopService,
    startJail,
    stopJail
} from "@/api/fx67ll/server/fail2ban";

import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

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
            jailList: [],           // 所有监狱列表
            jailFilter: "",         // 监狱搜索过滤关键字

            // ==================== 弹窗控制 ====================
            dialogVisible: false,           // 弹窗显示状态
            currentJailDetail: null,        // 当前查看的监狱详情数据
            dialogSelectedIps: [],          // 弹窗内选中的IP列表

            // ==================== 攻击统计 ====================
            topAttackIps: [],       // 攻击来源Top 20
            trendData: [],          // 24小时攻击趋势数据
            maxTrendCount: 1,       // 趋势最大攻击数
            baselineMaxRetry: 5,    // 动态威胁等级基准阈值
            statsLogLines: 10000,  // 统计日志行数，默认10000行

            // ==================== 全量封禁IP ====================
            allBannedIps: [],       // 所有被封禁的IP（去重后）
            ipCurrentPage: 1,       // IP列表当前页码
            ipPageSize: 100,        // IP列表每页条数

            // ==================== 日志管理 ====================
            recentLogs: [],         // 原始日志数据
            logLevelFilter: "",     // 日志级别筛选
            logJailFilter: "",      // 监狱筛选
            logLimit: 200,          // 日志返回条数
            logCurrentPage: 1,      // 日志当前页码
            logPageSize: 50,        // 日志每页条数
            logLastRefreshTime: "", // 日志独立刷新时间

            // ==================== IP选择（攻击来源卡片） ====================
            selectedTopIps: [],     // Top攻击IP中选中的IP

            // ==================== IP防护操作台 ====================
            operationForm: {
                type: 'ban',
                jailName: '',
                ip: ''
            },
            currentIp: '获取中...', // 当前客户端IP

            // ==================== 统一确认弹窗 ====================
            confirmDialogVisible: false,
            confirmLoading: false,
            confirmInfo: {
                type: 'ban',
                ip: '',
                jailName: ''
            },

            // ==================== 加载状态 ====================
            isRefreshing: false,    // 整体刷新状态
            isLoadingLogs: false,   // 日志刷新状态

            // ==================== 其他 ====================
            lastRefreshTime: "",    // 最后刷新时间
            refreshInterval: null   // 自动刷新定时器
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
        },

        /**
         * 操作台提交按钮是否可用
         */
        canSubmitOperation() {
            const ipReg = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            return this.operationForm.jailName && ipReg.test(this.operationForm.ip);
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
        // 代理工具函数
        getDialogVerticalOffset(offset) {
            return getDialogVerticalOffset(offset);
        },

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
                    this.loadAllBannedIps(),
                    this.loadCurrentIp()
                ]);
                const now = this.formatDateTime(new Date());
                this.lastRefreshTime = now;
                this.logLastRefreshTime = now;
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
                this.logLastRefreshTime = this.formatDateTime(new Date());
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
 * 加载攻击统计数据
 * 【优化】：接收后端返回的基准阈值，用于动态判断威胁等级
 * 【新增】：支持自定义统计日志行数
 */
        async loadAttackStats() {
            const response = await getAttackStats({ logLines: this.statsLogLines });
            this.topAttackIps = response.data.topAttackIps || [];
            this.baselineMaxRetry = response.data.baselineMaxRetry || 5;

            // 转换趋势数据格式
            const trend = response.data.hourlyTrend || {};
            const now = new Date();
            const entries = Object.entries(trend);

            this.trendData = entries.map(([hour, count], index) => {
                const date = new Date(now.getTime() - (23 - index) * 60 * 60 * 1000);
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return {
                    dateTime: `${month}-${day} ${hour}`,
                    count
                };
            }).reverse();

            // 计算24小时内最大攻击次数
            this.maxTrendCount = Math.max(...this.trendData.map(item => item.count), 1);
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

        // ==================== 监狱详情弹窗相关方法 ====================

        /**
         * 打开监狱详情弹窗
         * @param {Object} row 监狱行数据
         */
        async openJailDetail(row) {
            try {
                const res = await getJailDetail(row.name);
                this.currentJailDetail = res.data;
                this.dialogSelectedIps = [];
                this.dialogVisible = true;
            } catch (err) {
                this.$message.error("获取监狱详情失败：" + (err.msg || err.message));
            }
        },

        /**
         * 复制弹窗中全部IP到剪贴板
         */
        async copyDialogAllIps() {
            const ips = this.currentJailDetail.bannedIps || [];
            if (ips.length === 0) {
                this.$message.warning("没有可复制的IP");
                return;
            }
            await this.copyToClipboard(ips.join("\n"));
            this.$message.success(`已复制 ${ips.length} 个IP`);
        },

        /**
         * 复制弹窗中选中的IP到剪贴板
         */
        async copyDialogSelectedIps() {
            if (this.dialogSelectedIps.length === 0) {
                this.$message.warning("请先选择要复制的IP");
                return;
            }
            await this.copyToClipboard(this.dialogSelectedIps.join("\n"));
            this.$message.success(`已复制 ${this.dialogSelectedIps.length} 个选中的IP`);
        },

        // ==================== IP复制通用方法 ====================

        /**
         * 复制单个IP到剪贴板
         * @param {String} ip IP地址
         */
        async copySingleIp(ip) {
            await this.copyToClipboard(ip);
            this.$message.success(`已复制IP: ${ip}`);
        },

        /**
         * 复制全部IP到剪贴板（通用方法）
         * @param {Array} ips IP地址数组
         */
        async copyAllIps(ips) {
            if (!ips || ips.length === 0) {
                this.$message.warning("没有可复制的IP");
                return;
            }
            await this.copyToClipboard(ips.join("\n"));
            this.$message.success(`已复制 ${ips.length} 个IP`);
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
            await this.copyToClipboard(this.selectedTopIps.join("\n"));
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
        },

        /**
         * 处理Top IP选择事件（自动去重）
         */
        handleTopIpSelect() {
            this.selectedTopIps = [...new Set(this.selectedTopIps)];
        },

        /**
         * 从列表中移除IP（仅前端显示）
         * @param {String} ip IP地址
         */
        removeIpFromList(ip) {
            this.allBannedIps = this.allBannedIps.filter(item => item !== ip);
        },

        // ==================== 封禁解封核心方法 ====================

        /**
         * 判断IP是否已被封禁（前端本地比对）
         * @param {String} ip IP地址
         * @returns {Boolean} 是否已封禁
         */
        isIpBanned(ip) {
            return this.allBannedIps.includes(ip);
        },

        /**
         * 打开统一确认弹窗
         * @param {String} type 操作类型 ban/unban/startService/stopService/startJail/stopJail
         * @param {String} ip 目标IP地址
         * @param {String} jailName 监狱名称
         */
        openConfirmDialog(type, ip = '', jailName = '') {
            this.confirmInfo = { type, ip, jailName };
            this.confirmDialogVisible = true;
        },

        /**
         * 操作台提交操作
         */
        submitOperation() {
            this.openConfirmDialog(
                this.operationForm.type,
                this.operationForm.ip,
                this.operationForm.jailName
            );
        },

        /**
         * 获取确认弹窗操作类型文本
         */
        getConfirmTypeText() {
            const typeMap = {
                'ban': '封禁IP',
                'unban': '解封IP',
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
                'startService': 350,
                'stopService': 350,
                'startJail': 350,
                'stopJail': 350
            };
            return typeMap[this.confirmInfo.type] || 'startService';
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

                // 操作成功后刷新相关数据
                await Promise.all([
                    this.loadServiceStatus(),
                    this.loadJailList(),
                    this.loadAllBannedIps()
                ]);

                // 清空操作台输入
                this.operationForm.ip = '';
            } catch (err) {
                this.$message.error(err.msg || '操作失败，请检查权限');
            } finally {
                this.confirmLoading = false;
            }
        },

        // ==================== 分页事件处理 ====================

        /**
         * 日志每页条数改变事件
         * @param {Number} size 新的每页条数
         */
        handleLogSizeChange(size) {
            this.logPageSize = size;
            this.logCurrentPage = 1;
        },

        /**
         * 日志页码改变事件
         * @param {Number} page 新的页码
         */
        handleLogCurrentChange(page) {
            this.logCurrentPage = page;
            // 滚动到日志容器顶部
            this.$el.querySelector('.log-container').scrollTop = 0;
        },

        /**
         * IP列表每页条数改变事件
         * @param {Number} size 新的每页条数
         */
        handleIpSizeChange(size) {
            this.ipPageSize = size;
            this.ipCurrentPage = 1;
        },

        /**
         * IP列表页码改变事件
         * @param {Number} page 新的页码
         */
        handleIpCurrentChange(page) {
            this.ipCurrentPage = page;
        },

        // ==================== 工具方法 ====================

        /**
         * 根据攻击次数获取威胁等级类型（动态基准）
         * 以监狱maxretry为基准：
         * - 达到1倍基准：低危
         * - 达到2倍基准：中危
         * - 达到5倍基准：高危
         * - 达到10倍基准：极高危
         * 
         * @param {Number} count 攻击次数
         * @returns {String} ElementUI标签类型
         */
        getThreatLevel(count) {
            const base = this.baselineMaxRetry;
            if (count >= base * 10) return "danger";
            if (count >= base * 5) return "warning";
            if (count >= base * 2) return "default";
            return "info";
        },

        /**
         * 根据攻击次数获取威胁等级文本
         * @param {Number} count 攻击次数
         * @returns {String} 威胁等级文本
         */
        getThreatLevelText(count) {
            const base = this.baselineMaxRetry;
            if (count >= base * 10) return "极高危";
            if (count >= base * 5) return "高危";
            if (count >= base * 2) return "中危";
            return "低危";
        },

        /**
         * 根据日志级别获取对应的CSS类
         * @param {String} level 日志级别
         * @returns {String} CSS类名
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
         * @param {Date} date 日期对象
         * @returns {String} 格式化后的日期字符串
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
         * @param {Number} num 数字
         * @returns {String} 补零后的两位字符串
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
    flex-wrap: wrap;
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

/* ==================== 图表容器 ==================== */
.chart-container {
    margin-top: 20px;
}

/* ==================== IP列表区域（通用） ==================== */
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

/* ==================== 配置区域样式 ==================== */
.config-section {
    margin: 0 0 30px 0;
}

.section-title {
    font-size: 15px;
    /* font-weight: 600; */
    color: #1f2d3d;
    margin-bottom: 12px;
    padding-left: 8px;
    border-left: 3px solid #409eff;
}

/* ==================== 全量封禁IP列表 ==================== */
.all-banned-ips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
}

/* ==================== 日志容器 ==================== */
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

/* ==================== 分页容器 ==================== */
.pagination-container {
    margin-top: 20px;
    text-align: right;
}

/* ==================== IP防护操作台样式（方案二） ==================== */
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
    margin-left: 12px;
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
@media (max-width: 900px) {
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

/* 仅监狱详情弹窗去除上下padding，左右保留20px，不污染其他弹窗 */
::v-deep .jail-detail-dialog .el-dialog__body {
    padding: 28px 20px !important;
}
</style>
