<!-- @author zhengjie -->
<!-- 扩充：在原有 SVG 图标基础上新增 Element UI 字体图标分组，支持分组切换与搜索 -->
<template>
  <div class="icon-body">
    <el-input
      v-model="name"
      class="icon-search"
      clearable
      placeholder="请输入图标名称"
      @clear="filterIcons"
      @input="filterIcons"
    >
      <i slot="suffix" class="el-icon-search el-input__icon" />
    </el-input>
    <el-radio-group v-model="activeGroup" size="mini" class="icon-group-tabs" @change="filterIcons">
      <el-radio-button label="svg">SVG 图标</el-radio-button>
      <el-radio-button label="element">Element 图标</el-radio-button>
    </el-radio-group>
    <div class="icon-list">
      <div class="list-container">
        <div
          v-for="(item, index) in iconList"
          class="icon-item-wrapper"
          :key="index"
          @click="selectedIcon(item)"
        >
          <div :class="['icon-item', { active: activeIcon === item }]">
            <i
              v-if="item.startsWith('el-icon-')"
              :class="item"
              class="icon el-icon-item"
            />
            <svg-icon
              v-else
              :icon-class="item"
              class-name="icon"
              style="height: 25px; width: 16px"
            />
            <span>{{ item }}</span>
          </div>
        </div>
        <div v-if="iconList.length === 0" class="icon-empty">无匹配图标</div>
      </div>
    </div>
  </div>
</template>

<script>
import icons from "./requireIcons";
import elementIcons from "./elementIcons";
export default {
  name: "IconSelect",
  props: {
    activeIcon: {
      type: String,
    },
  },
  data() {
    return {
      name: "",
      // 当前分组：svg = 项目自有 SVG，element = Element UI 字体图标
      activeGroup: "svg",
      iconList: icons,
    };
  },
  methods: {
    filterIcons() {
      const source = this.activeGroup === "element" ? elementIcons : icons;
      if (this.name) {
        this.iconList = source.filter((item) => item.includes(this.name));
      } else {
        this.iconList = source;
      }
    },
    selectedIcon(name) {
      this.$emit("selected", name);
      document.body.click();
    },
    reset() {
      this.name = "";
      // 根据当前选中图标自动切换到对应分组，方便定位
      if (this.activeIcon && this.activeIcon.startsWith("el-icon-")) {
        this.activeGroup = "element";
      } else {
        this.activeGroup = "svg";
      }
      this.filterIcons();
    },
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.icon-body {
  width: 100%;
  padding: 10px;
  .icon-search {
    position: relative;
    margin-bottom: 8px;
  }
  .icon-group-tabs {
    width: 100%;
    margin-bottom: 8px;
    ::v-deep .el-radio-button {
      width: 50%;
      .el-radio-button__inner {
        width: 100%;
      }
    }
  }
  .icon-list {
    height: 200px;
    overflow: auto;
    .list-container {
      display: flex;
      flex-wrap: wrap;
      .icon-item-wrapper {
        width: calc(100% / 3);
        height: 25px;
        line-height: 25px;
        cursor: pointer;
        display: flex;
        .icon-item {
          display: flex;
          max-width: 100%;
          height: 100%;
          padding: 0 5px;
          &:hover {
            background: #ececec;
            border-radius: 5px;
          }
          .icon {
            flex-shrink: 0;
          }
          // Element 字体图标对齐与尺寸
          .el-icon-item {
            font-size: 16px;
            width: 16px;
            line-height: 25px;
            text-align: center;
          }
          span {
            display: inline-block;
            vertical-align: -0.15em;
            fill: currentColor;
            padding-left: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
        .icon-item.active {
          background: #ececec;
          border-radius: 5px;
        }
      }
      .icon-empty {
        width: 100%;
        text-align: center;
        color: #909399;
        font-size: 13px;
        line-height: 60px;
      }
    }
  }
}
</style>
