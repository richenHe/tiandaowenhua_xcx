<template>
  <view class="page-container">
    <TdPageHeader title="个人资料" :showBack="true" />

    <scroll-view scroll-y class="scroll-area scroll-area--with-header-footer" style="height: calc(100vh - 88rpx - 136rpx);" :scroll-top="bankSectionScrollTop">
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

          <!-- 收款银行账户分隔标题 -->
          <view id="bank-section" class="t-form-item t-form-item--divider">
            <view class="t-form-item__label">
              <text>收款银行账户</text>
            </view>
          </view>

          <!-- 收款人姓名 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>收款人姓名</text>
            </view>
            <view class="t-form-item__control">
              <view class="t-input__wrap">
                <view class="t-input t-align-left">
                  <input
                    class="t-input__inner"
                    type="text"
                    placeholder="请输入银行卡持有人姓名"
                    v-model="bankAccountName"
                    maxlength="30"
                  />
                </view>
              </view>
            </view>
          </view>

          <!-- 开户支行 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>开户支行</text>
            </view>
            <view class="t-form-item__control">
              <view class="t-input__wrap">
                <view class="t-input t-align-left">
                  <input
                    class="t-input__inner"
                    type="text"
                    placeholder="如：招商银行深圳南山支行"
                    v-model="bankName"
                    maxlength="60"
                    @input="onBankNameInput"
                  />
                </view>
              </view>
            </view>
          </view>

          <!-- 银行卡号 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text>银行卡号</text>
            </view>
            <view class="t-form-item__control">
              <view class="t-input__wrap">
                <view class="t-input t-align-left">
                  <input
                    class="t-input__inner"
                    type="number"
                    placeholder="请输入银行卡号"
                    v-model="bankAccountNumber"
                    maxlength="25"
                    @input="onBankCardInput"
                  />
                </view>
              </view>
            </view>
          </view>

          <!-- 银行卡验证：错误提示（红色） -->
          <view v-if="bankError" class="t-form-item">
            <view class="t-form-item__control">
              <view class="bank-validate-msg bank-validate-msg--error">
                <text>⚠️ {{ bankError }}</text>
              </view>
            </view>
          </view>

          <!-- 银行卡验证：警告提示（黄色） -->
          <view v-else-if="bankWarning" class="t-form-item">
            <view class="t-form-item__control">
              <view class="bank-validate-msg bank-validate-msg--warning">
                <text>⚠️ {{ bankWarning }}</text>
              </view>
            </view>
          </view>

          <!-- 推荐人信息已隐藏：仅后台可查看 -->
          <!--
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
          -->
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
import { onShow, onLoad } from '@dcloudio/uni-app'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { UserApi } from '@/api'
import StorageApi, { StoragePathHelper, cloudFileIDToURL } from '@/api/modules/storage'
// ---- 银行卡验证工具（内联，避免小程序模块缓存问题） ----
/** 校验银行卡号格式：10-25 位纯数字 */
function validateCardNumberFormat(cardNumber: string): boolean {
  return /^\d{10,25}$/.test(cardNumber.replace(/\s/g, ''))
}

interface BinLookupResult { bankName: string; keywords: string[] }

