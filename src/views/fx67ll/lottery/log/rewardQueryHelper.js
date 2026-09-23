/**
 * 号码记录「查询中奖信息」共享逻辑（mxnzp 代理，凭据不下发前端）
 *
 * 从 lottery/log/index.vue 抽离，供号码台账页与首页「未开奖号码」卡片复用，
 * 避免两处维护同一套查询→落库→中奖校验流程。
 *
 * 流程：查外部开奖号码 → 格式化 → 落库 winningNumber → 拉取详情逐注校验中奖 →
 *      命中则弹确认框保存中奖信息，未中奖则静默记录本期结果（isWin/winningPrice）
 *
 * 第三方开奖结果先静默校验：未开奖/查询失败时不展示动效组件、直接弹原提示；
 * 校验通过后才展示动效组件：查询中（覆盖落库与详情核对的等待）→ 匹配中 →
 * 未中奖（温柔安慰动效、随机安慰文案）/ 中奖（关闭组件后沿用原中奖信息确认弹窗）。
 */
import { queryRewardForApp, getLog, updateLog } from "@/api/fx67ll/lottery/log";
import { checkLotteryResult } from "@/utils/fx67ll/utils";

// 调用动效组件方法，组件缺失时安全跳过
function present(presenter, method, ...args) {
  if (presenter && typeof presenter[method] === "function") {
    return presenter[method](...args);
  }
  return undefined;
}

// 彩种文本（与号码台账页 lotteryTypeMap.text 保持一致）
export const LOTTERY_TYPE_TEXT = {
  1: "大乐透",
  2: "双色球",
  3: "排列三",
  4: "排列五",
  5: "七星彩",
};

// 合法的彩种值（含字符串形态）
const VALID_NUMBER_TYPES = [1, 2, 3, 4, 5, "1", "2", "3", "4", "5"];

// mxnzp 彩种 code 映射
const MXNZP_CODE_MAP = { 1: "cjdlt", 2: "ssq", 3: "pl3", 4: "pl5", 5: "qxc" };

// 浮动奖金的彩种+等级（弹窗里需加「动态」备注）
const DYNAMIC_PRIZE_LEVELS = {
  1: [1, 2], // 大乐透一、二等奖
  2: [1, 2], // 双色球一、二等奖
  5: [1, 2], // 七星彩一、二等奖
};

/** 格式化号码字符串展示：逗号换空格，横杠前后加空格 */
export function formatNumDisplay(numStr) {
  if (!numStr || numStr === "-") return numStr;
  return String(numStr).replace(/,/g, " ").replace(/-/g, " - ");
}

/**
 * 查询一条号码记录的开奖信息（入口，含「已查过是否再次查询」确认）
 * @param {import('vue').default} vm 调用方组件实例（用到 $confirm/$modal/$createElement）
 * @param {Object} record 号码记录（需含 lotteryId/dateCode/numberType/winningNumber）
 * @param {Object} [opts]
 * @param {(loading:boolean)=>void} [opts.onLoadingChange] 加载状态回调
 * @param {()=>void} [opts.onSuccess] 落库/取消后刷新回调
 * @param {Object} [opts.presenter] RewardQueryOverlay 动效组件实例，驱动查询进度与结果展示
 */
