/**
 * 生成随机len位数字
 * @param len 长度
 * @param isDate 是否数字后添加当前时间戳
 * @returns
 */
const getRandomString = (len: number, isDate: boolean) => {
  let random = ''
  random = Math.ceil(Math.random() * 100000000000000)
    .toString()
    .substring(0, len || 4)
  if (isDate) random = random + Date.now()
  return random
}

export default getRandomString
