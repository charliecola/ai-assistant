<template>
  <el-dialog title="配置页面保存" width="800px" v-model="uiConfigSaveDialogVisible" top="80px">
    <div :style="{ overflow: 'auto' }">
      <el-form ref="formRef" :model="saveData" label-width="120px" :rules="rules">
        <el-form-item label="页面名称" prop="title">
          <el-input v-model="saveData.title"></el-input>
        </el-form-item>
        <el-form-item label="页面编码" prop="uiMainCode">
          <el-input v-model="saveData.uiMainCode"></el-input>
        </el-form-item>
        <el-form-item label="页面使用对象" prop="useObject">
          <el-select v-model="saveData.useObject" placeholder="请选择活动区域">
            <el-option label="云办事" value="cloud-service"></el-option>
            <el-option label="人才认定" value="people-system"></el-option>
            <el-option label="通用" value="all"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleSureClick" :loading="loading">确定</el-button>
        <el-button @click="uiConfigSaveDialogVisible = false">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, defineEmits, defineExpose, getCurrentInstance } from 'vue';
import http from "@/utils/request";

// 获取当前实例 (用于访问 $message, $loading - 如果是全局挂载)
const { proxy } = getCurrentInstance();

// Emits
const emit = defineEmits(['saveSuccess']);

// Refs and Reactive State
const uiConfigSaveDialogVisible = ref(false);
const loading = ref(false);
const formRef = ref(null); // 用于引用 el-form
const saveData = reactive({
  title: '',
  uiMainCode: '',
  useObject: '',
  // 其他可能从父组件传递的属性
});

// Validation Rules (保持不变)
const rules = reactive({
  title: [
    { required: true, message: "请输入页面名称", trigger: "blur" },
    { min: 1, max: 200, message: "长度在200个字符内", trigger: "blur" },
  ],
  uiMainCode: [
    { required: true, message: "请输入页面编码", trigger: "blur" },
    { min: 1, max: 200, message: "长度在200个字符内", trigger: "blur" },
  ],
  useObject: [{ required: true, message: "请选择使用对象", trigger: "blur" }],
});

// Methods converted to functions
const initDialog = (data) => {
  // 使用 Object.assign 更新 reactive 对象
  Object.assign(saveData, data);
  uiConfigSaveDialogVisible.value = true;
};

const handleSureClick = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    await doSave();
  } catch (error) {
    // validate 失败时，Element Plus 会 reject Promise 或抛出错误
    // 如果 validate 没有 reject，下面的消息可以保留
    if (error !== 'validate failed') { // 避免重复提示
      proxy.$message({
        message: "请检查表单验证项!",
        type: "warning",
      });
    }
    console.log('Form validation failed or save error:', error);
  }
};

const doSave = async () => {
  loading.value = true;
  // 如果 $loading 是全局挂载的，可以使用 proxy
  // const loadingInstance = proxy.$loading({ lock: true, text: '保存中...' }); 
  // 或者从 Element Plus 导入服务
  // import { ElLoading } from 'element-plus';
  // const loadingInstance = ElLoading.service({ lock: true, text: '保存中...' });

  try {
    const response = await http.post("/people-system/pf/ui/config/saveInfo", saveData);
    if (response.meta.success == true) {
      if (response.data.isSuccess) {
        proxy.$message({ type: "success", message: "页面保存成功！" });
        uiConfigSaveDialogVisible.value = false;
        emit("saveSuccess", { ...saveData }); // 发送副本
      } else {
        proxy.$message({ type: "warning", message: response.data.message });
      }
    } else {
      proxy.$message({
        type: "warning",
        message: response.meta.message || "数据保存失败，请联系管理员！",
      });
    }
  } catch (e) {
    console.error(e);
    proxy.$message({ type: "warning", message: "当前网络环境异常，请稍后再试！" });
  } finally {
    loading.value = false;
    // loadingInstance?.close(); // 关闭 loading 服务
  }
};

// Expose methods to parent component
defineExpose({
  initDialog
});

</script>

<style lang="scss" scoped>
.dialog-footer {
  text-align: right;
}
</style>
