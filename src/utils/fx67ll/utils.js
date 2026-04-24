import CryptoJS from "crypto-js";

// 将对象数组中每一个对象属性值为 null 的属性值设置为 '-'
export function formatObjectArrayNullProperty(arr, isNeedNumZero) {
  // 创建一个新的数组，用于存储处理后的对象
  var newArr = [];
  // 遍历原数组中的每个对象
  for (var i = 0; i < arr.length; i++) {
    var newObj = {};
    // 遍历当前对象的属性
    for (var key in arr[i]) {
      // 检查属性值是否为 null
      if (arr[i].hasOwnProperty(key) && !arr[i][key]) {
        // 将属性值为 null 的属性设置为 '-'
        const isNeedNumZero = isNeedNumZero || false;
        newObj[key] = isNeedNumZero ? 0 : "-";
      } else {
        // 其他情况下，保持原有属性值不变
        newObj[key] = arr[i][key];
      }
    }
    // 将处理后的对象添加到新数组中
    newArr.push(newObj);
  }
  // 返回处理后的新数组
  return newArr;
}

// 加密函数
export function encryptString(plainText, key) {
  const encrypted = CryptoJS.AES.encrypt(plainText, key).toString();
  return encrypted;
}

// 解密函数
export function decryptString(encryptedText, key) {
  const decryptedBytes = CryptoJS.AES.decrypt(encryptedText, key);
  const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
  return decryptedText;
}

// 返回双色球和大乐透的中奖信息
export function checkLotteryResultForSSQDLT(
  lotteryType,
  recordNumStr,
  winNumStr
) {
  const frontNumbers = recordNumStr.split("-")[0].split(",");
  const backNumbers = recordNumStr.split("-")[1].split(",");
  const winningFrontNumbers = winNumStr.split("-")[0].split(",");
  const winningBackNumbers = winNumStr.split("-")[1].split(",");

  // console.log(lotteryType, frontNumbers, backNumbers, winningFrontNumbers, winningBackNumbers);

  const result = {
    prizeLevel: 0,
    prizeText: "",
    prizeAmount: 0,
  };

  const frontMatchCount = frontNumbers.filter((num) =>
    winningFrontNumbers.includes(num)
  ).length;
  const backMatchCount = backNumbers.filter((num) =>
    winningBackNumbers.includes(num)
  ).length;
  const totalMatchCount = frontMatchCount + backMatchCount;

  if (lotteryType === 1) {
    // 一等奖奖金为浮动奖金
    // 二等奖奖金为浮动奖金
    // 三等奖固定奖金10000元
    // 四等奖固定奖金3000元
    // 五等奖固定奖金300元
    // 六等奖固定奖金200元
    // 七等奖固定奖金100元
    // 八等奖固定奖金15元
    // 九等奖固定奖金5元
    switch (totalMatchCount) {
      case 7:
        result.prizeLevel = 1;
        result.prizeText = "一等奖";
        result.prizeAmount = 10000000;
        break;
      case 6:
        if (backMatchCount === 2) {
          result.prizeLevel = 4;
          result.prizeText = "四等奖";
          result.prizeAmount = 3000;
        } else if (backMatchCount === 1) {
          result.prizeLevel = 2;
          result.prizeText = "二等奖";
          result.prizeAmount = 5000000;
        }
        break;
      case 5:
        if (backMatchCount === 2) {
          result.prizeLevel = 6;
          result.prizeText = "六等奖";
          result.prizeAmount = 200;
        } else if (backMatchCount === 1) {
          result.prizeLevel = 5;
          result.prizeText = "五等奖";
          result.prizeAmount = 300;
        } else {
          result.prizeLevel = 5;
          result.prizeText = "三等奖";
          result.prizeAmount = 10000;
        }
        break;
      case 4:
        if (backMatchCount > 0) {
          result.prizeLevel = 8;
          result.prizeText = "八等奖";
          result.prizeAmount = 15;
        } else {
          result.prizeLevel = 7;
          result.prizeText = "七等奖";
          result.prizeAmount = 100;
        }
        break;
      case 3:
        result.prizeLevel = 9;
        result.prizeText = "九等奖";
        result.prizeAmount = 5;
        break;
      case 2:
        if (backMatchCount === 2) {
          result.prizeLevel = 9;
          result.prizeText = "九等奖";
          result.prizeAmount = 5;
        }
        break;
      default:
        result.prizeText = "未中奖";
        break;
    }
  }

  if (lotteryType === 2) {
    // 一等奖奖金为浮动奖金
    // 二等奖奖金为浮动奖金
    // 三等奖固定奖金3000元
    // 四等奖固定奖金200元
    // 五等奖固定奖金10元
    // 六等奖固定奖金5元
    switch (totalMatchCount) {
      case 7:
        result.prizeLevel = 1;
        result.prizeText = "一等奖";
        result.prizeAmount = 5000000;
        break;
      case 6:
        if (backMatchCount === 1) {
          result.prizeLevel = 3;
          result.prizeText = "三等奖";
          result.prizeAmount = 3000;
        } else {
          result.prizeLevel = 2;
          result.prizeText = "二等奖";
          result.prizeAmount = 100000;
        }
        break;
      case 5:
        result.prizeLevel = 4;
        result.prizeText = "四等奖";
        result.prizeAmount = 200;
        break;
      case 4:
        result.prizeLevel = 5;
        result.prizeText = "五等奖";
        result.prizeAmount = 10;
        break;
      case 3:
        if (backMatchCount === 1) {
          result.prizeLevel = 6;
          result.prizeText = "六等奖";
          result.prizeAmount = 5;
        }
        break;
      case 2:
        if (backMatchCount === 1) {
          result.prizeLevel = 6;
          result.prizeText = "六等奖";
          result.prizeAmount = 5;
        }
        break;
      case 1:
        if (backMatchCount === 1) {
          result.prizeLevel = 6;
          result.prizeText = "六等奖";
          result.prizeAmount = 5;
        }
        break;
      default:
        result.prizeText = "未中奖";
        break;
    }
  }

  // console.log(result);
  return result;
}

