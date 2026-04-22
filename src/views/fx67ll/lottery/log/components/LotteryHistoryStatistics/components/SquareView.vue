<template>
    <!-- 组件根容器 -->
    <div class="square-view-wrapper">
        <!-- 第一层Tab：切换彩种 (大乐透 / 双色球) -->
        <el-tabs v-model="activeTab" type="border-card">

            <!-- 大乐透面板 -->
            <el-tab-pane label="大乐透" name="dlt">
                <!-- 第二层Tab：切换大乐透的前区/后区 -->
                <el-tabs v-model="dltZone">
                    <!-- 大乐透前区 (1-35) -->
                    <el-tab-pane label="前区 (1-35)" name="front">
                        <div class="number-grid">
                            <!-- 遍历渲染号码卡片 -->
                            <div v-for="item in currentDltFrontData" :key="item.number" class="number-card"
                                :class="{ 'high-frequency': item.count === maxFrontCount && maxFrontCount > 0 }"
                                :style="{ backgroundColor: getColorByCount(item.count, maxFrontCount) }">
                                <!-- 显示格式化后的号码 (如 01, 12) -->
                                <div class="number">{{ formatNumber(item.number) }}</div>
                                <!-- 显示出现次数 -->
                                <div class="count">{{ item.count }}次</div>
                            </div>
                        </div>
                    </el-tab-pane>

                    <!-- 大乐透后区 (1-12) -->
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

            <!-- 双色球面板 -->
            <el-tab-pane label="双色球" name="ssq">
                <!-- 第二层Tab：切换双色球的前区/后区 -->
                <el-tabs v-model="ssqZone">
                    <!-- 双色球前区 (1-33) -->
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

                    <!-- 双色球后区 (1-16) -->
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

        <!-- 底部色条图例 -->
        <div class="color-legend">
            <span>低频</span>
            <div class="gradient-bar"></div>
            <span>高频</span>
        </div>
    </div>
</template>

