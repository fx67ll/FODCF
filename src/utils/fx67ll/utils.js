import CryptoJS from "crypto-js";
import moment from "moment";

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
  const frontNumbers = recordNumStr
    .split("-")[0]
    .split(",")
    .map((n) => n.trim());
  const backNumbers = recordNumStr
    .split("-")[1]
    .split(",")
    .map((n) => n.trim());
  const winningFrontNumbers = winNumStr
    .split("-")[0]
    .split(",")
    .map((n) => n.trim());
  const winningBackNumbers = winNumStr
    .split("-")[1]
    .split(",")
    .map((n) => n.trim());

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

  if (lotteryType === 1) {
    // 超级大乐透中奖规则（前区5个1-35，后区2个1-12）
    // 一等奖：前5+后2（浮动，参考行情约1000万）
    // 二等奖：前5+后1（浮动，参考行情约50万）
    // 三等奖：前5+后0 / 前4+后2，固定5000元
    // 四等奖：前4+后1，固定300元
    // 五等奖：前4+后0 / 前3+后2，固定150元
    // 六等奖：前3+后1 / 前2+后2，固定15元
    // 七等奖：前3+后0 / 前2+后1 / 前1+后2 / 前0+后2，固定5元
    if (frontMatchCount === 5 && backMatchCount === 2) {
      result.prizeLevel = 1;
      result.prizeText = "一等奖";
      result.prizeAmount = 10000000;
    } else if (frontMatchCount === 5 && backMatchCount === 1) {
      result.prizeLevel = 2;
      result.prizeText = "二等奖";
      result.prizeAmount = 500000;
    } else if (
      (frontMatchCount === 5 && backMatchCount === 0) ||
      (frontMatchCount === 4 && backMatchCount === 2)
    ) {
      result.prizeLevel = 3;
      result.prizeText = "三等奖";
      result.prizeAmount = 5000;
    } else if (frontMatchCount === 4 && backMatchCount === 1) {
      result.prizeLevel = 4;
      result.prizeText = "四等奖";
      result.prizeAmount = 300;
    } else if (
      (frontMatchCount === 4 && backMatchCount === 0) ||
      (frontMatchCount === 3 && backMatchCount === 2)
    ) {
      result.prizeLevel = 5;
      result.prizeText = "五等奖";
      result.prizeAmount = 150;
    } else if (
      (frontMatchCount === 3 && backMatchCount === 1) ||
      (frontMatchCount === 2 && backMatchCount === 2)
    ) {
      result.prizeLevel = 6;
      result.prizeText = "六等奖";
      result.prizeAmount = 15;
    } else if (
      (frontMatchCount === 3 && backMatchCount === 0) ||
      (frontMatchCount === 2 && backMatchCount === 1) ||
      (frontMatchCount === 1 && backMatchCount === 2) ||
      (frontMatchCount === 0 && backMatchCount === 2)
    ) {
      result.prizeLevel = 7;
      result.prizeText = "七等奖";
      result.prizeAmount = 5;
    } else {
      result.prizeText = "未中奖";
    }
  }

  if (lotteryType === 2) {
    // 双色球中奖规则（前区6个1-33，后区1个1-16）
    // 一等奖：前6+后1（浮动，参考行情约500万）
    // 二等奖：前6+后0（浮动，参考行情约10万）
    // 三等奖：前5+后1，固定3000元
    // 四等奖：前5+后0 / 前4+后1，固定200元
    // 五等奖：前4+后0 / 前3+后1，固定10元
    // 六等奖：前2+后1 / 前1+后1 / 前0+后1，固定5元
    // 福运奖：前3+后0，固定5元
    if (frontMatchCount === 6 && backMatchCount === 1) {
      result.prizeLevel = 1;
      result.prizeText = "一等奖";
      result.prizeAmount = 5000000;
    } else if (frontMatchCount === 6 && backMatchCount === 0) {
      result.prizeLevel = 2;
      result.prizeText = "二等奖";
      result.prizeAmount = 100000;
    } else if (frontMatchCount === 5 && backMatchCount === 1) {
      result.prizeLevel = 3;
      result.prizeText = "三等奖";
      result.prizeAmount = 3000;
    } else if (
      (frontMatchCount === 5 && backMatchCount === 0) ||
      (frontMatchCount === 4 && backMatchCount === 1)
    ) {
      result.prizeLevel = 4;
      result.prizeText = "四等奖";
      result.prizeAmount = 200;
    } else if (
      (frontMatchCount === 4 && backMatchCount === 0) ||
      (frontMatchCount === 3 && backMatchCount === 1)
    ) {
      result.prizeLevel = 5;
      result.prizeText = "五等奖";
      result.prizeAmount = 10;
    } else if (backMatchCount === 1 && frontMatchCount <= 2) {
      result.prizeLevel = 6;
      result.prizeText = "六等奖";
      result.prizeAmount = 5;
    } else if (frontMatchCount === 3 && backMatchCount === 0) {
      result.prizeLevel = 7;
      result.prizeText = "福运奖";
      result.prizeAmount = 5;
    } else {
      result.prizeText = "未中奖";
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
  // 一等奖：前6位全中+后区中（浮动，参考行情约500万）
  // 二等奖：前6位全中+后区不中（浮动，参考行情约100万）
  // 三等奖：前5中+后区中，固定3000元
  // 四等奖：前5中+后区不中 / 前4中+后区中，固定500元
  // 五等奖：前4中+后区不中 / 前3中+后区中，固定20元
  // 六等奖：前3中+后区不中 / 前2中+后区中 / 前1中+后区中 / 前0中+后区中，固定10元
  if (frontMatchCount === 6 && backMatchCount === 1) {
    result.prizeLevel = 1;
    result.prizeText = "一等奖";
    result.prizeAmount = 5000000; // 浮动奖金，参考行情约500万
  }
  // 二等奖：前6位全中，后区不中
  else if (frontMatchCount === 6 && backMatchCount === 0) {
    result.prizeLevel = 2;
    result.prizeText = "二等奖";
    result.prizeAmount = 1000000; // 浮动奖金，参考行情约100万
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
  // 六等奖：前3中后0 / 前2中后中 / 前1中后中 / 前0中后中
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

// ===================== 期号计算相关（从 FODCA 迁移） =====================
// 以下函数用于计算彩票期号（dateCode），与 FODCA pages/lottery/index/index.vue 逻辑一致。
// dateCode 格式按彩种固定年份前缀：大乐透(type1)4位、双色球(2)/排列三(3)/排列五(4)/七星彩(5)均2位。
// 跨年判定=最近记录 createTime 年份≠今年；跨年时以今年第一期 (D1,C1) 为锚点重算。
// 注意：未迁移 isDateCodeYearMatch 同年守卫（曾导致大乐透 null），FODCF 按无守卫思路实现。

// 返回当日号码类型（大乐透/双色球），todayWeek 为 ISO 星期 1=周一…7=周日
export function mapLotteryNumberType(todayWeek) {
  if (todayWeek === "1" || todayWeek === "3" || todayWeek === "6") {
    return "1";
  } else if (todayWeek === "2" || todayWeek === "4" || todayWeek === "7") {
    return "2";
  } else {
    return "";
  }
}

// 判断当前日期是否是上一个日期的"一个开奖周期"之后（同年）
// 大乐透/双色球一周三期，相邻开奖日间隔2天、跨周末间隔3天
export function isTwoOrThreeDaysAfterWithSameYearCheck(
  previousDate,
  currentDate
) {
  if (!previousDate || !currentDate) {
    return false;
  }
  const prevDate = moment(previousDate, "YYYY-MM-DD");
  const currDate = moment(currentDate, "YYYY-MM-DD");
  if (!prevDate || !currDate) {
    return false;
  }
  if (prevDate.year() !== currDate.year()) {
    return false;
  }
  const diffDays = currDate.diff(prevDate, "days");
  let hasFriday = false;
  for (let i = 1; i < diffDays; i++) {
    if (prevDate.clone().add(i, "days").day() === 5) {
      hasFriday = true;
      break;
    }
  }
  if (hasFriday && diffDays === 3) {
    return true;
  } else if (!hasFriday && diffDays === 2) {
    return true;
  } else {
    return false;
  }
}

// 按开奖日统计两日期之间间隔的期数（type: 1大乐透 2双色球 3七星彩）
// lastNumber 传 0 时返回纯间隔期数，用于跨年分支拼回带前缀 C1
export function calculateCurrentDateCode(
  type,
  currentDateStr,
  lastDateStr,
  lastNumber
) {
  try {
    if (type !== 1 && type !== 2 && type !== 3) {
      console.error(`无效的类型参数 "${type}"。只允许 1、2 或 3。`);
      return null;
    }
    const currentDate = moment(currentDateStr);
    const lastDate = moment(lastDateStr);
    if (!currentDate.isValid()) {
      console.error(`无效的当前日期格式 "${currentDateStr}"`);
      return null;
    }
    if (!lastDate.isValid()) {
      console.error(`无效的最后记录日期格式 "${lastDateStr}"`);
      return null;
    }
    if (currentDate.isSame(lastDate, "day")) {
      return lastNumber;
    }
    if (currentDate.isBefore(lastDate)) {
      console.error(
        `当前日期 (${currentDate.format(
          "YYYY-MM-DD"
        )}) 早于最后记录日期 (${lastDate.format("YYYY-MM-DD")})`
      );
      return null;
    }
    let recordDays;
    switch (type) {
      case 1:
        recordDays = [1, 3, 6];
        break; // 周一、周三、周六
      case 2:
        recordDays = [2, 4, 0];
        break; // 周二、周四、周日
      case 3:
        recordDays = [2, 5, 0];
        break; // 周二、周五、周日（同七星彩）
      default:
        return null;
    }
    const start = lastDate.clone().add(1, "days");
    const end = currentDate.clone();
    const totalDays = end.diff(start, "days") + 1;
    const fullWeeks = Math.floor(totalDays / 7);
    const remainDays = totalDays % 7;
    const fullWeekRecords = fullWeeks * 3;
    let remainRecords = 0;
    let tempDate = start.clone();
    for (let i = 0; i < remainDays; i++) {
      const dayOfWeek = tempDate.day();
      if (recordDays.includes(dayOfWeek)) {
        remainRecords++;
      }
      tempDate.add(1, "day");
    }
    const totalRecords = parseInt(fullWeekRecords) + parseInt(remainRecords);
    return parseInt(lastNumber) + parseInt(totalRecords);
  } catch (error) {
    console.error(`计算过程中发生意外错误: ${error.message}`);
    return null;
  }
}

// 各彩种 dateCode 的年份前缀位数：大乐透4，其余2
export function getDateCodeYearLen(type) {
  switch (parseInt(type)) {
    case 1:
      return 4;
    case 2:
    case 3:
    case 4:
    case 5:
      return 2;
    default:
      return 0;
  }
}

// 获取某一年该彩种的第一个开奖日（D1），不考虑元旦休市
export function getFirstDrawDayOfYear(type, year) {
  if (parseInt(type) === 3 || parseInt(type) === 4) {
    return moment({ year: parseInt(year), month: 0, day: 1 }).startOf("day");
  }
  let recordDays;
  switch (parseInt(type)) {
    case 1:
      recordDays = [1, 3, 6];
      break;
    case 2:
      recordDays = [2, 4, 0];
      break;
    case 5:
      recordDays = [2, 5, 0];
      break;
    default:
      console.error(`getFirstDrawDayOfYear 无效的类型参数 "${type}"`);
      return null;
  }
  const firstDay = moment({ year: parseInt(year), month: 0, day: 1 }).startOf(
    "day"
  );
  for (let i = 0; i < 7; i++) {
    if (recordDays.includes(firstDay.clone().add(i, "days").day())) {
      return firstDay.clone().add(i, "days");
    }
  }
  return firstDay;
}

// 将 dateCode 按彩种前缀位数拆分为年份/序号，序号至少3位，不足返回 null
export function splitDateCodeParts(dateCode, type) {
  if (dateCode === null || dateCode === undefined || dateCode === "") {
    return null;
  }
  const codeStr = String(dateCode);
  if (!/^\d+$/.test(codeStr)) {
    return null;
  }
  const yearLen = getDateCodeYearLen(type);
  const MIN_SEQ_LEN = 3;
  if (yearLen <= 0 || codeStr.length < yearLen + MIN_SEQ_LEN) {
    return null;
  }
  const yearPart = codeStr.slice(0, yearLen);
  const seqPart = codeStr.slice(yearLen);
  if (!seqPart || seqPart.length < MIN_SEQ_LEN) {
    return null;
  }
  return { yearPart, seqPart, yearLen, seqLen: seqPart.length };
}

// 生成指定年份第一期的期号（C1）：年份直接取 currentYear，序号重置为1（位数沿用 lastDateCode）
export function buildFirstIssueCodeOfThisYear(lastDateCode, type, currentYear) {
  const parts = splitDateCodeParts(lastDateCode, type);
  if (!parts) {
    return null;
  }
  const fullYearStr = String(parseInt(currentYear, 10));
  let newYearPart;
  if (fullYearStr.length >= parts.yearLen) {
    newYearPart = fullYearStr.slice(-parts.yearLen);
  } else {
    newYearPart = fullYearStr.padStart(parts.yearLen, "0");
  }
  const newSeqPart = "1".padStart(parts.seqLen, "0");
  return newYearPart + newSeqPart;
}

// 以基准期号为起点按偏移期数递增，仅序号部分加，前缀不动
export function calcIssueCodeByOffset(baseCode, offset, type) {
  if (offset === null || offset === undefined || isNaN(offset) || offset < 0) {
    return null;
  }
  const parts = splitDateCodeParts(baseCode, type);
  if (!parts) {
    return null;
  }
  const newSeqNum = parseInt(parts.seqPart, 10) + parseInt(offset, 10);
  const newSeqPart = String(newSeqNum).padStart(parts.seqLen, "0");
  return parts.yearPart + newSeqPart;
}

// 获取某彩种从指定日期起（含）下一个开奖日（用于"今日或之后最早一期"）
// type: 1大乐透 2双色球 3排列三 4排列五 5七星彩
export function getNextDrawDayFrom(type, fromDateStr) {
  const fromDay = moment(fromDateStr, "YYYY-MM-DD").startOf("day");
  if (!fromDay.isValid()) {
    return null;
  }
  // 排列三/五每天都是开奖日，下一个就是当天
  if (parseInt(type) === 3 || parseInt(type) === 4) {
    return fromDay;
  }
  let recordDays;
  switch (parseInt(type)) {
    case 1:
      recordDays = [1, 3, 6];
      break;
    case 2:
      recordDays = [2, 4, 0];
      break;
    case 5:
      recordDays = [2, 5, 0];
      break;
    default:
      return null;
  }
  // 从当天起最多往后找 7 天，必有开奖日
  for (let i = 0; i < 7; i++) {
    if (recordDays.includes(fromDay.clone().add(i, "days").day())) {
      return fromDay.clone().add(i, "days");
    }
  }
  return fromDay;
}
