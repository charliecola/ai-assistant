<template>
  <div class="height-100">
    <el-button @click="submitForm">提交</el-button>
    <vm-form-render ref="vFormRef" :form-json="formJson" :form-data="formData" :option-data="optionData"
      :global-dsv="globalDSV">
    </vm-form-render>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue';
import { getHashQueryParams } from '@/utils/urlParams';
import http from "@/utils/request";

const { proxy } = getCurrentInstance();
// 环境基础 URL
const BASC_URL = import.meta.env.VITE_BASC_URL;

const vFormRef = ref(null);

const formJson = ref({});
const formData = ref({});
const optionData = ref({});
const uiCode = ref(null);
const loading = ref(false);
// GlobalDSV - 保持 reactive
const globalDSV = reactive({
  uploadUrl:
    BASC_URL +
    "ps/cloud/apply/uploadOne/" +
    JSON.stringify({
      useObject: "uiConfigTest",
      jobId: "test",
      detailId: "test",
      isEnable: 1,
    }),
  baseUrl: BASC_URL,
  "FH-Token": "", // 考虑如何获取和设置 Token
  pageSize: 20,
  pageNum: 1,
  criteria: {}
});

const submitForm = () => {
  if (!vFormRef.value) return;
  vFormRef.value.getFormData().then(data => {
    alert(JSON.stringify(data));
  }).catch(error => {
    proxy.$message.error(error);
  });
};

const fetchFormJson = async (code) => {
  if (!code) {
    proxy.$message.error('缺少必要的表单标识');
    return;
  }
  loading.value = true;
  try {
    const response = await http.post("/people-system/pf/ui/config/getUiInfoByCode", {
      uiMainCode: code,
    });
    if (response.meta.success && response.data && response.data.uiContent) {
      try {
        formJson.value = JSON.parse(response.data.uiContent);
        vFormRef.value.setFormJson(formJson.value);

        formData.value = {};
        vFormRef.value.setFormData(formData.value);
      } catch (parseError) {
        proxy.$message.error('加载表单结构失败：格式错误');
      }
    } else {
      proxy.$message.error(response.meta?.message || '加载表单结构失败');
    }
  } catch (error) {
    proxy.$message.error('加载表单时网络异常');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  const params = getHashQueryParams();

  const tokenFromUrl = params.get('FH-Token');
  if (tokenFromUrl) {
    localStorage.setItem('FH-Token', tokenFromUrl);
    globalDSV['FH-Token'] = tokenFromUrl;
  } else {

  }

  const uiCodeFromUrl = params.get('uiCode');
  if (uiCodeFromUrl) {
    uiCode.value = uiCodeFromUrl;
    fetchFormJson(uiCodeFromUrl);
  } else {
    proxy.$message.error('无法加载表单：缺少必要的标识符。');
  }
});

</script>

<style scoped>
/* Add component-specific styles here if needed */
</style>