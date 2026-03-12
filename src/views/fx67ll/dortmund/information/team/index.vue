<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="72px">
      <el-form-item label="球队编码" prop="teamCode" v-if="isMoreQuery">
        <el-input v-model="queryParams.teamCode" placeholder="请输入球队编码" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <!-- 这下面个参数都可以用这个参数来模糊搜索 -->
      <el-form-item label="球队名称" prop="teamName">
        <el-input v-model="queryParams.teamName" placeholder="请输入球队名称" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="球队全称" prop="teamName" v-if="isMoreQuery">
        <el-input v-model="queryParams.teamName" placeholder="请输入球队全称" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="球队昵称" prop="teamNameShort" v-if="isMoreQuery">
        <el-input v-model="queryParams.teamNameShort" placeholder="请输入球队昵称" clearable
          @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="球队英文" prop="teamNameEn" v-if="isMoreQuery">
        <el-input v-model="queryParams.teamNameEn" placeholder="请输入球队英文" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="地区/联赛" prop="teamCountry">
        <el-select v-model="queryParams.teamCountry" style="width: 100%" placeholder="请选择或输入地区/联赛" clearable filterable
          allow-create default-first-option>
          <el-option v-for="item in teamCountryOptions" :key="item.value" :label="item.label" :value="item.value"
            @keyup.enter.native="handleQuery" />
        </el-select>
      </el-form-item>
      <el-form-item label="球队状态" prop="teamStatus" v-if="isMoreQuery">
        <el-select v-model="queryParams.teamStatus" style="width: 100%" placeholder="请选择球队状态" clearable
          @keyup.enter.native="handleQuery">
          <el-option v-for="dict in dict.type.sys_normal_disable" :key="dict.value" :label="dict.label"
            :value="dict.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" v-if="isMoreQuery">
        <el-date-picker v-model="daterangeCreateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
      </el-form-item>
      <el-form-item label="更新时间" v-if="isMoreQuery">
        <el-date-picker v-model="daterangeUpdateTime" style="width: 240px" value-format="yyyy-MM-dd" type="daterange"
          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" clearable></el-date-picker>
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
          v-hasPermi="['system:team:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:team:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:team:remove']">删除</el-button>
      </el-col>
      <!-- <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport"
          v-hasPermi="['system:team:export']">导出</el-button>
      </el-col> -->
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="teamList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="球队编码" align="center" prop="teamCode" width="80" fixed="left" />
      <el-table-column label="球队全称" align="center" prop="teamName" width="190" fixed="left" />
      <el-table-column label="球队昵称" align="center" prop="teamNameShort" width="100" />
      <el-table-column label="球队英文" align="center" prop="teamNameEn" width="150" />
      <el-table-column label="球队Logo" align="center" prop="teamLogoUrl" width="80">
        <template slot-scope="scope">
          <!-- 判断Logo地址是否有效（非空、非'-'） -->
          <div v-if="scope.row.teamLogoUrl && scope.row.teamLogoUrl !== '-'">
            <el-image :src="scope.row.teamLogoUrl" fit="cover" style="width: 50px; height: 50px; border-radius: 4px;"
              :preview-src-list="[scope.row.teamLogoUrl]" placeholder="加载中..." error-icon="el-icon-picture-outline" />
          </div>
          <!-- 无效地址时显示占位文本/图标 -->
          <div v-else style="color: #909399; font-size: 12px;">
            <i class="el-icon-picture-outline" style="margin-right: 4px;"></i>
            暂无Logo
          </div>
        </template>
      </el-table-column>
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
      <el-table-column label="球队排序" align="center" prop="teamSort" />
      <el-table-column label="球队备注" align="center" prop="teamRemark" />
      <el-table-column label="记录创建者" align="center" prop="createBy" width="90" />
      <el-table-column label="记录创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, "{y}-{m}-{d} {h}:{i}:{s}") }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="记录更新者" align="center" prop="updateBy" width="90" />
      <el-table-column label="记录更新时间" align="center" prop="updateTime" width="160">
        <template slot-scope="scope">
          <span>{{
            parseTime(scope.row.updateTime, "{y}-{m}-{d} {h}:{i}:{s}")
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="140">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['system:team:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:team:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改球队管理对话框 -->
    <el-dialog :title="title" :visible.sync="open" :close-on-click-modal="false" width="800px" style="top: 40px"
      append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="85px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="球队编码" prop="teamCode">
              <el-input v-model="form.teamCode" placeholder="请输入球队编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="球队全称" prop="teamName">
              <el-input v-model="form.teamName" placeholder="请输入球队全称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="球队昵称" prop="teamNameShort">
              <el-input v-model="form.teamNameShort" placeholder="请输入球队昵称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="球队英文" prop="teamNameEn">
              <el-input v-model="form.teamNameEn" placeholder="请输入球队英文" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- https://vip.fx67ll.com/vip-api/getRandomAvatar?isNeedMoreMosaic=Y&avatarBlockNum=6&avatarPadding=19 -->
            <el-form-item label="球队Logo" prop="teamLogoUrl">
              <el-input v-model="form.teamLogoUrl" placeholder="请输入内容" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地区/联赛" prop="teamCountry">
              <el-select v-model="form.teamCountry" style="width: 100%" placeholder="请选择或输入地区/联赛" clearable filterable
                allow-create default-first-option>
                <el-option v-for="item in teamCountryOptions" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="球队标签" prop="teamTag">
              <el-select v-model="form.teamTag" style="width: 100%" placeholder="请选择或输入球队标签" clearable filterable
                multiple allow-create default-first-option>
                <el-option v-for="item in teamTagOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="球队状态" prop="teamStatus">
              <el-select v-model="form.teamStatus" style="width: 100%" placeholder="请选择球队状态">
                <el-option v-for="dict in dict.type.sys_normal_disable" :key="dict.value" :label="dict.label"
                  :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="球队排序" prop="teamSort">
              <el-input v-model="form.teamSort" placeholder="请输入球队排序" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="球队备注" prop="teamRemark">
              <el-input v-model="form.teamRemark" type="textarea" placeholder="请输入内容" />
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
import { listTeam, getTeam, delTeam, addTeam, updateTeam } from "@/api/fx67ll/dortmund/team";

export default {
  name: "Team",
  dicts: ["sys_normal_disable"],
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
        teamLogoUrl: null,
        teamCountry: null,
        teamTag: null,
        teamStatus: null,
        teamSort: null,
        teamRemark: null,
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
      // 球队地区预选选项数组
      teamCountryOptions: [
        // 五大联赛
        { label: "德甲", value: "德甲" },
        { label: "英超", value: "英超" },
        { label: "西甲", value: "西甲" },
        { label: "意甲", value: "意甲" },
        { label: "法甲", value: "法甲" },
        // 国家队
        { label: "世界杯", value: "世界杯" },
        { label: "欧洲杯", value: "欧洲杯" },
        { label: "德国", value: "德国" },
        { label: "英国", value: "英国" },
        { label: "西班牙", value: "西班牙" },
        { label: "意大利", value: "意大利" },
        { label: "法国", value: "法国" },
        // 新增：五大联赛国内杯赛
        { label: "德国杯", value: "德国杯" },
        { label: "英格兰足总杯", value: "英格兰足总杯" },
        { label: "英格兰联赛杯", value: "英格兰联赛杯" },
        { label: "西班牙国王杯", value: "西班牙国王杯" },
        { label: "意大利杯", value: "意大利杯" },
        { label: "法国杯", value: "法国杯" },
        { label: "法国联赛杯", value: "法国联赛杯" },
        // 新增：五大联赛关联的洲际/顶级杯赛
        { label: "欧冠", value: "欧冠" },
        { label: "欧联杯", value: "欧联杯" },
        { label: "欧协联", value: "欧协联" },
        { label: "欧洲超级杯", value: "欧洲超级杯" },
        { label: "德国超级杯", value: "德国超级杯" },
        { label: "社区盾杯", value: "社区盾杯" },
        { label: "西班牙超级杯", value: "西班牙超级杯" },
        { label: "意大利超级杯", value: "意大利超级杯" },
        { label: "法国超级杯", value: "法国超级杯" },
        // 其他，杂七杂八
        { label: "德乙", value: "德乙" },
        { label: "英冠", value: "英冠" },
        { label: "荷甲", value: "荷甲" },
        { label: "日职", value: "日职" },
        { label: "日乙", value: "日乙" },
        { label: "韩职", value: "韩职" },
        { label: "中超", value: "中超" },
        { label: "中甲", value: "中甲" },
        { label: "亚洲杯", value: "亚洲杯" },
      ],
      // 球队标签预设选项数组（新增 type 字段）
      teamTagOptions: [
        // 基础标签 - 中性/主队相关
        { label: "我横", value: "我横", type: "warning" }, // 我横-黄色
        { label: "主队", value: "主队", type: "info" }, // 中性/主队相关 - 灰色
        { label: "窝里横", value: "窝里横", type: "warning" }, // 偏负面中性
        // 主场/客场表现
        { label: "主场龙", value: "主场龙", type: "success" }, // 正向-绿色
        { label: "客场虫", value: "客场虫", type: "danger" }, // 负向-红色
        { label: "血脉压制", value: "血脉压制", type: "primary" }, // 优势-深蓝
        { label: "平局大师", value: "平局大师", type: "info" }, // 中性-灰色
        { label: "杯赛大师", value: "杯赛大师", type: "info" }, // 中性-灰色
        { label: "二队出战", value: "二队出战", type: "warning" }, // 提醒-黄色
        // 比赛风格类
        { label: "攻势足球", value: "攻势足球", type: "success" }, // 正向-绿色
        { label: "防守反击", value: "防守反击", type: "primary" }, // 战术-深蓝
        { label: "传控流", value: "传控流", type: "info" }, // 中性-灰色
        { label: "摆大巴", value: "摆大巴", type: "warning" }, // 偏保守-黄色
        { label: "高空轰炸", value: "高空轰炸", type: "primary" }, // 战术-深蓝
        // 状态表现类
        { label: "状态火热", value: "状态火热", type: "success" }, // 正向-绿色
        { label: "状态低迷", value: "状态低迷", type: "danger" }, // 负向-红色
        { label: "连胜势头", value: "连胜势头", type: "success" }, // 正向-绿色
        { label: "连败颓势", value: "连败颓势", type: "danger" }, // 负向-红色
        { label: "绝杀专业户", value: "绝杀专业户", type: "success" }, // 正向-绿色
        { label: "被逆转之王", value: "被逆转之王", type: "danger" }, // 负向-红色
        // 球队特质类
        { label: "青年近卫军", value: "青年近卫军", type: "info" }, // 中性-灰色
        { label: "老牌劲旅", value: "老牌劲旅", type: "primary" }, // 核心-深蓝
        { label: "升班马", value: "升班马", type: "warning" }, // 提醒-黄色
        { label: "保级队", value: "保级队", type: "danger" }, // 危机-红色
        { label: "争冠热门", value: "争冠热门", type: "success" }, // 正向-绿色
        { label: "点球大战专家", value: "点球大战专家", type: "primary" }, // 优势-深蓝
        // 战术特点类
        { label: "边路飞翼", value: "边路飞翼", type: "success" }, // 正向-绿色
        { label: "中场绞肉机", value: "中场绞肉机", type: "warning" }, // 强硬-黄色
        { label: "定位球高手", value: "定位球高手", type: "primary" }, // 优势-深蓝
        { label: "门将开挂", value: "门将开挂", type: "success" }, // 正向-绿色
        { label: "锋线哑火", value: "锋线哑火", type: "danger" } // 负向-红色
      ],
    };
  },
  created() {
    this.getList();
  },
  methods: {
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
        this.open = true;
        this.title = "修改球队管理";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.teamTag = this.form?.teamTag?.length ? this.form.teamTag.join(",") : '';
          if (this.form.teamId != null) {
            updateTeam(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addTeam(this.form).then(response => {
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
      this.download('system/team/export', {
        ...this.queryParams
      }, `team_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