// 返回七星彩的中奖信息
export function checkLotteryResultForPL7(recordNumStr, winNumStr) {
  // 初始化结果对象（与参考方法结构保持一致）
  const result = {
    prizeLevel: 0,
    prizeText: "",
    prizeAmount: 0,
  };

  // 1. 号码拆分
  // 拆分投注号码：前6位（0-9）+后1位（0-14），逗号分隔的7位数字字符串
  const recordNumbers = recordNumStr
    .split(",")
    .filter((num) => num.trim() !== "");
  const winningNumbers = winNumStr
    .split(",")
    .filter((num) => num.trim() !== "");

  // 拆分前区（前6位）和后区（最后1位）
  const recordFront = recordNumbers.slice(0, 6);
  const recordBack = recordNumbers[6];
  const winFront = winningNumbers.slice(0, 6);
  const winBack = winningNumbers[6];

  // 2. 统计对位匹配数量
  // 前区（前6位）对位匹配数（核心：对位不连续）
  let frontMatchCount = 0;
  for (let i = 0; i < 6; i++) {
    if (recordFront[i] === winFront[i]) {
      frontMatchCount++;
    }
  }
  // 后区（最后1位）匹配数（0或1）
  const backMatchCount = recordBack === winBack ? 1 : 0;

  // 3. 按官方规则判定奖级
  // 一等奖：7位全中（前6位全中+后区中）
  if (frontMatchCount === 6 && backMatchCount === 1) {
    result.prizeLevel = 1;
    result.prizeText = "一等奖";
    result.prizeAmount = 5000000; // 浮动奖金，暂设最高限额
  }
  // 二等奖：前6位全中，后区不中
  else if (frontMatchCount === 6 && backMatchCount === 0) {
    result.prizeLevel = 2;
    result.prizeText = "二等奖";
    result.prizeAmount = 1000000; // 浮动奖金，暂设参考值
  }
  // 三等奖：前6位中5个+后区中
  else if (frontMatchCount === 5 && backMatchCount === 1) {
    result.prizeLevel = 3;
    result.prizeText = "三等奖";
    result.prizeAmount = 3000; // 固定奖金
  }
  // 四等奖：前6位中5个+后区不中 或 前6位中4个+后区中
  else if (
    (frontMatchCount === 5 && backMatchCount === 0) ||
    (frontMatchCount === 4 && backMatchCount === 1)
  ) {
    result.prizeLevel = 4;
    result.prizeText = "四等奖";
    result.prizeAmount = 500; // 固定奖金
  }
  // 五等奖：前6位中4个+后区不中 或 前6位中3个+后区中
  else if (
    (frontMatchCount === 4 && backMatchCount === 0) ||
    (frontMatchCount === 3 && backMatchCount === 1)
  ) {
    result.prizeLevel = 5;
    result.prizeText = "五等奖";
    result.prizeAmount = 20; // 固定奖金
  }
  // 六等奖：前6位中3个+后区不中 / 前2中+后中 / 前1中+后中 / 前0中+后中
  else if (
    (frontMatchCount === 3 && backMatchCount === 0) ||
    (frontMatchCount === 2 && backMatchCount === 1) ||
    (frontMatchCount === 1 && backMatchCount === 1) ||
    (frontMatchCount === 0 && backMatchCount === 1)
  ) {
    result.prizeLevel = 6;
    result.prizeText = "六等奖";
    result.prizeAmount = 5; // 固定奖金
  }
  // 未中奖
  else {
    result.prizeText = "未中奖";
  }

  return result;
}

