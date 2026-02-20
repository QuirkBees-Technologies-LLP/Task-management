import { call, put, select, takeLatest } from 'redux-saga/effects';
import axios from 'axios';
import {
  addUser,
  addUserFailure,
  addUserSuccess,
  changePasswordFailure,
  changePasswordStart,
  changePasswordSuccess,
  deleteTasks,
  deleteTasksFailure,
  deleteTasksSuccess,
  deleteUser,
  deleteUserFailure,
  deleteUserSuccess,
  fetchCheckout,
  fetchCheckoutFailure,
  fetchCheckoutSuccess,
  fetchTasks,
  fetchTasksFailure,
  fetchTasksSuccess,
  fetchUserInfo,
  fetchUserInfoFailure,
  fetchUserInfoSuccess,
  fetchUsers,
  fetchUsersFailure,
  fetchUsersSuccess,
  loadBilling,
  loadBillingFailure,
  loadBillingSuccess,
  loadClients,
  loadClientsFailure,
  loadClientsSuccess,
  loadDashboard,
  loadDashboardFailure,
  loadDashboardSuccess,
  loadEmailTemplates,
  loadEmailTemplatesSuccess,
  loadEmailTemplatesFailure,
  loadNotifications,
  loadNotificationsFailure,
  loadNotificationsSuccess,
  loadPlans,
  loadPlansFailure,
  loadPlansSuccess,
  loginFailure,
  loginStart,
  loginSuccess,
  logout,
  saveEmailTemplates,
  saveEmailTemplatesFailure,
  saveEmailTemplatesSuccess,
  deleteEmailTemplate,
  deleteEmailTemplateSuccess,
  deleteEmailTemplateFailure,
  saveTasks,
  saveTasksFailure,
  saveTasksOrder,
  saveTasksOrderFailure,
  saveTasksOrderSuccess,
  saveTasksSuccess,
  signupFailure,
  signupStart,
  signupSuccess,
  submitFeedback,
  submitFeedbackFailure,
  submitFeedbackSuccess,
  submitMarkAsRead,
  submitMarkAsReadFailure,
  submitMarkAsReadSuccess,
  verifyEmail,
  verifyEmailFailure,
  verifyEmailSuccess,
} from './slices';
import { enqueueSnackbar } from 'notistack';
import { handleErrorMessage, navigateTo, safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey, initialFormDataChangePassword } from '@/utils/constants';
import { selectNotifications, selectSuperuser } from './selectors';

// Set up axios interceptors to handle token expiration
axios.interceptors.request.use(
  (config) => {
    const token = safeLocalStorageGet(accessTokenKey);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// handle token expiration when request is unauthorized
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response.status === 401) {
      localStorage.removeItem(accessTokenKey);
      enqueueSnackbar({
        message: 'Session expired. Please log in again.',
        variant: 'error',
      });
      navigateTo('/login');
    }
    return Promise.reject(error);
  }
);

function* userLogin({ payload }: any) {
  try {
    const { email, password } = payload?.formData;
    const router = payload?.router; // Get router from payload

    const response = yield call(axios.post, '/api/auth/login', {
      email,
      password,
    });
    const userData = response.data.user;
    const isTemporaryPassword = userData.isTemporaryPassword;
    if (isTemporaryPassword) {
      enqueueSnackbar({
        message: 'Please change your temporary password with email link.',
        variant: 'error',
      });
    } else {
      enqueueSnackbar({ message: 'Signin Success!', variant: 'success' });
      localStorage.setItem(accessTokenKey, response.data.token);
      // Use router from payload if available, otherwise fallback to navigateTo
      if (router) {
        router.push('/dashboard/projects'); // Redirect to projects instead of dashboard
      } else {
        navigateTo('/dashboard/projects'); // Fallback to global router
      }
      yield put(loginSuccess(response.data));
      yield put(fetchUserInfo());
    }
  } catch (error: any) {
    yield put(loginFailure(error.message));
    handleErrorMessage(error);
  }
}

function* postNewUser({ payload }: any) {
  try {
    const response = yield call(axios.post, '/api/auth/signup', {
      firstName: payload.formData.firstName,
      lastName: payload.formData.lastName,
      email: payload.formData.email,
      password: payload.formData.password,
      organizationName: payload.formData.organizationName,
      planId: payload.formData.planId,
      billingPeriod: payload.formData.billingPeriod,
    });

    // Signup endpoint now only returns checkout URL
    // Organization and user will be created after payment succeeds
    if (response.data.success && response.data.checkoutUrl) {
      enqueueSnackbar({
        message: 'Redirecting to payment...',
        variant: 'info',
      });
      
      // Small delay to let snackbar show, then redirect to Stripe checkout
      yield new Promise(resolve => setTimeout(resolve, 1000));
      window.location.href = response.data.checkoutUrl;
    } else {
      // No checkout URL returned - this shouldn't happen
      yield put(signupFailure('Failed to initiate payment. Please try again.'));
      enqueueSnackbar({
        message: response.data.error || 'Failed to initiate payment. Please try again.',
        variant: 'error',
      });
    }
  } catch (error: any) {
    yield put(signupFailure(error.message));
    handleErrorMessage(error);
    enqueueSnackbar({
      message: error.response?.data?.error || 'Failed to initiate signup. Please try again.',
      variant: 'error',
    });
  }
}

