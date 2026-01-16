<template>
  <div class="app-container">
    <!-- Tomcat 服务管理卡片 -->
    <div class="status-card">
      <div class="status-header">
        <h2>Tomcat 服务管理</h2>
        <!-- 新增主动刷新按钮 -->
        <div class="refresh-container">
          <el-button type="text" icon="el-icon-refresh" @click="handleRefresh" :loading="isRefreshing"
            class="refresh-btn">
            手动刷新
          </el-button>
          <span class="refresh-time">最后刷新: {{ lastRefreshTime }}</span>
        </div>
      </div>

      <div class="status-content">
        <div class="status-indicator">
          <div class="indicator-dot" :class="status === '运行中' ? 'running' : 'stopped'"></div>
          <div class="status-text">{{ status }}</div>
        </div>

        <div class="operation-buttons">
          <el-button type="success" icon="el-icon-play" @click="startTomcat"
            :disabled="status === '运行中' || isOperating">
            启动服务
          </el-button>
          <el-button type="danger" icon="el-icon-stop" @click="stopTomcat" :disabled="status === '已停止' || isOperating">
            停止服务
          </el-button>
        </div>
      </div>

      <div class="status-log" v-if="logInfo">
        <h3>操作日志</h3>
        <pre>{{ logInfo }}</pre>
      </div>
    </div>

    <!-- 新增：GitHub 连接状态检测卡片 -->
    <div class="status-card">
      <div class="status-header">
        <h2>GitHub 连通性检测</h2>
        <div class="refresh-container">
          <el-button type="text" icon="el-icon-switch-button" @click="handleRefreshGithub" :loading="isRefreshingGithub"
            class="refresh-btn">
            重置检测
          </el-button>
          <span class="refresh-time" v-if="lastGithubTestTime">最后检测: {{ lastGithubTestTime }}</span>
        </div>
      </div>

      <div class="github-content">
        <div class="detection-methods">
          <div class="method-card">
            <div class="method-header">
              <h4>TCP 网络层检测</h4>
              <div class="method-status" :class="getStatusClass(tcpStatus)">
                {{ getStatusText(tcpStatus) }}
              </div>
            </div>
            <div class="method-desc">
              <p>检测与 GitHub 的网络连通性（TCP 443端口）</p>
              <p class="desc-detail">仅验证网络层是否可达，不涉及HTTP协议</p>
            </div>
            <div class="method-action">
              <el-button type="primary" size="small" @click="testTcpConnectivity" :loading="testingTcp"
                :disabled="testingHttp">
                {{ testingTcp ? '检测中...' : '开始检测' }}
              </el-button>
            </div>
          </div>

          <div class="method-card">
            <div class="method-header">
              <h4>HTTP 应用层检测</h4>
              <div class="method-status" :class="getStatusClass(httpStatus)">
                {{ getStatusText(httpStatus) }}
              </div>
            </div>
            <div class="method-desc">
              <p>完整检测 HTTPS 连接（包含SSL握手）</p>
              <p class="desc-detail">验证完整的HTTP协议栈和证书链</p>
            </div>
            <div class="method-action">
              <el-button type="primary" size="small" @click="testHttpConnectivity" :loading="testingHttp"
                :disabled="testingTcp">
                {{ testingHttp ? '检测中...' : '开始检测' }}
              </el-button>
            </div>
          </div>
        </div>

        <div class="detection-result" v-if="githubLogInfo">
          <h3>检测结果</h3>
          <pre>{{ githubLogInfo || 未知问题 }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getTomcatStatus,
  startTomcat,
  stopTomcat,
  testConnectToGithubByTcp,
  testConnectToGithubByHttp
} from "@/api/fx67ll/server/tomcat";

