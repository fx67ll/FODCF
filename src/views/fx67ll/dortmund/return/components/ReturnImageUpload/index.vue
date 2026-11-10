<template>
  <div class="return-image-upload">
    <el-upload multiple :action="uploadImgUrl" list-type="picture-card" :on-success="handleUploadSuccess"
      :before-upload="handleBeforeUpload" :limit="limit" :on-error="handleUploadError" :on-exceed="handleExceed"
      :before-remove="handleBeforeRemove" ref="returnImageUpload" :on-remove="handleRemove" :show-file-list="true"
      :headers="headers" :file-list="fileList" :on-preview="handlePreview" :class="{ hide: fileList.length >= limit }">
      <i class="el-icon-plus"></i>
    </el-upload>
    <div class="return-image-tip">
      每条组合最多 {{ limit }} 张；仅用于本次生成固化，生成成功后不可替换
    </div>
    <el-dialog title="图片预览" :visible.sync="previewVisible" append-to-body width="720px"
      custom-class="return-image-preview-dialog">
      <img :src="previewUrl" class="return-image-preview" />
    </el-dialog>
  </div>
</template>

<script>
import { getToken } from "@/utils/common/auth";
import { removeReturnImage } from "@/api/fx67ll/dortmund/returnCombination";

export default {
  name: "ReturnImageUpload",
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    limit: {
      type: Number,
      default: 3,
    },
    fileSize: {
      type: Number,
      default: 4,
    },
  },
  data() {
    return {
      uploadImgUrl: process.env.VUE_APP_BASE_API + "/dortmund/return/image/upload",
      headers: {
        Authorization: "Bearer " + getToken(),
      },
      fileList: [],
      previewUrl: "",
      previewVisible: false,
    };
  },
  watch: {
    value: {
      handler(value) {
        const list = Array.isArray(value) ? value : [];
        this.fileList = list.map((objectKey) => ({ name: objectKey, url: process.env.VUE_APP_BASE_API + objectKey }));
      },
      immediate: true,
    },
  },
  methods: {
    handleBeforeUpload(file) {
      if (!file.type || file.type.indexOf("image") !== 0) {
        this.$modal.msgError("请上传图片文件");
        return false;
      }
      if (file.size / 1024 / 1024 >= this.fileSize) {
        this.$modal.msgError(`上传图片大小不能超过 ${this.fileSize}MB`);
        return false;
      }
      return true;
    },
    handleUploadSuccess(response) {
      if (response && response.code === 200 && response.objectKey) {
        const keys = this.fileList.map((item) => item.name);
        keys.push(response.objectKey);
        this.fileList.push({
          name: response.objectKey,
          url: process.env.VUE_APP_BASE_API + response.objectKey,
        });
        this.$emit("input", keys);
        return;
      }
      this.$modal.msgError((response && response.msg) || "上传回报组合图片失败");
    },
    handleBeforeRemove(file) {
      const objectKey = file && file.name;
      if (!objectKey) {
        return false;
      }
      return removeReturnImage(objectKey).then(() => true).catch(() => {
        this.$modal.msgError("删除回报组合图片失败，请重试");
        return false;
      });
    },
    handleRemove(file) {
      const objectKey = file && file.name;
      if (!objectKey) {
        return;
      }
      this.fileList = this.fileList.filter((item) => item.name !== objectKey);
      this.$emit("input", this.fileList.map((item) => item.name));
    },
    handlePreview(file) {
      this.previewUrl = (file && file.url) || "";
      this.previewVisible = Boolean(this.previewUrl);
    },
    handleExceed() {
      this.$modal.msgError(`最多上传 ${this.limit} 张图片`);
    },
    handleUploadError() {
      this.$modal.msgError("上传回报组合图片失败，请重试");
    },
  },
};
</script>

<style lang="scss" scoped>
.return-image-tip {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: #7c8b84;
}

::v-deep.hide .el-upload--picture-card {
  display: none;
}

::v-deep .return-image-preview-dialog .el-dialog__body {
  padding: 16px;
  background: #1f2d3d;
  border-radius: 12px;
}

.return-image-preview {
  display: block;
  max-width: 100%;
  margin: 0 auto;
  border-radius: 10px;
}
</style>
