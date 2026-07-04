import auth from '@/plugins/auth';
import router, { constantRoutes, dynamicRoutes } from '@/router';
import { getRouters } from '@/api/menu';
import Layout from '@/layout/index';
import ParentView from '@/components/ParentView';
import InnerLink from '@/layout/components/InnerLink';

const permission = {
  state: {
    routes: [],
    addRoutes: [],
    defaultRoutes: [],
    topbarRouters: [],
    sidebarRouters: [],
  },
  mutations: {
    SET_ROUTES: (state, routes) => {
      state.addRoutes = routes;
      state.routes = constantRoutes.concat(routes);
    },
    SET_DEFAULT_ROUTES: (state, routes) => {
      state.defaultRoutes = constantRoutes.concat(routes);
    },
    SET_TOPBAR_ROUTES: (state, routes) => {
      state.topbarRouters = routes;
    },
    SET_SIDEBAR_ROUTERS: (state, routes) => {
      state.sidebarRouters = routes;
    },
  },
  actions: {
    // 生成路由
    GenerateRoutes({ commit }) {
      return new Promise(resolve => {
        // 向后端请求路由数据
        getRouters().then(res => {
          const sdata = JSON.parse(JSON.stringify(res.data));
          const rdata = JSON.parse(JSON.stringify(res.data));
          const sidebarRoutes = filterAsyncRouter(sdata);
          const rewriteRoutes = filterAsyncRouter(rdata, false, true);
          const asyncRoutes = filterDynamicRoutes(dynamicRoutes);
          rewriteRoutes.push({ path: '*', redirect: '/404', hidden: true });
          // === 路由 name 去重 START =================================================
          // 背景：若依后端 SysMenuServiceImpl.getRouteName() 用菜单 path 的首字母大写作为路由 name，
          //   导致多条以同名结尾的菜单（如 .../match/log、lottery/log、punch/log、note/log）
          //   生成的路由 name 都是 "Log"，前端 router.addRoutes 时 vue-router 报
          //   "Duplicate named routes definition" 警告。
          // 处理：在路由正式注册前，对整棵路由树递归调用 deduplicateRouteNames，把重复的 name
          //   改写为"完整路径转 PascalCase"的形式（如 match/log -> MatchLog），保证全局唯一且有语义。
          // 影响评估：本项目所有路由跳转均使用 path（router.push({path}) / <router-link :to="path">），
          //   不依赖路由 name 跳转，故改写 name 不影响任何现有功能。
          // 回退方式：若后期需要恢复后端原始 name，删除下面这一行调用即可
          //   （deduplicateRouteNames 函数可保留也可一并删除）。
          deduplicateRouteNames(rewriteRoutes);
          // === 路由 name 去重 END ===================================================
          router.addRoutes(asyncRoutes);
          commit('SET_ROUTES', rewriteRoutes);
          commit('SET_SIDEBAR_ROUTERS', constantRoutes.concat(sidebarRoutes));
          commit('SET_DEFAULT_ROUTES', sidebarRoutes);
          commit('SET_TOPBAR_ROUTES', sidebarRoutes);
          resolve(rewriteRoutes);
        });
      });
    },
  },
};

// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter(asyncRouterMap, lastRouter = false, type = false) {
  return asyncRouterMap.filter(route => {
    if (type && route.children) {
      route.children = filterChildren(route.children);
    }
    if (route.component) {
      // Layout ParentView 组件特殊处理
      if (route.component === 'Layout') {
        route.component = Layout;
      } else if (route.component === 'ParentView') {
        route.component = ParentView;
      } else if (route.component === 'InnerLink') {
        route.component = InnerLink;
      } else {
        route.component = loadView(route.component);
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, type);
    } else {
      delete route['children'];
      delete route['redirect'];
    }
    return true;
  });
}

/**
 * 路由 name 去重（整棵路由树递归）：保证注册到 vue-router 的 name 全局唯一。
 *
 * 触发条件：仅当后端生成的 name 在本次路由表中出现重复时才改写，唯一 name 原样保留。
 * 重命名规则：取路由完整 path（已由 filterChildren 拼接为全路径），按 / 拆段，
 *   每段首字母大写后拼接，如 "lottery/log" -> "LotteryLog"；若转换后仍重复则追加数字后缀。
 *
 * 说明：每次调用（每次登录生成路由）都会重新初始化已用 name 集合，避免跨登录会话污染。
 *
 * @param {Array} routes 路由树（会被递归遍历 children）
 * @returns {void} 直接修改各节点的 name
 */
function deduplicateRouteNames(routes) {
  const usedNames = new Set();
  const resolve = route => {
    if (route.name) {
      if (!usedNames.has(route.name)) {
        // name 未被使用，登记并保留后端原始 name
        usedNames.add(route.name);
      } else {
        // name 重复：用完整路径转 PascalCase 生成新 name，直至唯一
        let newName = pathToPascalCase(route.path);
        let suffix = 2;
        while (usedNames.has(newName)) {
          newName = pathToPascalCase(route.path) + '_' + suffix;
          suffix++;
        }
        route.name = newName;
        usedNames.add(newName);
      }
    }
    if (route.children && route.children.length) {
      route.children.forEach(resolve);
    }
  };
  routes.forEach(resolve);
}

/**
 * 路径转 PascalCase：lottery/log -> LotteryLog
 * @param {String} path 路由完整路径
 * @returns {String} PascalCase 名称
 */
function pathToPascalCase(path) {
  if (!path) {
    return '';
  }
  return path
    .split('/')
    .filter(segment => segment) // 去掉空段（首部 / 或连续 //）
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

function filterChildren(childrenMap, lastRouter = false) {
  var children = [];
  childrenMap.forEach((el, index) => {
    if (el.children && el.children.length) {
      if (el.component === 'ParentView' && !lastRouter) {
        el.children.forEach(c => {
          c.path = el.path + '/' + c.path;
          if (c.children && c.children.length) {
            children = children.concat(filterChildren(c.children, c));
            return;
          }
          children.push(c);
        });
        return;
      }
    }
    if (lastRouter) {
      el.path = lastRouter.path + '/' + el.path;
    }
    children = children.concat(el);
  });
  return children;
}

// 动态路由遍历，验证是否具备权限
export function filterDynamicRoutes(routes) {
  const res = [];
  routes.forEach(route => {
    if (route.permissions) {
      if (auth.hasPermiOr(route.permissions)) {
        res.push(route);
      }
    } else if (route.roles) {
      if (auth.hasRoleOr(route.roles)) {
        res.push(route);
      }
    }
  });
  return res;
}

export const loadView = view => {
  if (process.env.NODE_ENV === 'development') {
    return resolve => require([`@/views/${view}`], resolve);
  } else {
    // 使用 import 实现生产环境的路由懒加载
    return () => import(`@/views/${view}`);
  }
};

export default permission;
