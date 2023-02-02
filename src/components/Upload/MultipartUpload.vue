<template>
  <div class="upload">
    <!-- 上传图片区域 -->
    <div class="upload-input">
      <input type="file" ref="uploadInput" @change="uploadFile" />
      <p>请选择图片</p>
    </div>
    <!-- 上传图片区域 -->

    <!-- 图片上传中蒙版 -->
    <div
      class="upload-mask"
      v-if="uploadStatus == 'upload' || uploadStatus == 'paused'"
    >
      <p>{{ uploadStatus == 'upload' ? '上传中...' : '暂停中...' }}</p>
      <progress
        class="upload-progress"
        :value="uploadProgress"
        max="100"
      ></progress>
      <div
        :class="[
          'upload-btn',
          {
            upload: uploadStatus == 'upload',
            paused: uploadStatus == 'paused',
          },
        ]"
        @click="updateUpload"
      ></div>
    </div>
    <!-- 图片上传中蒙版 -->

    <!-- 图片上传成功模板 -->
    <div class="img-view" v-if="uploadStatus == 'success'">
      <img :src="url" alt="" />
      <div class="close-btn" @click="close()"></div>
    </div>
    <!-- 图片上传成功模板 -->
  </div>
</template>

<script setup lang="ts">
import { ossConfig } from '@/config/ossConfig'
import OSS, { type Checkpoint } from 'ali-oss'
import getFileSuffix from '@/libs/getFileSuffix'
import { multipartUpload, cancelMultipartUpload } from '@/libs/upload'

import { ref } from 'vue'

import { debounce } from 'lodash'

const uploadStatus = ref<'notStarted' | 'upload' | 'paused' | 'success'>(
  'notStarted'
)

const uploadProgress = ref<number>(0)

const url = ref<string>('')

const ossClient = ref<OSS | null>(null)

const file = ref<File | null>(null)

const uploadInput = ref<HTMLElement | null>(null)

const abortCheckpoint = ref<Checkpoint>()

const uploadFile = (e: Event) => {
  if (!e.target) {
    return false
  }

  const { files } = <HTMLInputElement>e.target

  if (!(files && files[0])) {
    return false
  }

  file.value = files[0]

  const sfx = getFileSuffix(file.value.name)

  const imgSfxs = ['jpg', 'jpeg', 'png', 'gif']

  if (!imgSfxs.includes(sfx)) {
    alert('请选择图片')
    ;(e.target as HTMLInputElement).value = ''
    return false
  }

  url.value = ''

  const { keyId, keySecret, bucket, region } = ossConfig

  ossClient.value = new OSS({
    region: region,
    accessKeyId: keyId,
    accessKeySecret: keySecret,
    bucket: bucket,
  })

  updateStatus()
}

const updateStatus = () => {
  if (!ossClient.value) {
    return false
  }

  if (!file.value) {
    return false
  }

  multipartUpload(
    ossClient.value,
    file.value,
    (res) => {
      if (!res) {
        alert('上传失败')
        ;(uploadInput.value as HTMLInputElement).value = ''
        return false
      }

      uploadStatus.value = res.status

      if (res.status == 'upload') {
        uploadProgress.value = res?.progress || 0

        ossClient.value = res.ossCli

        abortCheckpoint.value = res?.abortCheckpoint || undefined
      }

      if (res.status == 'success') {
        url.value = res.url || ''

        uploadProgress.value = 0
        ;(uploadInput.value as HTMLInputElement).value = ''

        ossClient.value = null

        file.value = null

        abortCheckpoint.value = undefined
      }
    },
    uploadStatus.value == 'paused' ? abortCheckpoint.value : undefined
  )
}

const updateUpload = debounce(
  () => {
    if (!ossClient.value) {
      return false
    }

    if (uploadStatus.value == 'upload') {
      console.log(abortCheckpoint.value)
      cancelMultipartUpload(ossClient.value, abortCheckpoint.value)
      uploadStatus.value = 'paused'
      return false
    }

    if (uploadStatus.value == 'paused') {
      updateStatus()
      uploadStatus.value = 'upload'
      return false
    }
  },
  1000,
  {
    leading: true,
    trailing: false,
  }
)

const close = () => {
  url.value = ''

  uploadStatus.value = 'notStarted'
}
</script>

<style lang="less" scoped>
.upload {
  position: relative;
  width: 400px;
  height: 300px;
  border-radius: var(--w-radius);
  border: 1px solid var(--c-blue);
  background: var(--c-white);
  .upload-input {
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 1;
    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 30px;
      height: 4px;
      background: var(--c-blue);
      top: calc(50% - 2px);
      left: calc(50% - 15px);
    }
    &::after {
      transform: rotate(90deg);
    }
    p {
      position: absolute;
      color: var(--c-black);
      font-size: 16px;
      width: 100%;
      text-align: center;
      top: 160px;
    }
    input {
      position: absolute;
      display: block;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      z-index: 1;
      cursor: pointer;
    }
  }
  .upload-mask {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background: var(--c-white);
    border-radius: var(--w-radius);
    z-index: 2;
    .upload-progress {
      display: block;
      width: 200px;
      height: 20px;
      background: var(--c-blue);
      border-radius: var(--w-radius);
      border: 1px solid var(--c-gray);
      &::-webkit-progress-bar {
        background: var(--c-bg);
        border-radius: var(--w-radius);
      }
      &::-webkit-progress-value {
        background: var(--c-blue);
        border-radius: var(--w-radius);
      }
    }

    .upload-btn {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: var(--c-blue);
      margin-top: var(--w-space-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      &.paused {
        &::before {
          content: '';
          display: block;
          border: 10px solid var(--c-white);
          border-top-color: rgba(0, 0, 0, 0);
          border-right-color: rgba(0, 0, 0, 0);
          border-bottom-color: rgba(0, 0, 0, 0);
          transform: translateX(5px);
          transition: all 0.2s;
        }
      }
      &.upload {
        &::before,
        &::after {
          content: '';
          display: block;
          width: 4px;
          height: 20px;
          background: var(--c-white);
        }
        &::before {
          transform: translateX(-4px);
        }
        &::after {
          transform: translateX(4px);
        }
      }
    }
  }

  .img-view {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    border-radius: var(--w-radius);
    z-index: 2;
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: var(--w-radius);
    }
    .close-btn {
      width: 30px;
      height: 30px;
      position: absolute;
      border-radius: 50%;
      top: -10px;
      right: -10px;
      background: var(--c-blue);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      &::before,
      &::after {
        content: '';
        position: absolute;
        width: 4px;
        height: 20px;
        background: var(--c-white);
        transform-origin: center center;
      }
      &::before {
        transform: rotate(-45deg);
      }
      &::after {
        transform: rotate(45deg);
      }
    }
  }
}
</style>
