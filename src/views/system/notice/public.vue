<template>
  <div class="app-container notice-public-container">
    <!-- 顶部搜索 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="公告标题" prop="noticeTitle">
        <el-input v-model="queryParams.noticeTitle" placeholder="请输入公告标题" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="公告类型" prop="noticeType" v-if="isMoreQuery">
        <el-select v-model="queryParams.noticeType" placeholder="公告类型" clearable>
          <el-option v-for="dict in dict.type.sys_notice_type" :key="dict.value" :label="dict.label"
            :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" v-if="isMoreQuery">
        <el-date-picker v-model="dateRange" style="width: 240px" value-format="yyyy-MM-dd HH:mm:ss" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"
          :default-time="['00:00:00', '23:59:59']"></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
        <el-button type="info" :icon="isMoreQuery ? 'el-icon-zoom-out' : 'el-icon-zoom-in'" size="mini"
          @click="handleMoreQuery">
          {{ isMoreQuery ? "关闭高级搜索" : "使用高级搜索" }}
        </el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 公告卡片列表 -->
    <div v-loading="loading" class="notice-card-list">
      <div v-if="noticeList.length === 0 && !loading" class="notice-empty">
        <i class="el-icon-bell"></i>
        <p>暂无公告</p>
      </div>
      <div v-for="item in noticeList" :key="item.noticeId" class="notice-card" @click="handleView(item)">
        <div class="notice-card-header">
          <span class="notice-type-tag" :class="'type-' + item.noticeType">
            {{ typeText(item.noticeType) }}
          </span>
          <span class="notice-card-title">{{ item.noticeTitle }}</span>
          <span class="notice-card-time">{{ parseTime(item.createTime) }}</span>
        </div>
        <div class="notice-card-content" v-html="stripContent(item.noticeContent)"></div>
        <div class="notice-card-footer">
          <span class="notice-card-author">发布者：{{ item.createBy || "系统" }}</span>
          <span class="notice-card-more">查看详情 <i class="el-icon-arrow-right"></i></span>
        </div>
      </div>
    </div>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 公告详情弹窗 -->
    <notice-detail-dialog :visible.sync="open" :notice="form" />
  </div>
</template>

<script>
import { listPublicNotice, getPublicNotice } from "@/api/system/notice";
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";
import NoticeDetailDialog from "@/views/system/notice/component/NoticeDetailDialog.vue";

export default {
  name: "NoticePublic",
  components: { NoticeDetailDialog },
  dicts: ["sys_notice_type"],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: false,
      // 总条数
      total: 0,
      // 公告列表
      noticeList: [],
      // 是否显示弹出层
      open: false,
      // 表单
      form: {},
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        noticeTitle: undefined,
        noticeType: undefined,
      },
      // 创建时间范围
      dateRange: [],
      // 是否展开高级搜索
      isMoreQuery: false,
    };
  },
  created() {
    this.getList();
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    /** 类型文本 */
    typeText(noticeType) {
      const dict = (this.dict.type.sys_notice_type || []).find((d) => d.value === noticeType);
      return dict ? dict.label : "公告";
    },
    /** 列表预览内容：去标签 + 截断 */
    stripContent(html) {
      if (!html) return "暂无内容";
      const text = html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
      return text.length > 120 ? text.substring(0, 120) + "..." : text;
    },
    /** 查询列表 */
    getList() {
      this.loading = true;
      listPublicNotice(this.addDateRange(this.queryParams, this.dateRange)).then((response) => {
        this.noticeList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 搜索 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 高级搜索展开/收起 */
    handleMoreQuery() {
      this.isMoreQuery = !this.isMoreQuery;
    },
    /** 重置 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 查看详情 */
    handleView(row) {
      getPublicNotice(row.noticeId).then((response) => {
        this.form = response.data;
        this.open = true;
      });
    },
  },
};
</script>

<style scoped lang="scss">
.notice-public-container {
  // .notice-card-list {}

  .notice-empty {
    text-align: center;
    padding: 80px 0;
    color: #909399;

    i {
      font-size: 48px;
      color: #c0c4cc;
    }

    p {
      margin-top: 16px;
      font-size: 14px;
    }
  }

  .notice-card {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    padding: 18px 22px;
    margin-bottom: 14px;
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

    &:hover {
      border-color: #2ecc71;
      box-shadow: 0 4px 16px rgba(46, 204, 113, 0.12);
      transform: translateY(-2px);
    }

    .notice-card-header {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }

    .notice-card-title {
      flex: 1;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 0 12px;
    }

    .notice-card-time {
      font-size: 12px;
      color: #909399;
      flex-shrink: 0;
    }

    .notice-card-content {
      font-size: 13px;
      color: #606266;
      line-height: 1.7;
      margin-bottom: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .notice-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #909399;

      .notice-card-more {
        color: #2ecc71;

        i {
          margin-left: 2px;
        }
      }
    }
  }

  // 类型标签
  .notice-type-tag {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 12px;
    color: #fff;
    flex-shrink: 0;

    &.type-1 {
      background: #ff9900;
    }

    &.type-2 {
      background: #2ecc71;
    }
  }
}
</style>
