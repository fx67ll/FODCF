<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="规则编号" prop="limitRuleId" v-if="isMoreQuery">
        <el-input v-model="queryParams.limitRuleId" type="number" min="1" step="1" placeholder="请输入规则编号" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <!-- 规则维度下拉框：1-模板，2-场景，3-分组，4-模型 -->
      <el-form-item label="规则维度" prop="limitRuleDimension" v-if="isMoreQuery">
        <el-select v-model="queryParams.limitRuleDimension" placeholder="请选择规则维度" clearable style="width: 100%">
          <el-option v-for="item in limitRuleDimensionOptions" :key="item.value" :label="item.label" :value="item.value"
            :enter-callback="handleQuery" />
        </el-select>
      </el-form-item>
      <el-form-item label="模板名称" prop="limitRuleTargetId" v-if="isMoreQuery && queryParams.limitRuleDimension === '1'">
        <common-enhanced-select ref="promptSelect" v-model="queryParams.promptId" valueKey="promptId"
          labelKey="promptName" :api-func="listTemplate" placeholder="请选择请求模板" :enter-callback="handleQuery" />
      </el-form-item>
      <el-form-item label="模版分组" prop="limitRuleTargetId" v-if="isMoreQuery && queryParams.limitRuleDimension === '2'">
        <common-enhanced-select ref="groupSelect" v-model="queryParams.groupId" valueKey="groupId" labelKey="groupName"
          :api-func="listGroup" placeholder="请选择模版分组" :enter-callback="handleQuery" />
      </el-form-item>
      <el-form-item label="模版场景" prop="limitRuleTargetId" v-if="isMoreQuery && queryParams.limitRuleDimension === '3'">
        <common-enhanced-select ref="sceneSelect" v-model="queryParams.sceneId" valueKey="sceneId" labelKey="sceneName"
          :api-func="listScene" placeholder="请选择模版场景" :enter-callback="handleQuery" />
      </el-form-item>
      <el-form-item label="绑定模型" prop="limitRuleTargetId" v-if="isMoreQuery && queryParams.limitRuleDimension === '4'">
        <common-enhanced-select ref="modelSelect" v-model="queryParams.modelId" valueKey="modelId" labelKey="modelName"
          :api-func="listModel" placeholder="请选择绑定模型" :enter-callback="handleQuery" />
      </el-form-item>
      <!-- 规则类型下拉框：1-流量控制，2-熔断保护 -->
      <el-form-item label="规则类型" prop="limitRuleType">
        <el-select v-model="queryParams.limitRuleType" placeholder="请选择规则类型" clearable style="width: 100%"
          :enter-callback="handleQuery">
          <el-option v-for="item in limitRuleTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <!-- 流控模式下拉框：D-直接拒绝，A-关联控制，L-链路流控 -->
      <el-form-item label="流控模式" prop="flowControlMode" v-if="isMoreQuery && queryParams.limitRuleType === '1'">
        <el-select v-model="queryParams.flowControlMode" placeholder="请选择流控模式" clearable style="width: 100%"
          :enter-callback="handleQuery">
          <el-option v-for="item in flowControlModeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <!-- 流控效果下拉框：F-快速失败，W-预热启动，Q-匀速排队 -->
      <el-form-item label="流控效果" prop="flowControlEffect" v-if="isMoreQuery && queryParams.limitRuleType === '1'">
        <el-select v-model="queryParams.flowControlEffect" placeholder="请选择流控效果" clearable style="width: 100%"
          :enter-callback="handleQuery">
          <el-option v-for="item in flowControlEffectOptions" :key="item.value" :label="item.label"
            :value="item.value" />
        </el-select>
      </el-form-item>
      <!-- 流控类型下拉框：Q-QPS阈值，C-并发线程数 -->
      <el-form-item label="流控类型" prop="flowRuleType" v-if="isMoreQuery && queryParams.limitRuleType === '1'">
        <el-select v-model="queryParams.flowRuleType" placeholder="请选择流控指标类型" clearable style="width: 100%"
          :enter-callback="handleQuery">
          <el-option v-for="item in flowRuleTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <!-- 熔断策略下拉框：S-慢调用比例，E-异常比例，N-异常数 -->
      <el-form-item label="熔断策略" prop="circuitStrategy" v-if="isMoreQuery && queryParams.limitRuleType === '2'">
        <el-select v-model="queryParams.circuitStrategy" placeholder="请选择熔断策略" clearable style="width: 100%"
          :enter-callback="handleQuery">
          <el-option v-for="item in circuitStrategyOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="规则状态" prop="limitRuleStatus">
        <el-select v-model="queryParams.limitRuleStatus" style="width: 100%" placeholder="请选择规则状态" clearable>
          <el-option v-for="dict in dict.type.sys_normal_disable" :key="dict.value" :label="dict.label"
            :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" v-if="isMoreQuery">
        <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable />
      </el-form-item>
      <el-form-item label="更新时间" v-if="isMoreQuery">
        <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable />
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
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
          v-hasPermi="['system:rule:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:rule:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:rule:remove']">删除</el-button>
      </el-col>
      <!-- <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:rule:export']">导出</el-button>
      </el-col> -->
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="ruleList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="规则编号" align="center" prop="limitRuleId" width="80" fixed="left" />
      <!-- 规则维度：1-模板，2-场景，3-分组，4-模型 -->
      <el-table-column label="规则维度" align="center" prop="limitRuleDimension" width="80" fixed="left">
        <template slot-scope="scope">
          {{ limitRuleDimensionMap[scope.row.limitRuleDimension] || scope.row.limitRuleDimension }}
        </template>
      </el-table-column>
      <el-table-column label="维度名称" align="center" prop="limitRuleTargetName" width="120" fixed="left" />
      <!-- 规则类型：1-流量控制，2-熔断保护 -->
      <el-table-column label="规则类型" align="center" prop="limitRuleType" width="100">
        <template slot-scope="scope">
          {{ limitRuleTypeMap[scope.row.limitRuleType] || scope.row.limitRuleType }}
        </template>
      </el-table-column>
      <!-- 流控模式：D-直接拒绝，A-关联控制，L-链路流控 -->
      <el-table-column label="流控模式" align="center" prop="flowControlMode" width="100">
        <template slot-scope="scope">
          {{ flowControlModeMap[scope.row.flowControlMode] || scope.row.flowControlMode }}
        </template>
      </el-table-column>
      <!-- 流控效果：F-快速失败，W-预热启动，Q-匀速排队 -->
      <el-table-column label="流控效果" align="center" prop="flowControlEffect" width="100">
        <template slot-scope="scope">
          {{ flowControlEffectMap[scope.row.flowControlEffect] || scope.row.flowControlEffect }}
        </template>
      </el-table-column>
      <!-- 流控指标类型：Q-QPS阈值，C-并发线程数 -->
      <el-table-column label="流控指标类型" align="center" prop="flowRuleType" width="120">
        <template slot-scope="scope">
          {{ flowRuleTypeMap[scope.row.flowRuleType] || scope.row.flowRuleType }}
        </template>
      </el-table-column>
      <el-table-column label="流控阈值" align="center" prop="flowThreshold" width="80" />
      <!-- 熔断策略：S-慢调用比例，E-异常比例，N-异常数 -->
      <el-table-column label="熔断策略" align="center" prop="circuitStrategy" width="110">
        <template slot-scope="scope">
          {{ circuitStrategyMap[scope.row.circuitStrategy] || scope.row.circuitStrategy }}
        </template>
      </el-table-column>
      <el-table-column label="熔断触发阈值" align="center" prop="circuitThreshold" width="120" />
      <el-table-column label="慢调用判定阈值" align="center" prop="circuitGrade" width="130" />
      <el-table-column label="熔断统计窗口时长" align="center" prop="circuitWindow" width="140" />
      <el-table-column label="熔断恢复超时时间" align="center" prop="circuitTimeout" width="140" />
      <el-table-column label="规则状态" align="center" prop="limitRuleStatus" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.limitRuleStatus" />
        </template>
      </el-table-column>
      <el-table-column label="规则备注" align="center" prop="limitRuleRemark" width="230" :show-overflow-tooltip="true" />
      <el-table-column label="记录创建者" align="center" prop="createBy" width="90" />
      <el-table-column label="记录创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="记录更新者" align="center" prop="updateBy" width="90" />
      <el-table-column label="记录更新时间" align="center" prop="updateTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="140">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['system:rule:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:rule:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改调用规则对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="900px" style="top: 60px"
      append-to-body>
      <el-form ref="form" :model="form" :rules="fullRules" :validate-on-rule-change="false" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <!-- 规则维度下拉框：1-模板，2-场景，3-分组，4-模型 -->
            <el-form-item label="规则维度" prop="limitRuleDimension">
              <el-select v-model="form.limitRuleDimension" placeholder="请选择规则维度" clearable style="width: 100%"
                :disabled="!isAdd">
                <el-option v-for="item in limitRuleDimensionOptions" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="请求模板" prop="limitRuleTargetId" v-if="form.limitRuleDimension === '1'">
              <common-enhanced-select ref="promptSelect" v-model="form.limitRuleTargetId" valueKey="promptId"
                labelKey="promptName" :api-func="listTemplate" placeholder="请选择请求模板" />
            </el-form-item>
            <el-form-item label="模版分组" prop="limitRuleTargetId" v-if="form.limitRuleDimension === '2'">
              <common-enhanced-select ref="groupSelect" v-model="form.limitRuleTargetId" valueKey="groupId"
                labelKey="groupName" :api-func="listGroup" placeholder="请选择模版分组" />
            </el-form-item>
            <el-form-item label="模版场景" prop="limitRuleTargetId" v-if="form.limitRuleDimension === '3'">
              <common-enhanced-select ref="sceneSelect" v-model="form.limitRuleTargetId" valueKey="sceneId"
                labelKey="sceneName" :api-func="listScene" placeholder="请选择模版场景" />
            </el-form-item>
            <el-form-item label="绑定模型" prop="limitRuleTargetId" v-if="form.limitRuleDimension === '4'">
              <common-enhanced-select ref="modelSelect" v-model="form.limitRuleTargetId" valueKey="modelId"
                labelKey="modelName" :api-func="listModel" placeholder="请选择绑定模型" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- 规则类型下拉框：1-流量控制，2-熔断保护 -->
            <el-form-item label="规则类型" prop="limitRuleType">
              <el-select v-model="form.limitRuleType" placeholder="请选择规则类型" clearable style="width: 100%"
                :disabled="!isAdd">
                <el-option v-for="item in limitRuleTypeOptions" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.limitRuleType === '1'">
            <!-- 流控模式下拉框：D-直接拒绝，A-关联控制，L-链路流控 -->
            <el-form-item label="流控模式" prop="flowControlMode">
              <el-select v-model="form.flowControlMode" placeholder="请选择流控模式" clearable style="width: 100%">
                <el-option v-for="item in flowControlModeOptions" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.limitRuleType === '1'">
            <!-- 流控效果下拉框：F-快速失败，W-预热启动，Q-匀速排队 -->
            <el-form-item label="流控效果" prop="flowControlEffect">
              <el-select v-model="form.flowControlEffect" placeholder="请选择流控效果" clearable style="width: 100%">
                <el-option v-for="item in flowControlEffectOptions" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.limitRuleType === '1'">
            <!-- 流控类型下拉框：Q-QPS阈值，C-并发线程数 -->
            <el-form-item label="流控指标类型" prop="flowRuleType" label-width="107px">
              <el-select v-model="form.flowRuleType" placeholder="请选择流控指标类型" clearable style="width: 100%">
                <el-option v-for="item in flowRuleTypeOptions" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.limitRuleType === '1'">
            <el-form-item label="流控阈值" prop="flowThreshold">
              <el-input v-model="form.flowThreshold" type="number" min="0" step="0.01"
                placeholder="请输入流控阈值(QPS或并发数，保留2位小数)" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.limitRuleType === '2'">
            <!-- 熔断策略下拉框：S-慢调用比例，E-异常比例，N-异常数 -->
            <el-form-item label="熔断策略" prop="circuitStrategy">
              <el-select v-model="form.circuitStrategy" placeholder="请选择熔断策略" clearable style="width: 100%">
                <el-option v-for="item in circuitStrategyOptions" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.limitRuleType === '2'">
            <el-form-item label="熔断触发阈值" prop="circuitThreshold" label-width="107px">
              <el-input v-model="form.circuitThreshold" type="number" min="0" placeholder="请输入熔断触发阈值" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.limitRuleType === '2'">
            <el-form-item label="慢调用判定阈值" prop="circuitGrade" label-width="122px">
              <el-input v-model="form.circuitGrade" type="number" min="0" step="1" placeholder="请输入慢调用判定阈值(毫秒数)" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.limitRuleType === '2'">
            <el-form-item label="熔断统计窗口时长" prop="circuitWindow" label-width="135px">
              <el-input v-model="form.circuitWindow" type="number" min="0" step="1" placeholder="请输入熔断统计窗口时长(毫秒数)" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.limitRuleType === '2'">
            <el-form-item label="熔断恢复超时时间" prop="circuitTimeout" label-width="135px">
              <el-input v-model="form.circuitTimeout" type="number" min="0" step="1" placeholder="请输入熔断恢复超时时间(毫秒数)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规则状态" prop="limitRuleStatus">
              <!-- <el-select v-model="form.limitRuleStatus" style="width: 100%" placeholder="请选择规则状态" clearable>
                <el-option v-for="dict in dict.type.sys_normal_disable" :key="dict.value" :label="dict.label"
                  :value="dict.value" />
              </el-select> -->
              <el-switch v-model="form.limitRuleStatus" active-value="0" inactive-value="2" />
            </el-form-item>
          </el-col>
          <el-col :span="form.limitRuleType === '1' ? 24 : 12">
            <el-form-item label="规则备注" prop="limitRuleRemark">
              <el-input v-model="form.limitRuleRemark" type="textarea" placeholder="请输入规则备注内容" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listRule, getRule, delRule, addRule, updateRule } from "@/api/fx67ll/ai/rule";
