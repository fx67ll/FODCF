<template>
    <!-- 
      Element UI 对话框组件 
      :visible.sync 双向绑定控制显示/隐藏
      width="950px" 宽度 950 像素
      style="top: 20px" 距离顶部 20px
      :close-on-click-modal="false" 禁止点击遮罩层关闭
      :class 根据 showCircle 动态切换样式类，用于穿透修改对话框内容样式
      @close 关闭时触发 handleClose 方法
      append-to-body 将对话框插入到 body 元素下，避免层级/定位问题
    -->
    <el-dialog :visible.sync="dialogVisible" width="950px" :style="`top: ${getDialogVerticalOffset(584)}`"
        :close-on-click-modal="false" :class="showCircle ? 'lottery-stats-dialog' : 'frequency-dialog'"
        @close="handleClose" append-to-body>

        <!-- 
          彩蛋：可点击的标题 
          slot="title" 替换对话框默认标题区域
          class="dialog-title-clickable" 添加可点击样式
          @click="toggleView" 点击切换圆形/方形视图
        -->
        <span slot="title" class="dialog-title-clickable" @click="toggleView">
            历史号码出现频率统计
        </span>

        <!-- 
          内容区域：通过 v-if 切换两个子组件，共用一份数据 rawData 
          v-loading="loading" 显示加载动画
        -->
        <div class="dialog-body-content" v-loading="loading">
            <!-- 
              子组件 1：圆形球视图（经典视图）
              v-if 控制渲染
              ref="circleRef" 供父组件调用其方法
              :raw-data="rawData" 传入原始数据
            -->
            <circle-view v-if="showCircle" ref="circleRef" :raw-data="rawData" />

            <!-- 
              子组件 2：方形卡片视图
              v-else 当 showCircle 为 false 时渲染
              ref="squareRef" 供父组件调用其方法
              :raw-data="rawData" 传入原始数据
            -->
            <square-view v-else ref="squareRef" :raw-data="rawData" />
        </div>

        <!-- 
          Footer 区域：根据当前视图显示对应的控制项 
          slot="footer" 替换对话框默认底部区域
        -->
        <span slot="footer" class="dialog-footer">
            <!-- 圆形球视图的 Footer 控制 -->
            <div v-if="showCircle" class="footer-control">
                <!-- 
                  el-switch 切换排序方式 
                  v-model="circleSortByFreq" 绑定排序状态
                  :active-text 动态显示当前模式文字
                  inactive-color="#ccc" 未激活状态颜色
                  @change="syncCircleSort" 状态变化时同步到子组件
                -->
                <el-switch v-model="circleSortByFreq" :active-text="circleSortByFreq ? '按频率排序' : '按数字排序'"
                    inactive-color="#ccc" @change="syncCircleSort" />
            </div>

            <!-- 方形卡片视图的 Footer 控制 -->
            <div v-else class="footer-control">
                <span class="sort-label">排序方式：</span>
                <!-- 
                  el-radio-group 单选按钮组 
                  v-model="squareSortByFreq" 绑定排序方式
                  size="small" 小尺寸
                  @change="syncSquareSort" 状态变化时同步到子组件
                -->
                <el-radio-group v-model="squareSortByFreq" size="small" @change="syncSquareSort">
                    <el-radio-button :label="true">按出现频率</el-radio-button>
                    <el-radio-button :label="false">按号码大小</el-radio-button>
                </el-radio-group>
                <!-- 提示文字：根据排序方式显示不同提示 -->
                <span class="hint">{{ squareSortByFreq ? '（从高频到低频）' : '（从小到大）' }}</span>
            </div>

            <!-- 关闭按钮 -->
            <el-button @click="dialogVisible = false">关 闭</el-button>
        </span>
    </el-dialog>
</template>

<script>
// 引入 API 方法：获取历史统计数据
import { listHistoryStatistics } from "@/api/fx67ll/lottery/log";
// 引入核心工具函数
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";
// 引入两个子组件
import CircleView from './components/CircleView.vue';
import SquareView from './components/SquareView.vue';

