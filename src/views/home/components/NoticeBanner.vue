<template>
  <div class="notice-banner-wrapper">
    <transition name="notice-slide">
      <div v-if="latestNotice && !isNoticeClosed" class="notice-card" :class="{ 'notice-shake': isShaking }"
        @click="handleViewLatest">
        <div class="notice-card-icon">
          <i class="el-icon-bell bell-shake"></i>
        </div>
        <div class="notice-card-body">
          <span class="notice-type-tag" :class="'type-' + latestNotice.noticeType">
            {{ typeText(latestNotice.noticeType) }}
          </span>
          <span class="notice-card-title">{{ latestNotice.noticeTitle }}</span>
          <span class="notice-card-time">{{ parseTime(latestNotice.createTime, "{y}-{m}-{d}") }}</span>
        </div>
        <div class="notice-card-more" @click.stop="goNoticeList">
          全部公告<i class="el-icon-arrow-right"></i>
        </div>
        <div class="notice-card-close" @click.stop="handleCloseNotice">
          <i class="el-icon-close"></i>
        </div>
      </div>
    </transition>

    <!-- 公告详情弹窗（信封样式，见 NoticeDetailDialog） -->
    <notice-detail-dialog :visible.sync="noticeOpen" :notice="noticeDetail" />
  </div>
</template>

<script>
import { latestPublicNotice, getPublicNotice } from "@/api/system/notice";
import NoticeDetailDialog from "@/views/system/notice/component/NoticeDetailDialog.vue";
import { NOTICE_PUBLIC_PATH } from "@/views/system/notice/constants";

/**
 * 通知公告条（对应需求 #5：保留非管理员首页的公告条，沿用现有实现）
 */
export default {
  name: "HomeNoticeBanner",
  components: { NoticeDetailDialog },
  dicts: ["sys_notice_type"],
  data() {
    return {
      latestNotice: null,
      noticeOpen: false,
      noticeDetail: {},
      closedNoticeId: sessionStorage.getItem("closedNoticeId") || "",
      readNoticeId: sessionStorage.getItem("readNoticeId") || "",
      isShaking: false,
    };
  },
  computed: {
    isNoticeClosed() {
      if (!this.latestNotice || !this.latestNotice.noticeId) return false;
      return String(this.closedNoticeId) === String(this.latestNotice.noticeId);
    },
  },
  mounted() {
    this.loadLatestNotice();
  },
  methods: {
    typeText(noticeType) {
      const dict = (this.dict.type.sys_notice_type || []).find((item) => item.value === noticeType);
      return dict ? dict.label : "公告";
    },
    loadLatestNotice() {
      latestPublicNotice()
        .then((response) => {
          this.latestNotice = response.data || null;
        })
        .catch(() => {
          this.latestNotice = null;
        });
    },
    handleViewLatest() {
      if (!this.latestNotice) return;
      getPublicNotice(this.latestNotice.noticeId).then((response) => {
        this.noticeDetail = response.data || {};
        this.noticeOpen = true;
        this.readNoticeId = String(this.latestNotice.noticeId);
        sessionStorage.setItem("readNoticeId", this.readNoticeId);
      });
    },
    goNoticeList() {
      this.$router.push(NOTICE_PUBLIC_PATH).catch(() => { });
    },
    handleCloseNotice() {
      if (!this.latestNotice || !this.latestNotice.noticeId) return;
      const isRead = String(this.readNoticeId) === String(this.latestNotice.noticeId);
      if (!isRead) {
        this.$message.warning("请先拆阅公告来信，再关闭公告条");
        this.triggerShake();
        return;
      }
      this.closedNoticeId = String(this.latestNotice.noticeId);
      sessionStorage.setItem("closedNoticeId", this.closedNoticeId);
    },
    triggerShake() {
      if (this.isShaking) return;
      this.isShaking = true;
      setTimeout(() => {
        this.isShaking = false;
      }, 500);
    },
  },
};
</script>