import { listTemplate } from "@/api/fx67ll/ai/template";
import { listGroup } from "@/api/fx67ll/ai/group";
import { listScene } from "@/api/fx67ll/ai/scene";
import { listModel } from "@/api/fx67ll/ai/model";

import { limitRuleDimensionOptions, limitRuleTypeOptions, flowControlModeOptions, flowControlEffectOptions, flowRuleTypeOptions, circuitStrategyOptions } from "@/utils/constant/fx67ll";
import { arrayToMap } from "@/utils/fx67ll/utils";

import CommonEnhancedSelect from "@/components/CommonEnhancedSelect/index";

export default {
  name: "Rule",
  dicts: ["sys_normal_disable"],
  components: { CommonEnhancedSelect },
  computed: {
    // 将选项数组转换为 { value: label } 的映射对象
    limitRuleDimensionMap() {
      return arrayToMap(this.limitRuleDimensionOptions);
    },
    limitRuleTypeMap() {
      return arrayToMap(this.limitRuleTypeOptions);
    },
    flowControlModeMap() {
      return arrayToMap(this.flowControlModeOptions);
    },
    flowControlEffectMap() {
      return arrayToMap(this.flowControlEffectOptions);
    },
    flowRuleTypeMap() {
      return arrayToMap(this.flowRuleTypeOptions);
    },
    circuitStrategyMap() {
      return arrayToMap(this.circuitStrategyOptions);
    },
    fullRules() {
      const base = { ...this.baseRules };
      if (this.form.limitRuleType === '1') {
        return { ...base, ...this.flowRules };
      } else if (this.form.limitRuleType === '2') {
        return { ...base, ...this.circuitRules };
      }
      return base;
    }
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 调用规则表格数据
      ruleList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 创建时间范围
      daterangeCreateTime: [],
      // 更新时间范围
      daterangeUpdateTime: [],
      // 是否使用高级搜索
      isMoreQuery: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        limitRuleId: null,
        limitRuleDimension: null,
        limitRuleTargetId: null,
        limitRuleType: null,
        flowControlMode: null,
        flowControlEffect: null,
        flowRuleType: null,
        flowThreshold: null,
        circuitStrategy: null,
        circuitThreshold: null,
        circuitGrade: null,
        circuitWindow: null,
        circuitTimeout: null,
        limitRuleStatus: null,
        limitRuleRemark: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 表单参数
      form: {},
      // 是否是新增
      isAdd: false,
      // 基础表单校验
      baseRules: {
        limitRuleDimension: [
          { required: true, message: "规则维度不能为空", trigger: "blur" }
        ],
        limitRuleTargetId: [
          { required: true, message: "规则维度目标编号不能为空", trigger: "blur" }
        ],
        limitRuleType: [
          { required: true, message: "规则类型不能为空", trigger: "change" }
        ],
      },
      // 流控表单校验
      flowRules: {
        flowControlMode: [
          { required: true, message: "流控模式不能为空", trigger: "blur" }
        ],
        flowControlEffect: [
          { required: true, message: "流控效果不能为空", trigger: "blur" }
        ],
        flowRuleType: [
          { required: true, message: "流控指标类型不能为空", trigger: "blur" }
        ],
        flowThreshold: [
          { required: true, message: "流控阈值不能为空", trigger: "blur" }
        ],
      },
      // 熔断表单校验
      circuitRules: {
        circuitStrategy: [
          { required: true, message: "熔断策略不能为空", trigger: "blur" }
        ],
        circuitThreshold: [
          { required: true, message: "熔断触发阈值不能为空", trigger: "blur" }
        ],
        circuitGrade: [
          { required: true, message: "慢调用判定阈值不能为空", trigger: "blur" }
        ],
        circuitWindow: [
          { required: true, message: "熔断统计窗口时长不能为空", trigger: "blur" }
        ],
        circuitTimeout: [
          { required: true, message: "熔断恢复超时时间不能为空", trigger: "blur" }
        ],
      },
      // 规则维度选项
      limitRuleDimensionOptions,
      // 规则类型选项
      limitRuleTypeOptions,
      // 流控模式选项
      flowControlModeOptions,
      // 流控效果选项
      flowControlEffectOptions,
      // 流控类型选项
      flowRuleTypeOptions,
      // 熔断策略选项
      circuitStrategyOptions,
    };
  },
  created() {
    // 将导入的函数挂载到实例，以便模板中使用
    this.listTemplate = listTemplate;
    this.listGroup = listGroup;
    this.listScene = listScene;
    this.listModel = listModel;

    this.getList();
  },
  methods: {
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
      this.queryParams.beginUpdateTime = null;
      this.queryParams.endUpdateTime = null;
    },
    /** 查询调用规则列表 */
    getList() {
      this.loading = true;
      this.clearDateQueryParams();
      if (null != this.daterangeCreateTime && "" != this.daterangeCreateTime) {
        this.queryParams.beginCreateTime = this.daterangeCreateTime[0];
        this.queryParams.endCreateTime = this.daterangeCreateTime[1];
      }
      if (null != this.daterangeUpdateTime && "" != this.daterangeUpdateTime) {
        this.queryParams.beginUpdateTime = this.daterangeUpdateTime[0];
        this.queryParams.endUpdateTime = this.daterangeUpdateTime[1];
      }
      listRule(this.queryParams).then(response => {
        this.ruleList = this.formatObjectArrayNullProperty(response.rows);
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        limitRuleId: null,
        limitRuleDimension: null,
        limitRuleTargetId: null,
        limitRuleType: null,
        flowControlMode: null,
        flowControlEffect: null,
        flowRuleType: null,
        flowThreshold: null,
        circuitStrategy: null,
        circuitThreshold: null,
        circuitGrade: null,
        circuitWindow: null,
        circuitTimeout: null,
        limitRuleStatus: null,
        limitRuleRemark: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
      };
      this.resetForm("form");
    },
    /** 高级搜索按钮操作 */
    handleMoreQuery() {
      this.isMoreQuery = !this.isMoreQuery;
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.limitRuleId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.isAdd = true;
      this.open = true;
      this.title = "添加调用规则";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      this.isAdd = false;
      const limitRuleId = row.limitRuleId || this.ids
      getRule(limitRuleId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改调用规则";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.limitRuleId != null) {
            updateRule(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addRule(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const limitRuleIds = row.limitRuleId || this.ids;
      this.$modal.confirm('是否确认删除调用规则编号为"' + limitRuleIds + '"的数据项？').then(function () {
        return delRule(limitRuleIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/rule/export', {
        ...this.queryParams
      }, `rule_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
