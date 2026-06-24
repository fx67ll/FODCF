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
            <div ref="trendChart" style="width: 100%; height: 300px;"></div>
        </div>
    </div>
</template>

<script>
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
        }
    },
    data() {
        return {
            trendChart: null          // 趋势图实例
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
        /**
         * 初始化攻击趋势图
         */
        initTrendChart() {
            const chartDom = this.$refs.trendChart;
            if (!chartDom) return;
            this.trendChart = echarts.init(chartDom);
            const option = {
                tooltip: {
                    trigger: 'axis',
                    formatter: '{b}<br/>攻击次数：{c} 次'
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: [],
                    axisLabel: {
                        rotate: 45,
                        fontSize: 10
                    }
                },
                yAxis: {
                    type: 'value',
                    name: '攻击次数',
                    nameTextStyle: {
                        fontSize: 12
                    }
                },
                series: [
                    {
                        data: [],
                        type: 'bar',
                        barWidth: '60%',
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#409eff' },
                                { offset: 1, color: '#66b1ff' }
                            ])
                        },
                        emphasis: {
                            itemStyle: {
                                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                    { offset: 0, color: '#337ecc' },
                                    { offset: 1, color: '#409eff' }
                                ])
                            }
                        }
                    }
                ]
            };
            this.trendChart.setOption(option);
        },

        /**
         * 更新攻击趋势图数据
         */
        updateTrendChart() {
            if (!this.trendChart || this.trendData.length === 0) return;

            const xAxisData = this.trendData.map(item => item.dateTime);
            const seriesData = this.trendData.map(item => item.count);

            // 计算阈值（平均值的2倍）
            const avgCount = this.totalTrendAttacks / this.trendData.length;
            const threshold = avgCount * 2;

            // 为超过阈值的柱子设置红色
            const itemStyles = seriesData.map(count => {
                if (count > threshold) {
                    return {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#f56c6c' },
                            { offset: 1, color: '#f78989' }
                        ])
                    };
                }
                return {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#409eff' },
                        { offset: 1, color: '#66b1ff' }
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

/* ==================== 新增：趋势统计样式 ==================== */
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
}

.refresh-time {
    font-size: 12px;
    color: #8392a5;
}

/* ==================== 图表容器 ==================== */
.chart-container {
    margin-top: 20px;
}

/* ==================== 响应式适配 ==================== */
@media (max-width: 768px) {
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