export default {
  name: "TomcatManager",
  data() {
    return {
      // Tomcat 状态相关
      status: "加载中...",
      lastRefreshTime: "",
      logInfo: "",
      isOperating: false,
      refreshInterval: null,
      isRefreshing: false,

      // GitHub 检测相关
      tcpStatus: "waiting", // waiting, testing, success, error
      httpStatus: "waiting", // waiting, testing, success, error
      testingTcp: false,
      testingHttp: false,
      githubLogInfo: "",
      lastGithubTestTime: "",
      isRefreshingGithub: false
    };
  },
  created() {
    // 初始化查询状态
    this.queryStatus();

    // 设置自动刷新，每10秒一次
    this.refreshInterval = setInterval(() => {
      this.queryStatus();
    }, 10000);
  },
  beforeDestroy() {
    // 清除定时器
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    /**
     * 手动刷新状态
     */
    handleRefresh() {
      this.isRefreshing = true;
      this.queryStatus().finally(() => {
        this.isRefreshing = false;
      });
    },

    /**
     * 手动刷新GitHub检测状态
     */
    handleRefreshGithub() {
      this.isRefreshingGithub = true;
      // 重置状态
      this.tcpStatus = "waiting";
      this.httpStatus = "waiting";
      this.githubLogInfo = "";
      setTimeout(() => {
        this.isRefreshingGithub = false;
      }, 500);
    },

    /**
     * 查询Tomcat状态
     */
    queryStatus() {
      return getTomcatStatus().then(response => {
        this.status = response.data;
        this.lastRefreshTime = this.formatDateTime(new Date());
      }).catch(error => {
        this.$message.error("查询状态失败: " + (error.msg || error.message));
        this.status = "未知";
      });
    },

    /**
     * 启动Tomcat
     */
    startTomcat() {
      this.$confirm('确定要启动Tomcat服务吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.isOperating = true;
        this.logInfo = "正在启动Tomcat服务...";

        startTomcat().then(response => {
          this.$message.success(response.msg);
          this.logInfo = response.data || response.msg;
          // 启动后立即查询一次状态，然后等待3秒再查一次
          setTimeout(() => {
            this.queryStatus();
            setTimeout(() => {
              this.queryStatus();
              this.isOperating = false;
            }, 3000);
          }, 1000);
        }).catch(error => {
          this.$message.error(error.msg || "启动失败");
          this.logInfo = error.msg || "启动失败";
          this.isOperating = false;
          this.queryStatus();
        });
      }).catch(() => {
        this.$message.info('已取消启动');
      });
    },

    /**
     * 停止Tomcat
     */
    stopTomcat() {
      this.$confirm('确定要停止Tomcat服务吗？停止后可能导致相关应用无法访问。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }).then(() => {
        this.isOperating = true;
        this.logInfo = "正在停止Tomcat服务...";

        stopTomcat().then(response => {
          this.$message.success(response.msg);
          this.logInfo = response.data || response.msg;
          // 停止后立即查询一次状态，然后等待3秒再查一次
          setTimeout(() => {
            this.queryStatus();
            setTimeout(() => {
              this.queryStatus();
              this.isOperating = false;
            }, 3000);
          }, 1000);
        }).catch(error => {
          this.$message.error(error.msg || "停止失败");
          this.logInfo = error.msg || "停止失败";
          this.isOperating = false;
          this.queryStatus();
        });
      }).catch(() => {
        this.$message.info('已取消停止');
      });
    },

    /**
     * 测试TCP连通性
     */
    testTcpConnectivity() {
      this.testingTcp = true;
      this.tcpStatus = "testing";
      this.githubLogInfo = "正在检测 GitHub TCP 连通性...";

      testConnectToGithubByTcp().then(response => {
        this.tcpStatus = "success";
        this.githubLogInfo = `TCP检测成功：${response.msg}\n详细信息：${response.data}`;
        this.lastGithubTestTime = this.formatDateTime(new Date());
        this.$message.success('GitHub TCP连通性检测成功');
      }).catch(error => {
        this.tcpStatus = "error";
        this.githubLogInfo = `TCP检测失败：${error.msg || error.message}`;
        this.lastGithubTestTime = this.formatDateTime(new Date());
        this.$message.error('GitHub TCP连通性检测失败');
      }).finally(() => {
        this.testingTcp = false;
      });
    },

    /**
     * 测试HTTP连通性
     */
    testHttpConnectivity() {
      this.testingHttp = true;
      this.httpStatus = "testing";
      this.githubLogInfo = "正在检测 GitHub HTTP 连通性...";

      testConnectToGithubByHttp().then(response => {
        this.httpStatus = "success";
        this.githubLogInfo = `HTTP检测成功：${response.msg}\n详细信息：${response.data}`;
        this.lastGithubTestTime = this.formatDateTime(new Date());
        this.$message.success('GitHub HTTP连通性检测成功');
      }).catch(error => {
        this.httpStatus = "error";
        this.githubLogInfo = `HTTP检测失败：${error.msg || error.message}`;
        this.lastGithubTestTime = this.formatDateTime(new Date());
        this.$message.error('GitHub HTTP连通性检测失败');
      }).finally(() => {
        this.testingHttp = false;
      });
    },

    /**
     * 获取状态样式类
     */
    getStatusClass(status) {
      const statusMap = {
        waiting: 'status-waiting',
        testing: 'status-testing',
        success: 'status-success',
        error: 'status-error'
      };
      return statusMap[status] || 'status-waiting';
    },

    /**
     * 获取状态文本
     */
    getStatusText(status) {
      const textMap = {
        waiting: '等待检测',
        testing: '检测中...',
        success: '连接正常',
        error: '连接失败'
      };
      return textMap[status] || '未知状态';
    },

    /**
     * 格式化日期时间
     */
    formatDateTime(date) {
      const year = date.getFullYear();
      const month = this.padZero(date.getMonth() + 1);
      const day = this.padZero(date.getDate());
      const hour = this.padZero(date.getHours());
      const minute = this.padZero(date.getMinutes());
      const second = this.padZero(date.getSeconds());
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    },

    /**
     * 补零
     */
    padZero(num) {
      return num < 10 ? `0${num}` : num;
    }
  }
};
</script>