<style scoped lang="scss">
.notice-banner-wrapper {
  margin-bottom: 18px;
}

.notice-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.notice-slide-leave-active {
  transition: all 0.3s ease-in-out;
}

.notice-slide-enter,
.notice-slide-leave-to {
  opacity: 0;
  transform: translateY(-16px);
  height: 0;
  margin-bottom: 0;
}

.notice-card {
  position: relative;
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 8px 0 0;
  margin-bottom: 20px;
  overflow: hidden;
  background: linear-gradient(90deg, #f0fdf4 0%, #ffffff 70%);
  border: 1px solid #dcfce7;
  border-left: 4px solid #2ecc71;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(46, 204, 113, 0.1);
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-left-color 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 26px rgba(46, 204, 113, 0.2);
    border-left-color: #27ad60;

    .notice-card-title {
      color: #27ad60;
    }
  }

  &:active {
    transform: translateY(0) scale(0.995);
  }
}

.notice-card.notice-shake {
  animation: notice-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  border-left-color: #f97316;

  &:hover {
    transform: none;
  }
}

@keyframes notice-shake {

  10%,
  90% {
    transform: translateX(-2px);
  }

  20%,
  80% {
    transform: translateX(4px);
  }

  30%,
  50%,
  70% {
    transform: translateX(-8px);
  }

  40%,
  60% {
    transform: translateX(8px);
  }
}

.notice-card-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 100%;
  color: #2ecc71;
  font-size: 20px;

  .bell-shake {
    animation: bell-ring 2.5s ease-in-out infinite;
    transform-origin: top center;
  }
}

@keyframes bell-ring {

  0%,
  100% {
    transform: rotate(0deg);
  }

  10% {
    transform: rotate(12deg);
  }

  20% {
    transform: rotate(-10deg);
  }

  30% {
    transform: rotate(8deg);
  }

  40% {
    transform: rotate(-6deg);
  }

  50% {
    transform: rotate(4deg);
  }

  60% {
    transform: rotate(-2deg);
  }

  70% {
    transform: rotate(1deg);
  }
}

.notice-card-body {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  padding-right: 16px;
  gap: 12px;
}

.notice-type-tag {
  flex-shrink: 0;
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;

  &.type-1 {
    background: linear-gradient(135deg, #fdba74 0%, #f97316 100%);
    box-shadow: 0 2px 6px rgba(249, 115, 22, 0.2);
  }

  &.type-2 {
    background: linear-gradient(135deg, #86efac 0%, #2ecc71 100%);
    box-shadow: 0 2px 6px rgba(46, 204, 113, 0.2);
  }
}

.notice-card-title {
  flex: 1;
  margin: 0;
  overflow: hidden;
  color: #374151;
  font-size: 15px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s ease;
}

.notice-card-time {
  flex-shrink: 0;
  color: #9ca3af;
  font-size: 12px;
}

.notice-card-more {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  height: auto;
  margin-right: 8px;
  padding: 6px 16px;
  color: #2ecc71;
  background: rgba(46, 204, 113, 0.06);
  border-radius: 20px;
  font-size: 13px;
  transition: all 0.25s ease;

  &:hover {
    color: #27ad60;
    background: rgba(46, 204, 113, 0.12);
  }

  i {
    margin-left: 4px;
    font-size: 12px;
    transition: transform 0.25s ease;
  }

  &:hover i {
    transform: translateX(3px);
  }
}

.notice-card-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: 4px;
  color: #9ca3af;
  font-size: 16px;
  border-radius: 50%;
  transition: all 0.25s ease;

  &:hover {
    color: #6b7280;
    background: rgba(0, 0, 0, 0.06);
    transform: rotate(90deg);
  }
}

@media (max-width: 700px) {
  .notice-card {
    padding-left: 4px;
  }

  .notice-card-more {
    display: none;
  }

  .notice-card-icon {
    width: 48px;
  }
}
</style>
