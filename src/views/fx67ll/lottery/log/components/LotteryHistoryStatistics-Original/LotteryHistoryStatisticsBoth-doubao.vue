<template>
    <el-dialog :visible.sync="dialogVisible" width="900px" :close-on-click-modal="false"
        :class="showCircle ? 'lottery-stats-dialog' : 'frequency-dialog'" @close="handleClose" v-loading="loading"
        element-loading-text="正在加载统计数据..." element-loading-spinner="el-icon-loading"
        element-loading-background="rgba(255, 255, 255, 0.8)" append-to-body>

        <!-- 自定义标题：点击切换彩蛋 -->
        <span slot="title" class="dialog-title-clickable" @click="toggleView">
            历史号码出现频率统计
        </span>

        <!-- 视图 1: 圆形球样式 (默认) -->
        <div v-if="showCircle" class="stats-container">
            <el-tabs v-model="activeType" type="card" class="type-tabs">
                <!-- 大乐透 -->
                <el-tab-pane label="大乐透" name="1">
                    <div class="zone-section">
                        <h4>前区 (1-35)</h4>
                        <div class="balls-container">
                            <div v-for="num in getSortedNums(1, '前区', 35)" :key="'front-1-' + num" class="ball-item"
                                :class="getBallClass(1, '前区', num, false)">
                                <span class="num-val">{{ num }}</span>
                                <span class="num-freq">{{ getFreq(1, '前区', num) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="zone-section">
                        <h4>后区 (1-12)</h4>
                        <div class="balls-container">
                            <div v-for="num in getSortedNums(1, '后区', 12)" :key="'back-1-' + num" class="ball-item"
                                :class="getBallClass(1, '后区', num, true)">
                                <span class="num-val">{{ num }}</span>
                                <span class="num-freq">{{ getFreq(1, '后区', num) }}</span>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>

                <!-- 双色球 -->
                <el-tab-pane label="双色球" name="2">
                    <div class="zone-section">
                        <h4>红球区 (1-33)</h4>
                        <div class="balls-container">
                            <div v-for="num in getSortedNums(2, '前区', 33)" :key="'front-2-' + num" class="ball-item"
                                :class="getBallClass(2, '前区', num, false)">
                                <span class="num-val">{{ num }}</span>
                                <span class="num-freq">{{ getFreq(2, '前区', num) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="zone-section">
                        <h4>蓝球区 (1-16)</h4>
                        <div class="balls-container">
                            <div v-for="num in getSortedNums(2, '后区', 16)" :key="'back-2-' + num" class="ball-item"
                                :class="getBallClass(2, '后区', num, true)">
                                <span class="num-val">{{ num }}</span>
                                <span class="num-freq">{{ getFreq(2, '后区', num) }}</span>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>
            </el-tabs>

            <!-- 图例 -->
            <div class="legend-box">
                <span class="legend-item"><i class="legend-color level-0-sample"></i> 冷门 (0次)</span>
                <span class="legend-item"><i class="legend-color level-2-sample"></i> 一般</span>
                <span class="legend-item"><i class="legend-color level-4-sample"></i> 热门</span>
            </div>
        </div>

        <!-- 视图 2: 方形卡片样式 -->
        <div v-else>
            <el-tabs v-model="activeTab" type="border-card">
                <!-- 大乐透 -->
                <el-tab-pane label="大乐透" name="dlt">
                    <el-tabs v-model="dltZone">
                        <el-tab-pane label="前区 (1-35)" name="front">
                            <div class="number-grid">
                                <div v-for="item in currentDltFrontData" :key="item.number" class="number-card"
                                    :class="{ 'high-frequency': item.count === maxFrontCount && maxFrontCount > 0 }"
                                    :style="{ backgroundColor: getColorByCount(item.count, maxFrontCount) }">
                                    <div class="number">{{ formatNumber(item.number) }}</div>
                                    <div class="count">{{ item.count }}次</div>
                                </div>
                            </div>
                        </el-tab-pane>
                        <el-tab-pane label="后区 (1-12)" name="back">
                            <div class="number-grid">
                                <div v-for="item in currentDltBackData" :key="item.number" class="number-card"
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
                                <div v-for="item in currentSsqFrontData" :key="item.number" class="number-card"
                                    :class="{ 'high-frequency': item.count === maxFrontCountSsq && maxFrontCountSsq > 0 }"
                                    :style="{ backgroundColor: getColorByCount(item.count, maxFrontCountSsq) }">
                                    <div class="number">{{ formatNumber(item.number) }}</div>
                                    <div class="count">{{ item.count }}次</div>
                                </div>
                            </div>
                        </el-tab-pane>
                        <el-tab-pane label="后区 (1-16)" name="back">
                            <div class="number-grid">
                                <div v-for="item in currentSsqBackData" :key="item.number" class="number-card"
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
        </div>

        <!-- Footer 区域 -->
        <span slot="footer" class="dialog-footer">
            <!-- Footer 1: 圆形球样式的控制 -->
            <div v-if="showCircle" class="footer-left-circle">
                <el-switch v-model="sortByFreq" :active-text="sortByFreq ? '按频率排序' : '按数字排序'" inactive-color="#ccc"
                    class="sort-switch" />
            </div>

            <!-- Footer 2: 方形卡片样式的控制 -->
            <div v-else class="footer-left-square">
                <span class="sort-label">排序方式：</span>
                <el-radio-group v-model="sortByFrequency" size="small">
                    <el-radio-button :label="true">按出现频率</el-radio-button>
                    <el-radio-button :label="false">按号码大小</el-radio-button>
                </el-radio-group>
                <span class="hint" v-if="sortByFrequency">（从高频到低频）</span>
                <span class="hint" v-if="!sortByFrequency">（从小到大）</span>
            </div>

            <el-button @click="dialogVisible = false">关 闭</el-button>
        </span>
    </el-dialog>
</template>

<script>
import { listHistoryStatistics } from "@/api/fx67ll/lottery/log";

export default {
    name: "LotteryHistoryStatistics",
    props: {
        visible: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            // 切换控制
            showCircle: true, // true = 圆形球, false = 方形卡片

            // 共享状态
            loading: false,
            dialogVisible: false,
            rawData: [], // 保存原始接口数据供两种视图解析

            // ===== 视图1 (圆形球) 数据 =====
            activeType: "1",
            statsMap: new Map(),
            zoneQuantiles: new Map(),
            sortByFreq: true,

            // ===== 视图2 (方形卡片) 数据 =====
            sortByFrequency: true,
            activeTab: "dlt",
            dltZone: "front",
            ssqZone: "front",
            dltFrontDataNumber: [],
            dltBackDataNumber: [],
            ssqFrontDataNumber: [],
            ssqBackDataNumber: [],
            dltFrontDataFreq: [],
            dltBackDataFreq: [],
            ssqFrontDataFreq: [],
            ssqBackDataFreq: [],
            maxFrontCount: 0,
            maxBackCount: 0,
            maxFrontCountSsq: 0,
            maxBackCountSsq: 0
        };
    },
    computed: {
        // 视图2 的计算属性
        currentDltFrontData() {
            return this.sortByFrequency ? this.dltFrontDataFreq : this.dltFrontDataNumber
        },
        currentDltBackData() {
            return this.sortByFrequency ? this.dltBackDataFreq : this.dltBackDataNumber
        },
        currentSsqFrontData() {
            return this.sortByFrequency ? this.ssqFrontDataFreq : this.ssqFrontDataNumber
        },
        currentSsqBackData() {
            return this.sortByFrequency ? this.ssqBackDataFreq : this.ssqBackDataNumber
        }
    },
    watch: {
        visible(val) {
            this.dialogVisible = val;
            if (val) {
                this.fetchData();
            }
        },
        dialogVisible(val) {
            this.$emit("update:visible", val);
        },
        sortByFreq() {
            this.$forceUpdate();
        }
    },
    methods: {
        // 切换彩蛋方法
        toggleView() {
            this.showCircle = !this.showCircle;
        },

        handleClose() {
            this.statsMap.clear();
            this.zoneQuantiles.clear();
            this.sortByFreq = true;
            this.showCircle = true; // 关闭后重置默认视图
            this.dialogVisible = false;
        },

        fetchData() {
            this.loading = true;
            listHistoryStatistics().then((res) => {
                if (res && res.code === 200) {
                    const rows = res.rows || [];
                    this.rawData = rows;
                    // 同时解析两种数据结构，保证切换流畅
                    this.structureDataForCircle(rows);
                    this.structureDataForSquare(rows);
                }
                this.loading = false;
            }).catch(() => {
                this.loading = false;
            });
        },

        // ===== 视图1 (圆形球) 逻辑 =====
        structureDataForCircle(rows) {
            this.statsMap = new Map();
            this.zoneQuantiles = new Map();
            const zoneCounts = new Map();

            rows.forEach((row) => {
                const zoneKey = `${row.numberType}_${row.zone}`;
                if (!zoneCounts.has(zoneKey)) zoneCounts.set(zoneKey, []);

                const nums = row.numbers.split(",");
                nums.forEach((n) => {
                    const numKey = `${zoneKey}_${n.trim()}`;
                    this.statsMap.set(numKey, row.occurrenceCount);
                    zoneCounts.get(zoneKey).push(row.occurrenceCount);
                });
            });

            zoneCounts.forEach((counts, zoneKey) => {
                this.zoneQuantiles.set(zoneKey, counts.sort((a, b) => a - b));
            });
        },
        getFreq(type, zone, num) {
            const key = `${type}_${zone}_${num}`;
            return this.statsMap.get(key) || 0;
        },
        getBallClass(type, zone, num, isBackZone = false) {
            const count = this.getFreq(type, zone, num);
            if (count === 0) return "level-0" + (isBackZone ? " back-zone" : "");

            const zoneKey = `${type}_${zone}`;
            const sortedCounts = this.zoneQuantiles.get(zoneKey) || [];
            const len = sortedCounts.length;

            let rank = 0;
            for (let i = 0; i < len; i++) {
                if (sortedCounts[i] >= count) { rank = i; break; }
            }
            const ratio = len > 0 ? rank / len : 0;

            let classStr = "";
            if (ratio < 0.3) classStr = "level-1";
            else if (ratio < 0.6) classStr = "level-2";
            else if (ratio < 0.8) classStr = "level-3";
            else if (ratio < 0.95) classStr = "level-4";
            else classStr = "level-5";

            if (isBackZone) classStr += " back-zone";
            return classStr;
        },
        getSortedNums(type, zone, maxNum) {
            const baseNums = Array.from({ length: maxNum }, (_, i) => i + 1);
            if (!this.sortByFreq) return baseNums;
            return baseNums.sort((a, b) => {
                const freqA = this.getFreq(type, zone, a);
                const freqB = this.getFreq(type, zone, b);
                if (freqB !== freqA) return freqB - freqA;
                return a - b;
            });
        },

        // ===== 视图2 (方形卡片) 逻辑 =====
        structureDataForSquare(rows) {
            const dltFrontMap = new Map();
            const dltBackMap = new Map();
            const ssqFrontMap = new Map();
            const ssqBackMap = new Map();

            for (let i = 1; i <= 35; i++) dltFrontMap.set(i, 0);
            for (let i = 1; i <= 12; i++) dltBackMap.set(i, 0);
            for (let i = 1; i <= 33; i++) ssqFrontMap.set(i, 0);
            for (let i = 1; i <= 16; i++) ssqBackMap.set(i, 0);

            rows.forEach(item => {
                const numberType = item.numberType;
                const zone = item.zone;
                const count = item.occurrenceCount;
                const numbers = item.numbers.split(',').map(n => parseInt(n.trim()));

                if (numberType === 1) {
                    if (zone === '前区') numbers.forEach(num => dltFrontMap.set(num, count));
                    else if (zone === '后区') numbers.forEach(num => dltBackMap.set(num, count));
                } else if (numberType === 2) {
                    if (zone === '前区') numbers.forEach(num => ssqFrontMap.set(num, count));
                    else if (zone === '后区') numbers.forEach(num => ssqBackMap.set(num, count));
                }
            });

            const toSortedByNumber = (map) => Array.from(map.entries()).map(([number, count]) => ({ number, count })).sort((a, b) => a.number - b.number);
            const toSortedByFreq = (arr) => [...arr].sort((a, b) => (a.count !== b.count ? b.count - a.count : a.number - b.number));

            this.dltFrontDataNumber = toSortedByNumber(dltFrontMap);
            this.dltBackDataNumber = toSortedByNumber(dltBackMap);
            this.ssqFrontDataNumber = toSortedByNumber(ssqFrontMap);
            this.ssqBackDataNumber = toSortedByNumber(ssqBackMap);

            this.dltFrontDataFreq = toSortedByFreq(this.dltFrontDataNumber);
            this.dltBackDataFreq = toSortedByFreq(this.dltBackDataNumber);
            this.ssqFrontDataFreq = toSortedByFreq(this.ssqFrontDataNumber);
            this.ssqBackDataFreq = toSortedByFreq(this.ssqBackDataNumber);

            this.maxFrontCount = Math.max(...this.dltFrontDataNumber.map(d => d.count), 0);
            this.maxBackCount = Math.max(...this.dltBackDataNumber.map(d => d.count), 0);
            this.maxFrontCountSsq = Math.max(...this.ssqFrontDataNumber.map(d => d.count), 0);
            this.maxBackCountSsq = Math.max(...this.ssqBackDataNumber.map(d => d.count), 0);
        },
        getColorByCount(count, maxCount) {
            if (maxCount === 0) return '#f8f8f8';
            const intensity = Math.pow(count / maxCount, 1.2);
            const r = Math.round(248 + (211 - 248) * intensity);
            const g = Math.round(248 + (47 - 248) * intensity);
            const b = Math.round(248 + (47 - 248) * intensity);
            return `rgb(${r}, ${g}, ${b})`;
        },
        formatNumber(num) {
            return num < 10 ? `0${num}` : `${num}`;
        }
    },
};
</script>

<style scoped>
/* 标题点击样式 */
.dialog-title-clickable {
    cursor: pointer;
    user-select: none;
    transition: color 0.3s;
}

.dialog-title-clickable:hover {
    color: #409eff;
}

/* 共享 Footer 布局 */
.dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0;
    padding-top: 0;
}

/* ===== 视图1：圆形球样式 (保留原样式) ===== */
.lottery-stats-dialog>>>.el-dialog__body {
    padding: 20px;
}

.stats-container {
    min-height: 300px;
}

.type-tabs {
    margin-bottom: 20px;
}

.zone-section {
    margin-bottom: 25px;
}

.zone-section h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #666;
    border-left: 4px solid #409eff;
    padding-left: 10px;
    line-height: 1;
}

.balls-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
}