const BIN_DATA: { prefixes: string[]; bankName: string; keywords: string[] }[] = [
  { prefixes: ['622700','622702','622707','622709','621483','621486','621489','621487','955100','622208','622210','621095','621096','621097','621098','621099','621285','621286','621287'], bankName: '中国工商银行', keywords: ['工商银行','工行','ICBC'] },
  { prefixes: ['622280','622281','622283','622284','622285','622286','622287','622288','622289','622290','621758','621759','621760','621761','621762','621763','621764','621765'], bankName: '中国农业银行', keywords: ['农业银行','农行','ABC'] },
  { prefixes: ['621226','621227','621228','621229','621230','621231','621232','621233','621234','621235','621236','621237','621238','621239','621240','621241','621260'], bankName: '中国银行', keywords: ['中国银行','中行','BOC'] },
  { prefixes: ['436742','436745','489734','489735','512315','512316','512317','622200','622202','622203','622204','622205','622206','622207','622209','622210','622211','622212'], bankName: '中国建设银行', keywords: ['建设银行','建行','CCB'] },
  { prefixes: ['621660','621661','621662','621663','621664','621665','621666','621667','621668','621669','621670','621671','621672','621673','621674','621675'], bankName: '中国邮政储蓄银行', keywords: ['邮政储蓄','邮储银行','邮储','PSBC'] },
  { prefixes: ['622580','622581','622582','622583','622584','622585','622586','622587','622588','622589','622590','622591','622592','622593','622594','622595'], bankName: '交通银行', keywords: ['交通银行','交行','BOCOM'] },
  { prefixes: ['621001','621002','621010','621020','621050','621051','621052','621053','621054','621055','621056','621060','621061','621062','621063','621064'], bankName: '招商银行', keywords: ['招商银行','招行','CMB'] },
  { prefixes: ['622660','622661','622662','622663','622664','622665','622666','622667','622668','622669','622670','622671','622672','622673','622674','622675','621790','621791','621792','621793','621794','621795','621796','621797','621798','621799','621979','621981','621982','621983','621984','621985','621986'], bankName: '浦发银行', keywords: ['浦发银行','浦发','上海浦东发展银行','SPDB'] },
  { prefixes: ['622400','622401','622402','622403','622404','622405','622406','622407','622408','622409','622410','622411','622412','622413','622414','622415'], bankName: '中信银行', keywords: ['中信银行','中信','CITIC'] },
  { prefixes: ['622360','622361','622362','622363','622364','622365','622366','622367','622368','622369','622370','622371','622372','622373','622374','622375'], bankName: '光大银行', keywords: ['光大银行','光大','CEB'] },
  { prefixes: ['621900','621901','621902','621903','621904','621905','621906','621907','621908','621909','621910','621911','621912','621913','621914','621915'], bankName: '华夏银行', keywords: ['华夏银行','华夏','HXB'] },
  { prefixes: ['622720','622721','622722','622723','622724','622725','622726','622727','622728','622729','622730','622731','622732','622733','622734','622735'], bankName: '民生银行', keywords: ['民生银行','民生','CMBC'] },
  { prefixes: ['622560','622561','622562','622563','622564','622565','622566','622567','622568','622569','622570','622571','622572','622573','622574','622575'], bankName: '兴业银行', keywords: ['兴业银行','兴业','CIB'] },
  { prefixes: ['622268','622269','622270','622271','622272','622273','622274','622275','622276','622277','622278','622279','621728','621729','621730','621731'], bankName: '平安银行', keywords: ['平安银行','平安','深圳发展银行','深发展','PAB'] },
  { prefixes: ['622880','622881','622882','622883','622884','622885','622886','622887','622888','622889','622890','622891','622892','622893','622894','622895'], bankName: '广发银行', keywords: ['广发银行','广发','GDB'] },
  { prefixes: ['621800','621801','621802','621803','621804','621805','621806','621807','621808','621809','621810','621811','621812','621813','621814','621815'], bankName: '北京银行', keywords: ['北京银行','北京行','BOB'] },
  { prefixes: ['621700','621701','621702','621703','621704','621705','621706','621707','621708','621709','621710','621711','621712','621713','621714','621715'], bankName: '上海银行', keywords: ['上海银行','BOSC'] },
]

/** 根据银行卡号前 6 位识别发卡行 */
function lookupBankByCardNumber(cardNumber: string): BinLookupResult | null {
  const cleaned = cardNumber.replace(/\s/g, '')
  if (cleaned.length < 6) return null
  const prefix6 = cleaned.substring(0, 6)
  for (const entry of BIN_DATA) {
    if (entry.prefixes.includes(prefix6)) return { bankName: entry.bankName, keywords: entry.keywords }
  }
  return null
}

/** 校验开户支行名称是否包含发卡行关键词 */
function isBranchMatchingBin(branchName: string, binResult: BinLookupResult): boolean {
  const lower = branchName.trim().toLowerCase()
  return binResult.keywords.some(kw => lower.includes(kw.toLowerCase()))
}

