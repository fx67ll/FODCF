<template>
    <div class="status-card" v-loading="loading" element-loading-text="数据加载中..."
        element-loading-background="rgba(255, 255, 255, 0.8)">
        <div class="status-header">
            <div class="title-group">
                <h2>最近24小时攻击趋势</h2>
                <el-button type="text" icon="el-icon-refresh" @click="handleRefresh" :loading="loading"
                    class="refresh-btn">
                    手动刷新
                </el-button>
                <span v-if="lastRefreshTime" class="refresh-time">最后刷新: {{ lastRefreshTime }}</span>
            </div>
            <div class="trend-stats">
                <span class="stat-item">
                    <span class="stat-label">总攻击：</span>
                    <span class="stat-value">{{ totalTrendAttacks }} 次</span>
                </span>
                <span class="stat-item">
                    <span class="stat-label">峰值：</span>
                    <span class="stat-value">{{ maxTrendCount }} 次/小时</span>
                </span>
            </div>
        </div>
        <div class="chart-container">
            <div ref="trendChart" style="width: 100%; height: 300px; cursor: pointer;"></div>
        </div>

        <!-- 时段攻击IP详情弹窗 -->
        <el-dialog :title="`${currentHourLabel} 攻击次数 Top5 IP`" :visible.sync="dialogVisible"
            :close-on-click-modal="false" width="700px"
            :style="`top: ${getDialogVerticalOffset(300 + ((currentTopIps.length - 2) * 50))}`" append-to-body
            custom-class="trend-detail-dialog" @close="handleDialogClose">
            <el-table :data="currentTopIps" border stripe style="width: 100%"
                @selection-change="handleDialogSelectionChange">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="排名" width="60" align="center">
                    <template v-slot="scope">
                        {{ scope.$index + 1 }}
                    </template>
                </el-table-column>
                <el-table-column label="攻击IP">
                    <template v-slot="scope">
                        <span class="ip-text">{{ scope.row.ip }}</span>
                        <el-button type="text" icon="el-icon-document-copy" size="mini"
                            @click="handleCopyIp(scope.row.ip)" class="copy-btn" />
                    </template>
                </el-table-column>
                <el-table-column label="来源监狱" width="110" align="center">
                    <template v-slot="scope">
                        <el-tag v-for="jail in scope.row.jails.split(', ')" :key="jail" size="mini" type="info"
                            style="margin: 2px;">
                            {{ jail }}
                        </el-tag>
                        <span v-if="!scope.row.jails" style="color: #909399;">未知</span>
                    </template>
                </el-table-column>
                <el-table-column prop="count" label="攻击次数" width="80" align="center" />
                <el-table-column label="封禁状态" width="90" align="center">
                    <template v-slot="scope">
                        <el-tag :type="isIpBanned(scope.row.ip) ? 'danger' : 'success'" size="small">
                            {{ isIpBanned(scope.row.ip) ? '已封禁' : '未封禁' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100" align="center">
                    <template v-slot="scope">
                        <el-button v-if="!isIpBanned(scope.row.ip)" type="danger" size="mini" icon="el-icon-close"
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
            <span slot="footer" class="dialog-footer">
                <!--
                    批量封禁按钮：所选行全部未封禁 + 来自同一单个监狱时可用
                    用 span 包裹以确保 disabled 状态下 tooltip 仍能触发
                -->
                <el-tooltip :content="batchBanTooltip" placement="top" :disabled="canBatchBan">
                    <span>
                        <el-button type="danger" size="small" icon="el-icon-close" :disabled="!canBatchBan"
                            @click="handleBatchBan">
                            批量封禁 ({{ selectedDialogRows.length }})
                        </el-button>
                    </span>
                </el-tooltip>
                <!--
                    批量解封按钮：所选行全部已封禁 + 来自同一单个监狱时可用
                -->
                <el-tooltip :content="batchUnbanTooltip" placement="top" :disabled="canBatchUnban">
                    <span>
                        <el-button type="warning" size="small" icon="el-icon-check" :disabled="!canBatchUnban"
                            @click="handleBatchUnban">
                            批量解封 ({{ selectedDialogRows.length }})
                        </el-button>
                    </span>
                </el-tooltip>
                <el-button type="primary" size="small" icon="el-icon-document-copy" @click="copyAllDialogIps"
                    :disabled="currentTopIps.length === 0">
                    复制全部
                </el-button>
                <el-button type="success" size="small" icon="el-icon-check" @click="copySelectedDialogIps"
                    :disabled="selectedDialogRows.length === 0">
                    复制选中 ({{ selectedDialogRows.length }})
                </el-button>
                <el-button @click="dialogVisible = false">关闭</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";

import * as echarts from 'echarts';

export default {
    name: "AttackTrendPanel",
    props: {
        trendData: {
            type: Array,
            default: () => []
        },
        maxTrendCount: {
            type: Number,
            default: 1
        },
        totalTrendAttacks: {
            type: Number,
            default: 0
        },
        loading: {
            type: Boolean,
            default: false
        },
        lastRefreshTime: {
            type: String,
            default: ""
        },
        // 全量封禁IP列表（用于前端状态判断）
        allBannedIps: {
            type: Array,
            default: () => []
        },
        // 按监狱分组的封禁IP（用于精准状态判断）
        bannedIpsByJail: {
            type: Object,
            default: () => ({})
        },
        // 监狱列表（备用）
        jailList: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            trendChart: null,           // 趋势图实例
            dialogVisible: false,       // 时段IP详情弹窗开关
            currentHourLabel: "",       // 当前选中时段标签
            currentTopIps: [],          // 当前时段Top5 IP列表
            /**
             * 弹窗中选中的完整行对象数组
             * 存完整行对象以便提取 ip、jails 等字段用于批量操作校验
             */
            selectedDialogRows: [],
            threshold: 0                // 攻击次数超标阈值（均值2倍）
        };
    },
    watch: {
        /**
         * 趋势数据变化时更新图表
         */
        trendData: {
            deep: true,
            handler() {
                this.$nextTick(() => {
                    this.updateTrendChart();
                });
            }
        }
    },
    computed: {
        /**
         * 从选中行提取去重后的监狱数组
         * 用于判断所有选中行是否都来自同一个监狱
         */
        selectedJailSet() {
            const jails = new Set();
            this.selectedDialogRows.forEach(row => {
                if (row.jails) {
                    row.jails.split(', ').filter(Boolean).forEach(j => jails.add(j));
                }
            });
            return Array.from(jails);
        },

        /**
         * 批量操作通用前置校验：
         * 1. 至少选中一行
         * 2. 每行 jails 字段只含一个监狱（排除监狱未知的情况）
         * 3. 所有选中行属于同一个监狱
         */
        batchPreCheck() {
            if (this.selectedDialogRows.length === 0) return false;
            const allSingleJail = this.selectedDialogRows.every(row => {
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
            return this.selectedDialogRows.every(row => !this.isIpBanned(row.ip));
        },

        /**
         * 是否允许批量解封：
         * 通用前置校验通过 + 所有选中行均为已封禁状态
         */
        canBatchUnban() {
            if (!this.batchPreCheck) return false;
            return this.selectedDialogRows.every(row => this.isIpBanned(row.ip));
        },

        /**
         * 批量封禁按钮不可用时的 tooltip 说明
         */
        batchBanTooltip() {
            if (this.selectedDialogRows.length === 0) return '请先勾选要操作的IP';
            if (!this.batchPreCheck) return '所选IP须来自同一个监狱，且每行只能对应一个监狱';
            if (!this.canBatchBan) return '所选IP中存在已封禁的IP，批量封禁仅支持全部未封禁的IP';
            return '';
        },

        /**
         * 批量解封按钮不可用时的 tooltip 说明
         */
        batchUnbanTooltip() {
            if (this.selectedDialogRows.length === 0) return '请先勾选要操作的IP';
            if (!this.batchPreCheck) return '所选IP须来自同一个监狱，且每行只能对应一个监狱';
            if (!this.canBatchUnban) return '所选IP中存在未封禁的IP，批量解封仅支持全部已封禁的IP';
            return '';
        }
    },
    mounted() {
        this.initTrendChart();
        window.addEventListener('resize', this.handleResize);
    },
    beforeDestroy() {
        if (this.trendChart) {
            this.trendChart.dispose();
        }
        window.removeEventListener('resize', this.handleResize);
    },
    methods: {
        // 代理工具函数
        getDialogVerticalOffset(offset) {
            return getDialogVerticalOffset(offset);
        },

        /**
         * 初始化攻击趋势图
         */
        initTrendChart() {
            const chartDom = this.$refs.trendChart;
            if (!chartDom) return;
            this.trendChart = echarts.init(chartDom);
            const option = {
                animation: true,
                animationDuration: 800,
                animationEasing: 'cubicOut',
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow',
                        shadowStyle: {
                            color: 'rgba(144, 202, 249, 0.12)' // 浅蓝淡阴影，清新
                        }
                    },
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    borderColor: '#e7edf5',
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: [10, 14],
                    textStyle: {
                        color: '#4e5969',
                        fontSize: 12,
                        lineHeight: 1.6
                    },
                    extraCssText: 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);',
                    formatter: (params) => {
                        const val = params[0];
                        const isExceed = val.value > this.threshold;
                        const tagHtml = isExceed
                            ? '<span style="color:#f56c6c;font-size:11px;">● 攻击水平超标</span>'
                            : '<span style="color:#67c23a;font-size:11px;">● 攻击水平正常</span>';
                        return `${val.name}<br/>攻击次数：${val.value} 次<br/>${tagHtml}<br/><span style="color:#86909c;font-size:11px;">点击查看该时段攻击IP</span>`;
                    }
                },
                grid: {
                    left: '1%',
                    right: '2%',
                    bottom: '4%',
                    top: '12%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: [],
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: {
                        rotate: 45,
                        fontSize: 11,
                        color: '#86909c', // 更浅灰，清新柔和
                        margin: 10,
                        interval: 0
                    }
                },
                yAxis: {
                    type: 'value',
                    name: '攻击次数',
                    nameTextStyle: {
                        fontSize: 12,
                        color: '#86909c',
                        padding: [0, 0, 0, 8]
                    },
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: {
                        lineStyle: {
                            color: '#f0f4f9', // 极浅网格线
                            type: 'dashed'
                        }
                    },
                    axisLabel: {
                        fontSize: 11,
                        color: '#86909c'
                    }
                },
                series: [
                    {
                        data: [],
                        type: 'bar',
                        barWidth: '55%',
                        barMaxWidth: 32,
                        barMinHeight: 2,
                        // 清新浅青蓝渐变（主色）
                        itemStyle: {
                            borderRadius: [6, 6, 0, 0], // 圆角加大更柔和
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#a8daf8' },
                                { offset: 1, color: '#d0e9fb' }
                            ])
                        },
                        emphasis: {
                            focus: 'series',
                            itemStyle: {
                                borderRadius: [6, 6, 0, 0],
                                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                    { offset: 0, color: '#7cc7f2' },
                                    { offset: 1, color: '#b3e0f7' }
                                ]),
                                shadowBlur: 6,
                                shadowColor: 'rgba(124, 199, 242, 0.2)' // 淡阴影，不刺眼
                            }
                        },
                        // 均值线改为浅薄荷绿，替换原来刺眼橙黄
                        markLine: {
                            silent: true,
                            symbol: 'none',
                            lineStyle: {
                                color: '#88d8c0',
                                type: 'dashed',
                                width: 1.5
                            },
                            label: {
                                formatter: '平均值',
                                color: '#47b89c',
                                fontSize: 11,
                                backgroundColor: 'rgba(136, 216, 192, 0.12)',
                                padding: [2, 6],
                                borderRadius: 4,
                                position: 'insideMiddleTop'
                            },
                            data: [{ type: 'average', name: '平均值' }]
                        }
                    }
                ]
            };
            this.trendChart.setOption(option);

            // 绑定柱状图点击事件，唤起时段IP详情弹窗
            this.trendChart.on('click', (params) => {
                if (params.componentType === 'series') {
                    this.handleBarClick(params.name);
                }
            });
        },

        /**
         * 更新攻击趋势图数据
         */
        updateTrendChart() {
            if (!this.trendChart || this.trendData.length === 0) return;

            const xAxisData = this.trendData.map(item => item.dateTime);
            const seriesData = this.trendData.map(item => item.count);

            // 计算阈值（平均值的2倍），存到组件 data 供 tooltip formatter 使用
            const avgCount = this.totalTrendAttacks / this.trendData.length;
            this.threshold = avgCount * 2;

            // 为超过阈值的柱子设置红色渐变
            const itemStyles = seriesData.map(count => {
                if (count > this.threshold) {
                    // 超标：浅蜜桃粉渐变，温柔不刺眼
                    return {
                        borderRadius: [12, 12, 0, 0],
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#ffc8c8' },
                            { offset: 1, color: '#ffe5e5' }
                        ])
                    };
                }
                // 正常：浅青蓝清新渐变
                return {
                    borderRadius: [12, 12, 0, 0],
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#a8daf8' },
                        { offset: 1, color: '#d0e9fb' }
                    ])
                };
            });

            this.trendChart.setOption({
                xAxis: {
                    data: xAxisData
                },
                series: [
                    {
                        data: seriesData.map((value, index) => ({
                            value,
                            itemStyle: itemStyles[index]
                        }))
                    }
                ]
            });
        },

        /**
         * 点击柱状图柱子，打开时段IP详情弹窗
         * @param {String} hourKey 小时键值，格式如 "06-25 14:00"
         */
        handleBarClick(hourKey) {
            const hourData = this.trendData.find(item => item.dateTime === hourKey);
            if (!hourData || !hourData.topIps || hourData.topIps.length === 0) {
                this.$message.info("该时段暂无攻击IP记录");
                return;
            }
            this.currentHourLabel = this.formatHourLabel(hourKey);
            this.currentTopIps = hourData.topIps;
            this.dialogVisible = true;
        },

        /**
         * 将小时键值格式化为完整日期时间段标签
         * @param {String} hourKey 格式如 "06-25 14:00"
         * @returns {String} 格式如 "2026年06月25日 14:00 - 14:59"
         */
        formatHourLabel(hourKey) {
            const currentYear = new Date().getFullYear();
            // 解析 "06-25 14:00"
            const [datePart, timePart] = hourKey.split(' ');
            const [month, day] = datePart.split('-');
            // 从 "14:00" 提取小时，拼接 "xx:59"
            const hour = timePart.split(':')[0];
            const endTime = `${hour}:59`;
            return `${currentYear}年${month}月${day}日 ${timePart} - ${endTime}`;
        },

        /**
         * 窗口大小变化时自适应图表
         */
        handleResize() {
            if (this.trendChart) {
                this.trendChart.resize();
            }
        },

        /**
         * 点击刷新按钮
         */
        handleRefresh() {
            this.$emit('refresh');
        },

        /**
         * 判断IP是否已被封禁（前端本地比对）
         * @param {String} ip IP地址
         * @returns {Boolean} 是否已封禁
         */
        isIpBanned(ip) {
            return this.allBannedIps.includes(ip);
        },

        /**
         * 根据来源监狱数量自动返回监狱名称
         * 仅一个监狱时自动带上，多个监狱时返回空串让父组件弹窗手动选择
         * @param {String} jails 逗号分隔的监狱名称
         * @returns {String} 单个监狱名或空串
         */
        getAutoJail(jails) {
            if (!jails) return '';
            const jailArr = jails.split(', ').filter(Boolean);
            return jailArr.length === 1 ? jailArr[0] : '';
        },

        /**
         * 通知父组件打开确认弹窗执行封禁/解封
         * @param {String} type 操作类型 ban/unban/ban-batch/unban-batch
         * @param {String} ip 目标IP地址（单个操作时使用）
         * @param {String} jailName 监狱名称
         * @param {Array} ips 批量操作IP列表（可选）
         */
        handleOpenConfirm(type, ip = '', jailName = '', ips = []) {
            this.$emit('open-confirm', type, ip, jailName, ips);
        },

        /**
         * 批量封禁：提取选中IP和监狱名，触发父组件确认弹窗
         * 前置校验已由 canBatchBan computed 保证，此处直接取第一项的监狱名
         */
        handleBatchBan() {
            if (!this.canBatchBan) return;
            const jailName = this.selectedJailSet[0];
            const ips = this.selectedDialogRows.map(row => row.ip);
            this.handleOpenConfirm('ban-batch', '', jailName, ips);
        },

        /**
         * 批量解封：提取选中IP和监狱名，触发父组件确认弹窗（走危险操作二次确认流程）
         * 前置校验已由 canBatchUnban computed 保证，此处直接取第一项的监狱名
         */
        handleBatchUnban() {
            if (!this.canBatchUnban) return;
            const jailName = this.selectedJailSet[0];
            const ips = this.selectedDialogRows.map(row => row.ip);
            this.handleOpenConfirm('unban-batch', '', jailName, ips);
        },

        /**
         * 关闭时段IP详情弹窗时重置选中状态
         */
        handleDialogClose() {
            this.dialogVisible = false;
            this.selectedDialogRows = [];
        },

        /**
         * 复制弹窗中所有IP到剪贴板
         */
        async copyAllDialogIps() {
            const ips = this.currentTopIps.map(item => item.ip);
            if (!ips || ips.length === 0) {
                this.$message.warning("没有可复制的IP");
                return;
            }
            await this.copyToClipboard(ips.join("\n"));
            this.$message.success(`已复制 ${ips.length} 个IP`);
        },

        /**
         * 复制弹窗中选中的IP到剪贴板
         */
        async copySelectedDialogIps() {
            if (this.selectedDialogRows.length === 0) {
                this.$message.warning("请先选择要复制的IP");
                return;
            }
            const ips = this.selectedDialogRows.map(row => row.ip);
            await this.copyToClipboard(ips.join("\n"));
            this.$message.success(`已复制 ${ips.length} 个选中的IP`);
        },

        /**
         * 处理弹窗表格选择变更事件（存储完整行对象，用于提取 ip/jails/banned）
         * @param {Array} selection 选中的行数据
         */
        handleDialogSelectionChange(selection) {
            this.selectedDialogRows = selection;
        },

        /**
         * 复制单行IP地址到剪贴板
         * @param {String} ip 要复制的IP地址
         */
        async handleCopyIp(ip) {
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

/* ==================== 标题+刷新组合 ==================== */
.title-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.title-group h2 {
    margin: 0;
    font-size: 18px;
    color: #1f2d3d;
}

/* ==================== 趋势统计样式 ==================== */
.trend-stats {
    display: flex;
    gap: 20px;
    align-items: center;
}

.trend-stats .stat-item {
    font-size: 13px;
}

.trend-stats .stat-label {
    color: #909399;
}

.trend-stats .stat-value {
    color: #303133;
    font-weight: 600;
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

/* ==================== 刷新按钮 ==================== */
.refresh-btn {
    color: #409eff;
    font-size: 12px;
    padding: 4px 8px;
    transition: all 0.25s ease;
}

/* ==================== 刷新按钮悬浮动画 ==================== */
.refresh-btn:hover {
    opacity: 0.85;
}

/* 手动刷新图标：hover 时旋转一圈 */
.refresh-btn ::v-deep .el-icon-refresh {
    transition: transform 0.5s ease;
}

.refresh-btn:hover ::v-deep .el-icon-refresh {
    transform: rotate(360deg);
}

.refresh-time {
    font-size: 12px;
    color: #8392a5;
}

/* ==================== 图表容器 ==================== */
.chart-container {
    margin-top: 20px;
}

/* ==================== 弹窗相关样式 ==================== */
.dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.hour-label {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}

.tip-text {
    font-size: 12px;
    color: #909399;
}

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

/* ==================== 弹窗 footer 按钮组间距 ==================== */
/* el-tooltip>span 包装层打断了 el-button+el-button 的默认 margin，改用 flex+gap 统一间距 */
::v-deep .trend-detail-dialog .el-dialog__footer .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    align-items: center;
}

::v-deep .dialog-footer .el-button+.el-button,
.el-checkbox.is-bordered+.el-checkbox.is-bordered {
    margin-left: 0;
}


/* ==================== 响应式适配 ==================== */

/* 标题行适配：元素开始换行变形时即分两行 */
@media (max-width: 900px) {
    .status-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .trend-stats {
        margin-top: 0;
    }
}
</style>
