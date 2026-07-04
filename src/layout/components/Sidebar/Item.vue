<script>
export default {
  name: "MenuItem",
  functional: true,
  props: {
    icon: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
  },
  render(h, context) {
    const { icon, title } = context.props;
    const vnodes = [];

    if (icon) {
      // 兼容 Element UI 字体图标：icon 以 "el-icon-" 开头时渲染 <i>，否则走 SVG 体系
      if (icon.startsWith("el-icon-")) {
        vnodes.push(<i class={icon} />);
      } else {
        vnodes.push(<svg-icon icon-class={icon} />);
      }
    }

    if (title) {
      if (title.length > 5) {
        vnodes.push(
          <span slot="title" title={title}>
            {title}
          </span>
        );
      } else {
        vnodes.push(<span slot="title">{title}</span>);
      }
    }
    return vnodes;
  },
};
</script>
