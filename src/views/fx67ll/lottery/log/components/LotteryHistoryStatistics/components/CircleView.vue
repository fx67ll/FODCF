<template>
    <!-- 组件根容器 -->
    <div class="circle-view-wrapper">
        <!-- 顶部切换 Tab：用于切换大乐透和双色球 -->
        <el-tabs v-model="activeType" type="card" class="type-tabs">

            <!-- Tab 1：大乐透 -->
            <el-tab-pane label="大乐透" name="1">
                <!-- 前区区域 -->
                <div class="zone-section">
                    <h4>前区 (1-35)</h4>
                    <!-- 号码球容器 -->
                    <div class="balls-container">
                        <!-- 
                            循环渲染前区号码球：
                            1. getSortedNums(1, '前区', 35) 获取排序后的1-35数组
                            2. getBallClass 动态计算颜色/大小类名
                            3. getFreq 显示具体出现频次
                        -->
                        <div v-for="num in getSortedNums(1, '前区', 35)" :key="'front-1-' + num" class="ball-item"
                            :class="getBallClass(1, '前区', num, false)">
                            <span class="num-val">{{ num }}</span>
                            <span class="num-freq">{{ getFreq(1, '前区', num) }}</span>
                        </div>
                    </div>
                </div>
                <!-- 后区区域 -->
                <div class="zone-section">
                    <h4>后区 (1-12)</h4>
                    <div class="balls-container">
                        <!-- 逻辑同上，isBackZone=true 表示使用后区(蓝色)样式 -->
                        <div v-for="num in getSortedNums(1, '后区', 12)" :key="'back-1-' + num" class="ball-item"
                            :class="getBallClass(1, '后区', num, true)">
                            <span class="num-val">{{ num }}</span>
                            <span class="num-freq">{{ getFreq(1, '后区', num) }}</span>
                        </div>
                    </div>
                </div>
            </el-tab-pane>

            <!-- Tab 2：双色球 -->
            <el-tab-pane label="双色球" name="2">
                <!-- 红球区 (逻辑同大乐透前区) -->
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
                <!-- 蓝球区 (逻辑同大乐透后区) -->
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

        <!-- 底部图例说明 -->
        <div class="legend-box">
            <span class="legend-item"><i class="legend-color level-0-sample"></i> 冷门 (0次)</span>
            <span class="legend-item"><i class="legend-color level-2-sample"></i> 一般</span>
            <span class="legend-item"><i class="legend-color level-4-sample"></i> 热门</span>
        </div>
    </div>
</template>

<script>
// 导入获取历史统计数据的 API 接口
import { listHistoryStatistics } from "@/api/fx67ll/lottery/log";