<style scoped>
.status-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f5f5f5;
}

.status-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1f2d3d;
}

.refresh-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.refresh-btn {
  color: #409eff;
  font-size: 12px;
  padding: 4px 8px;
}

.refresh-btn:hover {
  color: #66b1ff;
  background-color: #e6f4ff;
}

.refresh-time {
  font-size: 12px;
  color: #8392a5;
}

.status-content {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.status-indicator {
  display: flex;
  align-items: center;
  margin-right: 30px;
}

.indicator-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 10px;
  transition: all 0.3s ease;
}

.indicator-dot.running {
  background-color: #52c41a;
  box-shadow: 0 0 10px rgba(82, 196, 26, 0.5);
}

.indicator-dot.stopped {
  background-color: #f5222d;
  box-shadow: 0 0 10px rgba(245, 34, 45, 0.5);
}

.status-text {
  font-size: 24px;
  font-weight: 500;
  color: #1f2d3d;
}

.operation-buttons {
  margin-left: 20px;
}

.operation-buttons .el-button {
  margin-right: 15px;
  width: 120px;
  height: 40px;
  font-size: 14px;
}

.status-log {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.status-log h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #4e5969;
}

.status-log pre {
  margin: 0;
  padding: 10px;
  background-color: #1f2d3d;
  color: #e0e0e0;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
}

/* 新增：GitHub 检测相关样式 */
.github-content {
  margin-top: 10px;
}

.detection-methods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.method-card {
  border: 1px solid #e6e6e6;
  border-radius: 6px;
  padding: 16px;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.method-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #d1d1d1;
}

.method-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.method-header h4 {
  margin: 0;
  font-size: 14px;
  color: #1f2d3d;
}

.method-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-waiting {
  background-color: #f5f5f5;
  color: #8c8c8c;
}

.status-testing {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-success {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-error {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.method-desc {
  margin-bottom: 16px;
}

.method-desc p {
  margin: 4px 0;
  font-size: 12px;
  color: #666;
}

.desc-detail {
  color: #999 !important;
  font-size: 11px !important;
}

.method-action {
  text-align: center;
}

.detection-result {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.detection-result h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #4e5969;
}

.detection-result pre {
  margin: 0;
  padding: 10px;
  background-color: #1f2d3d;
  color: #e0e0e0;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detection-methods {
    grid-template-columns: 1fr;
  }

  .status-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-indicator {
    margin-bottom: 15px;
    margin-right: 0;
  }

  .operation-buttons {
    margin-left: 0;
  }
}
</style>