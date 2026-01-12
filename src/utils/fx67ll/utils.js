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
 * 校验彩票字符串是否符合对应格式
 * @param {number} lotteryType - 彩票类型：1(大乐透)、2(双色球)、3(排列三)、4(排列五)、5(七星彩)
 * @param {string} lotteryStr - 待校验的彩票字符串
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
      splitChar: "-", // 分隔符
      partCount: 2, // 分隔后部分数量
      numCounts: [5, 2], // 每部分的数字数量
      numRanges: [
        [1, 35],
        [1, 12],
      ], // 每部分数字的范围
      noRepeat: [true, true], // 每部分是否禁止数字重复
      ascending: [true, true], // 每部分是否必须升序排列
      description:
        "大乐透: 5个前区数字(1-35) + 2个后区数字(1-12)，格式: 1,2,3,4,5-6,7",
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
      noRepeat: [true, false], // 蓝球只有1个，无需校验重复
      ascending: [true, false], // 红球需升序，蓝球只有一个无需校验
      description: "双色球: 6个红球(1-33) + 1个蓝球(1-16)，格式: 1,2,3,4,5,6-7",
    },
    3: {
      // 排列三
      splitChar: null, // 无分隔符
      partCount: 1,
      numCounts: [3],
      numRanges: [[0, 9]],
      noRepeat: [false],
      ascending: [false],
      description: "排列三: 3个数字(0-9)，格式: 1,2,3",
    },
    4: {
      // 排列五
      splitChar: null,
      partCount: 1,
      numCounts: [5],
      numRanges: [[0, 9]],
      noRepeat: [false],
      ascending: [false],
      description: "排列五: 5个数字(0-9)，格式: 1,2,3,4,5",
    },
    5: {
      // 七星彩
      splitChar: null,
      partCount: 1,
      numCounts: [7],
      numRanges: [[0, 9]],
      noRepeat: [false],
      ascending: [false],
      description: "七星彩: 7个数字(0-9)，格式: 1,2,3,4,5,6,7",
    },
  };

  const rule = lotteryRules[lotteryType];
  if (!rule) return false;

  try {
    // 4. 拆分字符串并校验拆分后的部分数量
    let parts = rule.splitChar ? lotteryStr.split(rule.splitChar) : [lotteryStr];

    // 检查分隔符是否正确（防止多余的分隔符）
    if (rule.splitChar && lotteryStr.includes(rule.splitChar)) {
      // 确保分隔符两侧没有多余的分隔符
      const splitCount = (
        lotteryStr.match(new RegExp(`\\${rule.splitChar}`, "g")) || []
      ).length;
      if (splitCount !== rule.partCount - 1) {
        return false;
      }
    }

    if (parts.length !== rule.partCount) {
      return false;
    }

    // 5. 遍历每个部分，校验数字合法性
    for (let i = 0; i < parts.length; i++) {
      // 清理空格并分割
      const partStr = parts[i].trim();
      if (partStr === "") return false;

      const numStrList = partStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");

      // 校验数字数量是否匹配
      if (numStrList.length !== rule.numCounts[i]) {
        return false;
      }

      // 转换为数字并校验是否为有效整数
      const numList = numStrList.map((numStr) => {
        // 检查是否包含非数字字符
        if (!/^-?\d+$/.test(numStr)) {
          throw new Error("包含非数字字符");
        }
        const num = parseInt(numStr, 10);
        if (isNaN(num) || !Number.isInteger(num) || numStr !== num.toString()) {
          throw new Error("不是有效的整数");
        }
        return num;
      });

      // 校验数字范围
      const [min, max] = rule.numRanges[i];
      const isInRange = numList.every((num) => num >= min && num <= max);
      if (!isInRange) {
        return false;
      }

      // 校验数字是否重复（如果规则要求）
      if (rule.noRepeat[i]) {
        const uniqueNums = new Set(numList);
        if (uniqueNums.size !== numList.length) {
          return false;
        }
      }

      // 校验是否升序排列（如果规则要求）
      if (rule.ascending[i]) {
        for (let j = 1; j < numList.length; j++) {
          if (numList[j] <= numList[j - 1]) {
            return false;
          }
        }
      }
    }

    // 所有校验通过
    return true;
  } catch (error) {
    // 捕获异常，返回false
    return false;
  }
}