export default {
    name: "CircleView",
    props: {
        // 接收父组件传入的原始统计数据，避免重复请求接口
        rawData: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            activeType: "1",          // 当前激活的彩种类型：'1'=大乐透，'2'=双色球
            statsMap: new Map(),      // 核心数据映射：Key="类型_区域_号码" -> Value=出现频次
            zoneQuantiles: new Map(), // 分位数缓存：Key="类型_区域" -> Value=排序后的频次数组(用于计算热度等级)
            sortByFreq: true          // 排序开关：true=按频次降序，false=按号码升序
        };
    },
    watch: {
        // 监听父组件传入的数据变化
        rawData: {
            handler(newVal) {
                if (newVal && newVal.length > 0) {
                    this.structureData(newVal); // 数据到达时立即进行结构化处理
                }
            },
            immediate: true, // 组件创建时立即执行一次
            deep: true       // 深度监听数组内部变化
        },
        // 监听排序方式变化，强制刷新视图 (因为依赖的是计算逻辑而非响应式数据本身)
        sortByFreq() {
            this.$forceUpdate();
        }
    },
    methods: {
        /**
         * 重置组件状态
         * 通常用于关闭弹窗或重新加载数据前调用
         */
        resetState() {
            this.statsMap.clear();
            this.zoneQuantiles.clear();
            this.sortByFreq = true;
            this.activeType = "1";
        },

        /**
         * 核心数据结构化方法
         * 将后端扁平的数组数据转换为前端易用的 Map 结构
         * @param {Array} rows - 后端返回的原始数据列表 
         */
        structureData(rows) {
            this.statsMap = new Map();
            this.zoneQuantiles = new Map();
            const zoneCounts = new Map(); // 临时存储每个区域的所有频次数据

            // 1. 遍历原始数据行
            rows.forEach((row) => {
                // 构建区域 Key (例如："1_前区" 表示大乐透前区)
                const zoneKey = `${row.numberType}_${row.zone}`;

                // 初始化该区域的频次数组
                if (!zoneCounts.has(zoneKey)) {
                    zoneCounts.set(zoneKey, []);
                }

                // 2. 拆分号码字符串 (后端通常返回 "01,05,12" 这种格式)
                const nums = row.numbers.split(",");
                nums.forEach((n) => {
                    // 构建具体号码的 Key (例如："1_前区_5")
                    const numKey = `${zoneKey}_${n.trim()}`;

                    // 存入频次 Map
                    this.statsMap.set(numKey, row.occurrenceCount);

                    // 将该频次加入区域数组，用于后续计算分位数
                    zoneCounts.get(zoneKey).push(row.occurrenceCount);
                });
            });

            // 3. 计算每个区域的“分位数基准”并缓存
            zoneCounts.forEach((counts, zoneKey) => {
                // 对频次进行从小到大排序，这是计算排名的基础
                this.zoneQuantiles.set(zoneKey, counts.sort((a, b) => a - b));
            });
        },

        /**
         * 获取某个号码的出现频次
         * @param {string|number} type - 彩种类型
         * @param {string} zone - 区域 ('前区' 或 '后区')
         * @param {number} num - 具体号码
         * @returns {number} 出现次数，默认为0
         */
        getFreq(type, zone, num) {
            const key = `${type}_${zone}_${num}`;
            return this.statsMap.get(key) || 0;
        },

        /**
         * 核心算法：计算号码球的 CSS 类名 (决定颜色和大小)
         * 逻辑：根据频次在该区域的历史分位数来决定热度等级 (Level 0-5)
         * @param {string|number} type - 彩种类型
         * @param {string} zone - 区域
         * @param {number} num - 号码
         * @param {boolean} isBackZone - 是否为后区/蓝球 (影响色调)
         * @returns {string} CSS 类名字符串
         */
        getBallClass(type, zone, num, isBackZone = false) {
            const count = this.getFreq(type, zone, num);

            // 1. 特殊处理：0次的直接返回 Level 0
            if (count === 0) return "level-0" + (isBackZone ? " back-zone" : "");

            // 2. 获取该区域的排序后的频次数组
            const zoneKey = `${type}_${zone}`;
            const sortedCounts = this.zoneQuantiles.get(zoneKey) || [];
            const len = sortedCounts.length;

            // 3. 计算当前频次的“排名位置”
            // 找到第一个大于等于当前 count 的索引，即为排名
            let rank = 0;
            for (let i = 0; i < len; i++) {
                if (sortedCounts[i] >= count) {
                    rank = i;
                    break;
                }
            }
            // 计算排名比例 (0 到 1 之间)
            const ratio = len > 0 ? rank / len : 0;

            // 4. 根据比例区间划分等级
            // 这里使用了类似正态分布的分段：两头小，中间大
            let classStr = "";
            if (ratio < 0.3) classStr = "level-1";      // 较冷 (后30%)
            else if (ratio < 0.6) classStr = "level-2"; // 一般 (中间30%)
            else if (ratio < 0.8) classStr = "level-3"; // 较多 (接下来20%)
            else if (ratio < 0.95) classStr = "level-4";// 热门 (接下来15%)
            else classStr = "level-5";                    // 绝世热门 (最后5%)

            // 5. 如果是后区，加上蓝色调标识
            if (isBackZone) classStr += " back-zone";
            return classStr;
        },

        /**
         * 获取排序后的号码数组
         * @param {string|number} type - 彩种类型
         * @param {string} zone - 区域
         * @param {number} maxNum - 该区域最大号码 (如35, 12, 33)
         * @returns {Array} 排序后的号码数组
         */
        getSortedNums(type, zone, maxNum) {
            // 1. 生成基础数组：[1, 2, 3, ..., maxNum]
            const baseNums = Array.from({ length: maxNum }, (_, i) => i + 1);

            // 2. 如果不按频次排序，直接返回按号码升序的数组
            if (!this.sortByFreq) {
                return baseNums;
            }

            // 3. 按频次降序排序
            return baseNums.sort((a, b) => {
                const freqA = this.getFreq(type, zone, a);
                const freqB = this.getFreq(type, zone, b);

                // 优先比较频次
                if (freqB !== freqA) {
                    return freqB - freqA;
                }
                // 频次相同时，按号码本身升序排列
                return a - b;
            });
        }
    }
};
</script>

