<template>
  <div>
    <i class="el-icon-mobile-phone" @click="goto" />
  </div>
</template>

<script>
export default {
  name: "fx67llH5",
  data() {
    return {
      url: "https://life.fx67ll.com/",
    };
  },
  methods: {
    /**
     * 根据当前浏览器可视高度，从预设的 iPhone 机型宽高中挑选最合适的一组
     * 选择规则（默认取最小宽高）：
     *   1. 当前可视高度 <= 最小高度        → 取最小宽高
     *   2. 当前可视高度 >  最大高度        → 取最大宽高
     *   3. 其它（介于最小与最大之间）       → 取「heightPx <= 当前可视高度」中最接近的一项
     * @returns {{ width: number, height: number }} 选中的宽高，单位 px
     */
    pickSize() {
      // 预设的 iPhone 机型宽高（逻辑像素），按需替换为实际值
      const iphoneList = [
        { model: "iPhone 4", widthPx: 320, heightPx: 480 },
        { model: "iPhone 5/SE(GEN1)", widthPx: 320, heightPx: 568 },
        { model: "iPhone 6/7/8/SE(GEN2/3)", widthPx: 375, heightPx: 667 },
        { model: "iPhone 6/7/8 Plus", widthPx: 540, heightPx: 960 },
        { model: "iPhone X/XS/11 Pro", widthPx: 562.5, heightPx: 1218 },
        { model: "iPhone XR/11", widthPx: 414, heightPx: 896 },
        { model: "iPhone XS/11 Pro Max", widthPx: 621, heightPx: 1344 },
        { model: "iPhone 12/13 mini", widthPx: 540, heightPx: 1170 },
        { model: "iPhone 12/13/14", widthPx: 585, heightPx: 1266 },
        { model: "iPhone 12/13 Pro Max + 14 Plus", widthPx: 642, heightPx: 1389 },
        { model: "iPhone 14/15/16", widthPx: 589.5, heightPx: 1278 },
        { model: "iPhone 14/15 Pro Max + Plus", widthPx: 645, heightPx: 1398 },
        { model: "iPhone 16 Pro", widthPx: 603, heightPx: 1311 },
        { model: "iPhone 16 Pro Max", widthPx: 660, heightPx: 1434 }
      ];

      // 按 heightPx 升序排列，便于按高度分档选择（不修改原数组）
      const sorted = [...iphoneList].sort((a, b) => a.heightPx - b.heightPx);
      const currentHeight = window.innerHeight; // 当前浏览器可视区域高度
      const minHeight = sorted[0].heightPx;
      const maxHeight = sorted[sorted.length - 1].heightPx;

      // 默认取最小宽高（对应规则 1）
      let target = sorted[0];
      if (currentHeight > maxHeight) {
        // 规则 3：超过最大高度 → 取最大宽高
        target = sorted[sorted.length - 1];
      } else if (currentHeight > minHeight) {
        // 规则 2：高于最小高度 → 取「heightPx <= 当前可视高度」中最接近的一项
        // 在所有满足 heightPx <= currentHeight 的机型里，挑 heightPx 最大的那个
        target = sorted.reduce((acc, cur) => {
          return cur.heightPx <= currentHeight && cur.heightPx > acc.heightPx ? cur : acc;
        }, sorted[0]);
      }

      return { width: target.widthPx, height: target.heightPx };
    },
    // 打开新窗口：先按可视高度挑选宽高，再居中显示并悬浮于当前页面之上
    goto() {
      const { width, height } = this.pickSize();
      // 计算居中坐标（相对屏幕左上角）
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      // 拼接 window.open 的窗口特性字符串
      const features = [
        `width=${width}`,
        `height=${height}`,
        `left=${left}`,
        `top=${top}`,
        "resizable=yes", // 允许用户调整窗口大小
        "scrollbars=yes", // 显示滚动条
      ].join(",");
      window.open(this.url, "_blank", features);
    },
  },
};
</script>