function* changePasswordSaga({ payload }: any) {
  const { oldPassword, newPassword, setFormData, token, email } = payload;

  if (token) {
    try {
      let options: any = undefined;

      options = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = yield call(
        axios.post,
        '/api/auth/change-password',
        {
          oldPassword, // Send oldPassword (current password) to API
          newPassword,
        },
        options
      );

      yield put(changePasswordSuccess(response.data));

      setFormData(initialFormDataChangePassword);
      yield put(logout());
      navigateTo('/login');
      enqueueSnackbar({
        message: 'Password changed successfully! Login using new password',
        variant: 'success',
      });
    } catch (error: any) {
      yield put(changePasswordFailure(error.message));
      handleErrorMessage(error);
    }
  } else {
    // if no token, the password reset link email api is called
    try {
      yield call(axios.post, '/api/auth/password-reset-link', {
        email,
      });
      yield put(changePasswordSuccess());
      setFormData(initialFormDataChangePassword);
      enqueueSnackbar({
        message: 'Password reset link sent to your email!',
        variant: 'info',
      });
      navigateTo('/login');
    } catch (error: any) {
      yield put(changePasswordFailure(error.message));
      handleErrorMessage(error);
    }
  }
}

function* fetchUserInfoSaga({ payload }) {
  const token = payload?.token;
  let options: any = undefined;

  if (token) {
    options = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }
  try {
    const response = yield call(axios.get, '/api/users?currentUser=true', options);
    if (!token) {
      yield put(loadNotifications({ limit: 5 }));
    }
    yield put(fetchUserInfoSuccess(response.data));
  } catch (error: any) {
    yield put(fetchUserInfoFailure(error.message));
    handleErrorMessage(error);
  }
}

function* fetchUserSaga() {
  try {
    const endpoint = '/api/users';
    const response = yield call(axios.get, endpoint);
    yield put(fetchUsersSuccess(response.data));
  } catch (error: any) {
    yield put(fetchUsersFailure(error.message));
    handleErrorMessage(error);
  }
}

function* saveUserSaga({ payload }) {
  try {
    const { formData, setOpenDialog } = payload;
    const method = formData?._id ? 'put' : 'post';
    yield call(axios[method], '/api/users', formData);
    yield put(addUserSuccess());
    if (setOpenDialog) {
      setOpenDialog(false);
    }
    enqueueSnackbar({
      message: `User ${method === 'post' ? 'created' : 'updated'} successfully!`,
      variant: 'success',
    });
    if (method === 'post') {
      yield put(fetchUsers());
    } else {
      yield put(fetchUserInfo());
    }
  } catch (error: any) {
    console.log(error);
    yield put(addUserFailure(error.message));
    handleErrorMessage(error);
  }
}

function* loadEmailTemplatesSaga() {
  try {
    const response = yield call(axios.get, '/api/email-templates');
    if (response.data.success) {
      yield put(loadEmailTemplatesSuccess(response.data.templates || []));
    } else {
      yield put(loadEmailTemplatesSuccess([]));
    }
  } catch (error: any) {
    handleErrorMessage(error);
    yield put(loadEmailTemplatesFailure(error.message));
  }
}

function* saveEmailTemplatesSaga({ payload }) {
  try {
    const { formData, editingTemplate, setOpenDialog } = payload;
    if (editingTemplate) {
      // Update existing template
      const response = yield call(axios.put, '/api/email-templates', {
        id: editingTemplate._id || editingTemplate.id,
        ...formData,
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Update failed');
      }
    } else {
      // Create new template
      const response = yield call(axios.post, '/api/email-templates', formData);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Creation failed');
      }
    }

    // Refresh templates by dispatching load action
    yield put(loadEmailTemplates());
    yield put(saveEmailTemplatesSuccess());

    enqueueSnackbar({
      message: editingTemplate
        ? 'Email template updated successfully!'
        : 'Email template created successfully!',
      variant: 'success',
    });

    if (setOpenDialog && typeof setOpenDialog === 'function') {
      setOpenDialog(false);
    }
  } catch (error: any) {
    handleErrorMessage(error);
    yield put(saveEmailTemplatesFailure(error.message));
  }
}

