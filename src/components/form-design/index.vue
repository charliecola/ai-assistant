<template>
  <div class="height-100">
    <vm-form-designer :designer-config="designerConfig" ref="vfDesignerRef" :global-dsv="globalDSV">
      <template #customToolButtons>
        <el-button type="text" @click="saveFormJson">
          <i class="el-icon-finished" />保存
        </el-button>
      </template>
    </vm-form-designer>

    <uiConfigSaveDialog ref="uiConfigSaveDialogRef" @saveSuccess="saveSuccess"></uiConfigSaveDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue';
import uiConfigSaveDialog from "./dialog/VFormDesignerEdit.vue";
import http from "@/utils/request";
import { getHashQueryParams } from '@/utils/urlParams'; // Import the utility

// 获取当前实例 (用于访问 $message - 如果是全局挂载)
const { proxy } = getCurrentInstance();

// 环境基础 URL
const BASC_URL = import.meta.env.VITE_BASC_URL;

// 组件 Refs
const vfDesignerRef = ref(null);
const uiConfigSaveDialogRef = ref(null);

// Reactive State
const initUiCode = ref("zjx测试");
const designerConfig = reactive({
  toolbarMaxWidth: 478,
  generateSFCButton: false,
  logoHeader: false,
});
const uiInfo = reactive({}); // 使用 reactive 替代空对象
const loading = ref(false); // 添加 loading 状态

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

// Methods converted to functions
const saveFormJson = () => {
  if (!vfDesignerRef.value) return;
  const formJson = vfDesignerRef.value.getFormJson();
  uiInfo.uiContent = JSON.stringify(formJson);
  if (uiConfigSaveDialogRef.value) {
    uiConfigSaveDialogRef.value.initDialog(Object.assign({}, uiInfo));
  }
};

const saveSuccess = (saveInfo) => {
  initUiCode.value = saveInfo.uiMainCode;
  initUiInfo();
};

const initUiInfo = async () => {
  // document.title 应该在 setup 作用域外设置，或者通过其他方式
  // 如果只是想在函数内使用 title 变量，可以像下面这样
  let title = "页面配置维护";

  if (!initUiCode.value) {
    vfDesignerRef.value?.clearDesigner();
    Object.keys(uiInfo).forEach(key => delete uiInfo[key]); // 清空 reactive 对象
    return;
  }

  loading.value = true;
  try {
    const response = await http.post("/people-system/pf/ui/config/getUiInfoByCode", {
      uiMainCode: initUiCode.value,
    });
    if (response.meta.success) {
      if (response.data && response.data.uiMainId != null) {
        Object.assign(uiInfo, response.data); // 更新 reactive 对象
        title = `【${uiInfo.title}】页面配置维护`; // 更新局部变量
        // 可以考虑将 title 也设为 ref 如果需要在模板中使用
        vfDesignerRef.value?.setFormJson?.(uiInfo.uiContent);
      } else {
        Object.keys(uiInfo).forEach(key => delete uiInfo[key]);
        vfDesignerRef.value?.clearDesigner();
      }
    } else {
      proxy.$message({ type: "warning", message: response.meta.message || "获取UI信息失败！" });
    }
  } catch (e) {
    console.error(e);
    proxy.$message({ type: "warning", message: "当前网络环境异常，请稍后再试！" });
  } finally {
    loading.value = false;
  }
};

// Lifecycle Hook
onMounted(() => {
  // Use the utility function to get hash parameters
  const params = getHashQueryParams();

  // 1. Handle FH-Token
  const tokenFromUrl = params.get('FH-Token');
  if (tokenFromUrl) {
    // Store token in localStorage for request utility to access
    localStorage.setItem('FH-Token', tokenFromUrl);
    // Optionally update globalDSV if needed elsewhere immediately
    globalDSV['FH-Token'] = tokenFromUrl;
    console.log('FH-Token set from URL hash:', tokenFromUrl);
  } else {
    console.warn('FH-Token not found in URL hash parameters.');
    // Optionally check localStorage as a fallback if needed
    const tokenFromStorage = localStorage.getItem('FH-Token');
    if (tokenFromStorage) {
      globalDSV['FH-Token'] = tokenFromStorage;
      console.log('Using FH-Token from localStorage:', tokenFromStorage);
    } else {
      // Handle missing token
      console.error('FH-Token not found in URL hash or localStorage.');
    }
  }

  // 2. Handle uiCode
  const uiCodeFromUrl = params.get('uiCode');
  if (uiCodeFromUrl) {
    initUiCode.value = uiCodeFromUrl;
    console.log('initUiCode set from URL hash:', uiCodeFromUrl);
  } else {
    console.warn(`uiCode not found in URL hash parameters. Using default: "${initUiCode.value}"`);
  }

  // Now call initUiInfo with the potentially updated initUiCode
  initUiInfo();
});

</script>

<style lang="scss">
body {
  margin: 0;
  /* 如果页面出现垂直滚动条，则加入此行CSS以消除之 */
}
</style>