export function queryRewardForRecord(vm, record, opts = {}) {
  const setLoading = (val) =>
    typeof opts.onLoadingChange === "function" && opts.onLoadingChange(val);
  const refresh = () =>
    typeof opts.onSuccess === "function" && opts.onSuccess();
  const presenter = opts.presenter || null;

  if (!record || !VALID_NUMBER_TYPES.includes(record.numberType)) {
    vm.$modal.msgError("数据异常，请联系管理员！");
    return;
  }
  if (!record.dateCode) {
    vm.$modal.msgWarning("查询失败！请补充完整期号！");
    return;
  }
  // 已查询过开奖信息：二次确认
  const run = () => runRewardQuery(vm, record, setLoading, refresh, presenter);
  if (record.winningNumber && record.winningNumber !== "-") {
    vm.$confirm("您已查询过开奖信息，是否需要再次查询", "提示", {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(run)
      .catch(() => {});
  } else {
    run();
  }
}

// 实际查询开奖号码并落库：先静默查询第三方开奖结果，
// 未开奖/查询失败时不展示动效组件、直接弹原提示，校验通过后再展示动效组件进入后续流程
function runRewardQuery(vm, record, setLoading, refresh, presenter) {
  const logDateCode = record.dateCode;
  const logNumType = Number(record.numberType);
  const logNumId = record.lotteryId;
  setLoading(true);
  queryRewardForApp(logDateCode, logNumType)
    .then((res) => {
      const mxnzp = res && res.mxnzp;
      if (mxnzp && mxnzp.code === 1) {
        const resData = mxnzp.data || {};
        const zoneCodes = [MXNZP_CODE_MAP[1], MXNZP_CODE_MAP[2]];
        const plainCodes = [
          MXNZP_CODE_MAP[3],
          MXNZP_CODE_MAP[4],
          MXNZP_CODE_MAP[5],
        ];
        if (resData.openCode && zoneCodes.includes(resData.code)) {
          // 开奖结果校验通过后才展示动效组件：滚动动效覆盖后续落库与详情核对的等待
          present(presenter, "showQuerying", record);
          formatWinningNumber(
            vm,
            resData.openCode,
            logNumType,
            logNumId,
            setLoading,
            refresh,
            presenter
          );
        } else if (resData.openCode && plainCodes.includes(resData.code)) {
          // 开奖结果校验通过后才展示动效组件：滚动动效覆盖后续落库与详情核对的等待
          present(presenter, "showQuerying", record);
          saveWinningNumber(
            vm,
            resData.openCode,
            logNumType,
            logNumId,
            setLoading,
            refresh,
            presenter
          );
        } else {
          vm.$modal.msgWarning("外部接口异常，请联系管理员！");
          setLoading(false);
        }
      } else if (mxnzp && mxnzp.code === 10027) {
        vm.$modal.msgWarning("暂未开奖，请晚些时候再查询！");
        setLoading(false);
      } else {
        vm.$modal.msgWarning(
          `第三方站点开奖号码查询失败！报错信息：${mxnzp && mxnzp.msg}`
        );
        setLoading(false);
      }
    })
    .catch((error) => {
      console.error("查询中奖信息异常：" + (error && (error.msg || error)));
      vm.$modal.msgWarning("查询中奖信息查询接口配置项失败！");
      setLoading(false);
    });
}

// 格式化开奖号码：把 mxnzp 的「逗号+加号」转成「逗号+横杠」，再落库
function formatWinningNumber(
  vm,
  winNum,
  nType,
  lid,
  setLoading,
  refresh,
  presenter
) {
  const numType = Number(nType);
  const originalString = winNum.replace(/\+/, "-").replace(/\+/, ",");
  const splitByDash = originalString.split("-");
  const firstArray = splitByDash[0]
    .split(",")
    .map(Number)
    .sort((a, b) => a - b);
  const secondArray = splitByDash[1]
    .split(",")
    .map(Number)
    .sort((a, b) => a - b);
  const resultString = firstArray.join(",") + "-" + secondArray.join(",");
  saveWinningNumber(
    vm,
    resultString,
    numType,
    lid,
    setLoading,
    refresh,
    presenter
  );
}

// 落库 winningNumber，成功后校验中奖
function saveWinningNumber(
  vm,
  winNum,
  nType,
  lid,
  setLoading,
  refresh,
  presenter
) {
  const numType = Number(nType);
  updateLog({ lotteryId: lid, winningNumber: winNum })
    .then((res) => {
      if (res && res.code === 200) {
        checkIsGetReward(vm, winNum, numType, lid, refresh, presenter);
      } else {
        present(presenter, "close");
        vm.$modal.msgWarning("开奖号码保存失败！");
      }
    })
    .finally(() => {
      setLoading(false);
    });
}

// 拉取详情并逐注校验中奖，命中弹确认框
function checkIsGetReward(vm, winNum, numTp, logId, refresh, presenter) {
  const numType = Number(numTp);
  // 进入匹配阶段：开奖号码逐个揭晓动效
  present(presenter, "showMatching", { winNum, numType });
  const isDynamic = (type, level) =>
    !!(
      DYNAMIC_PRIZE_LEVELS[type] && DYNAMIC_PRIZE_LEVELS[type].includes(level)
    );

  getLog(logId)
    .then((res) => {
      if (res && res.code === 200 && res.data) {
        const recordNumStrList =
          (res.data.recordNumber && String(res.data.recordNumber).split("/")) ||
          [];
        const chaseNumStrList =
          (res.data.chaseNumber && String(res.data.chaseNumber).split("/")) ||
          [];
        const winDetails = [];

        recordNumStrList.forEach((item) => {
          const resultTmp = checkLotteryResult(numType, item, winNum);
          if (resultTmp && resultTmp.prizeLevel > 0) {
            winDetails.push({
              source: "购买号码",
              num: item,
              prizeText: resultTmp.prizeText,
              prizeAmount: resultTmp.prizeAmount,
              dynamic: isDynamic(numType, resultTmp.prizeLevel),
            });
          }
        });
        chaseNumStrList.forEach((item) => {
          const resultTmp = checkLotteryResult(numType, item, winNum);
          if (resultTmp && resultTmp.prizeLevel > 0) {
            winDetails.push({
              source: "固定追号",
              num: item,
              prizeText: resultTmp.prizeText,
              prizeAmount: resultTmp.prizeAmount,
              dynamic: isDynamic(numType, resultTmp.prizeLevel),
            });
          }
        });

        const totalRewardCount = winDetails.length;
        const totalRewardPrize = winDetails.reduce(
          (sum, d) => sum + d.prizeAmount,
          0
        );
        const hasDynamic = winDetails.some((d) => d.dynamic);

        if (totalRewardCount > 0) {
          const numTypeText = LOTTERY_TYPE_TEXT[numType] || "";
          // 中奖详情行：来源改色块标签、号码等宽、奖级与金额对齐，配色与新动效组件一致
          const detailRows = winDetails
            .map(
              (d, i) => `
                <li style="display:flex;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px dashed #eef3f0;">
                  <span style="color:#909399;font-size:12px;margin-right:6px;">${
                    i + 1
                  }</span>
                  <span style="display:inline-block;padding:1px 7px;margin-right:6px;border-radius:4px;background:#e7f8ee;color:#27ad60;font-size:12px;font-weight:600;">${
                    d.source
                  }</span>
                  <span style="color:#2b3a36;font-family:Menlo,Monaco,monospace;letter-spacing:0.02em;">${formatNumDisplay(
                    d.num
                  )}</span>
                  <span style="color:#b9c4be;margin:0 6px;">—</span>
                  <span style="color:#e6a23c;font-weight:600;">${
                    d.prizeText
                  }</span>
                  <span style="margin-left:6px;color:#ff5a5f;font-weight:700;">￥${
                    d.prizeAmount
                  }</span>
                  ${
                    d.dynamic
                      ? '<span style="margin-left:4px;color:#909399;font-size:11px;">（动态）</span>'
                      : ""
                  }
                </li>`
            )
            .join("");
          const dynamicTip = hasDynamic
            ? `<p style="color:#e6a23c;font-size:12px;margin:6px 0 0;">* 动态奖金为行情参考值，实际以官方公布为准</p>`
            : "";
          // 中奖：先关闭动效组件，关闭后再沿用原中奖信息确认弹窗
          const showWinPopup = () => {
            vm.$confirm("", "恭喜您中奖了！", {
              confirmButtonText: "保存",
              cancelButtonText: "取消",
              dangerouslyUseHTMLString: true,
              message: `
                <div style="font-size:14px;">
                  <p style="margin:0 0 10px;">
                    本期所购
                    <strong style="color:#27ad60;">${numTypeText}</strong>
                    共
                    <strong style="color:#ff5a5f;font-size:16px;">${totalRewardCount}</strong>
                    注号码中奖
                  </p>
                  <ul style="padding-left:0;margin:0 0 10px;list-style:none;">${detailRows}</ul>
                  <p style="margin:8px 0 4px;">
                    合计预计奖金
                    <strong style="color:#ff5a5f;font-size:18px;margin-left:4px;">￥${totalRewardPrize}</strong>
                    ${
                      hasDynamic
                        ? '<span style="color:#e6a23c;font-size:12px;">（含动态奖金）</span>'
                        : ""
                    }
                  </p>
                  ${dynamicTip}
                  <p style="margin:10px 0 0;color:#7c8b84;font-size:13px;">是否需要为您记录中奖信息？</p>
                </div>`,
            })
              .then(() => {
                saveRewardInfo(vm, logId, "Y", totalRewardPrize, refresh);
              })
              .catch(() => {
                refresh();
              });
          };
          const closer = present(presenter, "close");
          if (closer) {
            closer.then(showWinPopup);
          } else {
            showWinPopup();
          }
        } else {
          // 未中奖：参照中奖记录的落库逻辑记录本期结果（isWin=N、中奖金额归零），成功时静默
          saveRewardInfo(vm, logId, "N", 0, refresh, true);
          // 未中奖改用温柔安慰动效（无动效组件时回退原成功提示）
          if (presenter) {
            presenter.showNoWin();
          } else {
            vm.$modal.alertSuccess("开奖号码保存成功！本期未中奖！");
          }
        }
      } else {
        present(presenter, "close");
        vm.$modal.msgError(
          "开奖号码保存成功，但是未查询到本期购买记录！请联系管理员！"
        );
        refresh();
      }
    })
    .catch((error) => {
      console.error("查询历史号码详情接口异常：" + error);
      present(presenter, "close");
      refresh();
    });
}

// 保存中奖信息（isWin / winningPrice）：中奖与未中奖记录共用同一落库逻辑，
// silentSuccess 为 true 时（未中奖）成功不弹提示，避免打扰安慰动效
function saveRewardInfo(vm, lotteryId, isWin, winningPrice, refresh, silentSuccess) {
  updateLog({ lotteryId, isWin, winningPrice }).then((res) => {
    if (res && res.code === 200) {
      if (!silentSuccess) {
        vm.$modal.msgSuccess("中奖信息保存成功！");
      }
    } else {
      vm.$modal.msgWarning("中奖信息保存失败！");
    }
    refresh();
  });
}
