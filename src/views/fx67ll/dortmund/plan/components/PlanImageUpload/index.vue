<template>
  <div class="plan-image-upload">
    <el-upload multiple :action="uploadImgUrl" list-type="picture-card" :on-success="handleUploadSuccess"
      :before-upload="handleBeforeUpload" :limit="limit" :on-error="handleUploadError" :on-exceed="handleExceed"
      ref="planImageUpload" :on-remove="handleDelete" :show-file-list="true" :headers="headers" :file-list="fileList"
      :on-preview="handlePictureCardPreview" :class="{ hide: this.fileList.length >= this.limit }">
      <i class="el-icon-plus"></i>
    </el-upload>

    <!-- 上传提示 -->
    <div class="el-upload__tip" slot="tip" v-if="showTip">
      请上传
      <template v-if="fileSize">
        大小不超过 <b style="color: #f56c6c">{{ fileSize }}MB</b>
      </template>
      <template v-if="fileType">
        格式为 <b style="color: #f56c6c">{{ fileType.join("/") }}</b>
      </template>
      的文件，最多 {{ limit }} 张
    </div>

    <!-- 图片预览 -->
    <el-dialog title="预览" :visible.sync="dialogVisible" :close-on-click-modal="false" width="800"
      :style="`top: ${getDialogVerticalOffset(444)}`" append-to-body>
      <img :src="dialogImageUrl" style="display: block; max-width: 100%; margin: 0 auto" />
    </el-dialog>
  </div>
</template>

<script>
import { getDialogVerticalOffset } from "@/utils/fx67ll/utils";
import { getToken } from "@/utils/common/auth";

export default {
  name: "PlanImageUpload",
  props: {
    // 图片对象键集合（相对对象键，v-model）
    value: {
      type: Array,
      default: () => [],
    },
    // 图片数量限制（方案计划最多两张）
    limit: {
      type: Number,
      default: 2,
    },
    // 大小限制(MB)，对齐服务端 4MB
    fileSize: {
      type: Number,
      default: 4,
    },
    // 文件类型
    fileType: {
      type: Array,
      default: () => ["png", "jpg", "jpeg"],
    },
    // 是否显示提示
    isShowTip: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      number: 0,
      uploadList: [],
      // 上传成功后的相对对象键集合（等待提交）
      uploadedObjectKeys: [],
      dialogImageUrl: "",
      dialogVisible: false,
      baseUrl: process.env.VUE_APP_BASE_API,
      // 上传地址改为方案计划图片专用接口，返回相对对象键
      uploadImgUrl: process.env.VUE_APP_BASE_API + "/dortmund/plan/image/upload",
      headers: {
        Authorization: "Bearer " + getToken(),
      },
      fileList: [],
    };
  },
  computed: {
    // 是否显示提示
    showTip() {
      return this.isShowTip && (this.fileType || this.fileSize);
    },
  },
  watch: {
    // 外部对象键集合变化时重建文件列表（预览地址 = 基础地址 + 相对对象键）
    value: {
      handler(val) {
        const list = Array.isArray(val) ? val : [];
        this.fileList = list.map((item) => {
          return { name: item, url: this.baseUrl + item };
        });
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    // 代理工具函数
    getDialogVerticalOffset(offset) {
      return getDialogVerticalOffset(offset);
    },
    // 上传前校验文件格式与大小
    handleBeforeUpload(file) {
      let isImg = false;
      if (this.fileType.length) {
        let fileExtension = "";
        if (file.name.lastIndexOf(".") > -1) {
          fileExtension = file.name.slice(file.name.lastIndexOf(".") + 1);
        }
        isImg = this.fileType.some((type) => {
          if (file.type.indexOf(type) > -1) return true;
          if (fileExtension && fileExtension.indexOf(type) > -1) return true;
          return false;
        });
      } else {
        isImg = file.type.indexOf("image") > -1;
      }

      if (!isImg) {
        this.$modal.msgError(
          `文件格式不正确, 请上传${this.fileType.join("/")}图片格式文件!`
        );
        return false;
      }
      if (this.fileSize) {
        const isLt = file.size / 1024 / 1024 < this.fileSize;
        if (!isLt) {
          this.$modal.msgError(`上传图片大小不能超过 ${this.fileSize} MB!`);
          return false;
        }
      }
      this.$modal.loading("正在上传图片，请稍候...");
      this.number++;
    },
    // 文件个数超出
    handleExceed() {
      this.$modal.msgError(`上传图片数量不能超过 ${this.limit} 个!`);
    },
    // 上传成功回调：接口返回相对对象键，不落库、不拼完整地址
    handleUploadSuccess(res, file) {
      if (res.code === 200 && res.objectKey) {
        this.uploadList.push({ name: res.objectKey, url: this.baseUrl + res.objectKey, objectKey: res.objectKey });
        this.uploadedSuccessfully();
      } else {
        this.number--;
        this.$modal.closeLoading();
        this.$modal.msgError(res.msg || "上传方案计划图片失败，请重试");
        this.$refs.planImageUpload.handleRemove(file);
        this.uploadedSuccessfully();
      }
    },
    // 删除图片：从对象键集合中移除并同步到父组件
    handleDelete(file) {
      const findex = this.fileList.map((f) => f.name).indexOf(file.name);
      if (findex > -1) {
        this.fileList.splice(findex, 1);
        this.emitObjectKeys();
      }
    },
    // 上传失败
    handleUploadError() {
      this.$modal.msgError("上传方案计划图片失败，请重试");
      this.$modal.closeLoading();
    },
    // 上传结束处理：把新上传的对象键并入集合后同步到父组件
    uploadedSuccessfully() {
      if (this.number > 0 && this.uploadList.length === this.number) {
        this.uploadList.forEach((item) => {
          this.uploadedObjectKeys.push(item.objectKey);
        });
        this.fileList = this.fileList.concat(this.uploadList);
        this.uploadList = [];
        this.number = 0;
        this.emitObjectKeys();
        this.$modal.closeLoading();
      }
    },
    // 预览
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url;
      this.dialogVisible = true;
    },
    // 同步相对对象键集合到父组件（v-model，不提供手工填写对象键的输入框）
    emitObjectKeys() {
      this.$emit("input", this.fileList.map((item) => item.name));
    },
  },
};
</script>
<style scoped lang="scss">
// .el-upload--picture-card 控制加号部分
::v-deep.hide .el-upload--picture-card {
  display: none;
}

// 去掉动画效果
::v-deep .el-list-enter-active,
::v-deep .el-list-leave-active {
  transition: all 0s;
}

::v-deep .el-list-enter,
.el-list-leave-active {
  opacity: 0;
  transform: translateY(0);
}
</style>
