<template>
    <div class="status-card" v-loading="loading" element-loading-text="数据加载中..."
        element-loading-background="rgba(255, 255, 255, 0.8)">
        <div class="status-header">
            <h2>
                攻击来源统计 (Top {{ topIpLimit }})
                <el-button type="text" icon="el-icon-refresh" @click="handleRefresh" :loading="loading"
                    class="refresh-btn">
                    手动刷新
                </el-button>
                <span v-if="lastRefreshTime" class="refresh-time">最后刷新: {{ lastRefreshTime }}</span>

            </h2>
            <div class="ip-actions">
                <!-- Top条数选择 -->
                <el-select :value="topIpLimit" size="small" style="width: 120px;"
                    @change="handleFilterChange('topIpLimit', $event)">
                    <el-option label="Top10" :value="10" />
                    <el-option label="Top20" :value="20" />
                    <el-option label="Top50" :value="50" />
                    <el-option label="Top100" :value="100" />
                </el-select>
                <!-- 统计行数选择 -->
                <el-select :value="statsLogLines" size="small" style="width: 140px;"
                    @change="handleFilterChange('statsLogLines', $event)">
                    <el-option label="最近5千行" :value="5000" />
                    <el-option label="最近1万行" :value="10000" />
                    <el-option label="最近5万行" :value="50000" />
                    <el-option label="最近10万行" :value="100000" />
                </el-select>
                <el-button type="primary" size="small" icon="el-icon-document-copy" @click="copyAllTopIps"
                    :disabled="topAttackIps.length === 0">
                    复制全部
                </el-button>
                <!--
                    批量操作下拉菜单：合并批量封禁、批量解封、复制选中三个操作
                    封禁/解封在 dropdown-item 层面单独控制禁用态和 tooltip
                    未选中任何行时整体按钮禁用
                -->
                <el-dropdown trigger="click" :disabled="selectedRows.length === 0" @command="handleBatchCommand"
                    size="small">
                    <el-button size="small" :disabled="selectedRows.length === 0">
                        批量操作选中 ({{ selectedRows.length }})<i class="el-icon-arrow-down" style="margin-left: 4px;"></i>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                        <!-- 批量封禁：全部未封禁 + 同一单监狱时可用 -->
                        <el-tooltip :content="batchBanTooltip" placement="left" :disabled="canBatchBan">
                            <span>
                                <el-dropdown-item command="ban" :disabled="!canBatchBan">
                                    <div class="dropdown-item-inner">
                                        <i class="el-icon-close" style="color: #f56c6c;"></i>
                                        批量封禁
                                    </div>
                                </el-dropdown-item>
                            </span>
                        </el-tooltip>
                        <!-- 批量解封：全部已封禁 + 同一单监狱时可用 -->
                        <el-tooltip :content="batchUnbanTooltip" placement="left" :disabled="canBatchUnban">
                            <span>
                                <el-dropdown-item command="unban" :disabled="!canBatchUnban">
                                    <div class="dropdown-item-inner">
                                        <i class="el-icon-check" style="color: #e6a23c;"></i>
                                        批量解封
                                    </div>
                                </el-dropdown-item>
                            </span>
                        </el-tooltip>
                        <el-dropdown-item divided command="copy">
                            <div class="dropdown-item-inner">
                                <i class="el-icon-document-copy" style="color: #409eff;"></i>
                                复制选中IP
                            </div>
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
            </div>
        </div>

        <el-table :data="paginatedTopIps" border stripe style="width: 100%"
            @selection-change="handleStatsSelectionChange">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column label="排名" width="60" align="center">
                <template v-slot="scope">
                    {{ scope.row.rank }}
                </template>
            </el-table-column>
            <el-table-column label="攻击IP" width="">
                <template v-slot="scope">
                    <span class="ip-text">{{ scope.row.ip }}</span>
                    <el-button type="text" icon="el-icon-document-copy" size="mini" @click="handleCopyIp(scope.row.ip)"
                        class="copy-btn" />
                </template>
            </el-table-column>
            <!-- 来源监狱列 -->
            <el-table-column label="来源监狱" width="200" align="center">
                <template v-slot="scope">
                    <el-tag v-for="jail in scope.row.jails.split(', ')" :key="jail" size="mini" type="info"
                        style="margin: 2px;">
                        {{ jail }}
                    </el-tag>
                    <span v-if="!scope.row.jails" style="color: #909399;">未知</span>
                </template>
            </el-table-column>
            <el-table-column prop="count" label="攻击次数" width="90" align="center" />
            <el-table-column label="威胁等级" width="140" align="center">
                <template v-slot="scope">
                    <el-tag :type="getThreatLevel(scope.row.count)">
                        {{ getThreatLevelText(scope.row.count) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="封禁状态" width="100" align="center">
                <template v-slot="scope">
                    <el-tag :type="scope.row.banned ? 'danger' : 'success'" size="small">
                        {{ scope.row.banned ? '已封禁' : '未封禁' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
                <template v-slot="scope">
                    <el-button v-if="!scope.row.banned" type="danger" size="mini" icon="el-icon-close"
                        @click="handleOpenConfirm('ban', scope.row.ip, getAutoJail(scope.row.jails))">
                        封禁
                    </el-button>
                    <el-button v-else type="success" size="mini" icon="el-icon-check"
                        @click="handleOpenConfirm('unban', scope.row.ip, getAutoJail(scope.row.jails))">
                        解封
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container" v-if="processedTopIps.length > 0">
            <el-pagination @size-change="handleStatsSizeChange" @current-change="handleStatsCurrentChange"
                :current-page="statsCurrentPage" :page-sizes="statsPageSizes" :page-size="statsPageSize"
                layout="total, sizes, prev, pager, next, jumper" :total="processedTopIps.length" background>
            </el-pagination>
        </div>
    </div>
</template>

<script>
export default {
    name: "AttackStatsPanel",
    props: {
        topAttackIps: {
            type: Array,
            default: () => []
        },
        allBannedIps: {
            type: Array,
            default: () => []
        },
        bannedIpsByJail: {
            type: Object,
            default: () => ({})
        },
        baselineMaxRetry: {
            type: Number,
            default: 5
        },
        jailList: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        },
        topIpLimit: {
            type: Number,
            default: 20
        },
        statsLogLines: {
            type: Number,
            default: 10000
        },
        lastRefreshTime: {
            type: String,
            default: ""
        }
    },
    data() {
        return {
            /**
             * 表格当前选中的完整行对象数组
             * 存完整行对象以便提取 ip、jails、banned 等字段用于批量操作校验
             */
            selectedRows: [],
            statsCurrentPage: 1,    // 分页当前页码
            statsPageSize: 5        // 分页每页条数，默认5条
        };
    },
    computed: {
        /**
         * 根据每个监狱的封禁状态拆分行：
         * - 所有监狱封禁状态一致 → 保留一行
         * - 部分封禁部分未封禁 → 拆分为已封禁行和未封禁行
         */
        processedTopIps() {
            const result = [];
            // 先按count计算并列排名（同count同排名，后续跳号）
            let rank = 0;
            let prevCount = null;
            this.topAttackIps.forEach((item, index) => {
                if (item.count !== prevCount) {
                    rank = index + 1;
                    prevCount = item.count;
                }
                if (!item.jails) {
                    result.push({ ...item, rank, banned: this.isIpBanned(item.ip) });
                    return;
                }
                const jailArr = item.jails.split(', ').filter(Boolean);
                const bannedJails = [];
                const unbannedJails = [];
                jailArr.forEach(jail => {
                    const jailBannedIps = this.bannedIpsByJail[jail] || [];
                    if (jailBannedIps.includes(item.ip)) {
                        bannedJails.push(jail);
                    } else {
                        unbannedJails.push(jail);
                    }
                });
                if (bannedJails.length > 0 && unbannedJails.length > 0) {
                    // 状态不一致，拆分为两行
                    result.push({ ip: item.ip, count: item.count, jails: bannedJails.join(', '), rank, banned: true });
                    result.push({ ip: item.ip, count: item.count, jails: unbannedJails.join(', '), rank, banned: false });
                } else if (bannedJails.length > 0) {
                    result.push({ ip: item.ip, count: item.count, jails: item.jails, rank, banned: true });
                } else {
                    result.push({ ip: item.ip, count: item.count, jails: item.jails, rank, banned: false });
                }
            });
            return result;
        },
        /**
         * 分页后的攻击来源数据
         */
        paginatedTopIps() {
            const start = (this.statsCurrentPage - 1) * this.statsPageSize;
            const end = start + this.statsPageSize;
            return this.processedTopIps.slice(start, end);
        },

        /**
         * 根据Top条数动态生成分页每页条数选项
         * 只保留不超过topIpLimit的选项，确保最大选项等于topIpLimit
         */
        statsPageSizes() {
            const base = [5, 10, 20, 50, 100];
            const sizes = base.filter(s => s <= this.topIpLimit);
            if (!sizes.includes(this.topIpLimit)) {
                sizes.push(this.topIpLimit);
            }
            return sizes;
        },

        /**
         * 从选中行提取去重后的监狱数组
         * 用于判断所有选中行是否都来自同一个监狱
         */
        selectedJailSet() {
            const jails = new Set();
            this.selectedRows.forEach(row => {
                if (row.jails) {
                    row.jails.split(', ').filter(Boolean).forEach(j => jails.add(j));
                }
            });
            return Array.from(jails);
        },

        /**
         * 批量操作通用前置校验：
         * 1. 至少选中一行
         * 2. 每行 jails 字段只含一个监狱（排除监狱未知或跨监狱行）
         * 3. 所有选中行属于同一个监狱
         */
        batchPreCheck() {
            if (this.selectedRows.length === 0) return false;
            const allSingleJail = this.selectedRows.every(row => {
                const jailArr = (row.jails || '').split(', ').filter(Boolean);
                return jailArr.length === 1;
            });
            if (!allSingleJail) return false;
            return this.selectedJailSet.length === 1;
        },

        /**
         * 是否允许批量封禁：
         * 通用前置校验通过 + 所有选中行均为未封禁状态
         */
        canBatchBan() {
            if (!this.batchPreCheck) return false;
            return this.selectedRows.every(row => !row.banned);
        },

        /**
         * 是否允许批量解封：
         * 通用前置校验通过 + 所有选中行均为已封禁状态
         */
        canBatchUnban() {
            if (!this.batchPreCheck) return false;
            return this.selectedRows.every(row => row.banned);
        },

        /**
         * 批量封禁按钮不可用时的 tooltip 说明
         */
        batchBanTooltip() {
            if (this.selectedRows.length === 0) return '请先勾选要操作的IP';
            if (!this.batchPreCheck) return '所选IP须来自同一个监狱，且每行只能对应一个监狱';
            if (!this.canBatchBan) return '所选IP中存在已封禁的IP，批量封禁仅支持全部未封禁的IP';
            return '';
        },

        /**
         * 批量解封按钮不可用时的 tooltip 说明
         */
        batchUnbanTooltip() {
            if (this.selectedRows.length === 0) return '请先勾选要操作的IP';
            if (!this.batchPreCheck) return '所选IP须来自同一个监狱，且每行只能对应一个监狱';
            if (!this.canBatchUnban) return '所选IP中存在未封禁的IP，批量解封仅支持全部已封禁的IP';
            return '';
        }
    },
    watch: {
        /**
         * 数据变化时重置分页到第一页
         */
        topAttackIps() {
            this.statsCurrentPage = 1;
        },
        /**
         * 分页选项变化时，统一重置为5条一页并回到第一页
         */
        statsPageSizes() {
            this.statsPageSize = 5;
            this.statsCurrentPage = 1;
        }
    },
    methods: {
        /**
         * 判断IP是否已被封禁（前端本地比对）
         * @param {String} ip IP地址
         * @returns {Boolean} 是否已封禁
         */
        isIpBanned(ip) {
            return this.allBannedIps.includes(ip);
        },

        /**
         * 根据攻击次数获取威胁等级类型（动态基准）
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
         * 处理筛选条件变更（同步更新父组件值并触发刷新）
         * @param {String} filterName 筛选字段名
         * @param {*} value 新值
         */
        handleFilterChange(filterName, value) {
            this.$emit(`update:${filterName}`, value);
            this.$emit('refresh');
        },

        /**
         * 点击刷新按钮
         */
        handleRefresh() {
            this.$emit('refresh');
        },

        /**
         * 通知父组件打开确认弹窗
         * @param {String} type 操作类型
         * @param {String} ip 目标IP地址
         * @param {String} jailName 监狱名称
         * @param {Array} ips 批量操作IP列表（可选）
         */
        handleOpenConfirm(type, ip = '', jailName = '', ips = []) {
            this.$emit('open-confirm', type, ip, jailName, ips);
        },

        /**
         * 批量操作下拉菜单统一路由
         * @param {String} command 'ban' | 'unban' | 'copy'
         */
        handleBatchCommand(command) {
            if (command === 'ban') this.handleBatchBan();
            else if (command === 'unban') this.handleBatchUnban();
            else if (command === 'copy') this.copySelectedTopIps();
        },

        /**
         * 批量封禁：提取选中IP和监狱名，触发父组件确认弹窗（走危险操作二次确认流程）
         * 前置校验已由 canBatchBan computed 保证，此处直接取第一项的监狱名
         */
        handleBatchBan() {
            if (!this.canBatchBan) return;
            const jailName = this.selectedJailSet[0];
            const ips = this.selectedRows.map(row => row.ip);
            this.handleOpenConfirm('ban-batch', '', jailName, ips);
        },

        /**
         * 批量解封：提取选中IP和监狱名，触发父组件确认弹窗（走危险操作二次确认流程）
         * 前置校验已由 canBatchUnban computed 保证，此处直接取第一项的监狱名
         */
        handleBatchUnban() {
            if (!this.canBatchUnban) return;
            const jailName = this.selectedJailSet[0];
            const ips = this.selectedRows.map(row => row.ip);
            this.handleOpenConfirm('unban-batch', '', jailName, ips);
        },

        /**
         * 根据来源监狱数量自动返回监狱名称
         * 仅一个监狱时自动带上，多个监狱时返回空串让用户手动选择
         * @param {String} jails 逗号分隔的监狱名称
         * @returns {String} 单个监狱名或空串
         */
        getAutoJail(jails) {
            if (!jails) return '';
            const jailList = jails.split(', ').filter(Boolean);
            return jailList.length === 1 ? jailList[0] : '';
        },

        /**
         * 复制单行IP地址到剪贴板
         * @param {String} ip 要复制的IP地址
         */
        async handleCopyIp(ip) {
            await this.copyToClipboard(ip);
            this.$message.success(`已复制IP: ${ip}`);
        },

        // ==================== IP复制方法 ====================

        /**
         * 复制全部Top攻击IP到剪贴板
         */
        async copyAllTopIps() {
            const ips = this.topAttackIps.map(item => item.ip);
            if (!ips || ips.length === 0) {
                this.$message.warning("没有可复制的IP");
                return;
            }
            await this.copyToClipboard(ips.join("\n"));
            this.$message.success(`已复制 ${ips.length} 个IP`);
        },

        /**
         * 复制选中的Top攻击IP到剪贴板
         */
        async copySelectedTopIps() {
            if (this.selectedRows.length === 0) {
                this.$message.warning("请先选择要复制的IP");
                return;
            }
            const ips = this.selectedRows.map(row => row.ip);
            await this.copyToClipboard(ips.join("\n"));
            this.$message.success(`已复制 ${ips.length} 个选中的IP`);
        },

        /**
         * 处理表格选择变更事件（存储完整行对象，用于提取 ip/jails/banned）
         * @param {Array} selection 选中的行数据
         */
        handleStatsSelectionChange(selection) {
            this.selectedRows = selection;
        },

        // ==================== 分页事件处理 ====================

        /**
         * 每页条数改变事件
         * @param {Number} size 新的每页条数
         */
        handleStatsSizeChange(size) {
            this.statsPageSize = size;
            this.statsCurrentPage = 1;
        },

        /**
         * 页码改变事件
         * @param {Number} page 新的页码
         */
        handleStatsCurrentChange(page) {
            this.statsCurrentPage = page;
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

.ip-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
}

::v-deep .ip-actions .el-button+.el-button,
.el-checkbox.is-bordered+.el-checkbox.is-bordered {
    margin-left: 0;
}

/* ==================== 分页容器 ==================== */
.pagination-container {
    margin-top: 20px;
    text-align: left;
}

/* ==================== 刷新按钮 ==================== */
.refresh-btn {
    color: #409eff;
    font-size: 12px;
    padding: 4px 8px;
}

/* ==================== 攻击IP列样式 ==================== */
.ip-text {
    font-family: Consolas, monospace;
    font-weight: 500;
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

.refresh-time {
    font-size: 12px;
    color: #8392a5;
}

/* ==================== 下拉菜单项内容布局 ==================== */
.dropdown-item-inner {
    display: flex;
    align-items: center;
    gap: 6px;
}

/* ==================== 响应式适配 ==================== */
@media (max-width: 768px) {
    .ip-actions {
        width: 100%;
        justify-content: flex-start;
    }
}
</style>
