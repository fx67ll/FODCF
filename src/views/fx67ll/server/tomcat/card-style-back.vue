<template>
  <div class="app-container">
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
export default {
  name: "TomcatManager",
  methods: {
    goToJenkins() {
      window.open('https://run.fx67ll.com/jenkins', '_blank');
    },
    goToBaota() {
      window.open('https://baota.fx67ll.com', '_blank');
    },
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

.refresh-time {
  font-size: 12px;
  color: #8392a5;
}

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

.service-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(46, 204, 113, 0.15);
  border-color: #2ECC71;
  background: linear-gradient(135deg, #f0fff7 0%, #e6ffe6 100%);
}

.service-item:hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #2ECC71, #58D68D);
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

.goto-btn {
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

.tip-text {
  font-size: 12px;
  color: #8392a5;
  font-style: italic;
}

@media (max-width: 768px) {
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