function* deleteEmailTemplateSaga({ payload }) {
  try {
    const { templateId, setDeleteDialogOpen } = payload;
    const response = yield call(axios.delete, `/api/email-templates?_id=${templateId}`);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Delete failed');
    }

    // Refresh templates by dispatching load action
    yield put(loadEmailTemplates());
    yield put(deleteEmailTemplateSuccess());

    enqueueSnackbar({
      message: 'Email template deleted successfully!',
      variant: 'success',
    });

    if (setDeleteDialogOpen && typeof setDeleteDialogOpen === 'function') {
      setDeleteDialogOpen(false);
    }
  } catch (error: any) {
    handleErrorMessage(error);
    yield put(deleteEmailTemplateFailure(error.message));
  }
}

function* verifyEmailSaga({ payload }) {
  try {
    const token = payload?.token;
    let options: any = undefined;

    if (token) {
      options = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }
    yield call(axios.post, '/api/auth/verify-email', undefined, options);
    yield put(verifyEmailSuccess());
    enqueueSnackbar({
      message: 'Email Verified!',
      variant: 'success',
    });
    navigateTo('/login');
  } catch (error: any) {
    yield put(verifyEmailFailure(error.message));
    handleErrorMessage(error);
    navigateTo('/login');
  }
}

function* getTasks() {
  try {
    const isSuperUser = yield select(selectSuperuser);
    const apiEndpoint = isSuperUser ? '/api/tasks' : '/api/userTasks';
    const response = yield call(axios.get, apiEndpoint);
    yield put(fetchTasksSuccess(response.data));
  } catch (error: any) {
    yield put(fetchTasksFailure(error.message));
    handleErrorMessage(error);
  }
}

function* saveTasksSaga({ payload }) {
  try {
    const { task, onClose } = payload;
    const isEdit = task._id;
    const isStatusUpdate = task?.status;
    const apiEndpoint = !isStatusUpdate ? '/api/tasks' : '/api/userTasks';
    const response = yield call(axios[isEdit ? 'put' : 'post'], apiEndpoint, {
      ...task,
      taskId: task._id,
    });

    yield put(saveTasksSuccess(response.data));

    enqueueSnackbar({
      message: isEdit ? 'Task updated successfully!' : 'Task created successfully!',
      variant: 'success',
    });
    onClose();
    yield put(fetchTasks());
  } catch (error: any) {
    yield put(saveTasksFailure(error.message));
    handleErrorMessage(error);
  }
}

function* deleteTaskSaga({ payload }) {
  try {
    const { id, onClose } = payload;
    yield call(axios.delete, `/api/tasks?_id=${id}`);
    enqueueSnackbar({
      message: 'Task deleted successfully!',
      variant: 'success',
    });
    yield put(fetchTasks());
    yield put(deleteTasksSuccess());
    onClose();
  } catch (error: any) {
    handleErrorMessage(error);
    yield put(deleteTasksFailure(error.message));
  }
}

function* checkoutSaga({ payload }) {
  try {
    const { selectedPlan } = payload;
    const response = yield call(axios.post, '/api/stripe/checkout', {
      plan: selectedPlan,
    });

    const { url } = response.data;
    window.location.href = url;

    yield put(fetchCheckoutSuccess(response.data));
  } catch (error: any) {
    yield put(fetchCheckoutFailure(error.message));
    handleErrorMessage(error);
  }
}

function* deleteUserSaga({ payload }) {
  try {
    const { id, setOpen } = payload;
    yield call(axios.delete, `/api/users?_id=${id}`);
    enqueueSnackbar({
      message: 'User deleted successfully!',
      variant: 'success',
    });
    yield put(deleteUserSuccess());
    yield put(fetchUsers());
    setOpen(false);
  } catch (error: any) {
    yield put(deleteUserFailure(error.message));
    handleErrorMessage(error);
  }
}

