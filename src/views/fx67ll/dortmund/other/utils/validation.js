/*
 * Dortmund 业务字段通用校验规则。
 * 业务常量统一来自 config/moduleConfig.js，本文件只保留表格和表单共用的校验函数。
 */

import {
  DORTMUND_LIMITS,
  DORTMUND_MATCH_RESULT_OPTIONS,
  DORTMUND_NUMERIC,
  DORTMUND_ODDS_RESULT_OPTIONS,
  DORTMUND_SEASON_STATUS_OPTIONS,
  DORTMUND_SIM_MODE_OPTIONS,
  DORTMUND_STATUS_OPTIONS,
  DORTMUND_YES_NO_OPTIONS,
} from "../config/moduleConfig";

export {
  DORTMUND_LIMITS,
  DORTMUND_MATCH_RESULT_OPTIONS,
  DORTMUND_ODDS_RESULT_OPTIONS,
  DORTMUND_SEASON_STATUS_OPTIONS,
  DORTMUND_SIM_MODE_OPTIONS,
  DORTMUND_STATUS_OPTIONS,
  DORTMUND_YES_NO_OPTIONS,
};

const DECIMAL_PATTERN = /^-?\d+(?:\.\d+)?$/;
const INTEGER_PATTERN = /^-?\d+$/;

function isBlank(value) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  );
}

function textLength(value) {
  return Array.from(String(value)).length;
}

// 将数值格式化为普通十进制文本，无法安全格式化时回退，避免科学计数法进入接口或展示
export function formatPlainDecimal(
  value,
  fractionDigits = DORTMUND_NUMERIC.defaultDecimalFractionDigits,
  fallback = ""
) {
  const numeric = Number(value);
  if (
    !Number.isFinite(numeric) ||
    !Number.isInteger(fractionDigits) ||
    fractionDigits < 0 ||
    fractionDigits > DORTMUND_NUMERIC.maxSupportedFractionDigits
  ) {
    return fallback;
  }
  const text = numeric.toFixed(fractionDigits);
  return /^-?\d+(?:\.\d+)?$/.test(text) ? text : fallback;
}

export function trimText(value) {
  return isBlank(value) ? null : String(value).trim();
}

export function trimTextFields(source, fields) {
  const target = { ...source };
  fields.forEach((field) => {
    target[field] = trimText(target[field]);
  });
  return target;
}

export function requiredTextRule(label, maxLength) {
  return {
    required: true,
    validator: (rule, value, callback) => {
      if (isBlank(value)) {
        callback(new Error(`${label}不能为空`));
        return;
      }
      if (maxLength && textLength(String(value).trim()) > maxLength) {
        callback(new Error(`${label}不能超过${maxLength}个字符`));
        return;
      }
      callback();
    },
    trigger: "blur",
  };
}

export function optionalTextRule(label, maxLength) {
  return {
    validator: (rule, value, callback) => {
      if (
        !isBlank(value) &&
        maxLength &&
        textLength(String(value).trim()) > maxLength
      ) {
        callback(new Error(`${label}不能超过${maxLength}个字符`));
        return;
      }
      callback();
    },
    trigger: "blur",
  };
}

export function integerRangeRule(
  label,
  min,
  max,
  required,
  forbiddenValues = []
) {
  return {
    required: Boolean(required),
    validator: (rule, value, callback) => {
      if (isBlank(value)) {
        callback(required ? new Error(`${label}不能为空`) : undefined);
        return;
      }
      const text = String(value).trim();
      if (!INTEGER_PATTERN.test(text)) {
        callback(new Error(`${label}必须为整数`));
        return;
      }
      const numeric = Number(text);
      if (!Number.isSafeInteger(numeric)) {
        callback(new Error(`${label}超出安全整数范围`));
        return;
      }
      if (min !== null && min !== undefined && numeric < min) {
        callback(new Error(`${label}不能小于${min}`));
        return;
      }
      if (max !== null && max !== undefined && numeric > max) {
        callback(new Error(`${label}不能大于${max}`));
        return;
      }
      if (forbiddenValues.includes(numeric)) {
        callback(new Error(`${label}不能为${numeric}`));
        return;
      }
      callback();
    },
    trigger: "blur",
  };
}

