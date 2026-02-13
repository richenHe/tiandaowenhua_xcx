<template>
  <view class="page-container">
    <TdPageHeader title="个人资料" :showBack="true" />

    <scroll-view scroll-y class="scroll-area scroll-area--with-header-footer" style="height: calc(100vh - 88rpx - 136rpx);">
      <view class="page-content page-content--with-bg" style="padding-bottom: 480rpx;">
        <!-- 表单 -->
        <view class="t-form t-form--label-top">
          <!-- 头像 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>头像</text>
            </view>
            <view class="t-form-item__control" style="display: flex; justify-content: center; margin-top: 16rpx;">
              <button 
                class="t-avatar-picker"
                open-type="chooseAvatar" 
                @chooseavatar="onChooseAvatar"
              >
                <image 
                  v-if="formData.avatar" 
                  :src="formData.avatar" 
                  mode="aspectFill"
                  style="width: 100%; height: 100%;"
                />
                <text v-else style="font-size: 72rpx; color: #DCDCDC; font-weight: 300;">+</text>
              </button>
            </view>
          </view>

          <!-- 背景图片 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>个人主页背景</text>
            </view>
            <view class="t-form-item__control" style="display: flex; justify-content: center; margin-top: 16rpx;">
              <view 
                class="t-background-picker"
                @click="chooseBackgroundImage"
              >
                <image 
                  v-if="formData.backgroundImage" 
                  :src="formData.backgroundImage" 
                  mode="aspectFill"
                  style="width: 100%; height: 100%;"
                />
                <view v-else class="t-background-picker__placeholder">
                  <text style="font-size: 48rpx; color: #DCDCDC; font-weight: 300;">+</text>
                  <text style="font-size: 24rpx; color: #999999; margin-top: 8rpx;">点击上传背景图片</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 真实姓名 -->
          <view class="t-form-item">
            <view class="t-form-item__label t-form-item__label--required">
              <text>真实姓名</text>
            </view>
            <view class="t-form-item__control">
              <view class="t-input__wrap">
                <view class="t-input t-align-left">
                  <input class="t-input__inner" type="text" placeholder="请输入真实姓名" v-model="formData.realName" />
                </view>
              </view>
            </view>
          </view>

          <!-- 手机号 -->
          <view class="t-form-item">
            <view class="t-form-item__label t-form-item__label--required">
              <text>手机号</text>
            </view>
            <view class="t-form-item__control">
              <view class="t-input__wrap">
                <view class="t-input t-align-left">
                  <input class="t-input__inner" type="tel" placeholder="请输入手机号" v-model="formData.phone" />
                </view>
              </view>
            </view>
          </view>

          <!-- 性别 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>性别</text>
            </view>
            <view class="t-form-item__control">
              <view class="t-radio-group">
                <label
                  v-for="item in genderOptions"
                  :key="item.value"
                  class="t-radio"
                  @click="formData.gender = item.value"
                >
                  <view 
                    class="t-radio__input"
                    :class="{ 't-radio__input--checked': formData.gender === item.value }"
                  ></view>
                  <text class="t-radio__label">{{ item.label }}</text>
                </label>
              </view>
            </view>
          </view>

          <!-- 出生八字 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>出生八字 (选填)</text>
            </view>
            <view class="t-form-item__control">
              <view class="grid grid-cols-4 gap-s">
                <view
                  v-for="(item, index) in birthdateFields"
                  :key="index"
                  class="t-input__wrap"
                >
                  <view class="t-input t-align-center">
                    <input class="t-input__inner" type="text" :placeholder="item.placeholder" v-model="(formData.birthdate as any)[item.key]" />
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 从事行业 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>从事行业 (选填)</text>
            </view>
            <view class="t-form-item__control">
              <picker
                mode="selector"
                :range="industryOptions"
                :value="industryIndex"
                @change="onIndustryChange"
              >
                <view class="t-select">
                  <view class="t-select__input">
                    <text 
                      :class="formData.industry ? 't-select__value' : 't-select__placeholder'"
                    >
                      {{ formData.industry || '请选择' }}
                    </text>
                    <text class="t-select__arrow">▼</text>
                  </view>
                </view>
              </picker>
            </view>
          </view>

          <!-- 所在地区 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>所在地区 (选填)</text>
            </view>
            <view class="t-form-item__control">
              <picker
                mode="region"
                :value="regionValue"
                @change="onRegionChange"
              >
                <view class="t-select">
                  <view class="t-select__input">
                    <text 
                      :class="formData.region ? 't-select__value' : 't-select__placeholder'"
                    >
                      {{ formData.region || '请选择' }}
                    </text>
                    <text class="t-select__arrow">▼</text>
                  </view>
                </view>
              </picker>
            </view>
          </view>

          <!-- 推荐人信息（只读） -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>我的传播大使</text>
            </view>
            <view class="t-form-item__control">
              <view class="referee-info-display" @click="goToRefereeManage">
                <text>{{ refereeInfo.name || '暂无' }}</text>
                <text v-if="refereeInfo.level" class="t-badge t-badge--primary">{{ refereeInfo.level }}</text>
                <text v-if="refereeInfo.status" class="t-badge t-badge--warning">{{ refereeInfo.status }}</text>
                <text class="t-list-item__action">›</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 固定底部 -->
    <view class="fixed-bottom">
      <button class="t-button t-button--theme-primary t-button--variant-base t-button--size-large t-button--block" @click="handleSave">
        <text class="t-button__text">保存</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { UserApi } from '@/api'