<style scoped>
/* ---------------- 布局辅助样式 ---------------- */
/* Footer 布局 (虽然模板中未直接体现，但为了代码完整性保留) */
.dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0;
    padding-top: 0;
}

.footer-control {
    display: flex;
    align-items: center;
}

.footer-buttons {
    display: flex;
    align-items: center;
}

/* 排序开关样式微调 */
.sort-switch {
    font-size: 14px;
}

.sort-switch /deep/ .el-switch__label {
    font-size: 14px;
    color: #606266;
}

.sort-switch /deep/ .el-switch__label--left {
    margin-right: 8px;
}

.sort-switch /deep/ .el-switch__label--right {
    margin-left: 8px;
}

/* 弹窗 Body 间距调整 */
.lottery-stats-dialog>>>.el-dialog__body {
    padding: 20px;
}

.stats-container {
    min-height: 300px;
}

.type-tabs {
    margin-bottom: 20px;
}

/* 区域标题样式 */
.zone-section {
    margin-bottom: 25px;
}

.zone-section h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #666;
    border-left: 4px solid #409eff;
    /* 左侧蓝色装饰条 */
    padding-left: 10px;
    line-height: 1;
}

/* ---------------- 核心：号码球 Flex 布局 ---------------- */
.balls-container {
    display: flex;
    flex-wrap: wrap;
    /* 允许换行 */
    gap: 12px;
    /* 球之间的间距 */
    align-items: center;
    /* 垂直居中 */
    padding-left: 12px;
}