// 返回排列三/排列五的中奖信息（仅处理全匹配中奖场景）
export function checkLotteryResultForPL35(
  lotteryType,
  recordNumStr,
  winNumStr
) {
  // 初始化结果对象（与双色球/大乐透方法结构完全一致）
  const result = {
    prizeLevel: 0,
    prizeText: "",
    prizeAmount: 0,
  };

  // 1. 号码拆分（排列三/五无前后区，直接按逗号拆分）
  const recordNumbers = recordNumStr
    .split(",")
    .filter((num) => num.trim() !== "");
  const winningNumbers = winNumStr
    .split(",")
    .filter((num) => num.trim() !== "");

  // 2. 全匹配判定（核心逻辑：按位完全一致）
  const isFullMatch =
    recordNumbers.every((num, index) => num === winningNumbers[index]) &&
    recordNumbers.length === winningNumbers.length;

  // 3. 按彩种类型判定奖项（仅全匹配中奖）
  if (lotteryType === 3 && isFullMatch) {
    // 排列三：3位全匹配=一等奖，奖金1040元
    result.prizeLevel = 1;
    result.prizeText = "一等奖";
    result.prizeAmount = 1040;
  }
  if (lotteryType === 4 && isFullMatch) {
    // 排列五：5位全匹配=一等奖，奖金100000元
    result.prizeLevel = 1;
    result.prizeText = "一等奖";
    result.prizeAmount = 100000;
  }
  return result;
}

// 返回中奖信息通用入口
export function checkLotteryResult(lotteryType, recordNumStr, winNumStr) {
  switch (lotteryType) {
    case 1: // 大乐透
    case "1": // 大乐透
    case 2: // 双色球
    case "2": // 双色球
      return checkLotteryResultForSSQDLT(lotteryType, recordNumStr, winNumStr);
    case 3: // 排列三
    case "3": // 排列三
    case 4: // 排列五
    case "4": // 排列五
      return checkLotteryResultForPL35(lotteryType, recordNumStr, winNumStr);
    case 5: // 七星彩
    case "5": // 七星彩
      return checkLotteryResultForPL7(recordNumStr, winNumStr);
    default:
      return { prizeLevel: 0, prizeText: "不支持的彩种类型", prizeAmount: 0 };
  }
}

/**
 * 校验单注彩票字符串是否符合对应格式
 * @param {number} lotteryType - 彩票类型：1(大乐透)、2(双色球)、3(排列三)、4(排列五)、5(七星彩)
 * @param {string} lotteryStr - 待校验的单注彩票字符串
 * @returns {boolean} 校验结果：true=符合，false=不符合
 */