import StorageApi, { StoragePathHelper } from '@/api/modules/storage'

// 表单数据
const formData = ref({
  avatar: '',
  avatarFileID: '', // 头像 fileID
  backgroundImage: '', // 背景图片临时 URL（用于显示）
  backgroundImageFileID: '', // 背景图片 fileID（用于保存）
  realName: '',
  phone: '',
  gender: 'male',
  birthdate: {
    year: '',
    month: '',
    day: '',
    hour: '',
  },
  industry: '',
  region: '',
})

// 推荐人信息（只读）
const refereeInfo = ref({
  name: '',
  level: '',
  status: ''
})

// 性别选项
const genderOptions = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
]

// 出生八字字段
const birthdateFields = [
  { key: 'year', placeholder: '年份（YYYY）' },
  { key: 'month', placeholder: '月份（MM）' },
  { key: 'day', placeholder: '日期（DD）' },
  { key: 'hour', placeholder: '时辰（HH）' },
]

// 行业选项（全面的行业分类）
const industryOptions = [
  '互联网/电子商务',
  '计算机软件',
  '计算机硬件',
  'IT服务/系统集成',
  '通信/电信运营',
  '网络游戏',
  '金融/投资/证券',
  '银行',
  '保险',
  '基金/证券/期货',
  '信托/担保/拍卖',
  '教育/培训',
  '学术/科研',
  '专业服务/咨询',
  '会计/审计',
  '法律',
  '广告/会展/公关',
  '市场推广/会展',
  '影视/媒体/艺术',
  '文字媒体/出版',
  '印刷/包装/造纸',
  '房地产开发',
  '建筑/建材/工程',
  '家居/室内设计',
  '物业管理/商业中心',
  '汽车/摩托车',
  '零配件',
  '租赁/商务服务',
  '中介服务',
  '检测/认证',
  '外包服务',
  '贸易/进出口',
  '批发/零售',
  '快速消费品',
  '耐用消费品',
  '服装/纺织/皮革',
  '家具/家电',
  '奢侈品/收藏品',
  '办公用品及设备',
  '医疗/护理/卫生',
  '医疗设备/器械',
  '制药/生物工程',
  '美容/保健',
  '酒店/餐饮',
  '旅游/度假',
  '娱乐/休闲/体育',
  '航空/航天研究',
  '交通/运输/物流',
  '仓储',
  '能源/矿产/采掘',
  '石油/石化/化工',
  '电气/电力/水利',
  '新能源',
  '原材料和加工',
  '政府/公共事业',
  '非盈利机构',
  '环保',
  '农/林/牧/渔',
  '多元化业务集团',
  '其他行业',
]
const industryIndex = ref(0)

