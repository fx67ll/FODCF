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
                <el-table-column label="总失败尝试" align="center">
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
                <el-table-column label="操作" width="280" align="center">
                    <template v-slot="scope">
                        <el-button @click="openJailDetail(scope.row)" class="pill-btn pill-detail">
                            <span class="pill-icon">🔍</span>
                            <span class="pill-text">查看</span>
                        </el-button>
                        <el-button v-if="scope.row.status === '运行中'" @click="handleOpenConfigEdit(scope.row.name)"
                            class="pill-btn pill-config">
                            <span class="pill-icon">⚙️</span>
                            <span class="pill-text">配置</span>
                        </el-button>
                        <el-button v-if="scope.row.status === '运行中'"
                            @click="handleOpenConfirm('stopJail', '', scope.row.name)" class="pill-btn pill-stop">
                            <span class="pill-icon">🔒</span>
                            <span class="pill-text">停止</span>
                        </el-button>
                        <el-button v-else @click="handleOpenConfirm('startJail', '', scope.row.name)"
                            class="pill-btn pill-start">
                            <span class="pill-icon">🕹️</span>
                            <span class="pill-text">启动</span>
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

        <!-- ==================== 监狱详情弹窗（子组件） ==================== -->
        <JailDetailDialog :visible.sync="dialogVisible" :jail-detail="currentJailDetail"
            @open-confirm="handleOpenConfirm" @open-config-edit="handleOpenConfigEdit" />

        <!-- ==================== 配置修改弹窗（子组件） ==================== -->
        <JailConfigEditDialog :visible.sync="configDialogVisible" :jail-name="currentEditJailName"
            @config-updated="handleConfigUpdated" />
    </div>
</template>

<script>
import { getJailDetail } from "@/api/fx67ll/server/fail2ban";
import JailDetailDialog from "./JailDetailDialog.vue";
import JailConfigEditDialog from "./JailConfigEditDialog.vue";

export default {
    name: "JailStatusPanel",
    components: {
        JailDetailDialog,
        JailConfigEditDialog
    },
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

            // ==================== 配置修改弹窗控制 ====================
            configDialogVisible: false,         // 配置修改弹窗显示状态
            currentEditJailName: ""             // 当前修改配置的监狱名称
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
                this.dialogVisible = true;
            } catch (err) {
                if (!err._isHandled) {
                    this.$message.error("获取监狱详情失败：" + (err.msg || err.message));
                }
            }
        },

        /**
         * 刷新弹窗中的监狱详情数据（操作成功后由父组件调用）
         */
        async refreshJailDetail() {
            if (!this.dialogVisible || !this.currentJailDetail) return;
            try {
                const res = await getJailDetail(this.currentJailDetail.name);
                this.currentJailDetail = res.data;
            } catch (err) {
                // 刷新详情失败不影响主流程，静默处理
                console.warn('刷新监狱详情失败:', err);
            }
        },

        /**
         * 打开配置修改弹窗
         * @param {String} jailName 监狱名称
         */
        handleOpenConfigEdit(jailName) {
            this.currentEditJailName = jailName;
            this.configDialogVisible = true;
        },

        /**
         * 配置修改成功回调，刷新列表与详情数据
         */
        handleConfigUpdated() {
            // 触发父组件刷新列表
            this.$emit('refresh');
            // 同步刷新详情弹窗数据
            this.refreshJailDetail();
        },

        /**
         * 通知父组件打开确认弹窗（同时转发子组件的确认事件）
         * @param {String} type 操作类型
         * @param {String} ip 目标IP地址
         * @param {String} jailName 监狱名称
         * @param {Array} ips 批量操作IP列表（可选）
         */
        handleOpenConfirm(type, ip = '', jailName = '', ips) {
            this.$emit('open-confirm', type, ip, jailName, ips);
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
    margin-bottom: 20px;
    padding-bottom: 10px;
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
    color: #fcac50;
    font-weight: bold;
    font-size: 28px;
    cursor: pointer;
}

/* ==================== 监狱列表操作按钮（椭圆药丸按钮） ==================== */
/* 清新配色，非 Element 主题色：天蓝 / 暖黄 / 珊瑚红 / 薄荷绿 */
.pill-btn {
    height: 30px;
    padding: 0 14px;
    border: none;
    border-radius: 15px;
    color: #fff;
    font-size: 13px;
    line-height: 30px;
    transition: all 0.25s ease;
}

.pill-btn:hover,
.pill-btn:focus {
    color: #fff;
}

.pill-btn .pill-icon {
    font-size: 13px;
    transition: font-size 0.25s ease;
    vertical-align: middle;
}

.pill-btn .pill-text {
    margin-left: 4px;
    vertical-align: middle;
}

/* hover：emoji 放大 + 底色变浅更透明 */
.pill-btn:hover .pill-icon {
    font-size: 16px;
}

/* 详情：天蓝 */
.pill-detail {
    background-color: rgba(91, 155, 245, 0.85);
    box-shadow: 0 2px 6px rgba(91, 155, 245, 0.3);
}

.pill-detail:hover,
.pill-detail:focus {
    background-color: rgba(91, 155, 245, 0.5);
    box-shadow: 0 2px 8px rgba(91, 155, 245, 0.25);
}

/* 配置：暖黄 */
.pill-config {
    background-color: rgba(245, 194, 66, 0.85);
    box-shadow: 0 2px 6px rgba(245, 194, 66, 0.3);
}

.pill-config:hover,
.pill-config:focus {
    background-color: rgba(245, 194, 66, 0.5);
    box-shadow: 0 2px 8px rgba(245, 194, 66, 0.25);
}

/* 停止：珊瑚红 */
.pill-stop {
    background-color: rgba(248, 113, 108, 0.85);
    box-shadow: 0 2px 6px rgba(248, 113, 108, 0.3);
}

.pill-stop:hover,
.pill-stop:focus {
    background-color: rgba(248, 113, 108, 0.5);
    box-shadow: 0 2px 8px rgba(248, 113, 108, 0.25);
}

/* 启动：薄荷绿 */
.pill-start {
    background-color: rgba(82, 200, 150, 0.85);
    box-shadow: 0 2px 6px rgba(82, 200, 150, 0.3);
}

.pill-start:hover,
.pill-start:focus {
    background-color: rgba(82, 200, 150, 0.5);
    box-shadow: 0 2px 8px rgba(82, 200, 150, 0.25);
}

/* ==================== 响应式适配 ==================== */
@media (max-width: 768px) {
    .header-actions {
        flex-wrap: wrap;
    }
}
</style>