/* 球的基础样式 */
.ball-item {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    /* 圆形 */
    display: flex;
    flex-direction: column;
    /* 上下结构：号码在上，频次在下 */
    justify-content: center;
    align-items: center;
    background: #fff;
    border: 1px solid #e9e9eb;
    position: relative;
    /* 动画：悬停放大效果 */
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 悬停交互：放大并增加阴影 */
.ball-item:hover {
    transform: scale(1.15);
    z-index: 10;
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

/* 号码文字样式 */
.ball-item .num-val {
    font-size: 15px;
    font-weight: 500;
    color: #333;
    line-height: 1;
}

/* 频次文字样式 (小字) */
.ball-item .num-freq {
    font-size: 9px;
    line-height: 1;
    margin-top: 2px;
    color: #666;
}

/* ---------------- 颜色梯度系统 (前区/红球 - 暖色调) ---------------- */
/* Level 0: 未出现 (灰色虚线框) */
.ball-item.level-0 {
    background: #ffffff;
    border: 1px dashed #e0e0e0;
    opacity: 0.6;
}

.ball-item.level-0 .num-val {
    color: #ccc;
}

.ball-item.level-0 .num-freq {
    color: #ccc;
}

/* Level 1: 很少出现 (浅灰) */
.ball-item.level-1 {
    background: #fafafa;
    border-color: #f0f0f0;
}

.ball-item.level-1 .num-val {
    color: #999;
}

.ball-item.level-1 .num-freq {
    color: #999;
}

/* Level 2: 一般 (淡红) */
.ball-item.level-2 {
    background: #fff1f0;
    border-color: #ffccc7;
}

.ball-item.level-2 .num-val {
    color: #5c5c5c;
}

.ball-item.level-2 .num-freq {
    color: #5c5c5c;
}

/* Level 3: 较多 (红) */
.ball-item.level-3 {
    background: #ffa39e;
    border-color: #ff7875;
    box-shadow: 0 2px 6px rgba(255, 120, 117, 0.2);
}

.ball-item.level-3 .num-val {
    color: #fff;
    font-weight: bold;
}

.ball-item.level-3 .num-freq {
    color: rgba(255, 255, 255, 0.9);
}

/* Level 4: 热门 (深红，尺寸变大) */
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

.ball-item.level-4 .num-freq {
    color: rgba(255, 255, 255, 0.9);
}

/* Level 5: 绝世热门 (渐变红，尺寸最大，阴影最强) */
.ball-item.level-5 {
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, #ff4d4f, #cf1322);
    border-color: #820014;
    box-shadow: 0 6px 20px rgba(207, 19, 34, 0.6);
}

.ball-item.level-5 .num-val {
    color: #fff;
    font-weight: bolder;
    font-size: 19px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.ball-item.level-5 .num-freq {
    color: #fff;
    font-weight: bold;
}

/* ---------------- 后区/蓝球 冷色调覆盖 (通过 .back-zone 区分) ---------------- */
/* 逻辑同上，只是将红色系改为蓝色系 */
.ball-item.back-zone.level-1 {
    background: #fafafa;
    border-color: #f0f0f0;
}

.ball-item.back-zone.level-1 .num-val {
    color: #999;
}

.ball-item.back-zone.level-1 .num-freq {
    color: #999;
}

.ball-item.back-zone.level-2 {
    background: #e6f7ff;
    border-color: #91d5ff;
}

.ball-item.back-zone.level-2 .num-val {
    color: #5c5c5c;
}

.ball-item.back-zone.level-2 .num-freq {
    color: #5c5c5c;
}

.ball-item.back-zone.level-3 {
    background: #40a9ff;
    border-color: #1890ff;
    box-shadow: 0 2px 6px rgba(24, 144, 255, 0.2);
}

.ball-item.back-zone.level-3 .num-val {
    color: #fff;
    font-weight: bold;
}

.ball-item.back-zone.level-3 .num-freq {
    color: rgba(255, 255, 255, 0.9);
}

.ball-item.back-zone.level-4 {
    width: 48px;
    height: 48px;
    background: #1890ff;
    border-color: #0050b3;
    box-shadow: 0 4px 10px rgba(24, 144, 255, 0.4);
}

.ball-item.back-zone.level-4 .num-val {
    color: #fff;
    font-weight: bold;
    font-size: 17px;
}

.ball-item.back-zone.level-4 .num-freq {
    color: rgba(255, 255, 255, 0.9);
}

.ball-item.back-zone.level-5 {
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, #1890ff, #0050b3);
    border-color: #003a8c;
    box-shadow: 0 6px 20px rgba(0, 80, 179, 0.6);
}

.ball-item.back-zone.level-5 .num-val {
    color: #fff;
    font-weight: bolder;
    font-size: 19px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.ball-item.back-zone.level-5 .num-freq {
    color: #fff;
    font-weight: bold;
}

/* ---------------- 图例样式 ---------------- */
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

/* 图例示例色块 */
.level-0-sample {
    background: #fff;
    border: 1px dashed #ddd;
}

.level-2-sample {
    background: #ffa39e;
}

.level-4-sample {
    background: linear-gradient(135deg, #ff4d4f, #cf1322);
    box-shadow: 0 2px 4px rgba(207, 19, 34, 0.3);
}
</style>