export function validateLotteryString(lotteryType, lotteryStr) {
  // 1. 基础参数校验
  if (![1, 2, 3, 4, 5].includes(Number(lotteryType))) {
    return false;
  }

  // 2. 去除首尾空格
  lotteryStr = lotteryStr.trim();
  if (lotteryStr.length === 0) return false;

  // 3. 定义各类型的校验规则
  const lotteryRules = {
    1: {
      // 大乐透
      splitChar: "-", // 前后区分隔符
      partCount: 2, // 分隔后部分数量
      numCounts: [5, 2], // 每部分的数字数量
      numRanges: [
        [1, 35],
        [1, 12],
      ], // 每部分数字的范围
      noRepeat: [true, true], // 每部分是否禁止数字重复
      ascending: [true, true], // 每部分是否必须升序排列
    },
    2: {
      // 双色球
      splitChar: "-",
      partCount: 2,
      numCounts: [6, 1],
      numRanges: [
        [1, 33],
        [1, 16],
      ],
      noRepeat: [true, false],
      ascending: [true, false],
    },
    3: {
      // 排列三
      splitChar: null,
      partCount: 1,
      numCounts: [3],
      numRanges: [[0, 9]],
      noRepeat: [false],
      ascending: [false],
    },
    4: {
      // 排列五
      splitChar: null,
      partCount: 1,
      numCounts: [5],
      numRanges: [[0, 9]],
      noRepeat: [false],
      ascending: [false],
    },
    5: {
      // 七星彩
      splitChar: null,
      partCount: 1,
      numCounts: [7],
      numRanges: [[0, 9]],
      noRepeat: [false],
      ascending: [false],
    },
  };

  const rule = lotteryRules[lotteryType];
  if (!rule) return false;

  try {
    // 4. 拦截首尾带分隔符的情况
    if (rule.splitChar) {
      if (
        lotteryStr.startsWith(rule.splitChar) ||
        lotteryStr.endsWith(rule.splitChar)
      ) {
        return false;
      }
    }

    // 5. 拆分字符串
    let parts = rule.splitChar
      ? lotteryStr.split(rule.splitChar)
      : [lotteryStr];

    // 检查分隔符数量
    if (rule.splitChar) {
      const splitCount = (
        lotteryStr.match(new RegExp(`\\${rule.splitChar}`, "g")) || []
      ).length;
      if (splitCount !== rule.partCount - 1) return false;
    }

    if (parts.length !== rule.partCount) return false;

    // 6. 遍历校验每个部分
    for (let i = 0; i < parts.length; i++) {
      const partStr = parts[i].trim();
      if (partStr === "") return false;

      const numStrList = partStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");
      if (numStrList.length !== rule.numCounts[i]) return false;

      // 校验数字格式（禁止前导零）
      const numList = numStrList.map((numStr) => {
        if (!/^(0|[1-9]\d*)$/.test(numStr))
          throw new Error("Invalid number format");
        const num = parseInt(numStr, 10);
        if (isNaN(num) || !Number.isInteger(num))
          throw new Error("Not an integer");
        return num;
      });

      // 校验范围
      const [min, max] = rule.numRanges[i];
      if (!numList.every((num) => num >= min && num <= max)) return false;

      // 校验重复
      if (rule.noRepeat[i]) {
        if (new Set(numList).size !== numList.length) return false;
      }

      // 校验升序
      if (rule.ascending[i]) {
        for (let j = 1; j < numList.length; j++) {
          if (numList[j] <= numList[j - 1]) return false;
        }
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 校验多注彩票字符串（使用 / 拼接）
 * @param {number} lotteryType - 彩票类型
 * @param {string} multiLotteryStr - 待校验的多注字符串
 * @returns {boolean} 校验结果
 */
export function validateMultiLotteryString(lotteryType, multiLotteryStr) {
  if (!multiLotteryStr || typeof multiLotteryStr !== "string") return false;

  const trimmedStr = multiLotteryStr.trim();
  if (trimmedStr.length === 0) return false;

  // 拦截首尾的 /
  if (trimmedStr.startsWith("/") || trimmedStr.endsWith("/")) return false;

  // 拆分多注
  const tickets = trimmedStr
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s !== "");

  // 必须至少有一注
  if (tickets.length === 0) return false;

  // 逐注校验
  return tickets.every((ticket) => validateLotteryString(lotteryType, ticket));
}

// 通用转换方法
export function arrayToMap(arr) {
  return arr.reduce((map, item) => {
    map[item.value] = item.label;
    return map;
  }, {});
}

/**
 * 通用字符串处理方法：如果字符串末尾存在指定后缀（不区分大小写），截取后缀之前的字符串
 * @param {string} str - 待处理的原始字符串
 * @param {string} suffix - 要匹配的后缀（如 "Id"、"Name"）
 * @returns {string} 处理后的字符串（无匹配后缀/非字符串/截取后为空则返回原字符串）
 */
export function trimSuffixFromEnd(str, suffix) {
  // 1. 入参校验：非字符串/空字符串/后缀为空，直接返回原字符串
  if (
    typeof str !== "string" ||
    str.trim() === "" ||
    typeof suffix !== "string" ||
    suffix.trim() === ""
  ) {
    return str;
  }

  const trimmedStr = str.trim();
  const trimmedSuffix = suffix.trim();
  // 2. 构造不区分大小写的正则（匹配字符串末尾的指定后缀）
  const suffixRegex = new RegExp(trimmedSuffix + "$", "i");

  // 3. 匹配后缀并截取
  if (suffixRegex.test(trimmedStr)) {
    const result = trimmedStr.replace(suffixRegex, "");
    // 防止截取后为空（如 str="Id"，suffix="Id"），返回原字符串
    return result || trimmedStr;
  }

  // 4. 无匹配后缀，返回原字符串
  return trimmedStr;
}

/**
 * 确定性随机选择器（基于种子）
 * @param {Array} array - 原始数组
 * @param {number} k - 需要选取的数量
 * @param {number} seed - 随机种子
 * @returns {Array} 随机选取的k个元素
 */
function deterministicSelect(array, k, seed) {
  const arr = [...array];
  let s = seed >>> 0; // 转为无符号32位整数
  const rng = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(rng() * (arr.length - i));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, k);
}

/**
 * 从指定分组中选取指定位数的号码
 * @param {Array} group - 数据分组
 * @param {number} needCount - 需要选取的号码数量
 * @param {string} sortOrder - 排序方式 ('desc' 高频, 'asc' 低频)
 * @param {number} dayOfYear - 日期天数（0-366），无效值自动转为0
 * @returns {Array} 排序后的号码数组
 */
function getLotteryNumberByTypeZone(group, needCount, sortOrder, dayOfYear) {
  // 按出现次数排序
  const sortedGroup = [...group].sort((a, b) =>
    sortOrder === "desc"
      ? b.occurrenceCount - a.occurrenceCount
      : a.occurrenceCount - b.occurrenceCount
  );

  const result = [];
  for (let i = 0; i < sortedGroup.length; i++) {
    if (result.length >= needCount) break;

    const item = sortedGroup[i];
    const numbers = item.numbers.split(",").map((n) => n.trim());
    const remaining = needCount - result.length;

    if (numbers.length <= remaining) {
      result.push(...numbers);
    } else {
      // 确定性随机选择
      const seed = dayOfYear * 10000 + i;
      const selected = deterministicSelect(numbers, remaining, seed);
      result.push(...selected);
    }
  }

  return result.map((n) => parseInt(n)).sort((a, b) => a - b);
}

/**
 * 生成高频/低频号码组合
 * @param {Object} data - 接口返回的原始数据
 * @param {number} [dayOfYear] - 日期天数（0-366），无效时自动当作0（固定随机）
 * @returns {Object} 四组号码
 */
export function getLotteryNumberByFrequency(data, dayOfYear) {
  // 规范化：有效数字且 0-366 范围内则保留，否则使用 0
  let normalized = 0;
  if (typeof dayOfYear === "number" && !isNaN(dayOfYear)) {
    const d = Math.floor(dayOfYear);
    if (d >= 0 && d <= 366) normalized = d;
  }

  const groups = {
    DLTFront: [],
    DLTBack: [],
    SSQFront: [],
    SSQBack: [],
  };

  data.rows.forEach((item) => {
    if (item.numberType === 1) {
      item.zone === "前区"
        ? groups.DLTFront.push(item)
        : groups.DLTBack.push(item);
    } else {
      item.zone === "前区"
        ? groups.SSQFront.push(item)
        : groups.SSQBack.push(item);
    }
  });

  return {
    lotteryDLTHighFrequency: [
      ...getLotteryNumberByTypeZone(groups.DLTFront, 5, "desc", normalized),
      ...getLotteryNumberByTypeZone(groups.DLTBack, 2, "desc", normalized),
    ],
    lotteryDLTLowFrequency: [
      ...getLotteryNumberByTypeZone(groups.DLTFront, 5, "asc", normalized),
      ...getLotteryNumberByTypeZone(groups.DLTBack, 2, "asc", normalized),
    ],
    lotterySSQHighFrequency: [
      ...getLotteryNumberByTypeZone(groups.SSQFront, 6, "desc", normalized),
      ...getLotteryNumberByTypeZone(groups.SSQBack, 1, "desc", normalized),
    ],
    lotterySSQLowFrequency: [
      ...getLotteryNumberByTypeZone(groups.SSQFront, 6, "asc", normalized),
      ...getLotteryNumberByTypeZone(groups.SSQBack, 1, "asc", normalized),
    ],
  };
}

/**
 * 计算垂直居中偏移高度
 * @param {number} fixedHeight - 固定高度参数
 * @returns {string} 计算后带px单位的字符串
 */
export function getDialogVerticalOffset(fixedHeight) {
  // 🔥 这就是：当前浏览器页面的纯可视高度（不含浏览器边框/地址栏）
  const viewHeight = document.documentElement.clientHeight || 0;
  if (viewHeight <= fixedHeight + 90) {
    return "23px";
  }

  // 计算：(页面可视高度 - 固定高度) / 2，100是弹窗固定的上下margin
  return `${(viewHeight - fixedHeight - 90) / 2 - 10}px`;
}
