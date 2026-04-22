<template>
    <!-- 
      历史开奖号码组合弹窗组件
      功能：展示大乐透/双色球的高频与低频号码组合，支持单独复制和全部复制
      设计：卡片式布局，红蓝渐变区分高频/低频，带入场动画及悬停效果
    -->
    <el-dialog title="历史开奖号码组合" :visible.sync="dialogVisible" width="950px" style="top: 20px" class="generate-dialog"
        :close-on-click-modal="false" @close="handleClose" append-to-body>
        <!-- 加载状态容器 -->
        <div class="generate-result-container" v-loading="loading">
            <!-- 
              外层循环：按行渲染（第一行为大乐透，第二行为双色球）
              resultRows 为计算属性，返回二维数组
            -->
            <div class="result-row" v-for="(row, rowIdx) in resultRows" :key="rowIdx">
                <!-- 内层循环：每行两个卡片（高频/低频） -->
                <div class="result-card" v-for="(item, idx) in row" :key="idx"
                    :class="[item.freqClass === 'high' ? 'card-high' : 'card-low']"
                    :style="{ animationDelay: `${(rowIdx * 2 + idx) * 0.15}s` }">
                    <!-- 卡片头部：包含复制按钮、彩种名称、频率标签 -->
                    <div class="card-header">
                        <div class="title-group">
                            <!-- 单卡片复制按钮 -->
                            <el-button type="text" icon="el-icon-document-copy" class="copy-emoji-btn"
                                @click="copySingle(item)" size="mini" />
                            <span class="lottery-name">{{ item.name }}</span>
                            <!-- 高频/低频标签 -->
                            <span class="badge" :class="item.freqClass">{{ item.freqText }}</span>
                        </div>
                        <!-- 右侧装饰性提示图标及文字 -->
                        <div class="icon-hint"
                            :class="{ 'hot-hint': item.freqText === '高频', 'cold-hint': item.freqText === '低频' }">
                            <span v-if="item.freqText === '高频'">🔥 热门组合</span>
                            <span v-else>❄️ 冷门组合</span>
                        </div>
                    </div>

                    <!-- 号码展示区域 -->
                    <div class="numbers-area">
                        <div v-if="item.numbers && item.numbers.length" class="balls-container">
                            <!-- 大乐透渲染：前区5球 + 后区2球 -->
                            <template v-if="item.type === 'DLT'">
                                <span v-for="(num, i) in item.numbers.slice(0, 5)" :key="'front' + i"
                                    class="ball dlt-front" :style="{ animationDelay: `${i * 0.06}s` }">
                                    {{ padZero(num) }}
                                </span>
                                <span class="plus-symbol" style="animation-delay: 0.3s">+</span>
                                <span v-for="(num, i) in item.numbers.slice(5, 7)" :key="'back' + i"
                                    class="ball dlt-back" :style="{ animationDelay: `${(i + 5) * 0.06}s` }">
                                    {{ padZero(num) }}
                                </span>
                            </template>
                            <!-- 双色球渲染：红球6个 + 蓝球1个 -->
                            <template v-else-if="item.type === 'SSQ'">
                                <span v-for="(num, i) in item.numbers.slice(0, 6)" :key="'red' + i" class="ball ssq-red"
                                    :style="{ animationDelay: `${i * 0.06}s` }">
                                    {{ padZero(num) }}
                                </span>
                                <span class="plus-symbol" style="animation-delay: 0.36s">+</span>
                                <span v-for="(num, i) in item.numbers.slice(6, 7)" :key="'blue' + i"
                                    class="ball ssq-blue" :style="{ animationDelay: `${(i + 6) * 0.06}s` }">
                                    {{ padZero(num) }}
                                </span>
                            </template>
                        </div>
                        <div v-else class="no-numbers">暂无生成数据</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 底部操作栏 -->
        <div slot="footer" class="dialog-footer">
            <!-- 左下角 Tip 提示 -->
            <div class="footer-tip">
                <span class="tip-emoji">💡</span>
                <span class="tip-text">当频率排名并列之时，会随机选取组合，所以此处结果可能与移动端不完全一致</span>
            </div>
            <!-- 右侧按钮组 -->
            <div class="footer-buttons">
                <el-button type="danger" icon="el-icon-document-copy" @click="copyAll">拷 贝</el-button>
                <el-button plain @click="dialogVisible = false">关 闭</el-button>
            </div>
        </div>
    </el-dialog>