function* sendFeedback({ payload }) {
  const { formData, values, attachment, setValues, setAttachment } = payload;
  try {
    // 1) Send legacy feedback email (keeps existing behaviour)
    if (formData) {
      yield call(axios.post, '/api/feedback', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }

    // 2) Upload attachment for support ticket (if any)
    const attachments: any[] = [];
    if (attachment) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', attachment);

      const uploadResponse = yield call(axios.post, '/api/tasks/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { fileUrl, fileName, fileType, fileSize } = uploadResponse.data || {};
      if (fileUrl) {
        attachments.push({ fileUrl, fileName, fileType, fileSize });
      }
    }

    // 3) Create support ticket so admins can see it in Support UI
    const payloadBody: any = {
      subject: values?.feedback?.slice(0, 80) || 'Support request',
      description: values?.feedback || '',
      priority: 'medium',
      category: 'feedback',
      contact: {
        firstName: values?.firstName || '',
        lastName: values?.lastName || '',
        email: values?.email || '',
      },
      attachments,
    };

    yield call(axios.post, '/api/support', payloadBody);

    enqueueSnackbar({
      message: 'Support ticket submitted successfully!',
      variant: 'success',
    });
    setValues({
      firstName: '',
      lastName: '',
      email: '',
      feedback: '',
    });
    setAttachment(null);
    yield put(submitFeedbackSuccess());
  } catch (error: any) {
    yield put(submitFeedbackFailure(error.message));
    handleErrorMessage(error);
  }
}

function* getBillingData() {
  try {
    const response = yield call(axios.get, '/api/stripe/billing');
    yield put(loadBillingSuccess(response.data));
  } catch (error: any) {
    yield put(loadBillingFailure(error.message));
    handleErrorMessage(error);
  }
}

function* getDashboardData() {
  try {
    const response = yield call(axios.get, '/api/dashboard');
    yield put(loadDashboardSuccess(response.data));
  } catch (error: any) {
    yield put(loadDashboardFailure(error.message));
    handleErrorMessage(error);
  }
}

function* getPlansData() {
  try {
    const response = yield call(axios.get, '/api/stripe/plans');
    yield put(loadPlansSuccess(response.data));
  } catch (error: any) {
    yield put(loadPlansFailure(error.message));
    handleErrorMessage(error);
  }
}

function* loadNotificationsSaga({ payload }) {
  let endpoint = '/api/notifications';
  if (payload?.limit) {
    endpoint += `?limit=${payload?.limit}`;
  }

  try {
    const response = yield call(axios.get, endpoint);
    yield put(loadNotificationsSuccess(response.data));
  } catch (error: any) {
    yield put(loadNotificationsFailure(error.message));
    handleErrorMessage(error);
  }
}

function* submitMarkAsReadSaga({ payload }) {
  try {
    yield call(axios.put, '/api/notifications', { id: payload });
    yield put(submitMarkAsReadSuccess());
    const { data } = yield select(selectNotifications);
    yield put(
      loadNotificationsSuccess(
        data.map((item) => ({
          ...item,
          read: item._id === payload ? true : item.read,
        }))
      )
    );
    enqueueSnackbar({
      message: 'Notification marked as read successfully!',
      variant: 'success',
    });
  } catch (error: any) {
    yield put(submitMarkAsReadFailure(error.message));
    handleErrorMessage(error);
  }
}

function* getClients() {
  try {
    const response = yield call(axios.get, '/api/clients');
    yield put(loadClientsSuccess(response.data));
  } catch (error: any) {
    yield put(loadClientsFailure(error.message));
    handleErrorMessage(error);
  }
}

export function* saveTaskOrderSaga({ payload }: { payload }) {
  try {
    const response = yield call(axios.patch, '/api/tasks', payload);
    yield put(saveTasksOrderSuccess(response.data));
    yield put(fetchTasks());
  } catch (error: any) {
    yield put(saveTasksOrderFailure(error.message));
    handleErrorMessage(error);
  }
}

export default function* watchFetchData() {
  yield takeLatest(loginStart.type, userLogin);
  yield takeLatest(changePasswordStart.type, changePasswordSaga);
  yield takeLatest(signupStart.type, postNewUser);
  yield takeLatest(fetchUserInfo.type, fetchUserInfoSaga);
  yield takeLatest(fetchUsers.type, fetchUserSaga);
  yield takeLatest(loadEmailTemplates.type, loadEmailTemplatesSaga);
  yield takeLatest(saveEmailTemplates.type, saveEmailTemplatesSaga);
  yield takeLatest(deleteEmailTemplate.type, deleteEmailTemplateSaga);
  yield takeLatest(verifyEmail.type, verifyEmailSaga);
  yield takeLatest(fetchTasks.type, getTasks);
  yield takeLatest(saveTasks.type, saveTasksSaga);
  yield takeLatest(deleteTasks.type, deleteTaskSaga);
  yield takeLatest(fetchCheckout.type, checkoutSaga);
  yield takeLatest(deleteUser.type, deleteUserSaga);
  yield takeLatest(submitFeedback.type, sendFeedback);
  yield takeLatest(loadBilling.type, getBillingData);
  yield takeLatest(loadDashboard.type, getDashboardData);
  yield takeLatest(loadPlans.type, getPlansData);
  yield takeLatest(loadNotifications.type, loadNotificationsSaga);
  yield takeLatest(submitMarkAsRead.type, submitMarkAsReadSaga);
  yield takeLatest(addUser.type, saveUserSaga);
  yield takeLatest(loadClients.type, getClients);
  yield takeLatest(saveTasksOrder.type, saveTaskOrderSaga);
}
