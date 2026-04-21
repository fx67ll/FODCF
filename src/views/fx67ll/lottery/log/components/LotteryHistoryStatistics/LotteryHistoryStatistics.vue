<template>
    <el-dialog :visible.sync="dialogVisible" width="950px" style="top: 20px" :close-on-click-modal="false"
        :class="showCircle ? 'lottery-stats-dialog' : 'frequency-dialog'" @close="handleClose" v-loading="loading">
        <!-- 彩蛋：可点击的标题 -->
        <span slot="title" class="dialog-title-clickable" @click="toggleView">
            历史号码出现频率统计
        </span>

        <!-- 内容区域：通过 v-if 切换两个子组件，共用一份数据 -->
        <div class="dialog-body-content">
            <!-- 子组件 1：圆形球 -->
            <circle-view v-if="showCircle" ref="circleRef" :raw-data="rawData" />

            <!-- 子组件 2：方形卡片 -->
            <square-view v-else ref="squareRef" :raw-data="rawData" />
        </div>

        <!-- Footer 区域：根据当前视图显示对应的控制项 -->
        <span slot="footer" class="dialog-footer">
            <!-- 圆形球的 Footer -->
            <div v-if="showCircle" class="footer-control">
                <el-switch v-model="circleSortByFreq" :active-text="circleSortByFreq ? '按频率排序' : '按数字排序'"
                    inactive-color="#ccc" @change="syncCircleSort" />
            </div>

            <!-- 方形卡片的 Footer -->
            <div v-else class="footer-control">
                <span class="sort-label">排序方式：</span>
                <el-radio-group v-model="squareSortByFreq" size="small" @change="syncSquareSort">
                    <el-radio-button :label="true">按出现频率</el-radio-button>
                    <el-radio-button :label="false">按号码大小</el-radio-button>
                </el-radio-group>
                <span class="hint">{{ squareSortByFreq ? '（从高频到低频）' : '（从小到大）' }}</span>
            </div>

            <el-button @click="dialogVisible = false">关 闭</el-button>
        </span>
    </el-dialog>
</template>

<script>
import { listHistoryStatistics } from "@/api/fx67ll/lottery/log";

import { getLotteryNumberByFrequency } from "@/utils/fx67ll/utils";

import CircleView from './components/CircleView.vue';
import SquareView from './components/SquareView.vue';

export default {
    name: "ComboDialog",
    components: { CircleView, SquareView },
    props: {
        visible: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            dialogVisible: false,
            loading: false,
            showCircle: true, // 默认显示圆形球
            rawData: [],       // 统一管理的数据

            // 为了能在父组件控制 Footer，我们把部分状态提到父级
            circleSortByFreq: true,
            squareSortByFreq: true
        };
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
            // 每次打开，如果没数据才请求，或者可以选择强制刷新
            if (this.rawData.length === 0) {
                this.fetchData();
            }
        },
        fetchData() {
            this.loading = true;
            listHistoryStatistics().then(res => {
                if (res && res.code === 200) {
                    this.rawData = res.rows || [];
                    // TODO: 显示统计后的号码组
                    console.log(getLotteryNumberByFrequency(res));
                }
                this.loading = false;
            }).catch(() => {
                this.loading = false;
            });
        },
        toggleView() {
            this.showCircle = !this.showCircle;
            // 可以在这里加个小小的提示，让用户知道切换成功了（可选）
            // this.$message.info(`已切换至${this.showCircle ? '经典视图' : '卡片视图'}`);
        },
        handleClose() {
            // 关闭时重置状态
            this.showCircle = true;
            this.dialogVisible = false;
            // 调用子组件的重置方法，通过 ref
            if (this.$refs.circleRef) this.$refs.circleRef.resetState();
            if (this.$refs.squareRef) this.$refs.squareRef.resetState();
        },
        syncCircleSort(val) {
            // 父组件状态改变时，强制更新子组件视图（因为子组件用了 $forceUpdate，这里只需要同步数据逻辑）
            if (this.$refs.circleRef) {
                this.$refs.circleRef.sortByFreq = val;
                this.$refs.circleRef.$forceUpdate();
            }
        },
        syncSquareSort(val) {
            if (this.$refs.squareRef) {
                this.$refs.squareRef.sortByFrequency = val;
            }
        }
    }
};
</script>

<style scoped>
/* 父组件只需要写很少的样式，主要是标题和布局 */
.dialog-title-clickable {
    cursor: pointer;
    user-select: none;
    transition: color 0.3s;
}

.dialog-title-clickable:hover {
    color: #409eff;
}

.dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.footer-control {
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

/* 穿透样式，确保两个子组件的样式都能正常影响 Dialog Body */
.lottery-stats-dialog>>>.el-dialog__body,
.frequency-dialog>>>.el-dialog__body {
    padding: 20px;
}
</style>