/** 银行卡号脱敏：保留前4位和后4位 */
function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '')
  if (cleaned.length <= 8) return cleaned
  const head = cleaned.substring(0, 4)
  const tail = cleaned.substring(cleaned.length - 4)
  const middle = '*'.repeat(Math.min(cleaned.length - 8, 8))
  return `${head} ${middle} ${tail}`
}
// ---- end 银行卡验证工具 ----

// 表单数据
const formData = ref({
  avatar: '',
  avatarFileID: '', // 头像 fileID
  backgroundImage: '', // 背景图片临时 URL（用于显示）
  backgroundImageFileID: '', // 背景图片 fileID（用于保存）
  realName: '',
  phone: '',
  gender: 1,
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

// 性别选项（与数据库 users.gender 一致：1=男 / 0=女）
const genderOptions = [
  { label: '男', value: 1 },
  { label: '女', value: 0 },
]

// 出生八字字段
const birthdateFields = [
  { key: 'year', placeholder: '年' },
  { key: 'month', placeholder: '月' },
  { key: 'day', placeholder: '日' },
  { key: 'hour', placeholder: '时' },
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

// 银行账户信息（选填）
const bankAccountName = ref('') // 收款人姓名
const bankName = ref('')        // 开户支行
const bankAccountNumber = ref('') // 银行卡号
const bankError = ref('')       // 红色错误提示（卡号与开户行不匹配时）
const bankWarning = ref('')     // 黄色警告提示（BIN 无法识别时）
// 记录加载时的原始银行信息，用于检测是否有变更
const originalBankInfo = ref({ bankAccountName: '', bankName: '', bankAccountNumber: '' })

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

    // 加载头像（云函数已在服务端完成 cloud:// → HTTPS 转换，直接使用）
    if (profile.avatar) {
      // avatar_file_id 是原始 cloud:// fileID（用于保存），avatar 是已转换的 HTTPS URL（用于显示）
      formData.value.avatarFileID = profile.avatar_file_id || profile.avatar
      formData.value.avatar = profile.avatar
    }

    // 加载背景图片（云函数已在服务端完成 cloud:// → HTTPS 转换，直接使用）
    if (profile.background_image) {
      formData.value.backgroundImageFileID = profile.background_image_file_id || profile.background_image
      formData.value.backgroundImage = profile.background_image
    }
    
    // 性别（数据库 0=女/1=男，getProfile 统一返回数字或 null）
    if (profile.gender === 1) {
      formData.value.gender = 1  // 男
    } else if (profile.gender === 0) {
      formData.value.gender = 0  // 女
    }
    // gender 为 null/undefined（未设置）时，保留表单默认值 1（男）

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
      // 使用推荐人等级（referee_level）显示等级（与数据库 users.ambassador_level 一致：0普通用户/1准青鸾大使/2青鸾大使/3鸿鹄大使）
      const levelMap: Record<number, string> = {
        0: '普通用户',
        1: '准青鸾大使',
        2: '青鸾大使',
        3: '鸿鹄大使'
      }
      refereeInfo.value.level = levelMap[profile.referee_level || 0] || '普通用户'
    } else {
      refereeInfo.value.name = '暂无'
      refereeInfo.value.level = ''
      refereeInfo.value.status = ''
    }

    // 加载银行账户信息
    bankAccountName.value = (profile as any).bank_account_name || ''
    bankName.value = (profile as any).bank_name || ''
    bankAccountNumber.value = (profile as any).bank_account_number || ''
    originalBankInfo.value = {
      bankAccountName: bankAccountName.value,
      bankName: bankName.value,
      bankAccountNumber: bankAccountNumber.value
    }
    // 清空上次验证状态
    bankError.value = ''
    bankWarning.value = ''
  } catch (error) {
    // console.error('加载用户资料失败:', error)
  }
}

onMounted(() => {
  loadProfile()
})

onShow(() => {
  loadProfile()
})

