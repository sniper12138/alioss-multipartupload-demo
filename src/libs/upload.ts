import OSS, { type Checkpoint } from 'ali-oss'
import getFileSuffix from './getFileSuffix'
import getRandomString from './getRandomString'

export const multipartUpload = (
  ossClient: OSS,
  file: File,
  cb: (
    arg0:
      | {
          status: 'upload' | 'success'
          ossCli: OSS
          progress?: number
          url?: string
          abortCheckpoint?: Checkpoint
        }
      | false
  ) => void,
  abortCheckpoint?: Checkpoint
) => {
  let acpt

  if (abortCheckpoint) {
    acpt = abortCheckpoint
  }

  const sfx = getFileSuffix(file.name)
  const key = 'img/' + getRandomString(10, true) + '.' + sfx

  ossClient
    .multipartUpload(key, file, {
      progress: (p, cpt) => {
        // 为中断点赋值。
        acpt = cpt
        // console.log(abortCheckpoint)
        // 获取上传进度。
        // console.log(p * 100)

        console.log(acpt)

        cb({
          status: 'upload',
          ossCli: ossClient,
          progress: p * 100,
          abortCheckpoint: acpt,
        })
      },
      parallel: 1,
      partSize: 0.5 * 1024 * 1024,
      checkpoint: abortCheckpoint ? acpt : undefined,
    })
    .then((res) => {
      const { res: ossRes } = res
      if (ossRes.status == 200) {
        const url = ossRes['requestUrls'][0].split('?')[0]
        cb({
          status: 'success',
          ossCli: ossClient,
          url: url,
        })

        return false
      }

      cb(false)
    }) as unknown as OSS
}

export const cancelMultipartUpload = (
  ossClient: OSS,
  apt: Checkpoint | undefined
) => {
  if (!apt) {
    return false
  }

  ossClient.abortMultipartUpload(apt.name, apt.uploadId)
}
