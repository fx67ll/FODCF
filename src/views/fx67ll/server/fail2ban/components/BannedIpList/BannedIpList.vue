<template>
    <div class="status-card" v-loading="loading" element-loading-text="数据加载中..."
        element-loading-background="rgba(255, 255, 255, 0.8)">
        <div class="status-header">
            <h2>
                全量封禁IP列表 (共 {{ allBannedIps.length }} 个)
                <el-button type="text" icon="el-icon-refresh" @click="handleRefresh" :loading="loading"
                    class="refresh-btn">
                    手动刷新
                </el-button>
                <span v-if="lastRefreshTime" class="refresh-time">最后刷新: {{ lastRefreshTime }}</span>
            </h2>
            <div class="header-actions">
                <el-button type="danger" size="small" icon="el-icon-delete" @click="handleUnbanAll"
                    :disabled="allBannedIps.length === 0">
                    一键全部解封
                </el-button>
                <el-button type="primary" size="small" icon="el-icon-document-copy" @click="copyAllBannedIps"
                    :disabled="allBannedIps.length === 0">
                    复制全部封禁IP
                </el-button>
            </div>
        </div>

        <div class="all-banned-ips">
            <el-tag v-for="item in paginatedBannedIps" :key="item.ip" type="danger" style="margin: 5px;">
                {{ item.ip }}
                <el-button type="text" icon="el-icon-check" size="mini"
                    @click.stop="handleOpenConfirm('unban', item.ip, item.jailName)" class="unban-btn">
                    解封
                </el-button>
                <el-button type="text" icon="el-icon-document-copy" size="mini" @click.stop="copySingleIp(item.ip)"
                    class="copy-btn" />
            </el-tag>
            <div v-if="allBannedIps.length === 0" class="empty-text">
                暂无被封禁的IP
            </div>
        </div>

        <!-- 全量IP分页 -->
        <div class="pagination-container" v-if="allBannedIps.length > 20">
            <el-pagination @size-change="handleIpSizeChange" @current-change="handleIpCurrentChange"
                :current-page="ipCurrentPage" :page-sizes="[20, 50, 100, 200, 500, 1000]" :page-size="ipPageSize"
                layout="total, sizes, prev, pager, next, jumper" :total="allBannedIps.length" background>
            </el-pagination>
        </div>
    </div>
</template>

<script>
export default {
    name: "BannedIpList",
    props: {
        allBannedIps: {
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
            // ==================== 全量封禁IP分页 ====================
            ipCurrentPage: 1,           // IP列表当前页码
            ipPageSize: 20            // IP列表每页条数
        };
    },
    computed: {
        /**
         * 归一化IP列表：兼容纯字符串数组和带监狱信息的对象数组
         * 统一转为 { ip: 'xxx', jailName: 'xxx' } 格式
         */
        normalizedIps() {
            return this.allBannedIps.map(item => {
                if (typeof item === 'string') {
                    return { ip: item, jailName: '' };
                }
                return item;
            });
        },
        /**
         * 分页后的全量封禁IP列表
         */
        paginatedBannedIps() {
            const start = (this.ipCurrentPage - 1) * this.ipPageSize;
            const end = start + this.ipPageSize;
            return this.normalizedIps.slice(start, end);
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
         * 点击一键全部解封按钮
         * 通知父组件打开全局解封确认弹窗
         */
        handleUnbanAll() {
            this.$emit('open-confirm', 'unban-all', '', '');
        },

        /**
         * 复制所有封禁IP到剪贴板
         */
        async copyAllBannedIps() {
            if (!this.allBannedIps || this.allBannedIps.length === 0) {
                this.$message.warning("没有可复制的IP");
                return;
            }
            const ipTexts = this.normalizedIps.map(item => item.ip);
            await this.copyToClipboard(ipTexts.join("\n"));
            this.$message.success(`已复制 ${this.allBannedIps.length} 个IP`);
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
         * @param {String} type 操作类型 unban / unban-all
         * @param {String} ip 目标IP地址
         * @param {String} jailName 监狱名称
         */
        handleOpenConfirm(type, ip = '', jailName = '') {
            this.$emit('open-confirm', type, ip, jailName);
        },

        // ==================== 分页事件处理 ====================

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
    gap: 12px;
}

::v-deep .header-actions .el-button+.el-button,
.el-checkbox.is-bordered+.el-checkbox.is-bordered {
    margin-left: 0;
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

/* ==================== 全量封禁IP列表 ==================== */
.all-banned-ips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
}

.copy-btn {
    margin-left: 5px;
    padding: 2px 4px;
    transition: transform 0.2s;
}

.copy-btn:hover {
    transform: scale(1.25);
}

.unban-btn {
    margin-left: 5px;
    padding: 2px 4px;
    transition: transform 0.2s;
}

.unban-btn:hover {
    transform: scale(1.15);
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
</style>