<script>
export default {
    name: 'SquareView',
    props: {
        // 父组件传入的原始数据数组
        rawData: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            // 排序切换开关：true=按频率排序，false=按号码排序
            sortByFrequency: true,

            // 当前激活的彩种 Tab ('dlt' 或 'ssq')
            activeTab: 'dlt',
            // 大乐透当前激活的区域 ('front' 或 'back')
            dltZone: 'front',
            // 双色球当前激活的区域 ('front' 或 'back')
            ssqZone: 'front',

            // --- 数据存储 (按号码升序排列) ---
            dltFrontDataNumber: [],
            dltBackDataNumber: [],
            ssqFrontDataNumber: [],
            ssqBackDataNumber: [],

            // --- 数据存储 (按频率降序排列) ---
            dltFrontDataFreq: [],
            dltBackDataFreq: [],
            ssqFrontDataFreq: [],
            ssqBackDataFreq: [],

            // --- 各区域的历史最大出现次数 (用于计算颜色梯度) ---
            maxFrontCount: 0,    // 大乐透前区最大值
            maxBackCount: 0,     // 大乐透后区最大值
            maxFrontCountSsq: 0, // 双色球前区最大值
            maxBackCountSsq: 0   // 双色球后区最大值
        }
    },
    computed: {
        // 根据 sortByFrequency 的状态，动态返回大乐透前区应展示的数据
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
        // 监听父组件传入的 rawData 变化
        rawData: {
            handler(newVal) {
                if (newVal && newVal.length > 0) {
                    this.processData(newVal);
                }
            },
            immediate: true, // 组件创建时立即执行一次
            deep: true       // 深度监听数组内部变化
        }
    },
    methods: {
        /**
         * 重置组件状态（如果需要外部重置功能可调用）
         */
        resetState() {
            this.sortByFrequency = true;
            this.activeTab = 'dlt';
            this.dltZone = 'front';
            this.ssqZone = 'front';
        },

        /**
         * 核心数据处理函数
         * 1. 初始化 Map 并填充默认值 (保证每个号码都存在，即使是0次)
         * 2. 遍历原始数据更新计数
         * 3. 生成排序后的数组
         */
        processData(rows) {
            // 使用 Map 结构保证 key-value 的高效查找
            const dltFrontMap = new Map()
            const dltBackMap = new Map()
            const ssqFrontMap = new Map()
            const ssqBackMap = new Map()

            // --- 1. 初始化 Map，给每个可能的号码赋初始值 0 ---
            // 这一步确保了即使某个号码从未出现，界面上也会显示它，而不是缺失
            for (let i = 1; i <= 35; i++) dltFrontMap.set(i, 0)
            for (let i = 1; i <= 12; i++) dltBackMap.set(i, 0)
            for (let i = 1; i <= 33; i++) ssqFrontMap.set(i, 0)
            for (let i = 1; i <= 16; i++) ssqBackMap.set(i, 0)

            // --- 2. 遍历原始数据，填充 Map ---
            rows.forEach(item => {
                const numberType = item.numberType // 1=大乐透, 2=双色球
                const zone = item.zone             // '前区' 或 '后区'
                const count = item.occurrenceCount // 出现次数
                // 将逗号分隔的号码字符串转为数组 (如 "1,2,3" -> [1,2,3])
                const numbers = item.numbers.split(',').map(n => parseInt(n.trim()))

                // 根据类型分类存入不同的 Map
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

            // --- 3. 将 Map 转为数组并按【号码大小】排序 ---
            const toSortedByNumber = (map) => {
                return Array.from(map.entries())
                    .map(([number, count]) => ({ number, count }))
                    .sort((a, b) => a.number - b.number)
            }
            this.dltFrontDataNumber = toSortedByNumber(dltFrontMap)
            this.dltBackDataNumber = toSortedByNumber(dltBackMap)
            this.ssqFrontDataNumber = toSortedByNumber(ssqFrontMap)
            this.ssqBackDataNumber = toSortedByNumber(ssqBackMap)

            // --- 4. 基于已排序的数组，再按【频率】排序 (频率相同则按号码排) ---
            const toSortedByFreq = (arr) => {
                return [...arr].sort((a, b) => {
                    if (a.count !== b.count) return b.count - a.count // 降序
                    return a.number - b.number // 频率相同，号码升序
                })
            }
            this.dltFrontDataFreq = toSortedByFreq(this.dltFrontDataNumber)
            this.dltBackDataFreq = toSortedByFreq(this.dltBackDataNumber)
            this.ssqFrontDataFreq = toSortedByFreq(this.ssqFrontDataNumber)
            this.ssqBackDataFreq = toSortedByFreq(this.ssqBackDataNumber)

            // --- 5. 计算各个区域的最大出现次数 (用于颜色映射) ---
            this.maxFrontCount = Math.max(...this.dltFrontDataNumber.map(d => d.count), 0)
            this.maxBackCount = Math.max(...this.dltBackDataNumber.map(d => d.count), 0)
            this.maxFrontCountSsq = Math.max(...this.ssqFrontDataNumber.map(d => d.count), 0)
            this.maxBackCountSsq = Math.max(...this.ssqBackDataNumber.map(d => d.count), 0)
        },

        /**
         * 核心视觉算法：根据次数计算背景色
         * 使用非线性渐变 (Pow 1.2) 让视觉层次更分明
         * @param {number} count - 当前号码次数
         * @param {number} maxCount - 该区域最大次数
         * @returns {string} RGB颜色字符串
         */
        getColorByCount(count, maxCount) {
            if (maxCount === 0) return '#f8f8f8' // 无数据时返回浅灰

            // 计算强度 (0-1)，使用 Pow 进行伽马校正，避免中间色过于接近
            const intensity = Math.pow(count / maxCount, 1.2)

            // 定义颜色渐变的起点 (浅灰 #f8f8f8) 和终点 (深红 #d32f2f)
            const startR = 248, startG = 248, startB = 248
            const endR = 211, endG = 47, endB = 47

            // 线性插值计算 RGB
            const r = Math.round(startR + (endR - startR) * intensity)
            const g = Math.round(startG + (endG - startG) * intensity)
            const b = Math.round(startB + (endB - startB) * intensity)

            return `rgb(${r}, ${g}, ${b})`
        },

        /**
         * 格式化数字为两位数 (1 -> '01')
         */
        formatNumber(num) {
            return num < 10 ? `0${num}` : `${num}`
        }
    }
}
</script>

<style scoped>
/* 号码网格布局：自适应填充，最小宽度80px，最大90px */
.number-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 90px));
    gap: 12px;
    justify-content: center;
    padding: 16px;
}

/* 单个号码卡片样式 */
.number-card {
    text-align: center;
    padding: 12px 0;
    border-radius: 12px;
    transition: all 0.2s;
    /* 动画过渡 */
    cursor: default;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 鼠标悬停上浮效果 */
.number-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

/* 最高频号码的特殊高亮样式 */
.number-card.high-frequency {
    box-shadow: 0 4px 12px rgba(211, 47, 47, 0.4);
    border: 1px solid #ffcdd2;
}

/* 最高频号码的文字颜色 (确保在深红色背景上可见) */
.number-card.high-frequency .number,
.number-card.high-frequency .count {
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 号码字体样式 */
.number {
    font-size: 1.4rem;
    font-weight: bold;
    color: #2c3e50;
}

/* 次数字体样式 */
.count {
    font-size: 0.8rem;
    color: #555;
    margin-top: 6px;
}

/* 底部图例容器 */
.color-legend {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 20px;
    padding: 0 16px 10px 0;
    font-size: 12px;
    color: #666;
}

/* 图例渐变条 */
.gradient-bar {
    width: 150px;
    height: 12px;
    margin: 0 10px;
    border-radius: 6px;
    background: linear-gradient(to right, #f8f8f8, #d32f2f);
}

/* 以下样式在模板中未直接使用，但保留以防止父组件或弹窗扩展 */
.dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.footer-left {
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

/* 移动端响应式适配 */
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