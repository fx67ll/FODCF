<template>
    <el-dialog title="历史号码出现频率统计" :visible.sync="dialogVisible" width="80%" :close-on-click-modal="false" top="5vh"
        custom-class="frequency-dialog" @close="handleClose" v-loading="loading" element-loading-text="正在加载统计数据..."
        element-loading-spinner="el-icon-loading" element-loading-background="rgba(255, 255, 255, 0.8)" append-to-body>
        <el-tabs v-model="activeTab" type="border-card">
            <!-- 大乐透 -->
            <el-tab-pane label="大乐透" name="dlt">
                <el-tabs v-model="dltZone">
                    <el-tab-pane label="前区 (1-35)" name="front">
                        <div class="number-grid">
                            <div v-for="item in dltFrontData" :key="item.number" class="number-card"
                                :class="{ 'high-frequency': item.count === maxFrontCount && maxFrontCount > 0 }"
                                :style="{ backgroundColor: getColorByCount(item.count, maxFrontCount) }">
                                <div class="number">{{ formatNumber(item.number) }}</div>
                                <div class="count">{{ item.count }}次</div>
                            </div>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label="后区 (1-12)" name="back">
                        <div class="number-grid">
                            <div v-for="item in dltBackData" :key="item.number" class="number-card"
                                :class="{ 'high-frequency': item.count === maxBackCount && maxBackCount > 0 }"
                                :style="{ backgroundColor: getColorByCount(item.count, maxBackCount) }">
                                <div class="number">{{ formatNumber(item.number) }}</div>
                                <div class="count">{{ item.count }}次</div>
                            </div>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </el-tab-pane>

            <!-- 双色球 -->
            <el-tab-pane label="双色球" name="ssq">
                <el-tabs v-model="ssqZone">
                    <el-tab-pane label="前区 (1-33)" name="front">
                        <div class="number-grid">
                            <div v-for="item in ssqFrontData" :key="item.number" class="number-card"
                                :class="{ 'high-frequency': item.count === maxFrontCountSsq && maxFrontCountSsq > 0 }"
                                :style="{ backgroundColor: getColorByCount(item.count, maxFrontCountSsq) }">
                                <div class="number">{{ formatNumber(item.number) }}</div>
                                <div class="count">{{ item.count }}次</div>
                            </div>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label="后区 (1-16)" name="back">
                        <div class="number-grid">
                            <div v-for="item in ssqBackData" :key="item.number" class="number-card"
                                :class="{ 'high-frequency': item.count === maxBackCountSsq && maxBackCountSsq > 0 }"
                                :style="{ backgroundColor: getColorByCount(item.count, maxBackCountSsq) }">
                                <div class="number">{{ formatNumber(item.number) }}</div>
                                <div class="count">{{ item.count }}次</div>
                            </div>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </el-tab-pane>
        </el-tabs>

        <!-- 色条图例 -->
        <div class="color-legend">
            <span>低频</span>
            <div class="gradient-bar"></div>
            <span>高频</span>
        </div>

        <span slot="footer" class="dialog-footer">
            <el-button @click="dialogVisible = false">关 闭</el-button>
        </span>
    </el-dialog>
</template>

<script>
import { listHistoryStatistics } from '@/api/fx67ll/lottery/log'

