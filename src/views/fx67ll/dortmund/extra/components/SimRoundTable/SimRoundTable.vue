<template>
  <!-- 数值模拟轮次记录卡片 -->
  <div class="status-card">
    <div class="status-header">
      <h2>轮次记录</h2>
      <el-tag size="small" effect="plain" type="success">共 {{ total }} 轮</el-tag>
    </div>

    <el-table v-loading="loading" :data="rounds" empty-text="暂无模拟轮次记录，点击操作台按钮确认记录第一轮">
      <el-table-column label="轮次" align="center" prop="roundNo" width="60" />
      <el-table-column label="模式" align="center" prop="simMode" width="70">
        <template slot-scope="scope">
          <span>{{ scope.row.simMode === "half" ? "半量" : "全量" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="本轮开始数值" align="center" prop="startValue">
        <template slot-scope="scope">
          <span>{{ formatSimNumber(scope.row.startValue) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="本轮参与数值" align="center" prop="joinValue">
        <template slot-scope="scope">
          <span>{{ formatSimNumber(scope.row.joinValue) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="实际回收数值" align="center" prop="returnValue">
        <template slot-scope="scope">
          <span>{{ formatSimNumber(scope.row.returnValue) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="本轮结果" align="center" prop="isHit" width="90">
        <template slot-scope="scope">
          <span style="color: #2ecc71" v-if="scope.row.isHit === 'Y'">达成</span>
          <span style="color: #ff5a5f" v-else>未达成</span>
        </template>
      </el-table-column>
      <el-table-column label="本轮结束数值" align="center" prop="endValue">
        <template slot-scope="scope">
          <span :style="{ color: scope.row.endValue >= scope.row.startValue ? '#2ecc71' : '#ff5a5f' }">{{
            formatSimNumber(scope.row.endValue) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="数值变动" align="center" prop="roundChange" width="80">
        <template slot-scope="scope">
          <span>×{{ scope.row.roundChange }}</span>
        </template>
      </el-table-column>
      <el-table-column label="记录时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="pageNumValue" :limit.sync="pageSizeValue"
      :page-sizes="[10, 23, 50, 100]" @pagination="$emit('pagination')" />
  </div>
</template>

<script>
export default {
  name: "SimRoundTable",
  props: {
    // 轮次记录列表数据
    rounds: {
      type: Array,
      default: () => [],
    },
    // 轮次记录总条数
    total: {
      type: Number,
      default: 0,
    },
    // 列表加载状态
    loading: {
      type: Boolean,
      default: false,
    },
    // 当前页码
    page: {
      type: Number,
      default: 1,
    },
    // 每页条数
    limit: {
      type: Number,
      default: 10,
    },
  },
  computed: {
    pageNumValue: {
      get() {
        return this.page;
      },
      set(val) {
        this.$emit("update:page", val);
      },
    },
    pageSizeValue: {
      get() {
        return this.limit;
      },
      set(val) {
        this.$emit("update:limit", val);
      },
    },
  },
  methods: {
    // 数值模拟金额格式化，保留两位小数
    formatSimNumber(value) {
      return parseFloat(value || 0).toFixed(2);
    },
  },
};
</script>

<style lang="scss" scoped>
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
  margin-bottom: 18px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f5f5f5;
}

.status-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1f2d3d;
}
</style>