</template>

<script>
// 引入历史统计数据接口
import { listHistoryStatistics } from "@/api/fx67ll/lottery/log";
// 引入根据频率生成号码的核心工具函数
import { getLotteryNumberByFrequency } from "@/utils/fx67ll/utils";
import { create } from "sortablejs";
// 引入日期时间工具类
import moment from 'moment';

export default {
    name: "GenerateNumbers",
    props: {
        // 控制弹窗显隐（支持 .sync 修饰符）
        visible: { type: Boolean, default: false }
    },
    data() {
        return {
            dialogVisible: false,          // 内部弹窗显隐状态
            loading: false,                // 加载状态
            rawData: [],                   // 存储从接口获取的原始历史开奖数据
            generatedResult: {             // 存储由工具函数生成的四组号码
                lotteryDLTHighFrequency: [], // 大乐透高频号码（前5后2数组）
                lotteryDLTLowFrequency: [],  // 大乐透低频号码
                lotterySSQHighFrequency: [], // 双色球高频号码（前6后1数组）
                lotterySSQLowFrequency: [],  // 双色球低频号码
            },
        };
    },
    computed: {
        /**
         * 将生成结果格式化为二维数组，便于模板循环渲染
         * 返回结构：
         * [
         *   [ 大乐透高频卡片数据, 大乐透低频卡片数据 ],
         *   [ 双色球高频卡片数据, 双色球低频卡片数据 ]
         * ]
         * 若高频数据为空，返回空数组避免渲染错误
         */
        resultRows() {
            if (!this.generatedResult.lotteryDLTHighFrequency.length) return [];
            return [
                [
                    {
                        name: '大乐透',
                        freqText: '高频',
                        freqClass: 'high',
                        numbers: this.generatedResult.lotteryDLTHighFrequency,
                        type: 'DLT'
                    },
                    {
                        name: '大乐透',
                        freqText: '低频',
                        freqClass: 'low',
                        numbers: this.generatedResult.lotteryDLTLowFrequency,
                        type: 'DLT'
                    }
                ],
                [
                    {
                        name: '双色球',
                        freqText: '高频',
                        freqClass: 'high',
                        numbers: this.generatedResult.lotterySSQHighFrequency,
                        type: 'SSQ'
                    },
                    {
                        name: '双色球',
                        freqText: '低频',
                        freqClass: 'low',
                        numbers: this.generatedResult.lotterySSQLowFrequency,
                        type: 'SSQ'
                    }
                ]
            ];
        }
    },
    watch: {
        // 监听外部传入的 visible 变化，同步内部状态并触发数据初始化
        visible(val) {
            this.dialogVisible = val;
            if (val) {
                this.initData();
            }
        },
        // 内部状态变化时，向外同步更新 visible
        dialogVisible(val) {
            this.$emit('update:visible', val);
        }
    },
    methods: {
        /**
         * 初始化数据逻辑：
         * - 若未拉取过历史数据则请求接口
         * - 已有数据则直接生成号码组合
         */
        initData() {
            if (this.rawData.length === 0) {
                this.fetchData();
            } else {
                this.generateNumbers();
            }
        },

        /**
         * 请求历史开奖统计数据
         */
        fetchData() {
            this.loading = true;
            listHistoryStatistics().then(res => {
                if (res && res.code === 200) {
                    this.rawData = res.rows || [];
                    this.generateNumbers();
                } else {
                    this.$message.warning('获取历史数据失败');
                }
                this.loading = false;
            }).catch(() => {
                this.loading = false;
                this.$message.error('网络请求异常');
            });
        },

        /**
         * 调用工具函数生成高频/低频号码组合
         * 为了触发动画，先将结果置空，再在下一 tick 赋值
         */
        generateNumbers() {
            if (!this.rawData.length) return this.$message.warning('暂无历史数据，无法生成');
            try {
                // 先清空数据，触发 v-if 重新渲染，使动画重置
                this.generatedResult = {
                    lotteryDLTHighFrequency: [],
                    lotteryDLTLowFrequency: [],
                    lotterySSQHighFrequency: [],
                    lotterySSQLowFrequency: [],
                };
                // 下一帧更新真实数据，结合 CSS 动画呈现出现效果
                this.$nextTick(() => {
                    const dayOfYear = moment().dayOfYear();
                    this.generatedResult = getLotteryNumberByFrequency({ rows: this.rawData }, dayOfYear);
                });
            } catch (error) {
                this.$message.error('生成号码失败');
                console.error(error);
            }
        },

        /**
         * 数字补零（如 3 -> '03'）
         */
        padZero(num) {
            return String(num).padStart(2, '0');
        },

        /**
         * 弹窗关闭时的回调，向外同步 visible 状态
         */
        handleClose() {
            this.$emit('update:visible', false);
        },

        /**
         * 将号码数组格式化为易读字符串
         * @param {Array} nums - 原始号码数组
         * @param {String} type - 彩种类型 'DLT' 或 'SSQ'
         * @returns {String} 如 "01 02 03 04 05  -  06 07"
         */
        formatNumberString(nums, type) {
            if (!nums || nums.length === 0) return '';
            let front = [];
            let back = [];
            if (type === 'DLT') {
                front = nums.slice(0, 5).map(n => this.padZero(n));
                back = nums.slice(5, 7).map(n => this.padZero(n));
            } else if (type === 'SSQ') {
                front = nums.slice(0, 6).map(n => this.padZero(n));
                back = nums.slice(6, 7).map(n => this.padZero(n));
            }
            return `${front.join('  ')}  -  ${back.join('  ')}`;
        },

        /**
         * 复制单个卡片内容
         */
        copySingle(item) {
            if (!item.numbers || item.numbers.length === 0) {
                return this.$message.warning('暂无可复制的内容~');
            }
            const text = `老板买1注自选号码${item.name}\n\n${this.formatNumberString(item.numbers, item.type)}\n`;
            this.copyToClipboard(text);
        },

        /**
         * 复制全部四组号码
         */
        copyAll() {
            const res = this.generatedResult;
            let content = '';
            const hasDLT = res.lotteryDLTHighFrequency.length && res.lotteryDLTLowFrequency.length;
            if (hasDLT) {
                content += `老板买2注自选号码大乐透\n\n`;
                content += `${this.formatNumberString(res.lotteryDLTHighFrequency, 'DLT')}\n\n`;
                content += `${this.formatNumberString(res.lotteryDLTLowFrequency, 'DLT')}\n\n`;
            }
            const hasSSQ = res.lotterySSQHighFrequency.length && res.lotterySSQLowFrequency.length;
            if (hasSSQ) {
                content += `老板买2注自选号码双色球\n\n`;
                content += `${this.formatNumberString(res.lotterySSQHighFrequency, 'SSQ')}\n\n`;
                content += `${this.formatNumberString(res.lotterySSQLowFrequency, 'SSQ')}\n\n`;
            }
            if (!content) {
                return this.$message.warning('暂无可复制的内容~');
            }
            this.copyToClipboard(content);
        },

        /**
         * 现代 Clipboard API 复制方法
         */
        copyToClipboard(text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    this.$message.success('已为您复制到剪切板~');
                }).catch(err => {
                    console.error('Copy failed:', err);
                    this.fallbackCopy(text);
                });
            } else {
                this.fallbackCopy(text);
            }
        },

        /**
         * 降级复制方案（兼容旧浏览器）
         */
        fallbackCopy(text) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                this.$message.success('已为您复制到剪切板~');
            } catch (err) {
                this.$message.error('复制失败，请手动复制~');
                console.error('Fallback copy failed:', err);
            }
            document.body.removeChild(textArea);
        }
    }
};
</script>