// 地区选择
const regionValue = ref<string[]>([])

// 加载用户资料
const loadProfile = async () => {
  try {
    // console.log('开始加载用户资料...')
    const profile = await UserApi.getProfile()
    // console.log('获取到的profile数据:', profile)

    // 填充表单数据
    formData.value.realName = profile.real_name || ''
    formData.value.phone = profile.phone || ''
    formData.value.region = profile.city || ''

    // 加载头像
    if (profile.avatar) {
      formData.value.avatarFileID = profile.avatar
      formData.value.avatar = await StorageApi.getSingleTempFileURL(profile.avatar)
    }

    // 加载背景图片
    if (profile.background_image) {
      formData.value.backgroundImageFileID = profile.background_image
      formData.value.backgroundImage = await StorageApi.getSingleTempFileURL(profile.background_image)
    }
    
    // 解析性别
    if (profile.gender === '男') {
      formData.value.gender = 'male'
    } else if (profile.gender === '女') {
      formData.value.gender = 'female'
    }

    // 解析出生八字
    if (profile.birthday) {
      const parts = profile.birthday.split('-')
      if (parts.length === 4) {
        formData.value.birthdate = {
          year: parts[0],
          month: parts[1],
          day: parts[2],
          hour: parts[3]
        }
      }
    }

    // 解析行业
    if (profile.industry) {
      formData.value.industry = profile.industry
      const index = industryOptions.indexOf(profile.industry)
      if (index !== -1) {
        industryIndex.value = index
      }
    } else {
      formData.value.industry = ''
      industryIndex.value = 0
    }

    // 解析地区
    if (profile.city) {
      formData.value.region = profile.city
      regionValue.value = profile.city.split(' ')
    } else {
      formData.value.region = ''
      regionValue.value = []
    }

    // 填充推荐人信息
    if (profile.referee_id) {
      refereeInfo.value.name = profile.referee_name || '未设置' // 使用推荐人姓名（referee_name）
      refereeInfo.value.status = profile.referee_confirmed_at ? '已确认' : '未确认'
      // 使用推荐人等级（referee_level）显示等级
      const levelMap: Record<number, string> = {
        0: '普通用户',
        1: '准青鸾大使',
        2: '青鸾大使',
        3: '鸿鹄大使',
        4: '金凤大使'
      }
      refereeInfo.value.level = levelMap[profile.referee_level || 0] || '普通用户'
    } else {
      refereeInfo.value.name = '暂无'
      refereeInfo.value.level = ''
      refereeInfo.value.status = ''
    }

    // console.log('加载的表单数据:', formData.value)
    // console.log('推荐人信息:', refereeInfo.value)
  } catch (error) {
    // console.error('加载用户资料失败:', error)
  }
}

onMounted(() => {
  loadProfile()
})

// 跳转到推荐人管理
const goToRefereeManage = () => {
  uni.navigateTo({
    url: '/pages/mine/referral-list/index'
  })
}

/**
 * 选择头像
 */
const onChooseAvatar = async (e: any) => {
  try {
    uni.showLoading({ title: '上传中...' })

    const tempPath = e.detail.avatarUrl
    const userInfoData = uni.getStorageSync('userInfo')
    const cloudPath = StoragePathHelper.userAvatar(userInfoData.uid, tempPath)

    // 上传到云存储
    const result = await StorageApi.replaceFile(
      formData.value.avatarFileID || null,
      tempPath,
      cloudPath
    )

    // 保存 fileID 和临时 URL
    formData.value.avatarFileID = result.fileID
    formData.value.avatar = await StorageApi.getSingleTempFileURL(result.fileID)

    uni.hideLoading()
    uni.showToast({ title: '上传成功', icon: 'success' })
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '上传失败', icon: 'error' })
    console.error('上传头像失败:', error)
  }
}