export default {
    name: 'LotteryHistoryStatisticsSquare',
    data() {
        return {
            dialogVisible: false,
            loading: false,
            activeTab: 'dlt',
            dltZone: 'front',
            ssqZone: 'front',
            rawData: [],
            dltFrontData: [],
            dltBackData: [],
            ssqFrontData: [],
            ssqBackData: [],
            maxFrontCount: 0,
            maxBackCount: 0,
            maxFrontCountSsq: 0,
            maxBackCountSsq: 0
        }
    },
    methods: {
        open() {
            this.dialogVisible = true
            this.fetchData()
        },
        handleClose() {
            this.dialogVisible = false
        },
        fetchData() {
            this.loading = true
            listHistoryStatistics()
                .then(res => {
                    if (res.code === 200) {
                        this.rawData = res.rows || []
                        this.processData()
                    } else {
                        this.$message.error('获取统计数据失败')
                    }
                })
                .catch(err => {
                    console.error(err)
                    this.$message.error('接口请求异常')
                })
                .finally(() => {
                    this.loading = false
                })
        },
        processData() {
            const dltFrontMap = new Map()
            const dltBackMap = new Map()
            const ssqFrontMap = new Map()
            const ssqBackMap = new Map()

            for (let i = 1; i <= 35; i++) dltFrontMap.set(i, 0)
            for (let i = 1; i <= 12; i++) dltBackMap.set(i, 0)
            for (let i = 1; i <= 33; i++) ssqFrontMap.set(i, 0)
            for (let i = 1; i <= 16; i++) ssqBackMap.set(i, 0)

            this.rawData.forEach(item => {
                const numberType = item.numberType
                const zone = item.zone
                const count = item.occurrenceCount
                const numbers = item.numbers.split(',').map(n => parseInt(n.trim()))

                if (numberType === 1) {
                    if (zone === '前区') {
                        numbers.forEach(num => dltFrontMap.set(num, count))
                    } else if (zone === '后区') {
                        numbers.forEach(num => dltBackMap.set(num, count))
                    }
                } else if (numberType === 2) {
                    if (zone === '前区') {
                        numbers.forEach(num => ssqFrontMap.set(num, count))
                    } else if (zone === '后区') {
                        numbers.forEach(num => ssqBackMap.set(num, count))
                    }
                }
            })

            this.dltFrontData = Array.from(dltFrontMap.entries())
                .map(([number, count]) => ({ number, count }))
                .sort((a, b) => a.number - b.number)
            this.dltBackData = Array.from(dltBackMap.entries())
                .map(([number, count]) => ({ number, count }))
                .sort((a, b) => a.number - b.number)
            this.ssqFrontData = Array.from(ssqFrontMap.entries())
                .map(([number, count]) => ({ number, count }))
                .sort((a, b) => a.number - b.number)
            this.ssqBackData = Array.from(ssqBackMap.entries())
                .map(([number, count]) => ({ number, count }))
                .sort((a, b) => a.number - b.number)

            this.maxFrontCount = Math.max(...this.dltFrontData.map(d => d.count), 0)
            this.maxBackCount = Math.max(...this.dltBackData.map(d => d.count), 0)
            this.maxFrontCountSsq = Math.max(...this.ssqFrontData.map(d => d.count), 0)
            this.maxBackCountSsq = Math.max(...this.ssqBackData.map(d => d.count), 0)
        },
        /**
         * 极简配色：低频 -> 极浅灰，高频 -> 深红
         * 使用指数增强对比，让低频接近白色，高频浓烈
         */
        getColorByCount(count, maxCount) {
            if (maxCount === 0) return '#f8f8f8'
            const intensity = Math.pow(count / maxCount, 1.2) // 指数调整，让低频更淡，高频更浓
            // 起始色：浅灰 rgb(248,248,248)
            // 结束色：深红 rgb(211,47,47)
            const startR = 248, startG = 248, startB = 248
            const endR = 211, endG = 47, endB = 47
            const r = Math.round(startR + (endR - startR) * intensity)
            const g = Math.round(startG + (endG - startG) * intensity)
            const b = Math.round(startB + (endB - startB) * intensity)
            return `rgb(${r}, ${g}, ${b})`
        },
        formatNumber(num) {
            return num < 10 ? `0${num}` : `${num}`
        }
    }
}
</script>

<style scoped>
.number-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 90px));
    gap: 12px;
    justify-content: center;
    padding: 16px;
    /* 无滚动条 */
}

.number-card {
    text-align: center;
    padding: 12px 0;
    border-radius: 12px;
    transition: all 0.2s;
    cursor: default;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.number-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

/* 高频卡片额外强调 */
.number-card.high-frequency {
    box-shadow: 0 4px 12px rgba(211, 47, 47, 0.4);
    border: 1px solid #ffcdd2;
}

.number-card.high-frequency .number,
.number-card.high-frequency .count {
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.number {
    font-size: 1.4rem;
    font-weight: bold;
    color: #2c3e50;
    transition: color 0.2s;
}

.count {
    font-size: 0.8rem;
    color: #555;
    margin-top: 6px;
    transition: color 0.2s;
}

.color-legend {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 20px;
    padding: 0 16px 10px 0;
    font-size: 12px;
    color: #666;
}

.gradient-bar {
    width: 150px;
    height: 12px;
    margin: 0 10px;
    border-radius: 6px;
    background: linear-gradient(to right, #f8f8f8, #d32f2f);
}

@media (max-width: 768px) {
    .number-grid {
        grid-template-columns: repeat(auto-fill, minmax(65px, 70px));
        gap: 8px;
    }

    .number {
        font-size: 1.1rem;
    }

    .gradient-bar {
        width: 100px;
    }
}
</style>