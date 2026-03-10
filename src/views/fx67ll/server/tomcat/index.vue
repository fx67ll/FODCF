<template>
  <div class="app-container">
    <!-- Tomcat 服务管理卡片 -->
    <div class="status-card">
      <div class="status-header">
        <h2>Tomcat 服务管理</h2>
        <!-- 手动刷新按钮及最后刷新时间显示 -->
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
          <!-- 状态指示灯，根据 status 动态添加 running 或 stopped 类 -->
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

    <!-- 系统内存信息卡片 -->
    <div class="status-card">
      <div class="status-header">
        <h2>系统内存信息</h2>
        <div class="refresh-container">
          <el-button type="text" icon="el-icon-refresh" @click="queryStatus" :loading="isRefreshing" class="refresh-btn">
            手动刷新
          </el-button>
          <span class="refresh-time">最后更新: {{ lastRefreshTime }}</span>
        </div>
      </div>

      <div class="memory-grid">
        <div class="memory-item total-memory">
          <div class="memory-label">总内存</div>
          <div class="memory-value">{{ formatMemory(memoryInfo.totalMemoryMb) }} MB</div>
          <div class="memory-progress">
            <el-progress :percentage="100" :show-text="false" status="success"></el-progress>
          </div>
        </div>
        <div class="memory-item used-memory">
          <div class="memory-label">已用内存</div>
          <div class="memory-value">{{ formatMemory(memoryInfo.usedMemoryMb) }} MB</div>
          <div class="memory-progress">
            <el-progress :percentage="(memoryInfo.usedMemoryMb / memoryInfo.totalMemoryMb * 100) || 0" :show-text="false" status="exception"></el-progress>
          </div>
        </div>
        <div class="memory-item available-memory">
          <div class="memory-label">可用内存</div>
          <div class="memory-value">{{ formatMemory(memoryInfo.availableMemoryMb) }} MB</div>
          <div class="memory-progress">
            <el-progress :percentage="(memoryInfo.availableMemoryMb / memoryInfo.totalMemoryMb * 100) || 0" :show-text="false" status="success"></el-progress>
          </div>
        </div>
        <div class="memory-item tomcat-memory">
          <div class="memory-label">Tomcat占用</div>
          <div class="memory-value">{{ formatMemory(memoryInfo.tomcatResidentMemoryMb) }} MB</div>
          <div class="memory-progress">
            <el-progress :percentage="(memoryInfo.tomcatResidentMemoryMb / memoryInfo.totalMemoryMb * 100) || 0" :show-text="false" status="warning"></el-progress>
          </div>
        </div>
      </div>

      <div class="cache-clear-section">
        <el-button type="warning" icon="el-icon-delete" @click="handleClearCache" :loading="clearingCache">
          清理系统缓存
        </el-button>
        <span class="cache-tip">执行 sync; echo 3 > /proc/sys/vm/drop_caches 释放内存缓存</span>
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
          <!-- TCP 网络层检测卡片 -->
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

          <!-- HTTP 应用层检测卡片 -->
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

    <!-- 常用服务快速访问卡片 -->
    <div class="status-card">
      <div class="status-header">
        <h2>常用服务快速访问</h2>
        <div class="refresh-container">
          <span class="refresh-time">快捷入口</span>
        </div>
      </div>

      <div class="service-grid">
        <!-- Jenkins 服务入口卡片 -->
        <div class="service-item  service-item-jenkins" @click="goToJenkins">
          <div class="service-icon jenkins-icon">
            <i class="el-icon-s-promotion"></i>
          </div>
          <div class="service-info">
            <h4>Jenkins 服务</h4>
            <p>持续集成与部署平台</p>
            <div class="service-link">run.fx67ll.com/jenkins</div>
          </div>
          <div class="service-action">
            <el-button type="text" icon="el-icon-right" class="goto-btn goto-btn-jenkins"></el-button>
          </div>
        </div>

        <!-- 宝塔面板入口卡片 -->
        <div class="service-item service-item-baota" @click="goToBaota">
          <div class="service-icon baota-icon">
            <i class="el-icon-monitor"></i>
          </div>
          <div class="service-info">
            <h4>宝塔面板</h4>
            <p>服务器运维管理</p>
            <div class="service-link">baota.fx67ll.com</div>
          </div>
          <div class="service-action">
            <el-button type="text" icon="el-icon-right" class="goto-btn goto-btn-baota"></el-button>
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
/**
 * Tomcat 服务管理组件
 * 提供 Tomcat 服务的启动/停止、状态监控、内存信息展示、GitHub连通性检测、常用服务快速访问等功能
 */
import {
  getTomcatStatus,
  startTomcat,
  stopTomcat,
  testConnectToGithubByTcp,
  testConnectToGithubByHttp,
  clearSystemCache
} from "@/api/fx67ll/server/tomcat";

