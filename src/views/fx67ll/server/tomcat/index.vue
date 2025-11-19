<template>
  <div class="app-container">
    <div class="status-card">
      <div class="status-header">
        <h2>Tomcat 服务管理</h2>
        <!-- 新增主动刷新按钮 -->
        <div class="refresh-container">
          <el-button 
            type="text" 
            icon="el-icon-refresh" 
            @click="handleRefresh"
            :loading="isRefreshing"
            class="refresh-btn"
          >
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
          <el-button 
            type="success" 
            icon="el-icon-play" 
            @click="startTomcat"
            :disabled="status === '运行中' || isOperating"
          >
            启动服务
          </el-button>
          <el-button 
            type="danger" 
            icon="el-icon-stop" 
            @click="stopTomcat"
            :disabled="status === '已停止' || isOperating"
          >
            停止服务
          </el-button>
        </div>
      </div>
      
      <div class="status-log" v-if="logInfo">
        <h3>操作日志</h3>
        <pre>{{ logInfo }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import { getTomcatStatus, startTomcat, stopTomcat } from "@/api/fx67ll/server/tomcat";

export default {
  name: "TomcatManager",
  data() {
    return {
      status: "加载中...",
      lastRefreshTime: "",
      logInfo: "",
      isOperating: false,
      refreshInterval: null,
      isRefreshing: false // 新增：刷新按钮加载状态
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
     * 手动刷新状态（新增方法）
     */
    handleRefresh() {
      this.isRefreshing = true;
      this.queryStatus().finally(() => {
        this.isRefreshing = false; // 无论成功失败，都关闭加载状态
      });
    },
    
    /**
     * 查询Tomcat状态
     */
    queryStatus() {
      return getTomcatStatus().then(response => { // 新增return，用于finally捕获
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

/* 新增：刷新容器样式 */
.refresh-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 新增：刷新按钮样式 */
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
</style>