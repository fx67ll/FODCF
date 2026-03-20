<template>
    <div class="app-container">
        <!-- 顶部标签页导航 -->
        <el-tabs v-model="activeTab" type="border-card" class="main-tabs">

            <!-- 1. 赛季管理 -->
            <el-tab-pane label="赛季管理" name="season">
                <div class="top-btn-group">
                    <el-button type="primary" icon="el-icon-plus" @click="openSeasonModal()">新增赛季</el-button>
                </div>
                <el-table :data="seasonList" border stripe v-loading="seasonLoading">
                    <el-table-column prop="seasonName" label="赛季名称"></el-table-column>
                    <el-table-column prop="seasonCode" label="赛季编码" width="180"></el-table-column>
                    <el-table-column prop="seasonStartDate" label="开始日期" width="120"></el-table-column>
                    <el-table-column prop="seasonEndDate" label="结束日期" width="120"></el-table-column>
                    <el-table-column prop="seasonStatus" label="状态" width="100">
                        <template slot-scope="scope">
                            <el-tag :type="scope.row.seasonStatus === '0' ? 'success' : 'info'">
                                {{ scope.row.seasonStatus === '0' ? '进行中' : '已结束' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="180" align="center">
                        <template slot-scope="scope">
                            <el-button type="text" size="small" @click="openSeasonModal(scope.row)">编辑</el-button>
                            <el-button type="text" size="small" class="danger-btn"
                                @click="handleDeleteSeason(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>

            <!-- 2. 比赛管理 -->
            <el-tab-pane label="比赛管理" name="match">
                <div class="top-btn-group">
                    <el-button type="primary" icon="el-icon-plus" @click="openMatchModal()">新增比赛</el-button>
                </div>
                <el-table :data="matchList" border stripe v-loading="matchLoading">
                    <el-table-column prop="matchInfo" label="对阵双方" width="220">
                        <template slot-scope="scope">
                            <b>{{ scope.row.homeTeamName }}</b> vs <b>{{ scope.row.awayTeamName }}</b>
                        </template>
                    </el-table-column>
                    <el-table-column prop="seasonName" label="所属赛季"></el-table-column>
                    <el-table-column prop="matchTime" label="比赛时间" width="160"></el-table-column>
                    <el-table-column prop="matchVenue" label="场地"></el-table-column>
                    <el-table-column label="AI分析" width="100" align="center">
                        <template slot-scope="scope">
                            <el-tag type="warning">{{ scope.row.analysisCount || 0 }} 次</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200" align="center">
                        <template slot-scope="scope">
                            <el-button type="text" size="small" icon="el-icon-magic-stick"
                                @click="goToAnalysis(scope.row)">AI分析</el-button>
                            <el-button type="text" size="small" @click="openMatchModal(scope.row)">编辑</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>

            <!-- 3. AI 分析中心 -->
            <el-tab-pane label="AI分析中心" name="analysis">
                <el-card class="box-card">
                    <div slot="header" class="clearfix">
                        <span>智能分析控制台</span>
                    </div>
                    <el-form :model="analysisForm" label-width="100px">
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="选择比赛">
                                    <el-select v-model="analysisForm.matchId" placeholder="请先选择一场比赛"
                                        style="width: 100%;" filterable>
                                        <el-option v-for="item in matchList" :key="item.matchId"
                                            :label="item.homeTeamName + ' vs ' + item.awayTeamName"
                                            :value="item.matchId"></el-option>
                                    </el-select>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="选择模板">
                                    <el-select v-model="analysisForm.promptId" placeholder="选择Prompt模板"
                                        style="width: 100%;">
                                        <el-option v-for="item in promptList" :key="item.promptId"
                                            :label="item.promptName" :value="item.promptId"></el-option>
                                    </el-select>
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-form-item>
                            <el-button type="primary" :loading="analyzing" @click="startAnalysis" size="medium"
                                icon="el-icon-cpu">立即执行分析</el-button>
                        </el-form-item>
                    </el-form>

                    <div v-if="rawAnalysisResult" class="result-box">
                        <div class="header-title">
                            <i class="el-icon-document"></i> AI 原始响应 (JSON)
                        </div>
                        <pre class="json-pre">{{ JSON.stringify(rawAnalysisResult, null, 2) }}</pre>
                    </div>
                </el-card>
            </el-tab-pane>

            <!-- 4. 评分展示 -->
            <el-tab-pane label="评分看板" name="score">
                <div class="top-btn-group">
                    <el-select v-model="selectedMatchForScore" placeholder="选择比赛查看评分" style="width: 400px;"
                        @change="loadScore">
                        <el-option v-for="item in matchList" :key="item.matchId"
                            :label="item.homeTeamName + ' vs ' + item.awayTeamName" :value="item.matchId"></el-option>
                    </el-select>
                </div>

                <div v-if="scoreData" class="score-board">
                    <el-row :gutter="20">
                        <!-- 主队卡片 -->
                        <el-col :span="10">
                            <el-card shadow="hover" class="team-card home-card">
                                <div class="team-header">
                                    <h2>{{ scoreData.homeTeamName || '主队' }}</h2>
                                    <div class="total-score">{{ scoreData.homeTotalScore }}<span class="unit">分</span>
                                    </div>
                                </div>
                                <div class="score-items">
                                    <div class="score-item">
                                        <span class="label">进攻能力</span>
                                        <el-progress :percentage="scoreData.homeAttackScore"
                                            :color="getColor(scoreData.homeAttackScore)"></el-progress>
                                    </div>
                                    <div class="score-item">
                                        <span class="label">防守能力</span>
                                        <el-progress :percentage="scoreData.homeDefenseScore"
                                            :color="getColor(scoreData.homeDefenseScore)"></el-progress>
                                    </div>
                                    <div class="score-item">
                                        <span class="label">健康状况</span>
                                        <el-progress :percentage="scoreData.homeInjuryScore"
                                            :color="getColor(scoreData.homeInjuryScore)"></el-progress>
                                    </div>
                                    <div class="score-item">
                                        <span class="label">历史交锋</span>
                                        <el-progress :percentage="scoreData.homeHistoryScore"
                                            :color="getColor(scoreData.homeHistoryScore)"></el-progress>
                                    </div>
                                </div>
                            </el-card>
                        </el-col>

                        <!-- 中间预测结果 -->
                        <el-col :span="4">
                            <div class="vs-box">
                                <div class="prediction-result">
                                    <div class="title">预测结果</div>
                                    <el-tag v-if="scoreData.predictedResult === '0'" type="success"
                                        size="medium">主队胜</el-tag>
                                    <el-tag v-else-if="scoreData.predictedResult === '1'" type="warning"
                                        size="medium">平局</el-tag>
                                    <el-tag v-else type="danger" size="medium">客队胜</el-tag>

                                    <div class="confidence">
                                        <span>置信度</span>
                                        <el-progress :percentage="scoreData.predictedConfidence" :stroke-width="15"
                                            style="margin-top: 10px;"></el-progress>
                                    </div>
                                </div>
                            </div>
                        </el-col>

                        <!-- 客队卡片 -->
                        <el-col :span="10">
                            <el-card shadow="hover" class="team-card away-card">
                                <div class="team-header">
                                    <h2>{{ scoreData.awayTeamName || '客队' }}</h2>
                                    <div class="total-score">{{ scoreData.awayTotalScore }}<span class="unit">分</span>
                                    </div>
                                </div>
                                <div class="score-items">
                                    <div class="score-item">
                                        <span class="label">进攻能力</span>
                                        <el-progress :percentage="scoreData.awayAttackScore"
                                            :color="getColor(scoreData.awayAttackScore)"></el-progress>
                                    </div>
                                    <div class="score-item">
                                        <span class="label">防守能力</span>
                                        <el-progress :percentage="scoreData.awayDefenseScore"
                                            :color="getColor(scoreData.awayDefenseScore)"></el-progress>
                                    </div>
                                    <div class="score-item">
                                        <span class="label">健康状况</span>
                                        <el-progress :percentage="scoreData.awayInjuryScore"
                                            :color="getColor(scoreData.awayInjuryScore)"></el-progress>
                                    </div>
                                    <div class="score-item">
                                        <span class="label">历史交锋</span>
                                        <el-progress :percentage="scoreData.awayHistoryScore"
                                            :color="getColor(scoreData.awayHistoryScore)"></el-progress>
                                    </div>
                                </div>
                            </el-card>
                        </el-col>
                    </el-row>
                </div>
                <el-empty v-else description="请先在上方选择一场比赛"></el-empty>
            </el-tab-pane>
        </el-tabs>

        <!-- 赛季弹窗 -->
        <el-dialog :title="!seasonForm.seasonId ? '新增赛季' : '编辑赛季'" :visible.sync="seasonModalVisible" width="500px">
            <el-form ref="seasonFormRef" :model="seasonForm" :rules="rules.season" label-width="80px">
                <el-form-item label="赛季名称" prop="seasonName">
                    <el-input v-model="seasonForm.seasonName" placeholder="如：2025-2026赛季德甲"></el-input>
                </el-form-item>
                <el-form-item label="赛季编码" prop="seasonCode">
                    <el-input v-model="seasonForm.seasonCode" placeholder="如：2025-2026_Bundesliga"></el-input>
                </el-form-item>
                <el-form-item label="开始日期" prop="seasonStartDate">
                    <el-date-picker v-model="seasonForm.seasonStartDate" type="date" style="width: 100%;"
                        value-format="yyyy-MM-dd"></el-date-picker>
                </el-form-item>
                <el-form-item label="结束日期" prop="seasonEndDate">
                    <el-date-picker v-model="seasonForm.seasonEndDate" type="date" style="width: 100%;"
                        value-format="yyyy-MM-dd"></el-date-picker>
                </el-form-item>
                <el-form-item label="状态" prop="seasonStatus">
                    <el-select v-model="seasonForm.seasonStatus" style="width: 100%;">
                        <el-option label="未开始" value="2"></el-option>
                        <el-option label="进行中" value="0"></el-option>
                        <el-option label="已结束" value="1"></el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="seasonModalVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitSeason">确 定</el-button>
            </span>
        </el-dialog>

        <!-- 比赛弹窗 -->
        <el-dialog :title="!matchForm.matchId ? '新增比赛' : '编辑比赛'" :visible.sync="matchModalVisible" width="600px">
            <el-form ref="matchFormRef" :model="matchForm" :rules="rules.match" label-width="100px">
                <el-form-item label="所属赛季" prop="seasonId">
                    <el-select v-model="matchForm.seasonId" style="width: 100%;">
                        <el-option v-for="s in seasonList" :key="s.seasonId" :label="s.seasonName"
                            :value="s.seasonId"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="主队" prop="homeTeamId">
                    <el-select v-model="matchForm.homeTeamId" style="width: 100%;" filterable>
                        <el-option v-for="t in teamList" :key="t.teamId" :label="t.teamName"
                            :value="t.teamId"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="客队" prop="awayTeamId">
                    <el-select v-model="matchForm.awayTeamId" style="width: 100%;" filterable>
                        <el-option v-for="t in teamList" :key="t.teamId" :label="t.teamName"
                            :value="t.teamId"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="比赛时间" prop="matchTime">
                    <el-date-picker v-model="matchForm.matchTime" type="datetime" style="width: 100%;"
                        value-format="yyyy-MM-dd HH:mm:ss"></el-date-picker>
                </el-form-item>
                <el-form-item label="比赛场地" prop="matchVenue">
                    <el-input v-model="matchForm.matchVenue" placeholder="如：伊杜纳信号公园"></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="matchModalVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitMatch">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
export default {
    name: "DortmundAnalysis",
    data() {
        return {
            activeTab: 'season',
            // 模拟数据
            seasonList: [],
            matchList: [],
            teamList: [],
            promptList: [],

            // 状态控制
            seasonLoading: false,
            matchLoading: false,
            analyzing: false,
            seasonModalVisible: false,
            matchModalVisible: false,

            // 表单数据
            seasonForm: {},
            matchForm: {},
            analysisForm: {},
            selectedMatchForScore: null,

            // 结果数据
            rawAnalysisResult: null,
            scoreData: null,

            // 校验规则
            rules: {
                season: [
                    { seasonName: [{ required: true, message: '请输入赛季名称', trigger: 'blur' }] },
                    // ... 其他规则
                ],
                match: {
                    seasonId: [{ required: true, message: '请选择赛季', trigger: 'change' }],
                    homeTeamId: [{ required: true, message: '请选择主队', trigger: 'change' }],
                    // ...
                }
            }
        };
    },
    created() {
        this.initMockData(); // 初始化模拟数据
    },
    methods: {
        // --- 模拟数据初始化 (实际开发中请替换为 API 调用) ---
        initMockData() {
            this.teamList = [
                { teamId: 1, teamName: '多特蒙德', teamNameShort: '我横' },
                { teamId: 2, teamName: '拜仁慕尼黑', teamNameShort: '拜仁' },
                { teamId: 3, teamName: '勒沃库森', teamNameShort: '药厂' }
            ];
            this.seasonList = [
                { seasonId: 1, seasonName: '2025-2026赛季德甲联赛', seasonCode: '2025-2026_Bundesliga', seasonStartDate: '2025-08-15', seasonEndDate: '2026-05-18', seasonStatus: '0' }
            ];
            this.matchList = [
                {
                    matchId: 101,
                    seasonId: 1,
                    seasonName: '2025-2026赛季德甲联赛',
                    homeTeamId: 1, homeTeamName: '多特蒙德',
                    awayTeamId: 2, awayTeamName: '拜仁慕尼黑',
                    matchTime: '2025-10-26 21:30:00',
                    matchVenue: '伊杜纳信号公园球场',
                    analysisCount: 2
                }
            ];
            this.promptList = [
                { promptId: 1, promptName: '专业赛前技战术分析模板' },
                { promptId: 2, promptName: '球迷向趣味预测模板' }
            ];
        },

        // --- 赛季逻辑 ---
        openSeasonModal(row) {
            this.seasonForm = row ? Object.assign({}, row) : { seasonStatus: '2' };
            this.seasonModalVisible = true;
        },
        submitSeason() {
            this.$message.success("保存成功！");
            this.seasonModalVisible = false;
            // 实际开发中调用 API 后刷新列表
        },
        handleDeleteSeason(row) {
            this.$confirm('确定删除该赛季?', '提示', { type: 'warning' }).then(() => {
                this.$message.success('删除成功');
            });
        },

        // --- 比赛逻辑 ---
        openMatchModal(row) {
            this.matchForm = row ? Object.assign({}, row) : {};
            this.matchModalVisible = true;
        },
        submitMatch() {
            this.$message.success("保存比赛成功！");
            this.matchModalVisible = false;
        },
        // 一键跳转分析
        goToAnalysis(row) {
            this.activeTab = 'analysis';
            this.analysisForm.matchId = row.matchId;
            this.analysisForm.promptId = this.promptList[0].promptId; // 默认选第一个
        },

        // --- AI 分析逻辑 ---
        startAnalysis() {
            if (!this.analysisForm.matchId) return this.$message.warning('请先选择比赛');

            this.analyzing = true;
            this.rawAnalysisResult = null;

            // 模拟 API 延迟
            setTimeout(() => {
                // 模拟 AI 返回的原始 JSON
                this.rawAnalysisResult = {
                    model: "deepseek-v3",
                    analysis: "多特蒙德主场气势如虹，但拜仁近期状态更佳...",
                    suggested_bet: "让球平",
                    confidence: 0.78
                };

                // 模拟同时生成了评分数据 (实际是后端异步处理)
                this.$message.success("分析完成！正在跳转至评分看板...");
                this.analyzing = false;

                // 自动跳转并加载评分
                setTimeout(() => {
                    this.activeTab = 'score';
                    this.selectedMatchForScore = this.analysisForm.matchId;
                    this.loadScore();
                }, 800);

            }, 2000);
        },

        // --- 评分展示逻辑 ---
        loadScore() {
            if (!this.selectedMatchForScore) return;

            // 模拟从数据库取出的标准化评分
            const match = this.matchList.find(m => m.matchId === this.selectedMatchForScore);
            this.scoreData = {
                homeTeamName: match.homeTeamName,
                homeAttackScore: 85,
                homeDefenseScore: 72,
                homeInjuryScore: 90,
                homeHistoryScore: 60,
                homeTotalScore: 78.5,

                awayTeamName: match.awayTeamName,
                awayAttackScore: 92,
                awayDefenseScore: 88,
                awayInjuryScore: 85,
                awayHistoryScore: 95,
                awayTotalScore: 90.2,

                predictedResult: '2', // 客队胜
                predictedConfidence: 76
            };
        },

        // 辅助：进度条颜色
        getColor(val) {
            if (val > 90) return '#67C23A';
            if (val > 70) return '#E6A23C';
            return '#F56C6C';
        }
    }
};
</script>

<style lang="scss" scoped>
.app-container {
    padding: 20px;
    background-color: #f0f2f5;
    min-height: 100vh;
}

.top-btn-group {
    margin-bottom: 15px;
}

.main-tabs {
    background: #fff;

    ::v-deep .el-tabs__header {
        margin: 0;
        background-color: #fafafa;
    }
}

/* AI 分析区域 */
.box-card {
    margin-bottom: 20px;
}

.json-pre {
    background: #f4f4f5;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 13px;
    color: #606266;
}

/* 评分看板样式 */
.score-board {
    margin-top: 20px;
}

.team-card {
    text-align: center;
    border-top: 4px solid #409EFF;

    .team-header {
        margin-bottom: 20px;

        h2 {
            margin: 0;
            font-size: 24px;
            color: #303133;
        }

        .total-score {
            font-size: 48px;
            font-weight: bold;
            color: #409EFF;
            margin-top: 10px;

            .unit {
                font-size: 16px;
                color: #909399;
            }
        }
    }

    .score-item {
        margin-bottom: 20px;
        text-align: left;

        .label {
            display: inline-block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #606266;
        }
    }
}

.vs-box {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .prediction-result {
        text-align: center;
        padding: 20px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
        width: 100%;

        .title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #303133;
        }

        .confidence {
            margin-top: 20px;

            span {
                color: #909399;
            }
        }
    }
}

.danger-btn {
    color: #F56C6C;
}
</style>