export default {
  name: "TomcatManager",
  data() {
    return {
      // Tomcat 服务状态文本，如“运行中”、“已停止”、“加载中...”、“未知”
      status: "加载中...",
      // 内存信息对象，包含各项内存指标（单位：MB）
      memoryInfo: {
        totalMemoryMb: 0,           // 系统总内存
        availableMemoryMb: 0,       // 可用内存
        usedMemoryMb: 0,            // 已用内存
        tomcatResidentMemoryMb: 0    // Tomcat 进程常驻内存（RSS）
      },
      // 最后刷新时间（格式化后的字符串）
      lastRefreshTime: "",
      // 操作日志文本（启动/停止操作时记录）
      logInfo: "",
      // 是否正在执行启动/停止操作（用于禁用按钮）
      isOperating: false,
      // 自动刷新定时器句柄
      refreshInterval: null,
      // 手动刷新时的加载状态
      isRefreshing: false,

      // GitHub 检测相关状态
      tcpStatus: "waiting",          // TCP检测状态：waiting, testing, success, error
      httpStatus: "waiting",         // HTTP检测状态：waiting, testing, success, error
      testingTcp: false,              // TCP检测进行中标志
      testingHttp: false,             // HTTP检测进行中标志
      githubLogInfo: "",              // GitHub检测结果日志
      lastGithubTestTime: "",         // 最后一次GitHub检测时间
      isRefreshingGithub: false,      // 重置GitHub检测按钮的加载状态

      // 清理缓存操作状态
      clearingCache: false
    };
  },
  created() {
    // 组件创建后立即查询一次 Tomcat 状态和内存信息
    this.queryStatus();

    // 设置定时器，每10秒自动刷新一次状态（保持数据最新）
    this.refreshInterval = setInterval(() => {
      this.queryStatus();
    }, 10000);
  },
  beforeDestroy() {
    // 组件销毁前清除定时器，防止内存泄漏
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    /**
     * 手动刷新 Tomcat 状态
     * 设置加载状态，调用 queryStatus，完成后取消加载状态
     */
    handleRefresh() {
      this.isRefreshing = true;
      this.queryStatus().finally(() => {
        this.isRefreshing = false;
      });
    },

    /**
     * 查询 Tomcat 状态和内存信息
     * 调用后端接口 getTomcatStatus，更新 status、memoryInfo，并记录刷新时间
     * @returns {Promise} 接口调用 Promise
     */
    queryStatus() {
      return getTomcatStatus().then(response => {
        const data = response.data || {};
        this.status = data.status || "未知";
        this.memoryInfo = data.memoryInfo || {
          totalMemoryMb: 0,
          availableMemoryMb: 0,
          usedMemoryMb: 0,
          tomcatResidentMemoryMb: 0
        };
        this.lastRefreshTime = this.formatDateTime(new Date());
      }).catch(error => {
        this.$message.error("查询状态失败: " + (error.msg || error.message));
        this.status = "未知";
      });
    },

    /**
     * 启动 Tomcat 服务
     * 弹出确认对话框，调用 startTomcat 接口，更新操作日志，并轮询状态确保更新
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
          // 启动后立即查询一次状态，然后等待3秒再查一次（确保服务完全启动）
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
     * 停止 Tomcat 服务
     * 弹出警告对话框，调用 stopTomcat 接口，更新操作日志，并轮询状态确保更新
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
          // 停止后立即查询一次状态，然后等待3秒再查一次（确保服务完全停止）
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
     * 清理系统缓存
     * 弹出警告对话框，调用 clearSystemCache 接口，成功后刷新内存信息
     */
    handleClearCache() {
      this.$confirm('清理系统缓存将释放被占用的内存，但可能导致短时间内磁盘IO升高。确定继续吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.clearingCache = true;
        clearSystemCache().then(response => {
          this.$message.success(response.msg || '缓存清理成功');
          this.queryStatus(); // 刷新内存信息
        }).catch(error => {
          this.$message.error(error.msg || '缓存清理失败');
        }).finally(() => {
          this.clearingCache = false;
        });
      }).catch(() => {
        this.$message.info('缓存清理操作失败，请联系管理员！');
      });
    },

    /**
     * 格式化内存数值，保留两位小数
     * @param {number} value 原始内存数值
     * @returns {string} 格式化后的字符串（保留两位小数）
     */
    formatMemory(value) {
      if (value === undefined || value === null || isNaN(value)) return '0.00';
      return Number(value).toFixed(2);
    },

    /**
     * 手动重置 GitHub 检测状态（清除之前的检测结果）
     */
    handleRefreshGithub() {
      this.isRefreshingGithub = true;
      // 重置状态为等待检测
      this.tcpStatus = "waiting";
      this.httpStatus = "waiting";
      this.githubLogInfo = "";
      setTimeout(() => {
        this.isRefreshingGithub = false;
      }, 500);
    },

    /**
     * 测试 GitHub TCP 连通性（仅网络层）
     * 调用 testConnectToGithubByTcp 接口，更新状态和日志
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
     * 测试 GitHub HTTP 连通性（包括 SSL 握手）
     * 调用 testConnectToGithubByHttp 接口，更新状态和日志
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
     * 根据状态获取对应的 CSS 类名（用于状态标签样式）
     * @param {string} status 状态值（waiting, testing, success, error）
     * @returns {string} 对应的 CSS 类名
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
     * 根据状态获取显示文本
     * @param {string} status 状态值（waiting, testing, success, error）
     * @returns {string} 对应的中文文本
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
     * 格式化日期时间为字符串 "YYYY-MM-DD HH:mm:ss"
     * @param {Date} date 日期对象
     * @returns {string} 格式化后的日期字符串
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
     * 补零函数，将数字补成两位字符串（如 5 -> "05"）
     * @param {number} num 数字
     * @returns {string} 补零后的字符串
     */
    padZero(num) {
      return num < 10 ? `0${num}` : num;
    },

    /**
     * 跳转到 Jenkins 服务（新窗口打开）
     */
    goToJenkins() {
      window.open('https://run.fx67ll.com/jenkins', '_blank');
    },

    /**
     * 跳转到宝塔面板（新窗口打开）
     */
    goToBaota() {
      window.open('https://baota.fx67ll.com', '_blank');
    },
  }
};
</script>

