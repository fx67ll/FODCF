<template>
    <div class="status-card" v-loading="isLoading" element-loading-text="数据加载中..."
        element-loading-background="rgba(255, 255, 255, 0.8)">
        <div class="status-header">
            <h2>
                最近攻击日志
                <el-button type="text" icon="el-icon-refresh" @click="handleRefresh" :loading="isLoading"
                    class="refresh-btn">
                    手动刷新
                </el-button>
                <span v-if="lastRefreshTime" class="refresh-time">最后刷新: {{ lastRefreshTime }}</span>
            </h2>
            <div class="filter-container">
                <el-select v-model="logLevelFilter" placeholder="日志级别" size="small" style="width: 120px;" clearable
                    @change="handleFilterChange" @clear="handleFilterClear">
                    <el-option label="全部" value="" />
                    <el-option label="ERROR" value="ERROR" />
                    <el-option label="WARN" value="WARN" />
                    <el-option label="INFO" value="INFO" />
                </el-select>
                <el-select v-model="logJailFilter" placeholder="监狱" size="small" style="width: 120px;" clearable
                    @change="handleFilterChange" @clear="handleFilterClear">
                    <el-option label="全部" value="" />
                    <el-option v-for="jail in jailList" :key="jail.name" :label="jail.name" :value="jail.name" />
                </el-select>
                <el-select v-model="logLimit" placeholder="日志条数" size="small" style="width: 120px;"
                    @change="handleLogLimitChange">
                    <el-option label="50条" :value="50" />
                    <el-option label="100条" :value="100" />
                    <el-option label="200条" :value="200" />
                    <el-option label="500条" :value="500" />
                    <el-option label="1000条" :value="1000" />
                </el-select>
                <el-button type="text" icon="el-icon-circle-close" @click="handleResetFilters" class="reset-btn"
                    title="重置筛选条件为初始状态">
                    重置筛选
                </el-button>
            </div>
        </div>

        <div class="log-container-wrapper">
            <div class="log-container" ref="logContainer">
                <div v-for="(log, index) in paginatedLogs" :key="index" class="log-line"
                    :class="getLogClass(log.level)">
                    <span>[{{ log.date }} {{ log.time }}] [{{ log.level }}] {{ log.message }}</span>
                    <el-button v-if="log.ip" type="text" icon="el-icon-document-copy" size="mini"
                        @click="copySingleIp(log.ip)" class="copy-btn">
                        复制IP
                    </el-button>
                </div>
                <div v-if="filteredLogs.length === 0" class="empty-text">
                    暂无符合条件的日志
                </div>
            </div>
            <el-button type="text" icon="el-icon-full-screen" size="mini" @click="toggleFullscreen"
                class="fullscreen-btn" title="全屏显示日志">
            </el-button>
        </div>

        <!-- 日志分页 -->
        <div class="pagination-container" v-if="filteredLogs.length > 0">
            <el-pagination @size-change="handleLogSizeChange" @current-change="handleLogCurrentChange"
                :current-page="logCurrentPage" :page-sizes="pageSizeOptions" :page-size="logPageSize"
                layout="total, sizes, prev, pager, next, jumper" :total="filteredLogs.length" background>
            </el-pagination>
        </div>

        <!-- 全屏日志对话框 -->
        <el-dialog :visible.sync="isFullscreen" custom-class="fullscreen-log-dialog" :close-on-click-modal="false"
            :show-close="false" :modal="true" :append-to-body="true" fullscreen>
            <template slot="title">
                <div class="fullscreen-dialog-title-bar">
                    <span class="fullscreen-dialog-title">最近攻击日志</span>
                    <div class="fullscreen-filter-container">
                        <el-select v-model="logLevelFilter" placeholder="日志级别" size="small" style="width: 120px;"
                            clearable @change="handleFilterChange" @clear="handleFilterClear">
                            <el-option label="全部" value="" />
                            <el-option label="ERROR" value="ERROR" />
                            <el-option label="WARN" value="WARN" />
                            <el-option label="INFO" value="INFO" />
                        </el-select>
                        <el-select v-model="logJailFilter" placeholder="监狱" size="small" style="width: 120px;" clearable
                            @change="handleFilterChange" @clear="handleFilterClear">
                            <el-option label="全部" value="" />
                            <el-option v-for="jail in jailList" :key="'fs-jail-' + jail.name" :label="jail.name"
                                :value="jail.name" />
                        </el-select>
                        <el-select v-model="logLimit" placeholder="日志条数" size="small" style="width: 120px;"
                            @change="handleLogLimitChange">
                            <el-option label="50条" :value="50" />
                            <el-option label="100条" :value="100" />
                            <el-option label="200条" :value="200" />
                            <el-option label="500条" :value="500" />
                            <el-option label="1000条" :value="1000" />
                        </el-select>
                        <el-button type="text" icon="el-icon-circle-close" @click="handleResetFilters" class="reset-btn"
                            title="重置筛选条件为初始状态">
                            重置筛选
                        </el-button>
                        <span></span>
                        <el-button type="text" icon="el-icon-refresh" @click="handleRefresh" :loading="isLoading"
                            class="refresh-btn">
                            刷新日志
                        </el-button>
                        <span v-if="lastRefreshTime" class="refresh-time">最后刷新: {{ lastRefreshTime }}</span>
                    </div>
                    <el-button type="text" icon="el-icon-close" @click="toggleFullscreen" class="fullscreen-close-btn">
                        退出全屏模式
                    </el-button>
                </div>
            </template>
            <div class="fullscreen-dialog-body" v-loading="isLoading" element-loading-text="数据加载中..."
                element-loading-background="rgba(255, 255, 255, 0.8)">
                <div class="fullscreen-log-container" ref="fullscreenLogContainer">
                    <div v-for="(log, index) in paginatedLogs" :key="'fs-' + index" class="log-line"
                        :class="getLogClass(log.level)">
                        <span>[{{ log.date }} {{ log.time }}] [{{ log.level }}] {{ log.message }}</span>
                        <el-button v-if="log.ip" type="text" icon="el-icon-document-copy" size="mini"
                            @click="copySingleIp(log.ip)" class="copy-btn">
                            复制IP
                        </el-button>
                    </div>
                    <div v-if="filteredLogs.length === 0" class="empty-text">
                        暂无符合条件的日志
                    </div>
                </div>
                <div class="pagination-container fullscreen-pagination" v-if="filteredLogs.length > 0">
                    <el-pagination @size-change="handleLogSizeChange" @current-change="handleLogCurrentChange"
                        :current-page="logCurrentPage" :page-sizes="pageSizeOptions" :page-size="logPageSize"
                        layout="total, sizes, prev, pager, next, jumper" :total="filteredLogs.length" background>
                    </el-pagination>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { getRecentLogs } from "@/api/fx67ll/server/fail2ban";

