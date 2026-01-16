<template>
  <div class="app-container">
    <!-- Tomcat 服务管理卡片 -->
    <div class="status-card">
      <div class="status-header">
        <h2>Tomcat 服务管理</h2>
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

    <!-- GitHub 连接状态检测卡片 -->
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


    <!-- 新增：常用服务快速访问卡片 -->
    <div class="status-card">
      <div class="status-header">
        <h2>常用服务快速访问</h2>
        <div class="refresh-container">
          <span class="refresh-time">快捷入口</span>
        </div>
      </div>

      <div class="service-grid">
        <div class="service-item" @click="goToJenkins">
          <div class="service-icon jenkins-icon">
            <i class="el-icon-s-promotion"></i>
          </div>
          <div class="service-info">
            <h4>Jenkins 服务</h4>
            <p>持续集成与部署平台</p>
            <div class="service-link">run.fx67ll.com/jenkins</div>
          </div>
          <div class="service-action">
            <el-button type="text" icon="el-icon-right" class="goto-btn"></el-button>
          </div>
        </div>

        <div class="service-item" @click="goToBaota">
          <div class="service-icon baota-icon">
            <i class="el-icon-monitor"></i>
          </div>
          <div class="service-info">
            <h4>宝塔面板</h4>
            <p>服务器运维管理</p>
            <div class="service-link">baota.fx67ll.com</div>
          </div>
          <div class="service-action">
            <el-button type="text" icon="el-icon-right" class="goto-btn"></el-button>
          </div>
        </div>
      </div>

      <div class="service-footer">
        <span class="tip-text">点击上方卡片快速访问对应服务</span>
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
     * 跳转到 Jenkins 服务
     */
    goToJenkins() {
      window.open('https://run.fx67ll.com/jenkins', '_blank');
    },

    /**
     * 跳转到宝塔面板
     */
    goToBaota() {
      window.open('https://baota.fx67ll.com', '_blank');
    },

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
.app-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 24px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.status-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 18px;
  border-bottom: 1px solid #f0f0f0;
}

.status-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1f2d3d;
  font-weight: 600;
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
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  color: #66b1ff;
  background-color: #e6f4ff;
  border-radius: 4px;
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
  margin-right: 12px;
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
  font-weight: 600;
  color: #1f2d3d;
}

.operation-buttons {
  display: flex;
  gap: 15px;
  margin-left: 20px;
}

.operation-buttons .el-button {
  min-width: 120px;
  height: 40px;
  font-size: 14px;
  border-radius: 6px;
  font-weight: 500;
}

.status-log {
  margin-top: 24px;
  padding: 18px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 8px;
  border: 1px solid #e6e6e6;
}

.status-log h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #4e5969;
  font-weight: 600;
}

.status-log pre {
  margin: 0;
  padding: 14px;
  background-color: #1f2d3d;
  color: #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
}

/* 新增：服务快速访问卡片样式 */
.service-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin: 20px 0;
}

.service-item {
  display: flex;
  align-items: center;
  padding: 18px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
  border-radius: 10px;
  border: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* 修改：hover 效果改为绿色系 */
.service-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(46, 204, 113, 0.15);
  /* 绿色阴影 */
  border-color: #2ECC71;
  /* 主题色边框 */
  background: linear-gradient(135deg, #f0fff7 0%, #e6ffe6 100%);
  /* 淡绿色渐变背景 */
}

/* 修改：hover 顶部渐变条改为绿色系 */
.service-item:hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #2ECC71, #58D68D);
  /* 绿色渐变 */
}

.service-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 18px;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
}

.jenkins-icon {
  background: linear-gradient(135deg, #1a1a1a 0%, #404040 100%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
}

.jenkins-icon::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shine 3s linear infinite;
}

.baota-icon {
  background: linear-gradient(135deg, #2ECC71 0%, #20a53a 100%);
  box-shadow: 0 8px 32px rgba(0, 255, 127, 0.6);
  position: relative;
  overflow: hidden;
}

.baota-icon::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-conic-gradient(from 0deg,
      transparent 0deg 10deg,
      rgba(0, 255, 127, 0.2) 10deg 20deg);
  animation: rotate 15s linear infinite;
}

@keyframes shine {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }

  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.service-info {
  flex: 1;
}

.service-info h4 {
  margin: 0 0 6px 0;
  font-size: 16px;
  color: #1f2d3d;
  font-weight: 600;
}

.service-info p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #666;
}

.service-link {
  font-size: 11px;
  color: #8392a5;
  background: rgba(131, 146, 165, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
}

.service-action {
  margin-left: 12px;
}

/* 修改：跳转图标颜色改为主题色 */
.goto-btn {
  font-size: 16px;
  color: #2ECC71;
  /* 主题色 */
  padding: 8px;
  transition: transform 0.3s ease;
}

.service-item:hover .goto-btn {
  transform: translateX(5px);
}

.service-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.tip-text {
  font-size: 12px;
  color: #8392a5;
  font-style: italic;
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
  border-radius: 10px;
  padding: 20px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  transition: all 0.3s ease;
}

/* 修改：method-card hover 效果改为绿色系边框和阴影 */
.method-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #d1d1d1;
}

.method-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.method-header h4 {
  margin: 0;
  font-size: 15px;
  color: #1f2d3d;
  font-weight: 600;
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
  margin-bottom: 20px;
}

.method-desc p {
  margin: 6px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.desc-detail {
  color: #999 !important;
  font-size: 12px !important;
}

.method-action {
  text-align: center;
}

.method-action .el-button {
  width: 100%;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.detection-result {
  margin-top: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 8px;
  border: 1px solid #e6e6e6;
}

.detection-result h3 {
  margin: 0 0 14px 0;
  font-size: 15px;
  color: #4e5969;
  font-weight: 600;
}

.detection-result pre {
  margin: 0;
  padding: 16px;
  background-color: #1f2d3d;
  color: #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .operation-buttons {
    gap: 12px;
  }

  .operation-buttons .el-button {
    min-width: 110px;
  }
}

@media (max-width: 768px) {
  .detection-methods {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .status-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .status-indicator {
    margin-bottom: 0;
    margin-right: 0;
  }

  .operation-buttons {
    margin-left: 0;
    width: 100%;
    justify-content: flex-start;
  }

  .service-grid {
    gap: 12px;
  }

  .service-item {
    padding: 16px;
  }

  .service-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
    margin-right: 16px;
  }
}

@media (max-width: 576px) {
  .operation-buttons {
    flex-direction: column;
    gap: 10px;
  }

  .operation-buttons .el-button {
    width: 100%;
  }

  .status-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .refresh-container {
    align-self: stretch;
    justify-content: space-between;
  }

  .service-item {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }

  .service-icon {
    margin-right: 0;
    margin-bottom: 16px;
  }

  .service-info {
    margin-bottom: 16px;
  }

  .service-action {
    margin-left: 0;
    position: absolute;
    right: 16px;
    top: 16px;
  }
}
</style>