// 接收路由参数：scrollTo=bank 时自动滚动到银行信息区域
onLoad((options: any) => {
  if (options?.scrollTo === 'bank') {
    // 等待页面渲染完成后再滚动
    setTimeout(() => {
      const query = uni.createSelectorQuery()
      query.select('#bank-section').boundingClientRect((rect: any) => {
        if (rect) {
          // 通过修改 scroll-view 的 scroll-top 实现定位
          bankSectionScrollTop.value = rect.top
        }
      }).exec()
    }, 500)
  }
})

// 银行区块滚动定位用的 scroll-top
const bankSectionScrollTop = ref(0)

/**
 * 银行卡号输入时：触发 BIN 码识别，与开户支行交叉验证
 * 注意：通过事件对象读取当前值，避免 v-model 更新滞后问题
 */
const onBankCardInput = (e: any) => {
  const cardNo = (e.detail?.value ?? bankAccountNumber.value).replace(/\s/g, '')
  bankError.value = ''
  bankWarning.value = ''

  if (!cardNo) return

  // 基本格式校验（10-25 位纯数字）
  if (!validateCardNumberFormat(cardNo)) {
    bankError.value = '银行卡号格式不正确（需10-25位数字）'
    return
  }

  // BIN 码识别
  const binResult = lookupBankByCardNumber(cardNo)
  if (!binResult) {
    // 无法识别，黄色警告但不阻止保存
    bankWarning.value = '无法自动识别发卡行，请确认开户行信息无误'
    return
  }

  // 如果已填写开户支行，校验是否匹配
  if (bankName.value && !isBranchMatchingBin(bankName.value, binResult)) {
    bankError.value = `银行卡号与开户行不匹配（卡号识别为${binResult.bankName}）`
  }
}

/**
 * 开户支行输入时：如果卡号已识别出发卡行，同步校验匹配
 * 注意：通过事件对象读取当前值，避免 v-model 更新滞后问题
 */