export default {
    name: "LotteryHistoryStatistics",
    components: { CircleView, SquareView }, // 注册子组件

    props: {
        // 控制弹窗是否可见（由父组件传入）
        visible: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            dialogVisible: false,        // 内部对话框显示状态，与 visible 同步（经防抖处理）
            loading: false,              // 数据加载状态
            showCircle: true,            // 当前显示视图：true=圆形球视图，false=方形卡片视图
            rawData: [],                 // 统一管理的原始统计数据（共享给两个子组件）

            // 为了在父组件控制 Footer，将部分排序状态提升到父级管理
            circleSortByFreq: true,      // 圆形视图排序方式：true=按频率，false=按数字
            squareSortByFreq: true,      // 方形视图排序方式：true=按频率，false=按数字

            // 防抖定时器，用于处理 visible prop 变化时的延迟更新，避免动画冲突
            visibleDebounceTimer: null
        };
    },

    watch: {
        /**
         * 监听父组件传入的 visible 变化
         * 使用防抖处理，避免短时间内多次切换导致的渲染抖动或动画异常
         */
        visible(val) {
            // 清除之前的定时器，保证只执行最后一次变化
            if (this.visibleDebounceTimer) clearTimeout(this.visibleDebounceTimer);

            // 设置新的定时器，延迟 20ms 更新 dialogVisible
            this.visibleDebounceTimer = setTimeout(() => {
                this.dialogVisible = val;
                if (val) {
                    // 弹窗打开后，等待 DOM 更新完成再请求数据
                    this.$nextTick(() => {
                        this.initData();
                    });
                }
            }, 20);
        },

        /**
         * 监听内部 dialogVisible 变化，同步回父组件
         */
        dialogVisible(val) {
            // 发射 update:visible 事件，实现 .sync 修饰符效果
            this.$emit('update:visible', val);

            // 弹窗完全关闭时，重置对话框状态
            if (!val) {
                this.resetDialogState();
            }
        }
    },

    // 组件销毁前清除防抖定时器，避免内存泄漏
    beforeDestroy() {
        if (this.visibleDebounceTimer) {
            clearTimeout(this.visibleDebounceTimer);
        }
    },

    methods: {
        // 代理工具函数
        getDialogVerticalOffset(offset) {
            return getDialogVerticalOffset(offset);
        },
        /**
         * 初始化数据
         * 如果 rawData 为空且对话框可见，则请求数据
         */
        initData() {
            if (this.rawData.length === 0 && this.dialogVisible) {
                this.fetchData();
            }
        },

        /**
         * 获取历史统计数据
         */
        fetchData() {
            this.loading = true;
            listHistoryStatistics().then(res => {
                // 接口返回 code 200 表示成功
                if (res && res.code === 200) {
                    this.rawData = res.rows || []; // 保存数据行
                }
                this.loading = false;
            }).catch(() => {
                // 发生错误时也要关闭 loading
                this.loading = false;
            });
        },

        /**
         * 切换视图（彩蛋功能：点击标题触发）
         */
        toggleView() {
            this.showCircle = !this.showCircle;
            // 可选的提示信息（已注释）
            // this.$message.info(`已切换至${this.showCircle ? '经典视图' : '卡片视图'}`);
        },

        /**
         * 对话框关闭时的处理
         * 重置视图为圆形球，关闭对话框，并调用子组件的重置方法
         */
        handleClose() {
            this.showCircle = true;
            this.dialogVisible = false;

            // 如果子组件实例存在，调用其重置状态的方法
            if (this.$refs.circleRef) this.$refs.circleRef.resetState();
            if (this.$refs.squareRef) this.$refs.squareRef.resetState();
        },

        /**
         * 重置对话框状态（数据清理）
         * 在弹窗关闭后调用，清空数据以释放内存（下次打开会重新加载）
         */
        resetDialogState() {
            this.rawData = [];
            // 如果希望保留数据避免重复请求，可注释掉上一行
        },

        /**
         * 同步圆形视图的排序方式
         * @param {boolean} val 新的排序状态
         */
        syncCircleSort(val) {
            if (this.$refs.circleRef) {
                // 更新子组件的排序状态属性
                this.$refs.circleRef.sortByFreq = val;
                // 强制子组件重新渲染（因为子组件可能未监听 prop 变化，需显式刷新）
                this.$refs.circleRef.$forceUpdate();
            }
        },

        /**
         * 同步方形视图的排序方式
         * @param {boolean} val 新的排序状态
         */
        syncSquareSort(val) {
            if (this.$refs.squareRef) {
                this.$refs.squareRef.sortByFrequency = val;
                // 假设 SquareView 内部通过计算属性响应变化，故不需要 $forceUpdate
            }
        }
    }
};
</script>

<style scoped>
/* 
  父组件仅定义与对话框整体布局相关的样式，
  具体的球/卡片样式由子组件内部管理。
*/

/* 标题样式：可点击提示 */
.dialog-title-clickable {
    font-size: 18px;
    cursor: pointer;
    /* 鼠标变为手型，暗示可点击 */
    user-select: none;
    /* 禁止选中文字 */
    transition: color 0.3s;
    /* 颜色过渡动画 */
}

.dialog-title-clickable:hover {
    color: #409eff;
    /* 悬停时变为 Element 主题蓝色 */
}

/* 对话框底部布局：左右分布（控制项居左，关闭按钮居右） */
.dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* 底部控制项容器（开关/单选组） */
.footer-control {
    display: flex;
    align-items: center;
    gap: 8px;
    /* 内部元素间距 */
}

/* 排序方式标签文字 */
.sort-label {
    font-size: 14px;
    color: #606266;
    /* 次要文字颜色 */
}

/* 提示文字（红色，用于强调排序规则） */
.hint {
    font-size: 12px;
    color: #f56c6c;
}

/* 
  穿透样式（使用 >>> 深度选择器）：
  根据动态类名，修改 Element Dialog 内部 body 的内边距，
  确保两个子组件的布局与对话框边缘有合适的间距。
*/
.lottery-stats-dialog>>>.el-dialog__body,
.frequency-dialog>>>.el-dialog__body {
    padding: 20px;
}
</style>