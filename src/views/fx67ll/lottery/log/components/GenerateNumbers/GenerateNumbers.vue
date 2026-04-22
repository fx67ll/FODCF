<template>
    <el-dialog title="历史开奖号码组合" :visible.sync="dialogVisible" width="950px" style="top: 20px" class="generate-dialog"
        :close-on-click-modal="false" @close="handleClose" append-to-body>
        <div class="generate-result-container" v-loading="loading">
            <div class="result-row" v-for="(row, rowIdx) in resultRows" :key="rowIdx">
                <div class="result-card" v-for="(item, idx) in row" :key="idx"
                    :class="[item.freqClass === 'high' ? 'card-high' : 'card-low']"
                    :style="{ animationDelay: `${(rowIdx * 2 + idx) * 0.15}s` }">
                    <div class="card-header">
                        <div class="title-group">
                            <el-button type="text" icon="el-icon-document-copy" class="copy-emoji-btn"
                                @click="copySingle(item)" size="mini" />
                            <span class="lottery-name">{{ item.name }}</span>
                            <span class="badge" :class="item.freqClass">{{ item.freqText }}</span>
                        </div>
                        <div class="icon-hint"
                            :class="{ 'hot-hint': item.freqText === '高频', 'cold-hint': item.freqText === '低频' }">
                            <span v-if="item.freqText === '高频'">🔥 热门组合</span>
                            <span v-else>❄️ 冷门组合</span>
                        </div>
                    </div>
                    <div class="numbers-area">
                        <div v-if="item.numbers && item.numbers.length" class="balls-container">
                            <template v-if="item.type === 'DLT'">
                                <span v-for="(num, i) in item.numbers.slice(0, 5)" :key="'front' + i"
                                    class="ball dlt-front" :style="{ animationDelay: `${i * 0.06}s` }">{{ padZero(num)
                                    }}</span>
                                <span class="plus-symbol" style="animation-delay: 0.3s">+</span>
                                <span v-for="(num, i) in item.numbers.slice(5, 7)" :key="'back' + i"
                                    class="ball dlt-back" :style="{ animationDelay: `${(i + 5) * 0.06}s` }">{{
                                        padZero(num) }}</span>
                            </template>
                            <template v-else-if="item.type === 'SSQ'">
                                <span v-for="(num, i) in item.numbers.slice(0, 6)" :key="'red' + i" class="ball ssq-red"
                                    :style="{ animationDelay: `${i * 0.06}s` }">{{ padZero(num) }}</span>
                                <span class="plus-symbol" style="animation-delay: 0.36s">+</span>
                                <span v-for="(num, i) in item.numbers.slice(6, 7)" :key="'blue' + i"
                                    class="ball ssq-blue" :style="{ animationDelay: `${(i + 6) * 0.06}s` }">{{
                                        padZero(num) }}</span>
                            </template>
                        </div>
                        <div v-else class="no-numbers">暂无生成数据</div>
                    </div>
                </div>
            </div>
        </div>
        <span slot="footer" class="dialog-footer">
            <el-button type="danger" icon="el-icon-document-copy" @click="copyAll">拷 贝</el-button>
            <el-button plain @click="dialogVisible = false">关 闭</el-button>
        </span>
    </el-dialog>
</template>

<script>
import { listHistoryStatistics } from "@/api/fx67ll/lottery/log";

import { getLotteryNumberByFrequency } from "@/utils/fx67ll/utils";

export default {
    name: "GenerateNumbers",
    props: {
        visible: { type: Boolean, default: false }
    },
    data() {
        return {
            dialogVisible: false,
            loading: false,
            rawData: [], // 组件内部自己管理数据
            generatedResult: {
                lotteryDLTHighFrequency: [],
                lotteryDLTLowFrequency: [],
                lotterySSQHighFrequency: [],
                lotterySSQLowFrequency: [],
            }
        };
    },
    computed: {
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
        visible(val) {
            this.dialogVisible = val;
            if (val) {
                this.initData();
            }
        },
        dialogVisible(val) {
            this.$emit('update:visible', val);
        }
    },
    methods: {
        initData() {
            // 每次打开都重新获取，或者判断为空再获取
            if (this.rawData.length === 0) {
                this.fetchData();
            } else {
                this.generateNumbers();
            }
        },
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
        generateNumbers() {
            if (!this.rawData.length) return this.$message.warning('暂无历史数据，无法生成');
            try {
                // 重置为空触发动画
                this.generatedResult = {
                    lotteryDLTHighFrequency: [],
                    lotteryDLTLowFrequency: [],
                    lotterySSQHighFrequency: [],
                    lotterySSQLowFrequency: [],
                };
                this.$nextTick(() => {
                    this.generatedResult = getLotteryNumberByFrequency({ rows: this.rawData });
                });
            } catch (error) {
                this.$message.error('生成号码失败');
                console.error(error);
            }
        },
        padZero(num) {
            return String(num).padStart(2, '0');
        },
        handleClose() {
            this.$emit('update:visible', false);
        },
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
        copySingle(item) {
            if (!item.numbers || item.numbers.length === 0) {
                return this.$message.warning('暂无可复制的内容~');
            }
            const text = `老板买1注自选号码${item.name}\n\n${this.formatNumberString(item.numbers, item.type)}\n`;
            this.copyToClipboard(text);
        },
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
.generate-dialog>>>.el-dialog__body {
    padding: 32px 28px 34px;
    background: #f5f7fa;
}

.generate-result-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
}

.result-row {
    display: flex;
    gap: 30px;
}

.result-card {
    flex: 1;
    border-radius: 18px;
    padding: 26px 18px;
    transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
    border: 2px solid transparent;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    opacity: 0;
    animation-fill-mode: forwards;
}

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

.copy-emoji-btn {
    font-size: 20px;
    color: #909399;
    transition: all 0.2s;
    padding: 0;
    margin-top: 2px;
}

.copy-emoji-btn:hover {
    color: #409EFF;
    transform: scale(1.2);
}

.lottery-name {
    font-size: 18px;
    font-weight: 800;
    color: #1e293b;
    letter-spacing: 0.3px;
}

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

.balls-container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px 6px;
}

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

.dlt-front {
    background: radial-gradient(circle at 30% 25%, #ff8787, #dc2626);
    box-shadow: 0 6px 12px rgba(220, 38, 38, 0.4), inset 0 -2px 0 #991b1b;
}

.dlt-back {
    background: radial-gradient(circle at 30% 25%, #60a5fa, #1d4ed8);
    box-shadow: 0 6px 12px rgba(37, 99, 235, 0.4), inset 0 -2px 0 #1e3a8a;
}

.ssq-red {
    background: radial-gradient(circle at 30% 25%, #ff8787, #dc2626);
    box-shadow: 0 6px 12px rgba(220, 38, 38, 0.4), inset 0 -2px 0 #991b1b;
}

.ssq-blue {
    background: radial-gradient(circle at 30% 25%, #60a5fa, #1d4ed8);
    box-shadow: 0 6px 12px rgba(37, 99, 235, 0.4), inset 0 -2px 0 #1e3a8a;
}

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

.no-numbers {
    text-align: center;
    color: #94a3b8;
    font-size: 14px;
    padding: 12px 0;
    letter-spacing: 0.5px;
    font-weight: 500;
}

.dialog-footer {
    text-align: right;
    padding-top: 8px;
}

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