const onBankNameInput = (e: any) => {
  const currentBranchName = (e.detail?.value ?? bankName.value)
  bankError.value = ''
  bankWarning.value = ''

  const cardNo = bankAccountNumber.value.replace(/\s/g, '')
  if (!cardNo || !validateCardNumberFormat(cardNo)) return

  const binResult = lookupBankByCardNumber(cardNo)
  if (!binResult) {
    if (currentBranchName) {
      bankWarning.value = '无法自动识别发卡行，请确认开户行信息无误'
    }
    return
  }

  if (currentBranchName && !isBranchMatchingBin(currentBranchName, binResult)) {
    bankError.value = `银行卡号与开户行不匹配（卡号识别为${binResult.bankName}）`
  }
}

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

    // 保存 fileID，直接转换为 CDN HTTPS URL 用于显示（避免客户端 getTempFileURL 认证问题）
    formData.value.avatarFileID = result.fileID
    formData.value.avatar = cloudFileIDToURL(result.fileID)

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

        // 保存 fileID，直接转换为 CDN HTTPS URL 用于显示
        formData.value.backgroundImageFileID = result.fileID
        formData.value.backgroundImage = cloudFileIDToURL(result.fileID)

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

  // 验证生辰八字格式（如果填写了任何一个字段）
  const { year, month, day, hour } = formData.value.birthdate
  const hasBirthdateInput = year || month || day || hour
  
  if (hasBirthdateInput) {
    // 检查是否所有字段都填写完整
    if (!year || !month || !day || !hour) {
      uni.showModal({
        title: '格式错误',
        content: '生辰八字需要填写完整的年月日时',
        showCancel: false,
      })
      return
    }
    
    // 验证年份：4位数字，范围1900-2100
    const yearNum = parseInt(year)
    if (!/^\d{4}$/.test(year) || yearNum < 1900 || yearNum > 2100) {
      uni.showModal({
        title: '格式错误',
        content: '年份格式不正确，请输入4位数字（如：1990）',
        showCancel: false,
      })
      return
    }
    
    // 验证月份：1-12
    const monthNum = parseInt(month)
    if (!/^\d{1,2}$/.test(month) || monthNum < 1 || monthNum > 12) {
      uni.showModal({
        title: '格式错误',
        content: '月份格式不正确，请输入1-12之间的数字（如：01或1）',
        showCancel: false,
      })
      return
    }
    
    // 验证日期：1-31
    const dayNum = parseInt(day)
    if (!/^\d{1,2}$/.test(day) || dayNum < 1 || dayNum > 31) {
      uni.showModal({
        title: '格式错误',
        content: '日期格式不正确，请输入1-31之间的数字（如：01或1）',
        showCancel: false,
      })
      return
    }
    
    // 验证时辰：0-23
    const hourNum = parseInt(hour)
    if (!/^\d{1,2}$/.test(hour) || hourNum < 0 || hourNum > 23) {
      uni.showModal({
        title: '格式错误',
        content: '时辰格式不正确，请输入0-23之间的数字（如：08或8）',
        showCancel: false,
      })
      return
    }
  }

  // 银行信息校验：如果填写了卡号但存在错误，阻止保存
  if (bankAccountNumber.value && bankError.value) {
    uni.showToast({ title: bankError.value, icon: 'none', duration: 3000 })
    return
  }

  // 检测银行信息是否有变更
  const hasBankChange =
    bankAccountName.value !== originalBankInfo.value.bankAccountName ||
    bankName.value !== originalBankInfo.value.bankName ||
    bankAccountNumber.value !== originalBankInfo.value.bankAccountNumber

  // 如果银行信息有变更且填写了任意银行字段，弹窗让用户二次确认
  if (hasBankChange && (bankAccountName.value || bankName.value || bankAccountNumber.value)) {
    const maskedCard = bankAccountNumber.value ? maskCardNumber(bankAccountNumber.value) : '（未填写）'
    const confirmContent = [
      `收款人：${bankAccountName.value || '（未填写）'}`,
      `开户支行：${bankName.value || '（未填写）'}`,
      `银行卡号：${maskedCard}`,
      '',
      '请确认以上信息无误，避免汇款错误。'
    ].join('\n')

    const confirmed = await new Promise<boolean>((resolve) => {
      uni.showModal({
        title: '请确认银行收款信息',
        content: confirmContent,
        confirmText: '信息无误，保存',
        cancelText: '返回修改',
        success: (res) => resolve(!!res.confirm)
      })
    })

    if (!confirmed) return
  }

  try {
    // 构建出生八字字符串
    let birthday = ''
    if (formData.value.birthdate.year) {
      // 格式化为标准格式：YYYY-MM-DD-HH
      const yearStr = formData.value.birthdate.year.padStart(4, '0')
      const monthStr = formData.value.birthdate.month.padStart(2, '0')
      const dayStr = formData.value.birthdate.day.padStart(2, '0')
      const hourStr = formData.value.birthdate.hour.padStart(2, '0')
      birthday = `${yearStr}-${monthStr}-${dayStr}-${hourStr}`
    }

    // 调用API更新资料
    await UserApi.updateProfile({
      realName: formData.value.realName,
      phone: formData.value.phone,
      city: formData.value.region || '',
      avatar: formData.value.avatarFileID || '', // 使用 fileID 而不是临时URL
      backgroundImage: formData.value.backgroundImageFileID || '', // 使用 fileID
      gender: formData.value.gender,
      industry: formData.value.industry || '',
      birthday: birthday,
      bankAccountName: bankAccountName.value || '',
      bankName: bankName.value || '',
      bankAccountNumber: bankAccountNumber.value || ''
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

// 银行账户区块分隔标题
.t-form-item--divider {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1px solid $td-border-level-0;
}

// 银行卡验证提示
.bank-validate-msg {
  padding: 16rpx 24rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  line-height: 1.5;
}

.bank-validate-msg--error {
  background-color: rgba(227, 77, 89, 0.08);
  color: $td-error-color;
  border: 1px solid rgba(227, 77, 89, 0.2);
}

.bank-validate-msg--warning {
  background-color: rgba(212, 175, 55, 0.08);
  color: $td-warning-color;
  border: 1px solid rgba(212, 175, 55, 0.2);
}
</style>