// ==================== 初始默认值 ====================
const DEFAULT_LOG_LEVEL_FILTER = "";
const DEFAULT_LOG_JAIL_FILTER = "";
const DEFAULT_LOG_LIMIT = 200;
const DEFAULT_LOG_PAGE_SIZE = 50;

export default {
    name: "RecentLogsPanel",
    props: {
        jailList: {
            type: Array,
            default: () => []
        },
        lastRefreshTime: {
            type: String,
            default: ""
        }
    },
    data() {
        return {
            // ==================== 日志数据 ====================
            recentLogs: [],                              // 原始日志数据
            logLevelFilter: DEFAULT_LOG_LEVEL_FILTER,   // 日志级别筛选
            logJailFilter: DEFAULT_LOG_JAIL_FILTER,     // 监狱筛选
            logLimit: DEFAULT_LOG_LIMIT,                // 日志返回条数
            logCurrentPage: 1,                          // 日志当前页码
            logPageSize: DEFAULT_LOG_PAGE_SIZE,         // 日志每页条数

            // ==================== 加载状态（计数器，支持并发刷新互不干扰） ====================
            loadingCount: 0,             // 日志加载计数器，>0 时显示loading
            isFullscreen: false,         // 是否全屏显示日志
            fullscreenLogHeight: "400px" // 全屏日志容器高度（动态计算）
        };
    },
    computed: {
        /**
         * 是否正在加载（基于计数器，并发刷新时不会提前消失）
         */
        isLoading() {
            return this.loadingCount > 0;
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
         * 动态计算分页每页条数下拉选项
         * 20一定有，然后 50/100/200/500/1000 中 <= logLimit 的才显示
         * 例如 logLimit=200 → [20, 50, 100, 200]
         * 例如 logLimit=1000 → [20, 50, 100, 200, 500, 1000]
         */
        pageSizeOptions() {
            const candidates = [20, 50, 100, 200, 500, 1000];
            return candidates.filter(size => size <= this.logLimit);
        }
    },
    watch: {
        /**
         * 全屏状态变化时动态计算日志容器高度
         */
        isFullscreen(val) {
            if (val) {
                this.$nextTick(() => {
                    this.calcFullscreenLogHeight();
                });
            }
        }
    },
    methods: {
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
         * 刷新日志数据（供内部刷新按钮和父组件ref调用）
         * 使用计数器机制，并发刷新时loading不会提前消失
         * @param {Boolean} showLoading 是否显示loading效果，默认true
         */
        refresh(showLoading = true) {
            if (showLoading) {
                this.loadingCount++;
            }
            this.loadRecentLogs().finally(() => {
                if (showLoading && this.loadingCount > 0) {
                    this.loadingCount--;
                }
            });
        },

        /**
         * 点击刷新按钮
         */
        handleRefresh() {
            this.refresh(true);
        },

        /**
         * 日志查询条数改变事件
         * 切换条数后需要重新请求后端数据
         * 如果当前每页条数超过新的最大日志条数，需要降级到最大可用值
         */
        handleLogLimitChange() {
            // pageSizeOptions 变化后，确保当前 pageSize 不超过最大选项
            const maxPageSize = this.pageSizeOptions[this.pageSizeOptions.length - 1];
            if (this.logPageSize > maxPageSize) {
                this.logPageSize = maxPageSize;
            }
            this.refresh(true);
        },

        /**
         * 日志级别或监狱筛选改变事件
         * 切换筛选条件后重新请求后端数据
         */
        handleFilterChange() {
            this.refresh(true);
        },

        /**
         * el-select clear按钮点击事件
         * clear后值变为null，需要手动重置为初始空字符串并刷新
         */
        handleFilterClear() {
            if (this.logLevelFilter === null) {
                this.logLevelFilter = DEFAULT_LOG_LEVEL_FILTER;
            }
            if (this.logJailFilter === null) {
                this.logJailFilter = DEFAULT_LOG_JAIL_FILTER;
            }
            this.refresh(true);
        },

        /**
         * 重置筛选条件为初始状态
         * 重置所有筛选下拉、日志条数、分页参数，并重新请求数据
         * 解决分页切到最大值后分页器消失的问题
         */
        handleResetFilters() {
            this.logLevelFilter = DEFAULT_LOG_LEVEL_FILTER;
            this.logJailFilter = DEFAULT_LOG_JAIL_FILTER;
            this.logLimit = DEFAULT_LOG_LIMIT;
            this.logPageSize = DEFAULT_LOG_PAGE_SIZE;
            this.logCurrentPage = 1;
            this.refresh(true);
        },

        // ==================== 分页事件处理 ====================

        /**
         * 日志每页条数改变事件
         * @param {Number} size 新的每页条数
         */
        handleLogSizeChange(size) {
            this.logPageSize = size;
            this.logCurrentPage = 1;
            // 全屏模式下也需要重新计算高度
            if (this.isFullscreen) {
                this.$nextTick(() => {
                    this.calcFullscreenLogHeight();
                });
            }
        },

        /**
         * 日志页码改变事件
         * @param {Number} page 新的页码
         */
        handleLogCurrentChange(page) {
            this.logCurrentPage = page;
            // 滚动到日志容器顶部
            if (this.isFullscreen && this.$refs.fullscreenLogContainer) {
                this.$refs.fullscreenLogContainer.scrollTop = 0;
            } else if (this.$refs.logContainer) {
                this.$refs.logContainer.scrollTop = 0;
            }
        },

        // ==================== 工具方法 ====================

        /**
         * 切换全屏显示日志
         */
        toggleFullscreen() {
            this.isFullscreen = !this.isFullscreen;
        },

        /**
         * 动态计算全屏日志容器高度
         * 确保页面整体不滚动，仅日志区域滚动
         * 公式：视口高度 - 标题栏高度 - 分页栏高度 - 边距
         */
        calcFullscreenLogHeight() {
            const vh = window.innerHeight || document.documentElement.clientHeight;
            // el-dialog fullscreen 的标题栏约 54px，标题栏内自定义区域约 40px
            // 分页栏约 50px，上下边距各 20px，日志区域内边距 30px
            const titleBarHeight = 54;
            const customTitleContentHeight = 40;
            const paginationHeight = 50;
            const paddingTotal = 40;
            const logPadding = 30;
            // 如果没有分页，不分页高度
            const hasPagination = this.filteredLogs.length > this.logPageSize;
            const totalOffset = titleBarHeight + customTitleContentHeight + paddingTotal + logPadding
                + (hasPagination ? paginationHeight : 0);
            this.fullscreenLogHeight = (vh - totalOffset) + "px";
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
                await navigator.clipboard.writeText(text);
            } catch (err) {
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
         * 数字补零函数
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

.filter-container {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

/* ==================== 刷新按钮 ==================== */
.refresh-btn {
    color: #409eff;
    font-size: 12px;
    padding: 4px 8px;
}

.reset-btn {
    color: #f56c6c;
    font-size: 12px;
    padding: 4px 8px;
}

.reset-btn:hover {
    color: #e04040;
}

.refresh-time {
    font-size: 12px;
    color: #8392a5;
}

/* ==================== 日志容器 ==================== */
.log-container-wrapper {
    position: relative;
}

.log-container {
    background-color: #1f2d3d;
    border-radius: 4px;
    padding: 15px;
    max-height: 400px;
    overflow-y: auto;
    font-family: "Consolas", "Monaco", monospace;
    font-size: 12px;
}

.fullscreen-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    color: #b0b8c5;
    font-size: 16px;
    padding: 2px 8px;
    z-index: 1;
    transition: color 0.2s;
}

.fullscreen-btn:hover {
    color: #409eff;
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

.copy-btn {
    margin-left: 10px;
    padding: 2px 4px;
    transition: transform 0.2s;
}

.copy-btn:hover {
    transform: scale(1.15);
    position: relative;
    top: -2px;
}

.empty-text {
    color: #8392a5;
    font-size: 14px;
    text-align: center;
    padding: 20px;
}

/* ==================== 分页容器 ==================== */
.pagination-container {
    margin-top: 10px;
    text-align: left;
}

/* ==================== 响应式适配 ==================== */
@media (max-width: 768px) {
    .filter-container {
        flex-wrap: wrap;
        margin-top: 10px;
    }
}
</style>

<!-- 全屏对话框样式需要非scoped，因为el-dialog通过append-to-body挂载到body上 -->
<style>
/* ==================== 全屏对话框布局 ==================== */
.fullscreen-log-dialog .el-dialog__header {
    padding: 10px 20px;
    border-bottom: 1px solid #ebeef5;
}

.fullscreen-log-dialog .el-dialog__body {
    padding: 0 20px 20px 20px;
    overflow: hidden;
}

.fullscreen-dialog-title-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
}

.fullscreen-dialog-title {
    font-size: 18px;
    font-weight: bold;
    color: #1f2d3d;
}

.fullscreen-filter-container {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.fullscreen-close-btn {
    color: #909399;
    font-size: 14px;
}

.fullscreen-close-btn:hover {
    color: #409eff;
}

.fullscreen-log-dialog .reset-btn {
    color: #f56c6c;
    font-size: 12px;
    padding: 4px 8px;
}

.fullscreen-log-dialog .reset-btn:hover {
    color: #e04040;
}

/* ==================== 全屏对话框日志内容区 ==================== */
.fullscreen-dialog-body {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 95px);
    margin-top: 16px;
}

.fullscreen-log-container {
    background-color: #1f2d3d;
    border-radius: 4px;
    padding: 15px;
    flex: 1;
    overflow-y: auto;
    font-family: "Consolas", "Monaco", monospace;
    font-size: 12px;
}

.fullscreen-log-dialog .log-line {
    line-height: 1.6;
    word-break: break-all;
    padding: 2px 0;
    display: flex;
    align-items: center;
}

.fullscreen-log-dialog .log-error {
    color: #ff4d4f;
}

.fullscreen-log-dialog .log-warn {
    color: #faad14;
}

.fullscreen-log-dialog .log-info {
    color: #52c41a;
}

.fullscreen-log-dialog .log-debug {
    color: #8392a5;
}

.fullscreen-log-dialog .copy-btn {
    margin-left: 10px;
    padding: 2px 4px;
    transition: transform 0.2s;
}

.fullscreen-log-dialog .copy-btn:hover {
    transform: scale(1.15);
    position: relative;
    top: -2px;
}

.fullscreen-log-dialog .empty-text {
    color: #8392a5;
    font-size: 14px;
    text-align: center;
    padding: 20px;
}

.fullscreen-pagination {
    margin-top: 15px;
    text-align: left;
    flex-shrink: 0;
}
</style>
