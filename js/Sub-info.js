/*
 * 由@Rabbit-Spec编写
 * 原脚本地址：https://raw.githubusercontent.com/Rabbit-Spec/Surge/Master/Module/Panel/Sub-info/Moore/Sub-info.js
 * 由@zongsforce修改
 * 更新日期：2024.03.06
 * 版本：1.1
*/

let args = getArgs();

(async () => {
  let info = await getDataInfo(args.url);
  if (!info) $done();

  let used = info.download + info.upload;
  let total = info.total;
  let expire = args.expire || info.expire;
  let content = [`用量：${bytesToSize(used)} | ${bytesToSize(total)}`];

  if (expire && expire !== "false") {
    if (/^[\d.]+$/.test(expire)) expire *= 1000;
    expire = expire - 28800000;
    let expireDate = formatTime(expire);
    let resetDayLeft = getRemainingDays(expire);
    content.push(`重置：剩余${formatRemainingTime(resetDayLeft)}`);
    content.push(`到期：${expireDate}`);
  }

  let now = new Date();
  let hour = now.getHours();
  let minutes = now.getMinutes();
  hour = hour > 9 ? hour : "0" + hour;
  minutes = minutes > 9 ? minutes : "0" + minutes;

  $done({
    title: `${args.title} | ${hour}:${minutes}`,
    content: content.join("\n"),
    icon: args.icon || "airplane.circle",
    "icon-color": args.color || "#007aff",
  });
})();

function getArgs() {
  return Object.fromEntries(
    $argument
      .split("&")
      .map((item) => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );
}

function getUserInfo(url) {
  let method = args.method || "head";
  let request = { headers: { "User-Agent": "Quantumult%20X" }, url };
  return new Promise((resolve, reject) =>
    $httpClient[method](request, (err, resp) => {
      if (err != null) {
        reject(err);
        return;
      }
      if (resp.status !== 200) {
        reject(resp.status);
        return;
      }
      let header = Object.keys(resp.headers).find(
        (key) => key.toLowerCase() === "subscription-userinfo"
      );
      if (header) {
        resolve(resp.headers[header]);
        return;
      }
      reject("链接响应头不带有流量信息");
    })
  );
}

async function getDataInfo(url) {
  const [err, data] = await getUserInfo(url)
    .then((data) => [null, data])
    .catch((err) => [err, null]);
  if (err) {
    console.log(err);
    return;
  }

  return Object.fromEntries(
    data
      .match(/\w+=[\d.eE+-]+/g)
      .map((item) => item.split("="))
      .map(([k, v]) => [k, Number(v)])
  );
}

function getRemainingDays(expireTime) {
  const today = new Date();
  const targetDate = new Date(expireTime);
  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in one day
  const diffDays = Math.abs((targetDate - today) / oneDay);
  const remainder = (diffDays % 31);
  return remainder;
}

function bytesToSize(bytes) {
  if (bytes === 0) return "0B";
  let k = 1024;
  sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

function formatTime(time) {
  let dateObj = new Date(time);
  let year = dateObj.getFullYear();
  let month = dateObj.getMonth() + 1;
  let day = dateObj.getDate();
  let hour = dateObj.getHours();
  let minute = dateObj.getMinutes();

  return `${year}年${month}月${day}日 ${hour}时${minute}分`;
}

function formatRemainingTime(resetDayLeft) {
  if (resetDayLeft >= 1) {
    // resetDayLeft大于等于1，直接返回天数
    return `${resetDayLeft.toFixed(2)}天`;
  } else if (resetDayLeft * 24 >= 1) {
    // resetDayLeft小于1但resetDayLeft*24大于等于1，返回小时
    return `${(resetDayLeft * 24).toFixed(2)}小时`;
  } else {
    // resetDayLeft小于1且resetDayLeft*24小于1，返回分钟
    return `${(resetDayLeft * 24 * 60).toFixed(2)}分钟`;
  }
}