export function decimalRule(label, options = {}) {
  const {
    required = false,
    min = null,
    max = null,
    minExclusive = null,
    maxIntegerDigits = DORTMUND_NUMERIC.defaultDecimalIntegerDigits,
    maxFractionDigits = DORTMUND_NUMERIC.defaultDecimalFractionDigits,
    allowNegative = false,
    maxTextLength = null,
  } = options;
  return {
    required,
    validator: (rule, value, callback) => {
      if (isBlank(value)) {
        callback(required ? new Error(`${label}不能为空`) : undefined);
        return;
      }
      const text = String(value).trim();
      if (!DECIMAL_PATTERN.test(text)) {
        callback(new Error(`${label}必须为普通十进制数字，不能使用科学计数法`));
        return;
      }
      if (!allowNegative && text.charAt(0) === "-") {
        callback(new Error(`${label}不能为负数`));
        return;
      }
      if (maxTextLength && textLength(text) > maxTextLength) {
        callback(new Error(`${label}总长度不能超过${maxTextLength}个字符`));
        return;
      }
      const unsigned = text.charAt(0) === "-" ? text.slice(1) : text;
      const parts = unsigned.split(".");
      if (parts[0].replace(/^0+/, "").length > maxIntegerDigits) {
        callback(new Error(`${label}整数位不能超过${maxIntegerDigits}位`));
        return;
      }
      if (
        parts.length > 1 &&
        parts[1].replace(/0+$/, "").length > maxFractionDigits
      ) {
        callback(new Error(`${label}小数位不能超过${maxFractionDigits}位`));
        return;
      }
      if (min !== null && min !== undefined && Number(text) < min) {
        callback(new Error(`${label}不能小于${min}`));
        return;
      }
      if (
        minExclusive !== null &&
        minExclusive !== undefined &&
        Number(text) <= minExclusive
      ) {
        callback(new Error(`${label}必须大于${minExclusive}`));
        return;
      }
      if (max !== null && max !== undefined && Number(text) > max) {
        callback(new Error(`${label}不能大于${max}`));
        return;
      }
      callback();
    },
    trigger: "blur",
  };
}

export function decimalTextRule(label, required) {
  return {
    required,
    validator: (rule, value, callback) => {
      if (isBlank(value)) {
        callback(required ? new Error(`${label}不能为空`) : undefined);
        return;
      }
      const text = String(value).trim();
      if (!DECIMAL_PATTERN.test(text)) {
        callback(new Error(`${label}必须为有效十进制数字`));
        return;
      }
      if (textLength(text) > DORTMUND_NUMERIC.maxExtraTextLength) {
        callback(
          new Error(
            `${label}总长度不能超过${DORTMUND_NUMERIC.maxExtraTextLength}个字符`
          )
        );
        return;
      }
      callback();
    },
    trigger: "blur",
  };
}

export function enumRule(label, options, required) {
  return {
    required: Boolean(required),
    validator: (rule, value, callback) => {
      if (isBlank(value)) {
        callback(required ? new Error(`${label}不能为空`) : undefined);
        return;
      }
      if (!options.includes(String(value))) {
        callback(new Error(`${label}取值不正确`));
        return;
      }
      callback();
    },
    trigger: "change",
  };
}

/** 多选枚举规则：空值可选；选中值必须全部属于允许集合，提交前由页面转为逗号串。 */
export function enumListRule(label, options) {
  return {
    validator: (rule, value, callback) => {
      if (isBlank(value) || (Array.isArray(value) && value.length === 0)) {
        callback();
        return;
      }
      if (
        !Array.isArray(value) ||
        value.some((item) => !options.includes(String(item)))
      ) {
        callback(new Error(`${label}取值不正确`));
        return;
      }
      callback();
    },
    trigger: "change",
  };
}

export function dateRangeRule(label, getStart, getEnd) {
  return {
    validator: (rule, value, callback) => {
      const start = getStart();
      const end = getEnd();
      if (!isBlank(start) && !isBlank(end) && String(start) > String(end)) {
        callback(new Error(`${label}开始时间不能晚于结束时间`));
        return;
      }
      callback();
    },
    trigger: "change",
  };
}
