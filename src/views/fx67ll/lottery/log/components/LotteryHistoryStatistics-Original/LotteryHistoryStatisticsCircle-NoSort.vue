<template>
    <el-dialog title="历史号码出现频率统计" :visible.sync="dialogVisible" width="900px" :close-on-click-modal="false"
        class="lottery-stats-dialog" @close="handleClose">
        <div v-loading="loading" class="stats-container">
            <!-- 顶部切换 Tab -->
            <el-tabs v-model="activeType" type="card" class="type-tabs">
                <!-- 大乐透 -->
                <el-tab-pane label="大乐透" name="1">
                    <div class="zone-section">
                        <h4>前区 (1-35)</h4>
                        <div class="balls-container">
                            <div v-for="num in 35" :key="'front-1-' + num" class="ball-item"
                                :class="getBallClass(1, '前区', num)">
                                <span class="num-val">{{ num }}</span>
                                <span class="num-freq">{{ getFreq(1, '前区', num) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="zone-section">
                        <h4>后区 (1-12)</h4>
                        <div class="balls-container">
                            <div v-for="num in 12" :key="'back-1-' + num" class="ball-item"
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
                            <div v-for="num in 33" :key="'front-2-' + num" class="ball-item"
                                :class="getBallClass(2, '前区', num)">
                                <span class="num-val">{{ num }}</span>
                                <span class="num-freq">{{ getFreq(2, '前区', num) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="zone-section">
                        <h4>蓝球区 (1-16)</h4>
                        <div class="balls-container">
                            <div v-for="num in 16" :key="'back-2-' + num" class="ball-item"
                                :class="getBallClass(2, '后区', num, true)">
                                <span class="num-val">{{ num }}</span>
                                <span class="num-freq">{{ getFreq(2, '后区', num) }}</span>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>
            </el-tabs>

            <!-- 图例说明 -->
            <div class="legend-box">
                <span class="legend-item"><i class="legend-color level-0-sample"></i> 冷门 (0次)</span>
                <span class="legend-item"><i class="legend-color level-2-sample"></i> 一般</span>
                <span class="legend-item"><i class="legend-color level-4-sample"></i> 热门</span>
            </div>
        </div>

        <span slot="footer" class="dialog-footer">
            <el-button @click="dialogVisible = false">关 闭</el-button>
        </span>
    </el-dialog>
</template>

<script>
import { listHistoryStatistics } from "@/api/fx67ll/lottery/log";

export default {
    name: "LotteryHistoryStatisticsCircle",
    props: {
        visible: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            loading: false,
            activeType: "1",
            dialogVisible: false,
            statsMap: new Map(),
            // 修复：按【彩票类型+区】分别存储分位数，解决双色球蓝球全0问题
            zoneQuantiles: new Map(), 
        };
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
    },
    methods: {
        handleClose() {
            this.statsMap.clear();
            this.zoneQuantiles.clear();
        },
        fetchData() {
            this.loading = true;
            listHistoryStatistics().then((res) => {
                if (res && res.code === 200) {
                    this.structureData(res.rows || []);
                }
                this.loading = false;
            }).catch(() => {
                this.loading = false;
            });
        },
        structureData(rows) {
            this.statsMap = new Map();
            this.zoneQuantiles = new Map();
            // 临时存储每个区的所有频次
            const zoneCounts = new Map();

            rows.forEach((row) => {
                const zoneKey = `${row.numberType}_${row.zone}`;
                if (!zoneCounts.has(zoneKey)) {
                    zoneCounts.set(zoneKey, []);
                }

                const nums = row.numbers.split(",");
                nums.forEach((n) => {
                    const numKey = `${zoneKey}_${n.trim()}`;
                    this.statsMap.set(numKey, row.occurrenceCount);
                    zoneCounts.get(zoneKey).push(row.occurrenceCount);
                });
            });

            // 为每个区单独计算排序后的分位数数组
            zoneCounts.forEach((counts, zoneKey) => {
                this.zoneQuantiles.set(zoneKey, counts.sort((a, b) => a - b));
            });
        },
        getFreq(type, zone, num) {
            const key = `${type}_${zone}_${num}`;
            return this.statsMap.get(key) || 0;
        },
        // 修复：传入type和zone，使用对应区的分位数计算等级
        getBallClass(type, zone, num, isBackZone = false) {
            const count = this.getFreq(type, zone, num);
            if (count === 0) return "level-0" + (isBackZone ? " back-zone" : "");

            const zoneKey = `${type}_${zone}`;
            const sortedCounts = this.zoneQuantiles.get(zoneKey) || [];
            const len = sortedCounts.length;

            let rank = 0;
            for (let i = 0; i < len; i++) {
                if (sortedCounts[i] >= count) {
                    rank = i;
                    break;
                }
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
    },
};
</script>

<style scoped>
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

/* 核心：号码球布局 */
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

/* 修复：所有球都显示频次，统一文字颜色逻辑 */
.ball-item .num-freq {
    font-size: 9px;
    line-height: 1;
    margin-top: 2px;
    color: #666;
}

/* --- 颜色梯度 --- */

/* Level 0: 未出现 */
.ball-item.level-0 {
    background: #ffffff;
    border: 1px dashed #e0e0e0;
    opacity: 0.6;
}
.ball-item.level-0 .num-val { color: #ccc; }
.ball-item.level-0 .num-freq { color: #ccc; }

/* Level 1: 很少出现 */
.ball-item.level-1 {
    background: #fafafa;
    border-color: #f0f0f0;
}
.ball-item.level-1 .num-val { color: #999; }
.ball-item.level-1 .num-freq { color: #999; }

/* Level 2: 一般 */
.ball-item.level-2 {
    background: #fff1f0;
    border-color: #ffccc7;
}
.ball-item.level-2 .num-val { color: #5c5c5c; }
.ball-item.level-2 .num-freq { color: #5c5c5c; }

/* Level 3: 较多 */
.ball-item.level-3 {
    background: #ffa39e;
    border-color: #ff7875;
    box-shadow: 0 2px 6px rgba(255, 120, 117, 0.2);
}
.ball-item.level-3 .num-val { color: #fff; font-weight: bold; }
.ball-item.level-3 .num-freq { color: rgba(255,255,255,0.9); }

/* Level 4: 热门 */
.ball-item.level-4 {
    width: 48px;
    height: 48px;
    background: #ff4d4f;
    border-color: #cf1322;
    box-shadow: 0 4px 10px rgba(255, 77, 79, 0.4);
}
.ball-item.level-4 .num-val { color: #fff; font-weight: bold; font-size: 17px; }
.ball-item.level-4 .num-freq { color: rgba(255,255,255,0.9); }

/* Level 5: 绝世热门 */
.ball-item.level-5 {
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, #ff4d4f, #cf1322);
    border-color: #820014;
    box-shadow: 0 6px 20px rgba(207, 19, 34, 0.6);
}
.ball-item.level-5 .num-val { color: #fff; font-weight: bolder; font-size: 19px; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
.ball-item.level-5 .num-freq { color: #fff; font-weight: bold; }

/* --- 后区/蓝球 --- */
.ball-item.back-zone.level-1 { background: #fafafa; border-color: #f0f0f0; }
.ball-item.back-zone.level-1 .num-val { color: #999; }
.ball-item.back-zone.level-1 .num-freq { color: #999; }

.ball-item.back-zone.level-2 { background: #e6f7ff; border-color: #91d5ff; }
.ball-item.back-zone.level-2 .num-val { color: #5c5c5c; }
.ball-item.back-zone.level-2 .num-freq { color: #5c5c5c; }

.ball-item.back-zone.level-3 { background: #40a9ff; border-color: #1890ff; box-shadow: 0 2px 6px rgba(24, 144, 255, 0.2); }
.ball-item.back-zone.level-3 .num-val { color: #fff; font-weight: bold; }
.ball-item.back-zone.level-3 .num-freq { color: rgba(255,255,255,0.9); }

.ball-item.back-zone.level-4 {
    width: 48px; height: 48px;
    background: #1890ff;
    border-color: #0050b3;
    box-shadow: 0 4px 10px rgba(24, 144, 255, 0.4);
}
.ball-item.back-zone.level-4 .num-val { color: #fff; font-weight: bold; font-size: 17px; }
.ball-item.back-zone.level-4 .num-freq { color: rgba(255,255,255,0.9); }

.ball-item.back-zone.level-5 {
    width: 52px; height: 52px;
    background: linear-gradient(135deg, #1890ff, #0050b3);
    border-color: #003a8c;
    box-shadow: 0 6px 20px rgba(0, 80, 179, 0.6);
}
.ball-item.back-zone.level-5 .num-val { color: #fff; font-weight: bolder; font-size: 19px; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
.ball-item.back-zone.level-5 .num-freq { color: #fff; font-weight: bold; }

/* 图例 */
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
.level-0-sample { background: #fff; border: 1px dashed #ddd; }
.level-2-sample { background: #ffa39e; }
.level-4-sample { background: linear-gradient(135deg, #ff4d4f, #cf1322); box-shadow: 0 2px 4px rgba(207, 19, 34, 0.3); }
</style>