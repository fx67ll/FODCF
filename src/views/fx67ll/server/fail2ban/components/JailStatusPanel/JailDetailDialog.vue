<template>
    <!-- ==================== 监狱详情弹窗 ==================== -->
    <el-dialog :title="`查看监狱详情${(jailDetail && jailDetail.name) || jailName ? ' - ' + ((jailDetail && jailDetail.name) || jailName) : ''}`"
        :visible.sync="innerVisible" width="830px" :close-on-click-modal="false" @close="handleDialogClose"
        custom-class="jail-detail-dialog" :style="`top: ${getDialogVerticalOffset(540)}`" append-to-body>
        <!-- 详情加载中：先展示弹窗骨架，数据就绪后再渲染内容 -->
        <div v-loading="loading" element-loading-text="加载监狱详情中..."
            element-loading-background="rgba(255, 255, 255, 0.8)" style="min-height: 220px;">
            <div v-if="jailDetail">
            <!-- 监狱基本信息 -->
            <div class="config-section">
                <div class="section-title">
                    监狱基本信息
                    <el-button v-if="jailDetail && jailDetail.status === '运行中'"
                        @click="handleOpenConfirm('stopJail', '', jailDetail.name)" class="mini-pill-btn mini-pill-stop"
                        size="mini">
                        🔒 停止运行
                    </el-button>
                    <el-button v-else-if="jailDetail && jailDetail.status !== '运行中'"
                        @click="handleOpenConfirm('startJail', '', jailDetail.name)"
                        class="mini-pill-btn mini-pill-start" size="mini">
                        🕹️ 开始运行
                    </el-button>
                </div>
                <el-descriptions :column="4" border size="small">
                    <el-descriptions-item label="运行状态">
                        <el-tag :type="jailDetail.status === '运行中' ? 'success' : 'info'" size="small">
                            {{ jailDetail.status }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="当前失败">
                        {{ jailDetail.currentlyFailed || '0' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="总失败尝试">
                        {{ jailDetail.totalFailed || '0' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="当前封禁">
                        {{ jailDetail.currentlyBanned || '0' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="累计封禁">
                        {{ jailDetail.totalBanned || '0' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="日志路径" :span="3">
                        {{ jailDetail.logPath || '未知' }}
                    </el-descriptions-item>
                </el-descriptions>
            </div>

            <!-- 监狱只读配置信息 -->
            <div class="config-section">
                <div class="section-title">
                    监狱配置参数
                    <el-button v-if="jailDetail && jailDetail.status === '运行中'" @click="handleOpenConfigEdit"
                        class="mini-pill-btn mini-pill-config" size="mini">
                        ⚙️ 修改配置
                    </el-button>
                </div>
                <el-descriptions :column="4" border size="small">
                    <el-descriptions-item label="封禁时长">
                        {{ jailDetail.config.bantime === '-1秒' ? '永久' :
                            (jailDetail.config.bantime || '未知') }}
                    </el-descriptions-item>
                    <el-descriptions-item label="检测窗口">
                        {{ jailDetail.config.findtime || '未知' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="最大重试次数">
                        {{ jailDetail.config.maxretry || jailDetail.config.maxretry === 0 ?
                            `${jailDetail.config.maxretry}次` : '未知' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="白名单IP数量">
                        {{ (jailDetail.config.ignoreIpList || []).length }} 个
                    </el-descriptions-item>
                    <el-descriptions-item label="监狱白名单" :span="2">
                        <el-tag v-for="ip in (jailDetail.config.ignoreIpList || [])" :key="ip" size="mini"
                            style="margin: 3px;">
                            {{ ip }}
                        </el-tag>
                        <span v-if="!jailDetail.config.ignoreIpList.length" style="color: #909399;">
                            无白名单配置
                        </span>
                    </el-descriptions-item>
                </el-descriptions>
            </div>

            <!-- 封禁IP列表区域 -->
            <div class="banned-ips-section">
                <div class="section-header">
                    <h4>
                        当前监狱被封禁IP列表 (共 {{ bannedIpsTotal }} 个<span v-if="dialogSelectedIps.length > 0">，已选
                            {{ dialogSelectedIps.length }} 个</span>)
                    </h4>
                    <!-- 复制按钮移至底部footer，此处清空 -->
                    <div class="ip-actions"></div>
                </div>

                <div class="banned-ips-list">
                    <!-- 全选当前页按钮（位于每页第一个IP之前） -->
                    <el-checkbox v-if="paginatedBannedIps.length > 0" v-model="selectAllPage"
                        :indeterminate="isCurrentPageIndeterminate" class="ip-checkbox select-all-checkbox">
                        全选本页
                    </el-checkbox>
                    <el-checkbox v-for="ip in paginatedBannedIps" :key="ip" v-model="dialogSelectedIps" :label="ip"
                        class="ip-checkbox">
                        {{ ip }}
                        <el-button type="text" icon="el-icon-check" size="mini"
                            @click.stop="handleOpenConfirm('unban', ip, jailDetail.name)" class="copy-btn">
                            解封
                        </el-button>
                        <el-button type="text" icon="el-icon-document-copy" size="mini" @click.stop="copySingleIp(ip)"
                            class="copy-btn" />
                    </el-checkbox>
                </div>

                <div v-if="bannedIpsTotal === 0" class="empty-text">
                    暂无被封禁的IP
                </div>

                <!-- 分页器 -->
                <div class="ip-pagination-container" v-if="bannedIpsTotal > 0">
                    <el-pagination @size-change="handleIpSizeChange" @current-change="handleIpCurrentChange"
                        :current-page="ipCurrentPage" :page-sizes="[5, 10, 20, 50, 100]" :page-size="ipPageSize"
                        layout="total, sizes, prev, pager, next" :total="bannedIpsTotal" background>
                    </el-pagination>
                </div>
            </div>
        </div>
        </div>
        <!-- 弹窗底部footer：新增一键解封、解封选中、复制全部、复制选中按钮，整体加v-if判空，彻底避免空指针 -->
        <span slot="footer" class="dialog-footer" v-if="jailDetail">
            <el-button type="danger" size="small" icon="el-icon-delete" @click="handleUnbanAllCurrentJail"
                :disabled="!jailDetail.bannedIps || jailDetail.bannedIps.length === 0">
                一键解封本监狱全部IP
            </el-button>
            <el-button type="warning" size="small" icon="el-icon-check" @click="handleUnbanSelectedIps"
                :disabled="dialogSelectedIps.length === 0">
                解封选中 ({{ dialogSelectedIps.length }})
            </el-button>
            <el-button type="primary" size="small" icon="el-icon-document-copy" @click="copyDialogAllIps"
                :disabled="!jailDetail.bannedIps || jailDetail.bannedIps.length === 0">
                复制全部IP
            </el-button>
            <el-button type="success" size="small" icon="el-icon-check" @click="copyDialogSelectedIps"
                :disabled="dialogSelectedIps.length === 0">
                复制选中 ({{ dialogSelectedIps.length }})
            </el-button>
            <el-button @click="handleDialogClose">关闭</el-button>
        </span>
    </el-dialog>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

export default {
    name: "JailDetailDialog",
    props: {
        /** 弹窗显示状态 */
        visible: {
            type: Boolean,
            default: false
        },
        /** 当前查看的监狱详情数据 */
        jailDetail: {
            type: Object,
            default: null
        },
        /** 详情数据加载中（弹窗已打开、数据未就绪时展示loading） */
        loading: {
            type: Boolean,
            default: false
        },
        /** 当前查看的监狱名称（用于数据未就绪时标题展示） */
        jailName: {
            type: String,
            default: ""
        }
    },
    data() {
        return {
            // ==================== 弹窗控制 ====================
            dialogSelectedIps: [],              // 弹窗内选中的IP列表

            // ==================== 封禁IP分页 ====================
            ipCurrentPage: 1,                   // 当前页码
            ipPageSize: 5                       // 每页条数，默认5
        };
    },
    computed: {
        /**
         * 双向绑定 visible 属性，支持 .sync 修饰符
         */
        innerVisible: {
            get() {
                return this.visible;
            },
            set(val) {
                this.$emit('update:visible', val);
            }
        },

        /**
         * 当前监狱被封禁IP总数
         */
        bannedIpsTotal() {
            return (this.jailDetail && this.jailDetail.bannedIps) ? this.jailDetail.bannedIps.length : 0;
        },

        /**
         * 当前页展示的封禁IP列表
         */
        paginatedBannedIps() {
            if (!this.jailDetail || !this.jailDetail.bannedIps) return [];
            const start = (this.ipCurrentPage - 1) * this.ipPageSize;
            return this.jailDetail.bannedIps.slice(start, start + this.ipPageSize);
        },

        /**
         * 当前页是否已全选
         */
        isCurrentPageAllSelected() {
            const page = this.paginatedBannedIps;
            if (page.length === 0) return false;
            return page.every(ip => this.dialogSelectedIps.includes(ip));
        },

        /**
         * 当前页是否处于半选（indeterminate）状态
         */
        isCurrentPageIndeterminate() {
            const page = this.paginatedBannedIps;
            if (page.length === 0) return false;
            const selectedCount = page.filter(ip => this.dialogSelectedIps.includes(ip)).length;
            return selectedCount > 0 && selectedCount < page.length;
        },

        /**
         * 全选本页复选框双向绑定
         */
        selectAllPage: {
            get() {
                return this.isCurrentPageAllSelected;
            },
            set(val) {
                this.handleToggleSelectAllPage(val);
            }
        }
    },
    watch: {
        /**
         * 切换监狱时重置分页与选中状态，避免跨监狱数据残留
         */
        'jailDetail.name'() {
            this.ipCurrentPage = 1;
            this.dialogSelectedIps = [];
        },

        /**
         * 封禁IP数量变化后纠正页码，避免停留在空页
         */
        bannedIpsTotal(val) {
            const maxPage = Math.max(1, Math.ceil(val / this.ipPageSize));
            if (this.ipCurrentPage > maxPage) {
                this.ipCurrentPage = maxPage;
            }
        }
    },
    methods: {
        // 代理工具函数
        getDialogVerticalOffset(offset) {
            return getDialogVerticalOffset(offset);
        },

        /**
         * 弹窗关闭事件处理
         */
        handleDialogClose() {
            this.$emit('update:visible', false);
            this.dialogSelectedIps = [];
            this.ipCurrentPage = 1;
        },

        /**
         * 打开配置修改弹窗，通知父组件处理
         */
        handleOpenConfigEdit() {
            if (!this.jailDetail) return;
            this.$emit('open-config-edit', this.jailDetail.name);
        },

        /**
         * 一键解封当前监狱全部封禁IP
         */
        handleUnbanAllCurrentJail() {
            if (!this.jailDetail) return;
            // 抛出操作类型 unban-all-jail，携带当前监狱名称
            this.$emit('open-confirm', 'unban-all-jail', '', this.jailDetail.name);
        },

        /**
         * 批量解封当前监狱中选中的IP
         */
        handleUnbanSelectedIps() {
            if (!this.jailDetail || this.dialogSelectedIps.length === 0) return;
            // 抛出操作类型 unban-batch，携带选中IP列表和当前监狱名称
            this.$emit('open-confirm', 'unban-batch', '', this.jailDetail.name, this.dialogSelectedIps);
        },

        /**
         * 全选/取消全选当前页的封禁IP
         * @param {Boolean} checked 是否选中
         */
        handleToggleSelectAllPage(checked) {
            const page = this.paginatedBannedIps;
            if (checked) {
                // 选中当前页全部IP（跨页已选中的保留，不重复添加）
                page.forEach(ip => {
                    if (!this.dialogSelectedIps.includes(ip)) {
                        this.dialogSelectedIps.push(ip);
                    }
                });
            } else {
                // 取消当前页全部IP的选中（其他页已选中的不受影响）
                const pageSet = new Set(page);
                this.dialogSelectedIps = this.dialogSelectedIps.filter(ip => !pageSet.has(ip));
            }
        },

        /**
         * 封禁IP每页条数变化事件
         * @param {Number} size 新的每页条数
         */
        handleIpSizeChange(size) {
            this.ipPageSize = size;
            this.ipCurrentPage = 1;
        },

        /**
         * 封禁IP页码变化事件
         * @param {Number} page 新的页码
         */
        handleIpCurrentChange(page) {
            this.ipCurrentPage = page;
        },

        /**
         * 复制弹窗中全部IP到剪贴板
         */
        async copyDialogAllIps() {
            const ips = this.jailDetail.bannedIps || [];
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
         * @param {Array} ips 批量操作IP列表（可选）
         */
        handleOpenConfirm(type, ip = '', jailName = '') {
            this.$emit('open-confirm', type, ip, jailName);
        }
    }
};
</script>

<style scoped>
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

/* 全选本页按钮（淡蓝底，区别于普通IP标签） */
.select-all-checkbox {
    background-color: #ecf5ff;
    border-color: #c6e2ff;
    color: #409eff;
    font-weight: 500;
}

.select-all-checkbox ::v-deep .el-checkbox__label {
    color: #409eff;
}

/* 封禁IP分页器 */
.ip-pagination-container {
    margin-top: 15px;
    text-align: left;
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
    display: flex;
    align-items: center;
}

/* 迷你药丸按钮（详情页内联） */
.mini-pill-btn {
    height: 22px;
    padding: 0 10px;
    border: none;
    border-radius: 11px;
    color: #fff;
    font-size: 12px;
    line-height: 22px;
    margin-left: 10px;
    transition: all 0.25s ease;
}

.mini-pill-btn:hover,
.mini-pill-btn:focus {
    color: #fff;
    opacity: 0.8;
}

.mini-pill-config {
    background-color: rgba(245, 194, 66, 0.85);
    box-shadow: 0 2px 4px rgba(245, 194, 66, 0.3);
}

/* 停止运行：珊瑚红 */
.mini-pill-stop {
    background-color: rgba(248, 113, 108, 0.85);
    box-shadow: 0 2px 4px rgba(248, 113, 108, 0.3);
}

/* 开始运行：薄荷绿 */
.mini-pill-start {
    background-color: rgba(82, 200, 150, 0.85);
    box-shadow: 0 2px 4px rgba(82, 200, 150, 0.3);
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
