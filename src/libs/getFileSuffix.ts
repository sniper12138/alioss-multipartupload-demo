/**
 * 获取文件后缀
 * @param fileName 文件名
 * @returns 文件后缀，不带.，只返回诸如 jpg mp4 这样的后缀
 */
const getFileSuffix = (fileName: string): string => {
  const fileNameArr: string[] = String(fileName).split('.')
  const suffix: string = fileNameArr.length
    ? fileNameArr[fileNameArr.length - 1]
    : ''
  return suffix
}

export default getFileSuffix
