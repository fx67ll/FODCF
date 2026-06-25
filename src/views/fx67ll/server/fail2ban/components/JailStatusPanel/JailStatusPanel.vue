<template>
    <div>
        <!-- ==================== 监狱防护状态列表 ==================== -->
        <div class="status-card" v-loading="loading" element-loading-text="数据加载中..."
            element-loading-background="rgba(255, 255, 255, 0.8)">
            <div class="status-header">
                <h2>
                    监狱防护状态
                    <el-button type="text" icon="el-icon-refresh" @click="handleRefresh" :loading="loading"
                        class="refresh-btn">
                        手动刷新
                    </el-button>
                    <span v-if="lastRefreshTime" class="refresh-time">最后刷新: {{ lastRefreshTime }}</span>

                </h2>
                <div class="header-actions">
                    <div class="filter-container">
                        <el-input v-model="jailFilter" placeholder="搜索监狱" size="small"
                            style="width: 200px; margin-left: 16px;" prefix-icon="el-icon-search" />
                    </div>
                </div>
            </div>

            <el-table :data="paginatedJailList" border stripe style="width: 100%">
                <el-table-column prop="name" label="监狱名称" width="180" />
                <el-table-column label="运行状态" width="100" align="center">
                    <template v-slot="scope">
                        <el-tag :type="scope.row.status === '运行中' ? 'success' : 'info'" size="small">
                            {{ scope.row.status }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="当前失败" align="center">
                    <template v-slot="scope">
                        <span
                            :class="{ 'num-highlight-warning': scope.row.currentlyFailed && scope.row.currentlyFailed !== 0 }">
                            {{ scope.row.currentlyFailed }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="失败尝试" align="center">
                    <template v-slot="scope">
                        <span
                            :class="{ 'num-highlight-warning': scope.row.totalFailed && scope.row.totalFailed !== 0 }">
                            {{ scope.row.totalFailed }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="当前封禁" align="center">
                    <template v-slot="scope">
                        <span
                            :class="{ 'num-highlight-danger': scope.row.currentlyBanned && scope.row.currentlyBanned !== 0 }">
                            {{ scope.row.currentlyBanned }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="累计封禁" align="center">
                    <template v-slot="scope">
                        <span :class="{ 'num-highlight-danger': scope.row.totalBanned && scope.row.totalBanned !== 0 }">
                            {{ scope.row.totalBanned }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="180" align="center">
                    <template v-slot="scope">
                        <el-button type="primary" size="small" @click="openJailDetail(scope.row)">
                            详情
                        </el-button>
                        <el-button v-if="scope.row.status === '运行中'" type="danger" size="small"
                            @click="handleOpenConfirm('stopJail', '', scope.row.name)">
                            停止
                        </el-button>
                        <el-button v-else type="success" size="small"
                            @click="handleOpenConfirm('startJail', '', scope.row.name)">
                            启动
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 监狱列表分页 -->
            <div class="pagination-container" v-if="filteredJailList.length > jailPageSize">
                <el-pagination @size-change="handleJailSizeChange" @current-change="handleJailCurrentChange"
                    :current-page="jailCurrentPage" :page-sizes="[5, 10, 20]" :page-size="jailPageSize"
                    layout="total, sizes, prev, pager, next, jumper" :total="filteredJailList.length" background>
                </el-pagination>
            </div>
        </div>

        <!-- ==================== 监狱详情弹窗 ==================== -->
        <el-dialog :title="(currentJailDetail ? currentJailDetail.name : '') + ' 监狱详情'" :visible.sync="dialogVisible"
            width="830px" :close-on-click-modal="false" @close="dialogVisible = false; dialogSelectedIps = []"
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
                        <h4>当前监狱被封禁IP列表 (共 {{ (currentJailDetail.bannedIps || []).length }} 个)</h4>
                        <!-- 复制按钮移至底部footer，此处清空 -->
                        <div class="ip-actions"></div>
                    </div>

                    <div class="banned-ips-list">
                        <el-checkbox v-for="ip in (currentJailDetail.bannedIps || [])" :key="ip"
                            v-model="dialogSelectedIps" :label="ip" class="ip-checkbox">
                            {{ ip }}
                            <el-button type="text" icon="el-icon-check" size="mini"
                                @click.stop="handleOpenConfirm('unban', ip, currentJailDetail.name)" class="copy-btn">
                                解封
                            </el-button>
                            <el-button type="text" icon="el-icon-document-copy" size="mini"
                                @click.stop="copySingleIp(ip)" class="copy-btn" />
                        </el-checkbox>
                    </div>

                    <div v-if="!currentJailDetail.bannedIps || currentJailDetail.bannedIps.length === 0"
                        class="empty-text">
                        暂无被封禁的IP
                    </div>
                </div>
            </div>
            <!-- 弹窗底部footer：新增一键解封、复制全部、复制选中按钮，整体加v-if判空，彻底避免空指针 -->
            <span slot="footer" class="dialog-footer" v-if="currentJailDetail">
                <el-button type="danger" size="small" icon="el-icon-delete" @click="handleUnbanAllCurrentJail"
                    :disabled="!currentJailDetail.bannedIps || currentJailDetail.bannedIps.length === 0">
                    一键解封本监狱全部IP
                </el-button>
                <el-button type="primary" size="small" icon="el-icon-document-copy" @click="copyDialogAllIps"
                    :disabled="!currentJailDetail.bannedIps || currentJailDetail.bannedIps.length === 0">
                    复制全部IP
                </el-button>
                <el-button type="success" size="small" icon="el-icon-check" @click="copyDialogSelectedIps"
                    :disabled="dialogSelectedIps.length === 0">
                    复制选中 ({{ dialogSelectedIps.length }})
                </el-button>
                <el-button @click="dialogVisible = false; dialogSelectedIps = []">关闭</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
import { getJailDetail } from "@/api/fx67ll/server/fail2ban";
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
    name: "JailStatusPanel",
    props: {
        jailList: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        },
        lastRefreshTime: {
            type: String,
            default: ""
        }
    },
    data() {
        return {
            // ==================== 监狱管理 ====================
            jailFilter: "",             // 监狱搜索过滤关键字
            jailCurrentPage: 1,         // 监狱列表当前页码
            jailPageSize: 5,            // 监狱列表每页条数

            // ==================== 弹窗控制 ====================
            dialogVisible: false,               // 弹窗显示状态
            currentJailDetail: null,            // 当前查看的监狱详情数据
            dialogSelectedIps: []               // 弹窗内选中的IP列表
        };
    },
    computed: {
        /**
         * 过滤后的监狱列表（支持搜索，运行中排最前）
         */
        filteredJailList() {
            let list = this.jailList;
            if (this.jailFilter) {
                list = list.filter(jail =>
                    jail.name.toLowerCase().includes(this.jailFilter.toLowerCase())
                );
            }
            // 运行中的监狱排在最前面
            return [...list].sort((a, b) => {
                if (a.status === '运行中' && b.status !== '运行中') return -1;
                if (a.status !== '运行中' && b.status === '运行中') return 1;
                return 0;
            });
        },

        /**
         * 分页后的监狱列表
         */
        paginatedJailList() {
            const start = (this.jailCurrentPage - 1) * this.jailPageSize;
            const end = start + this.jailPageSize;
            return this.filteredJailList.slice(start, end);
        }
    },
    watch: {
        /**
         * 监狱搜索关键字变化时重置分页到第一页
         */
        jailFilter() {
            this.jailCurrentPage = 1;
        }
    },
    methods: {
        // 代理工具函数
        getDialogVerticalOffset(offset) {
            return getDialogVerticalOffset(offset);
        },

        /**
         * 点击刷新按钮
         */
        handleRefresh() {
            this.$emit('refresh');
        },

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
                if (!err._isHandled) {
                    this.$message.error("获取监狱详情失败：" + (err.msg || err.message));
                }
            }
        },

        /**
         * 一键解封当前监狱全部封禁IP
         */
        handleUnbanAllCurrentJail() {
            if (!this.currentJailDetail) return;
            // 抛出操作类型 unban-all-jail，携带当前监狱名称
            this.$emit('open-confirm', 'unban-all-jail', '', this.currentJailDetail.name);
        },

        /**
         * 刷新弹窗中的监狱详情数据（操作成功后由父组件调用）
         */
        async refreshJailDetail() {
            if (!this.dialogVisible || !this.currentJailDetail) return;
            try {
                const res = await getJailDetail(this.currentJailDetail.name);
                this.currentJailDetail = res.data;
                // 清空选中状态（IP列表可能已变化）
                this.dialogSelectedIps = [];
            } catch (err) {
                // 刷新详情失败不影响主流程，静默处理
                console.warn('刷新监狱详情失败:', err);
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
         * 通知父组件打开确认弹窗
         * @param {String} type 操作类型
         * @param {String} ip 目标IP地址
         * @param {String} jailName 监狱名称
         */
        handleOpenConfirm(type, ip = '', jailName = '') {
            this.$emit('open-confirm', type, ip, jailName);
        },

        // ==================== 分页事件处理 ====================

        /**
         * 监狱每页条数改变事件
         * @param {Number} size 新的每页条数
         */
        handleJailSizeChange(size) {
            this.jailPageSize = size;
            this.jailCurrentPage = 1;
        },

        /**
         * 监狱页码改变事件
         * @param {Number} page 新的页码
         */
        handleJailCurrentChange(page) {
            this.jailCurrentPage = page;
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

.header-actions {
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

/* ==================== 分页容器 ==================== */
.pagination-container {
    margin-top: 20px;
    text-align: left;
}

/* ==================== 列表数字高亮样式 - 非零值高亮放大加粗 ==================== */
/* 风险超标：匹配图表超标柱子顶部浅蜜桃红，低饱和柔和，视觉统一不刺眼 */
.num-highlight-danger {
    color: #ff8787;
    font-weight: bold;
    font-size: 28px;
    cursor: pointer;
}

/* 预警待处理：温润浅杏橙，贴合页面清新淡色调，不抢蓝/粉主视觉 */
.num-highlight-warning {
    color: #f7bc78;
    font-weight: bold;
    font-size: 28px;
    cursor: pointer;
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
    transition: transform 0.2s;
}

.copy-btn:hover {
    transform: scale(1.25);
    position: relative;
    top: -1px;
}

.empty-text {
    color: #8392a5;
    font-size: 14px;
    text-align: center;
    padding: 20px;
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

/* 仅监狱详情弹窗去除上下padding，左右保留20px，不污染其他弹窗 */
::v-deep .jail-detail-dialog .el-dialog__body {
    padding: 28px 20px !important;
}

/* 弹窗底部按钮间距 */
::v-deep .jail-detail-dialog .dialog-footer {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
}

/* ==================== 响应式适配 ==================== */
@media (max-width: 768px) {
    .header-actions {
        flex-wrap: wrap;
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