/**
 * 选择背景图片
 */
const chooseBackgroundImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      try {
        uni.showLoading({ title: '上传中...' })

        const filePath = res.tempFilePaths[0]
        const userInfoData = uni.getStorageSync('userInfo')
        const cloudPath = StoragePathHelper.userBackground(userInfoData.uid, filePath)

        // 上传到云存储
        const result = await StorageApi.replaceFile(
          formData.value.backgroundImageFileID || null,
          filePath,
          cloudPath
        )

        // 保存 fileID 和临时 URL
        formData.value.backgroundImageFileID = result.fileID
        formData.value.backgroundImage = await StorageApi.getSingleTempFileURL(result.fileID)

        uni.hideLoading()
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: '上传失败', icon: 'error' })
        console.error('上传背景图片失败:', error)
      }
    },
    fail: (err) => {
      console.error('选择图片失败:', err)
      uni.showToast({ title: '选择图片失败', icon: 'error' })
    }
  })
}

/**
 * 行业选择变更
 */
const onIndustryChange = (e: any) => {
  industryIndex.value = e.detail.value
  formData.value.industry = industryOptions[e.detail.value]
}

/**
 * 地区选择变更
 */
const onRegionChange = (e: any) => {
  regionValue.value = e.detail.value
  formData.value.region = e.detail.value.join(' ')
}

/**
 * 保存
 */
const handleSave = async () => {
  // 验证必填项
  if (!formData.value.realName) {
    uni.showToast({
      title: '请输入真实姓名',
      icon: 'none',
    })
    return
  }

  if (!formData.value.phone) {
    uni.showToast({
      title: '请输入手机号',
      icon: 'none',
    })
    return
  }

  // 验证手机号格式
  const phoneReg = /^1[3-9]\d{9}$/
  if (!phoneReg.test(formData.value.phone)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none',
    })
    return
  }

  try {
    // 构建出生八字字符串
    let birthday = ''
    if (formData.value.birthdate.year) {
      birthday = `${formData.value.birthdate.year}-${formData.value.birthdate.month}-${formData.value.birthdate.day}-${formData.value.birthdate.hour}`
    }

    // 调用API更新资料
    await UserApi.updateProfile({
      realName: formData.value.realName,
      phone: formData.value.phone,
      city: formData.value.region || '',
      avatar: formData.value.avatarFileID || '', // 使用 fileID 而不是临时URL
      backgroundImage: formData.value.backgroundImageFileID || '', // 使用 fileID
      gender: formData.value.gender === 'male' ? '男' : '女',
      industry: formData.value.industry || '',
      birthday: birthday
    })

    uni.showToast({
      title: '保存成功',
      icon: 'success',
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    // console.error('保存失败:', error)
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

// 按钮的伪元素边框重置（微信小程序 button 特有）
button::after {
  border: none;
}

// 页面内容区域背景（半透明白色 + 毛玻璃）
.page-content--with-bg {
  background-color: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
}

// 头像选择器（独立组件样式）
.t-avatar-picker {
  padding: 0;
  margin: 0;
  border: none;
  background: #FFFFFF;
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

// 背景图片选择器（长方形卡片样式）
.t-background-picker {
  width: 100%;
  height: 320rpx;
  border-radius: 16rpx;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
}

.t-background-picker__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

// 推荐人信息展示（白色卡片样式）
.referee-info-display {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
  background-color: #FFFFFF;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

// 徽章
.t-badge {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  display: inline-block;
}

.t-badge--primary {
  background-color: $td-info-color-light;
  color: $td-brand-color;
}

.t-badge--warning {
  background-color: $td-warning-color-light;
  color: $td-warning-color;
}

.t-list-item__action {
  font-size: 32rpx;
  color: $td-text-color-placeholder;
  flex-shrink: 0;
  margin-left: auto;
}

// 固定底部
.fixed-bottom {
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background-color: #FFFFFF;
  border-top: 1px solid $td-border-level-0;
}
</style>

