import { login, logout, getInfo, getAvatar } from "@/api/login";
import { getToken, setToken, removeToken } from "@/utils/auth";

const user = {
  state: {
    token: getToken(),
    name: "",
    avatar: "",
    roles: [],
    permissions: [],
  },

  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token;
    },
    SET_NAME: (state, name) => {
      state.name = name;
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar;
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles;
    },
    SET_PERMISSIONS: (state, permissions) => {
      state.permissions = permissions;
    },
  },

  actions: {
    // 登录
    Login({ commit }, userInfo) {
      const username = userInfo.username.trim();
      const password = userInfo.password;
      const code = userInfo.code;
      const uuid = userInfo.uuid;
      return new Promise((resolve, reject) => {
        login(username, password, code, uuid)
          .then((res) => {
            setToken(res.token);
            commit("SET_TOKEN", res.token);
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    // 获取用户信息
    GetInfo({ commit, state }) {
      return new Promise((resolve, reject) => {
        getInfo()
          .then((res) => {
            const user = res.user;

            console.log(process.env);

            // 如果没有设置头像，每次登录显示不同的随机马赛克头像，否则显示用户自定义头像
            // todo 后期再用户中心里添加一个配置，允许用户生成一个随机的马赛克头像并保存为自己的头像
            if (!user?.avatar || process.env.NODE_ENV === "development") {
              getAvatar("fx67ll").then((res) => {
                let avatar;
                if (res?.avatar) {
                  avatar = "data:image/gif;base64," + res.avatar;
                } else {
                  avatar =
                    user.avatar == "" || user.avatar == null
                      ? process.env.VUE_APP_LOGO_URL
                      : process.env.VUE_APP_BASE_API + user.avatar;
                }
                commit("SET_AVATAR", avatar);
              });
            } else {
              const avatar =
                user.avatar == "" || user.avatar == null
                  ? process.env.VUE_APP_LOGO_URL
                  : process.env.VUE_APP_BASE_API + user.avatar;
              commit("SET_AVATAR", avatar);
            }

            if (res.roles && res.roles.length > 0) {
              // 验证返回的roles是否是一个非空数组
              commit("SET_ROLES", res.roles);
              commit("SET_PERMISSIONS", res.permissions);
            } else {
              commit("SET_ROLES", ["ROLE_DEFAULT"]);
            }
            commit("SET_NAME", user.userName);

            resolve(res);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    // 退出系统
    LogOut({ commit, state }) {
      return new Promise((resolve, reject) => {
        logout(state.token)
          .then(() => {
            commit("SET_TOKEN", "");
            commit("SET_ROLES", []);
            commit("SET_PERMISSIONS", []);
            removeToken();
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    // 前端 登出
    FedLogOut({ commit }) {
      return new Promise((resolve) => {
        commit("SET_TOKEN", "");
        removeToken();
        resolve();
      });
    },
  },
};

export default user;
