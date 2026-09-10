<template>
  <!-- 全量滚动与半量滚动模式对比卡片 -->
  <div class="status-card">
    <div class="status-header">
      <h2>全量滚动与半量滚动模式对比</h2>
    </div>

    <el-table :data="compareList" size="small" border>
      <el-table-column label="对比维度" align="center" prop="compareDim" width="200" />
      <el-table-column label="全量滚动模式" align="center" prop="fullMode" />
      <el-table-column label="半量滚动模式" align="center" prop="halfMode" />
    </el-table>
  </div>
</template>

<script>
export default {
  name: "SimCompareTable",
  props: {
    // 两种模式对比数据
    compareList: {
      type: Array,
      default: () => [],
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
