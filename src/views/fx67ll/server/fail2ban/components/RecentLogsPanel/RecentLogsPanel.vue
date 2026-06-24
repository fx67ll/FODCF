<template>
    <div class="status-card" v-loading="isLoading" element-loading-text="数据加载中..."
        element-loading-background="rgba(255, 255, 255, 0.8)">
        <div class="status-header">
            <h2>最近攻击日志</h2>
            <div class="filter-container">
                <el-select v-model="logLevelFilter" placeholder="日志级别" size="small" style="width: 120px;"
                    @change="handleFilterChange">
                    <el-option label="全部" value="" />
                    <el-option label="ERROR" value="ERROR" />
                    <el-option label="WARN" value="WARN" />
                    <el-option label="INFO" value="INFO" />
                </el-select>
                <el-select v-model="logJailFilter" placeholder="监狱" size="small" style="width: 120px;"
                    @change="handleFilterChange">
                    <el-option label="全部" value="" />
                    <el-option v-for="jail in jailList" :key="jail.name" :label="jail.name"
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
                <el-button type="text" icon="el-icon-refresh" @click="handleRefresh" :loading="isLoading"
                    class="refresh-btn">
                    刷新日志
                </el-button>
                <span v-if="lastRefreshTime" class="refresh-time">最后刷新: {{ lastRefreshTime }}</span>
            </div>
        </div>

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

        <!-- 日志分页 -->
        <div class="pagination-container" v-if="filteredLogs.length > logPageSize">
            <el-pagination @size-change="handleLogSizeChange" @current-change="handleLogCurrentChange"
                :current-page="logCurrentPage" :page-sizes="[20, 50, 100]" :page-size="logPageSize"
                layout="total, sizes, prev, pager, next, jumper" :total="filteredLogs.length" background>
            </el-pagination>
        </div>
    </div>
</template>

<script>
import { getRecentLogs } from "@/api/fx67ll/server/fail2ban";

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
            recentLogs: [],              // 原始日志数据
            logLevelFilter: "",          // 日志级别筛选
            logJailFilter: "",           // 监狱筛选
            logLimit: 200,               // 日志返回条数
            logCurrentPage: 1,           // 日志当前页码
            logPageSize: 50,             // 日志每页条数

            // ==================== 加载状态（计数器，支持并发刷新互不干扰） ====================
            loadingCount: 0              // 日志加载计数器，>0 时显示loading
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
         */
        handleLogLimitChange() {
            this.refresh(true);
        },

        /**
         * 日志级别或监狱筛选改变事件
         * 切换筛选条件后重新请求后端数据
         */
        handleFilterChange() {
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
        },

        /**
         * 日志页码改变事件
         * @param {Number} page 新的页码
         */
        handleLogCurrentChange(page) {
            this.logCurrentPage = page;
            // 滚动到日志容器顶部
            if (this.$refs.logContainer) {
                this.$refs.logContainer.scrollTop = 0;
            }
        },

        // ==================== 工具方法 ====================

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

.refresh-time {
    font-size: 12px;
    color: #8392a5;
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
    margin-top: 20px;
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