<style scoped>
/* 整体卡片样式 */
.status-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

/* 卡片头部：标题和刷新区域布局 */
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

/* 刷新按钮区域 */
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

/* 卡片内容区：状态指示器和操作按钮 */
.status-content {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

/* 状态指示灯和文本 */
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

/* 操作日志显示区域 */
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

/* 内存信息卡片样式 */
.memory-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 20px 0;
}

.memory-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid;
  transition: all 0.3s;
}

.memory-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 不同内存项左侧边框颜色 */
.total-memory {
  border-left-color: #409eff;
}
.total-memory .memory-label { color: #409eff; }

.used-memory {
  border-left-color: #f56c6c;
}
.used-memory .memory-label { color: #f56c6c; }

.available-memory {
  border-left-color: #67c23a;
}
.available-memory .memory-label { color: #67c23a; }

.tomcat-memory {
  border-left-color: #e6a23c;
}
.tomcat-memory .memory-label { color: #e6a23c; }

.memory-label {
  font-size: 14px;
  margin-bottom: 8px;
}

.memory-value {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
}

.memory-progress {
  margin-top: 8px;
}

/* 清理缓存区域 */
.cache-clear-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #e6e6e6;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.cache-tip {
  font-size: 12px;
  color: #8392a5;
  background: #f5f7fa;
  padding: 4px 10px;
  border-radius: 12px;
}

/* GitHub 检测卡片样式 */
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

/* 状态标签样式 */
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

/* GitHub 检测结果区域 */
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

/* 服务快速访问卡片样式 */
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

/* Jenkins 卡片 hover 效果 */
.service-item-jenkins:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(46, 204, 113, 0.15);
  border-color: #eb5656;
  background: linear-gradient(135deg, #fee9e9 0%, #f8dddd 100%);
}

.service-item-jenkins:hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #eb5656, #FAB6B6);
}

/* 宝塔卡片 hover 效果 */
.service-item-baota:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(46, 204, 113, 0.15);
  border-color: #2ECC71;
  background: linear-gradient(135deg, #f0fff7 0%, #e6ffe6 100%);
}

.service-item-baota:hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #2ECC71, #58D68D);
}

/* 服务图标样式 */
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
  background: linear-gradient(135deg, #eb5656 0%, #FAB6B6 100%);
  box-shadow: 0 8px 32px rgba(250, 182, 182, 0.6);
  position: relative;
  overflow: hidden;
}

/* 动态光效动画 */
.jenkins-icon::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(250, 182, 182, 0.2), transparent);
  animation: shine 3s linear infinite;
}

.baota-icon {
  background: linear-gradient(135deg, #2ECC71 0%, #51c468 100%);
  box-shadow: 0 8px 32px rgba(81, 196, 127, 0.6);
  position: relative;
  overflow: hidden;
}

/* 旋转纹理动画 */
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

.goto-btn-jenkins {
  font-size: 16px;
  color: #FAB6B6;
  padding: 8px;
  transition: transform 0.3s ease;
}

.goto-btn-baota {
  font-size: 16px;
  color: #2ECC71;
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

/* 响应式设计：小屏幕下调整布局 */
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

  .memory-grid {
    grid-template-columns: 1fr;
  }

  .cache-clear-section {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>