.ball-item {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: #fff;
    border: 1px solid #e9e9eb;
    position: relative;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.ball-item:hover {
    transform: scale(1.15);
    z-index: 10;
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.ball-item .num-val {
    font-size: 15px;
    font-weight: 500;
    color: #333;
    line-height: 1;
}

.ball-item .num-freq {
    font-size: 9px;
    line-height: 1;
    margin-top: 2px;
    color: #666;
}

/* Level 0-5 颜色... (此处省略，与原代码一致，建议完整复制) */
.ball-item.level-0 {
    background: #ffffff;
    border: 1px dashed #e0e0e0;
    opacity: 0.6;
}

.ball-item.level-0 .num-val {
    color: #ccc;
}

.ball-item.level-2 {
    background: #fff1f0;
    border-color: #ffccc7;
}

.ball-item.level-4 {
    width: 48px;
    height: 48px;
    background: #ff4d4f;
    border-color: #cf1322;
    box-shadow: 0 4px 10px rgba(255, 77, 79, 0.4);
}

.ball-item.level-4 .num-val {
    color: #fff;
    font-weight: bold;
    font-size: 17px;
}

.ball-item.back-zone.level-2 {
    background: #e6f7ff;
    border-color: #91d5ff;
}

.ball-item.back-zone.level-4 {
    background: #1890ff;
    border-color: #0050b3;
}

.legend-box {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: center;
    gap: 40px;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #666;
}

.legend-color {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
}

.level-0-sample {
    background: #fff;
    border: 1px dashed #ddd;
}

.level-2-sample {
    background: #ffa39e;
}

.level-4-sample {
    background: linear-gradient(135deg, #ff4d4f, #cf1322);
}

/* Switch 样式 */
.sort-switch {
    font-size: 14px;
}

.sort-switch /deep/ .el-switch__label {
    color: #606266;
}

/* ===== 视图2：方形卡片样式 (保留原样式) ===== */
.number-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 90px));
    gap: 12px;
    justify-content: center;
    padding: 16px;
}

.number-card {
    text-align: center;
    padding: 12px 0;
    border-radius: 12px;
    transition: all 0.2s;
    cursor: default;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    background: #fff;
    /* 默认背景 */
}

.number-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

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
}

.count {
    font-size: 0.8rem;
    color: #555;
    margin-top: 6px;
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

.footer-left-square {
    display: flex;
    align-items: center;
    gap: 8px;
}

.sort-label {
    font-size: 14px;
    color: #606266;
}

.hint {
    font-size: 12px;
    color: #f56c6c;
}
</style>