<style scoped>
/* ---------- 弹窗主体调整 ---------- */
.generate-dialog>>>.el-dialog__body {
    padding: 32px 28px 34px;
    background: #f5f7fa;
}

/* ---------- 内容容器布局 ---------- */
.generate-result-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
}

.result-row {
    display: flex;
    gap: 30px;
}

/* ---------- 卡片基础样式 & 入场动画 ---------- */
.result-card {
    flex: 1;
    border-radius: 18px;
    padding: 26px 18px;
    transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
    border: 2px solid transparent;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    opacity: 0;
    /* 初始透明，等待动画触发 */
    animation-fill-mode: forwards;
    cursor: pointer;
}

/* 高频卡片专用样式（暖色调） */
.result-card.card-high {
    background: linear-gradient(145deg, #fff5f5 0%, #ffe0e0 100%);
    border-color: #ff6b6b;
    box-shadow: 0 8px 20px rgba(255, 107, 107, 0.25);
    animation-name: slideUpHigh;
    animation-duration: 0.6s;
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

.result-card.card-high:hover {
    border-color: #ee3f3f;
    box-shadow: 0 14px 28px rgba(255, 107, 107, 0.4);
    transform: translateY(-5px) scale(1.01);
    background: linear-gradient(145deg, #fff0f0 0%, #ffd6d6 100%);
}

/* 低频卡片专用样式（冷色调） */
.result-card.card-low {
    background: linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%);
    border-color: #7dd3fc;
    box-shadow: 0 8px 20px rgba(125, 211, 252, 0.2);
    animation-name: slideUpLow;
    animation-duration: 0.6s;
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

.result-card.card-low:hover {
    border-color: #38bdf8;
    box-shadow: 0 14px 28px rgba(56, 189, 248, 0.35);
    transform: translateY(-5px) scale(1.01);
    background: linear-gradient(145deg, #e0f2fe 0%, #bae6fd 100%);
}

/* ---------- 卡片头部布局 ---------- */
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    flex-wrap: wrap;
    gap: 8px;
}

.title-group {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

/* 单卡片复制按钮 */
.copy-emoji-btn {
    font-size: 20px;
    color: #909399;
    transition: all 0.2s;
    padding: 0;
    margin-top: 2px;
}

.copy-emoji-btn:hover {
    color: #2ecc71;
    transform: scale(1.2);
}

.lottery-name {
    font-size: 18px;
    font-weight: 800;
    color: #1e293b;
    letter-spacing: 0.3px;
}

/* 高频/低频标签 */
.badge {
    padding: 4px 12px;
    border-radius: 40px;
    font-size: 12px;
    font-weight: 800;
    background: #ffffffd6;
    backdrop-filter: blur(2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.badge.high {
    background: #fecaca;
    color: #991b1b;
    border: 1px solid #fca5a5;
}

.badge.low {
    background: #bfdbfe;
    color: #1e40af;
    border: 1px solid #93c5fd;
}

/* 右侧装饰提示 */
.icon-hint {
    font-size: 12px;
    padding: 4px 12px;
    border-radius: 40px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    backdrop-filter: blur(4px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.hot-hint {
    color: #b91c1c;
    background: #fee2e2;
    border: 1px solid #fecaca;
}

.cold-hint {
    color: #1d4ed8;
    background: #dbeafe;
    border: 1px solid #bfdbfe;
}

/* ---------- 号码展示区域 ---------- */
.numbers-area {
    background: rgba(255, 255, 255, 0.7);
    border-radius: 20px;
    padding: 16px 12px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(6px);
    transition: all 0.3s ease;
}

.result-card.card-high:hover .numbers-area {
    background: rgba(255, 255, 255, 0.9);
    box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.3);
}

.result-card.card-low:hover .numbers-area {
    background: rgba(255, 255, 255, 0.9);
    box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.3);
}

/* 彩球容器 */
.balls-container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px 6px;
}

/* 彩球基础样式 */
.ball {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    font-family: 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Code', 'Courier New', monospace;
    font-size: 18px;
    font-weight: 800;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15), inset 0 -2px 0 rgba(0, 0, 0, 0.2);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    opacity: 0;
    /* 初始透明，配合动画 */
    animation-name: popIn;
    animation-duration: 0.4s;
    animation-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
    animation-fill-mode: forwards;
}

.ball:hover {
    cursor: pointer;
    transform: scale(1.15) rotate(5deg);
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.25);
}

/* 大乐透前区 / 双色球红球（红色系） */
.dlt-front,
.ssq-red {
    background: radial-gradient(circle at 30% 25%, #ff8787, #dc2626);
    box-shadow: 0 6px 12px rgba(220, 38, 38, 0.4), inset 0 -2px 0 #991b1b;
}

/* 大乐透后区 / 双色球蓝球（蓝色系） */
.dlt-back,
.ssq-blue {
    background: radial-gradient(circle at 30% 25%, #60a5fa, #1d4ed8);
    box-shadow: 0 6px 12px rgba(37, 99, 235, 0.4), inset 0 -2px 0 #1e3a8a;
}

/* 加号分隔符 */
.plus-symbol {
    font-size: 24px;
    font-weight: 800;
    color: #64748b;
    margin: 0 6px;
    opacity: 0.9;
    animation: fadeIn 0.5s ease-out forwards;
    animation-delay: 0.3s;
    opacity: 0;
}

/* 暂无数据提示 */
.no-numbers {
    text-align: center;
    color: #94a3b8;
    font-size: 14px;
    padding: 12px 0;
    letter-spacing: 0.5px;
    font-weight: 500;
}

/* ---------- 底部 Footer 布局调整 ---------- */
.dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 8px;
    gap: 20px;
}

/* ---------- Tip 提示框样式 - 现代化改造 ---------- */
.footer-tip {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    /* 去除背景、边框、阴影 */
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 8px 0;
    flex: 1;
    /* 左侧装饰线，替代传统背景框 */
    padding-left: 14px;
    transition: border-color 0.2s ease;
}

.tip-emoji {
    font-size: 18px;
    line-height: 1;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.05));
}

.tip-text {
    font-size: 12px;
    color: #475569;
    line-height: 1.4;
    font-weight: 500;
    letter-spacing: 0.2px;
    /* 关键：加过渡动画，让所有属性变化都丝滑 */
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    /* 可选：让文字居中，放大时更优雅 */
    display: inline-block;
    vertical-align: middle;
}

.tip-text:hover {
    cursor: pointer;
    color: #2ecc71;
    font-size: 17px;
    font-weight: 900;
    line-height: 1;
}

/* 响应式微调：小屏时左边距和内边距适当缩小 */
@media (max-width: 600px) {
    .footer-tip {
        padding-left: 10px;
        gap: 8px;
    }

    .tip-emoji {
        font-size: 18px;
    }

    .tip-text {
        font-size: 11px;
    }
}

/* ---------- 动画定义 ---------- */
/* 高频卡片入场：从下方滑入 */
@keyframes slideUpHigh {
    from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
        box-shadow: 0 0 0 rgba(0, 0, 0, 0);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* 低频卡片入场：与高频一致（可独立调整） */
@keyframes slideUpLow {
    from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
        box-shadow: 0 0 0 rgba(0, 0, 0, 0);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* 彩球弹出效果 */
@keyframes popIn {
    0% {
        opacity: 0;
        transform: scale(0.3) rotate(-10deg);
    }

    60% {
        transform: scale(1.1) rotate(3deg);
    }

    100% {
        opacity: 1;
        transform: scale(1) rotate(0deg);
    }
}

/* 加号淡入 */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.8);
    }

    to {
        opacity: 0.9;
        transform: scale(1);
    }
}

/* ---------- 响应式调整 ---------- */
@media (max-width: 600px) {
    .ball {
        width: 36px;
        height: 36px;
        font-size: 16px;
    }

    .plus-symbol {
        font-size: 18px;
    }

    .result-card {
        padding: 16px 12px;
    }
}
</style>