<template>
  <div class="app-container dl-page">
    <template v-if="!open">
      <transition name="dl-filter">
        <el-form class="dl-filter" :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch"
          label-width="72px">
          <el-form-item label="球队编码" prop="teamCode" v-if="isMoreQuery">
            <el-input v-model="queryParams.teamCode" placeholder="请输入球队编码" clearable
              @keyup.enter.native="handleQuery" />
          </el-form-item>
          <!-- 这下面个参数都可以用这个参数来模糊搜索 -->
          <el-form-item label="搜索球队" prop="teamName" v-if="!isMoreQuery">
            <el-input v-model="queryParams.teamName" placeholder="请输入球队全称/昵称/简称/英文" clearable
              @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="球队全称" prop="teamName" v-if="isMoreQuery">
            <el-input v-model="queryParams.teamName" placeholder="请输入球队全称" clearable
              @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="球队昵称" prop="teamNameShort" v-if="isMoreQuery">
            <el-input v-model="queryParams.teamNameShort" placeholder="请输入球队昵称/简称" clearable
              @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="球队英文" prop="teamNameEn" v-if="isMoreQuery">
            <el-input v-model="queryParams.teamNameEn" placeholder="请输入球队英文" clearable
              @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="球队主场" prop="teamVenue" v-if="isMoreQuery">
            <dortmund-option-select v-model="queryParams.teamVenue" option-type="venue" placeholder="请选择或输入球队主场" />
          </el-form-item>
          <el-form-item label="地区/联赛" prop="teamCountry">
            <dortmund-option-select v-model="queryParams.teamCountry" option-type="country" placeholder="请选择或输入地区/联赛" />
          </el-form-item>
          <el-form-item label="球队标签" prop="teamTag" v-if="isMoreQuery">
            <dortmund-option-select v-model="queryParams.teamTag" option-type="tag" placeholder="请选择或输入球队标签" />
          </el-form-item>
          <el-form-item label="球队状态" prop="teamStatus" v-if="isMoreQuery">
            <el-select v-model="queryParams.teamStatus" style="width: 100%" placeholder="请选择球队状态" clearable
              @keyup.enter.native="handleQuery">
              <el-option v-for="dict in dict.type.sys_normal_disable" :key="dict.value" :label="dict.label"
                :value="dict.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间" v-if="isMoreQuery">
            <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd"
              type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"
              clearable></el-date-picker>
          </el-form-item>
          <el-form-item label="更新时间" v-if="isMoreQuery">
            <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd"
              type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"
              clearable></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button type="success" icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
            <el-button type="success" class="dl-more-btn" :icon="isMoreQuery ? 'el-icon-zoom-out' : 'el-icon-zoom-in'"
              size="mini" @click="handleMoreQuery">
              {{ isMoreQuery ? "关闭高级搜索" : "使用高级搜索" }}
            </el-button>
          </el-form-item>
        </el-form>
      </transition>

      <div class="dl-toolbar">
        <div class="dl-toolbar-actions">
          <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd"
            v-hasPermi="['dortmund:team:add']">新增</el-button>
          <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
            v-hasPermi="['dortmund:team:edit']">修改</el-button>
          <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
            v-hasPermi="['dortmund:team:remove']">删除</el-button>
          <!-- <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['dortmund:team:export']">导出</el-button> -->
          <transition name="dl-chip">
            <span class="dl-selected-chip" v-if="ids.length > 0"><i class="el-icon-circle-check"></i>已选 {{ ids.length }}
              项</span>
          </transition>
        </div>
        <div class="dl-toolbar-side">
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </div>
      </div>

      <div class="dl-list-card">
        <el-table v-loading="loading" :data="teamList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="球队编码" align="center" prop="teamCode" width="80" :show-overflow-tooltip="true"
            fixed="left" />
          <el-table-column label="球队全称" align="center" prop="teamName" width="190" :show-overflow-tooltip="true"
            fixed="left" />
          <el-table-column label="球队昵称" align="center" prop="teamNameShort" width="100" :show-overflow-tooltip="true" />
          <el-table-column label="球队英文" align="center" prop="teamNameEn" width="150" :show-overflow-tooltip="true" />
          <el-table-column label="球队Logo" align="center" prop="teamLogoUrl" width="80">
            <template slot-scope="scope">
              <!-- 判断Logo地址是否有效（非空、非'-'） -->
              <div v-if="scope.row.teamLogoUrl && scope.row.teamLogoUrl !== '-'" class="team-logo-cell">
                <el-image :src="scope.row.teamLogoUrl" fit="cover" class="team-logo-img"
                  :preview-src-list="[scope.row.teamLogoUrl]" placeholder="加载中..."
                  error-icon="el-icon-picture-outline" />
              </div>
              <!-- 无效地址时显示占位文本/图标 -->
              <div v-else class="team-logo-empty">
                <i class="el-icon-picture-outline"></i>
                暂无Logo
              </div>
            </template>
          </el-table-column>
          <el-table-column label="球队主场" align="center" prop="teamVenue" width="190" :show-overflow-tooltip="true" />
          <el-table-column label="地区/联赛" align="center" prop="teamCountry" />
          <el-table-column label="球队标签" align="center" prop="teamTag" width="230">
            <template slot-scope="scope">
              <!-- 遍历拆分后的标签数组，匹配对应 type 渲染彩色标签 -->
              <el-tag v-for="(tag, index) in scope.row.teamTag" :key="index" size="mini" :type="getTagType(tag.trim())"
                style="margin-right: 4px; margin-bottom: 4px;">
                {{ tag.trim() }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="球队状态" align="center" prop="teamStatus" width="80">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.teamStatus" />
            </template>
          </el-table-column>
          <el-table-column label="球队排序" align="center" prop="teamSort" width="100" sortable="teamSort"
            :sort-orders="['descending', 'ascending']" />
          <el-table-column label="球队备注" align="center" prop="teamRemark" width="230" :show-overflow-tooltip="true" />
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
              <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-edit"
                @click="handleUpdate(scope.row)" v-hasPermi="['dortmund:team:edit']">修改</el-button>
              <el-button size="mini" type="text" class="dortmund-theme-text" icon="el-icon-delete"
                @click="handleDelete(scope.row)" v-hasPermi="['dortmund:team:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
        @pagination="getList" />
    </template>

    <!-- 添加或修改球队管理二级页面 -->
    <team-edit-scene v-else key="edit" :edit-mode="editMode" :initial-form="form" :submitting="submitting"
      @back="cancel" @save="submitForm" />
  </div>
</template>

<script>
import { listTeam, getTeam, delTeam, addTeam, updateTeam } from "@/api/fx67ll/dortmund/team";

import { teamTagOptions } from "@/utils/constant/football";

import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";
import TeamEditScene from "./components/TeamEditScene/index.vue";
import DortmundOptionSelect from "@/views/fx67ll/dortmund/other/component/DortmundOptionSelect/index";

export default {
  name: "Team",
  dicts: ["sys_normal_disable"],
  components: { TeamEditScene, DortmundOptionSelect },
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
      // 球队管理表格数据
      teamList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 编辑场景模式
      editMode: "add",
      // 编辑提交状态
      submitting: false,
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
        teamCode: null,
        teamName: null,
        teamNameShort: null,
        teamNameEn: null,
        teamVenue: null,
        teamCountry: null,
        teamStatus: null,
        beginCreateTime: null,
        endCreateTime: null,
        beginUpdateTime: null,
        endUpdateTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        teamCode: [
          { required: true, message: "球队编码不能为空", trigger: "blur" }
        ],
        teamName: [
          { required: true, message: "球队全称不能为空", trigger: "blur" }
        ],
        teamNameShort: [
          { required: true, message: "球队昵称不能为空", trigger: "blur" }
        ],
        teamNameEn: [
          { required: true, message: "球队英文不能为空", trigger: "blur" }
        ],
        teamLogoUrl: [
          { required: true, message: "球队Logo不能为空", trigger: "blur" }
        ],
        teamCountry: [
          { required: true, message: "地区/联赛不能为空", trigger: "blur" }
        ],
        teamTag: [
          { required: true, message: "球队标签不能为空", trigger: "blur" }
        ],
        teamStatus: [
          { required: true, message: "球队状态不能为空", trigger: "blur" }
        ],
      },
      // 球队标签预设选项数组
      teamTagOptions,
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
    /** 根据标签值获取对应的 type（配色） */
    getTagType(tagValue) {
      // 从预设数组中查找匹配的标签
      const matchTag = this.teamTagOptions.find(item => item.value === tagValue);
      // 有匹配则返回对应 type，无匹配返回默认 info
      return matchTag ? matchTag.type : "info";
    },
    // 重置时间段查询
    clearDateQueryParams() {
      this.queryParams.beginCreateTime = null;
      this.queryParams.endCreateTime = null;
      this.queryParams.beginUpdateTime = null;
      this.queryParams.endUpdateTime = null;
    },
    /** 查询球队管理列表 */
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
      listTeam(this.queryParams).then(response => {
        const teamListTmp = (response.rows || []).map(item => ({ ...item, teamTag: item.teamTag ? item.teamTag.split(',').map(t => t.trim()) : [] }));
        this.teamList = this.formatObjectArrayNullProperty(teamListTmp);
        this.total = response.total;
      }).catch(() => {
        this.teamList = [];
        this.total = 0;
      }).finally(() => {
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
        teamId: null,
        teamCode: null,
        teamName: null,
        teamNameShort: null,
        teamNameEn: null,
        teamLogoUrl: null,
        teamCountry: null,
        teamTag: null,
        teamRemark: null,
        teamStatus: null,
        teamSort: null,
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
      this.daterangeCreateTime = [];
      this.daterangeUpdateTime = [];
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.teamId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.editMode = "add";
      this.open = true;
      this.title = "添加球队管理";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const teamId = row.teamId || this.ids
      getTeam(teamId).then(response => {
        const formDataObj = response.data;
        formDataObj.teamTag = formDataObj?.teamTag ? formDataObj.teamTag?.split(",") || [] : '';
        this.form = formDataObj;
        this.editMode = "update";
        this.open = true;
        this.title = "修改球队管理";
      }).catch(() => {
        this.$modal.msgError("获取球队详情失败");
      });
    },
    /** 提交按钮 */
    submitForm(formData) {
      this.submitting = true;
      const request = formData.teamId != null ? updateTeam(formData) : addTeam(formData);
      request.then(() => {
        this.$modal.msgSuccess(formData.teamId != null ? "修改成功" : "新增成功");
        this.open = false;
        this.getList();
      }).catch(() => {
      }).finally(() => {
        this.submitting = false;
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const teamIds = row.teamId || this.ids;
      this.$modal.confirm('是否确认删除球队管理编号为"' + teamIds + '"的数据项？').then(function () {
        return delTeam(teamIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => { });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('dortmund/team/export', {
        ...this.queryParams
      }, `team_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style lang="scss" scoped>
/* 列表Logo单元格：固定尺寸圆角预览 */
.team-logo-cell {
  display: inline-flex;

  .team-logo-img {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    border: 1px solid #e2eee7;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.06);
    }
  }
}

.team-logo-empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  color: #a8b5af;
  font-size: 11px;
  background: #f4f8f6;
  border: 1px dashed #dce9e2;
  border-radius: 8px;

  i {
    margin-right: 3px;
    font-size: 14px;
  }
}

/* 弹窗视觉语言：圆角、渐变图标、入场动画（与 extra/simulate 弹窗同一风格体系） */
::v-deep .team-edit-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 44px rgba(46, 204, 113, 0.18);
}

.dialog-header {
  display: flex;
  align-items: center;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f0f4f2;
}

.dialog-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  font-size: 20px;
  color: #fff;
  background: linear-gradient(135deg, #2ecc71 0%, #27ad60 100%);
  border-radius: 11px;
  box-shadow: 0 5px 12px rgba(46, 204, 113, 0.3);
}

.dialog-header-title {
  font-size: 16px;
  font-weight: 700;
  color: #2b3a36;
}

.dialog-header-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #7c8b84;
}

::v-deep .team-edit-dialog .el-dialog__body {
  padding-top: 18px;
}

::v-deep .team-edit-dialog .el-dialog__footer {
  padding: 14px 20px 18px;
  border-top: 1px solid #f0f4f2;
}

/* 表单区随弹窗打开做阶梯入场 */
::v-deep .team-edit-dialog .el-dialog__body .el-form {
  animation: teamFormFadeUp 0.3s ease 0.05s both;
}

@keyframes teamFormFadeUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
