import { accessTokenKey } from '@/utils/constants';
import { navigateTo } from '@/utils/helpers';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';

export interface AppState {
  auth: {
    currentUser: any;
    loading: boolean;
    error: string | null;
    loggedOut: boolean;
  };
  changePassword: {
    loading: boolean;
    error: string | null;
  };
  currentUser: {
    data: any;
    loading: boolean;
    error: string | null;
  };
  users: {
    data: any;
    loading: boolean;
    error: string | null;
    deleting: boolean;
    saving: boolean;
  };
  emailTemplate: {
    loading: boolean;
    error: string | null;
    data: any[];
    saving: boolean;
  };
  verifyEmail: {
    loading: boolean;
    error: string | null;
  };
  tasks: {
    data: any[];
    loading: boolean;
    error: string | null;
    saving: boolean;
  };
  checkout: {
    data: any;
    loading: boolean;
    error: string | null;
  };
  feedback: {
    saving: boolean;
    error: boolean;
  };
  billing: {
    data: any;
    loading: boolean;
    error: string | null;
  };
  dashboard: {
    data: any;
    loading: boolean;
    error: string | null;
  };
  plans: {
    data: any;
    loading: boolean;
    error: string | null;
  };
  notifications: {
    data: any[];
    saving: boolean;
    error: string | null;
    loading: boolean;
  };
  clients: {
    data: any[];
    loading: boolean;
    error: string | null;
    saving: boolean;
    deleting: boolean;
  };
}

const initialState: AppState = {
  auth: { currentUser: null, loading: false, error: null, loggedOut: false },
  changePassword: {
    loading: false,
    error: null,
  },
  currentUser: {
    data: null,
    loading: false,
    error: null,
  },
  users: {
    data: [],
    loading: false,
    error: null,
    deleting: false,
    saving: false,
  },
  emailTemplate: {
    data: [],
    loading: false,
    error: null,
    saving: false,
  },
  verifyEmail: {
    loading: false,
    error: null,
  },
  tasks: {
    data: [],
    loading: false,
    error: null,
    saving: false,
  },
  checkout: {
    data: null,
    loading: false,
    error: null,
  },
  feedback: {
    saving: false,
    error: false,
  },
  billing: {
    data: [],
    loading: false,
    error: null,
  },
  dashboard: {
    data: [],
    loading: false,
    error: null,
  },
  plans: {
    data: [],
    loading: false,
    error: null,
  },
  notifications: {
    data: [],
    loading: false,
    error: null,
    saving: false,
  },
  clients: {
    data: [],
    loading: false,
    error: null,
    saving: false,
    deleting: false,
  },
};

const loginSlice: any = createSlice({
  name: 'app',
  initialState,
  reducers: {
    loginStart(state: AppState, action: PayloadAction<any>) {
      state.auth.loading = true;
      state.auth.error = null;
      state.auth.loggedOut = false;
    },
    loginSuccess(state: AppState, action: PayloadAction<any>) {
      state.auth.loading = false;
      state.auth.currentUser = action.payload;
    },
    loginFailure(state: AppState, action: PayloadAction<string>) {
      state.auth.loading = false;
      state.auth.error = action.payload;
    },
    changePasswordStart(state: AppState, action: PayloadAction<any>) {
      state.changePassword.loading = true;
      state.changePassword.error = null;
    },
    changePasswordSuccess(state: AppState, action: PayloadAction<any>) {
      state.changePassword.loading = false;
      state.changePassword.error = null;
      state.auth.currentUser = action.payload;
    },
    changePasswordFailure(state: AppState, action: PayloadAction<string>) {
      state.changePassword.loading = false;
      state.changePassword.error = action.payload;
    },
    signupStart(state: AppState, action: PayloadAction<any>) {
      state.auth.loading = true;
      state.auth.error = null;
    },
    signupSuccess(state: AppState) {
      state.auth.loading = false;
    },
    signupFailure(state: AppState, action: PayloadAction<string>) {
      state.auth.loading = false;
      state.auth.error = action.payload;
    },
    logout(state: AppState, action: PayloadAction<any | undefined>) {
      state.auth.currentUser = null;
      state.auth.loading = false;
      state.auth.error = null;
      state.currentUser.data = null;
      state.auth.loggedOut = true;
      localStorage.removeItem(accessTokenKey);
      navigateTo('/login');
      enqueueSnackbar({
        message: 'Logged out!',
        variant: 'success',
      });
    },
    fetchUserInfo(state: AppState, action: PayloadAction<any>) {
      state.currentUser.loading = true;
      state.currentUser.error = null;
    },
    fetchUserInfoSuccess(state: AppState, action: PayloadAction<any>) {
      state.currentUser.loading = false;
      state.currentUser.data = action.payload;
    },
    fetchUserInfoFailure(state: AppState, action: PayloadAction<string>) {
      state.currentUser.loading = false;
      state.currentUser.error = action.payload;
    },
    fetchUsers(state: AppState, action: PayloadAction<any>) {
      state.users.loading = true;
      state.users.error = null;
    },
    fetchUsersSuccess(state: AppState, action: PayloadAction<any>) {
      state.users.loading = false;
      state.users.data = action.payload;
    },
    fetchUsersFailure(state: AppState, action: PayloadAction<string>) {
      state.users.loading = false;
      state.users.error = action.payload;
    },
    addUser(state: AppState, action: PayloadAction<any>) {
      state.users.saving = true;
      state.users.error = null;
    },
    addUserSuccess(state: AppState) {
      state.users.saving = false;
    },
    addUserFailure(state: AppState, action: PayloadAction<string>) {
      state.users.saving = false;
      state.users.error = action.payload;
    },
    deleteUser(state: AppState, action: PayloadAction<any>) {
      state.users.deleting = true;
      state.users.error = null;
    },
    deleteUserSuccess(state: AppState) {
      state.users.deleting = false;
    },
    deleteUserFailure(state: AppState, action: PayloadAction<string>) {
      state.users.deleting = false;
      state.users.error = action.payload;
    },
    loadEmailTemplates(state: AppState, action: PayloadAction<any>) {
      state.emailTemplate.loading = true;
      state.emailTemplate.error = null;
    },
    loadEmailTemplatesSuccess(state: AppState, { payload }: PayloadAction<any[]>) {
      state.emailTemplate.loading = false;
      state.emailTemplate.data = payload;
    },
    loadEmailTemplatesFailure(state: AppState, action: PayloadAction<string>) {
      state.emailTemplate.loading = false;
      state.emailTemplate.error = action.payload;
    },
    saveEmailTemplates(state: AppState, action: PayloadAction<any>) {
      state.emailTemplate.saving = true;
      state.emailTemplate.error = null;
    },
    saveEmailTemplatesSuccess(state: AppState) {
      state.emailTemplate.saving = false;
    },
    saveEmailTemplatesFailure(state: AppState, action: PayloadAction<string>) {
      state.emailTemplate.saving = false;
      state.emailTemplate.error = action.payload;
    },
    deleteEmailTemplate(state: AppState, action: PayloadAction<any>) {
      state.emailTemplate.saving = true;
      state.emailTemplate.error = null;
    },
    deleteEmailTemplateSuccess(state: AppState) {
      state.emailTemplate.saving = false;
    },
    deleteEmailTemplateFailure(state: AppState, action: PayloadAction<string>) {
      state.emailTemplate.saving = false;
      state.emailTemplate.error = action.payload;
    },
    verifyEmail(state: AppState, action: PayloadAction<any>) {
      state.verifyEmail.loading = true;
      state.verifyEmail.error = null;
    },
    verifyEmailSuccess(state: AppState) {
      state.verifyEmail.loading = false;
      state.verifyEmail.error = null;
    },
    verifyEmailFailure(state: AppState, action: PayloadAction<string>) {
      state.verifyEmail.loading = false;
      state.verifyEmail.error = action.payload;
    },
    fetchTasks(state: AppState, action: PayloadAction<any>) {
      state.tasks.loading = true;
      state.tasks.error = null;
    },
    fetchTasksSuccess(state: AppState, action: PayloadAction<any>) {
      state.tasks.loading = false;
      state.tasks.data = action.payload;
    },
    fetchTasksFailure(state: AppState, action: PayloadAction<string>) {
      state.tasks.loading = false;
      state.tasks.error = action.payload;
    },
    saveTasks(state: AppState, action: PayloadAction<any>) {
      state.tasks.saving = true;
      state.tasks.error = null;
    },
    saveTasksSuccess(state: AppState) {
      state.tasks.saving = false;
    },
    saveTasksFailure(state: AppState, action: PayloadAction<string>) {
      state.tasks.saving = false;
      state.tasks.error = action.payload;
    },
    deleteTasks(state: AppState, action: PayloadAction<any>) {
      state.tasks.saving = true;
      state.tasks.error = null;
    },
    deleteTasksSuccess(state: AppState) {
      state.tasks.saving = false;
    },
    deleteTasksFailure(state: AppState, action: PayloadAction<string>) {
      state.tasks.saving = false;
      state.tasks.error = action.payload;
    },
    saveTasksOrder(state: AppState, action: PayloadAction<any>) {
      state.tasks.saving = true;
      state.tasks.error = null;
    },
    saveTasksOrderSuccess(state: AppState) {
      state.tasks.saving = false;
    },
    saveTasksOrderFailure(state: AppState, action: PayloadAction<string>) {
      state.tasks.saving = false;
      state.tasks.error = action.payload;
    },
    fetchCheckout(state: AppState, action: PayloadAction<any>) {
      state.checkout.loading = true;
      state.checkout.error = null;
    },
    fetchCheckoutSuccess(state: AppState, action: PayloadAction<any>) {
      state.checkout.loading = false;
      state.checkout.data = action.payload;
    },
    fetchCheckoutFailure(state: AppState, action: PayloadAction<string>) {
      state.checkout.loading = false;
      state.checkout.error = action.payload;
    },
    submitFeedback(state: AppState, action: PayloadAction<any>) {
      state.feedback.saving = true;
      state.feedback.error = false;
    },
    submitFeedbackSuccess(state: AppState) {
      state.feedback.saving = false;
    },
    submitFeedbackFailure(state: AppState) {
      state.feedback.saving = false;
      state.feedback.error = true;
    },
    loadBilling(state: AppState, action: PayloadAction<any>) {
      state.billing.loading = true;
      state.billing.error = null;
    },
    loadBillingSuccess(state: AppState, action: PayloadAction<any>) {
      state.billing.loading = false;
      state.billing.data = action.payload;
    },
    loadBillingFailure(state: AppState, action: PayloadAction<string>) {
      state.billing.loading = false;
      state.billing.error = action.payload;
    },
    loadDashboard(state: AppState, action: PayloadAction<any>) {
      state.dashboard.loading = true;
      state.dashboard.error = null;
    },
    loadDashboardSuccess(state: AppState, action: PayloadAction<any>) {
      state.dashboard.loading = false;
      state.dashboard.data = action.payload;
    },
    loadDashboardFailure(state: AppState, action: PayloadAction<string>) {
      state.dashboard.loading = false;
      state.dashboard.error = action.payload;
    },
    loadPlans(state: AppState, action: PayloadAction<any>) {
      state.plans.loading = true;
      state.plans.error = null;
    },
    loadPlansSuccess(state: AppState, action: PayloadAction<any>) {
      state.plans.loading = false;
      state.plans.data = action.payload;
    },
    loadPlansFailure(state: AppState, action: PayloadAction<string>) {
      state.plans.loading = false;
      state.plans.error = action.payload;
    },
    loadNotifications(state: AppState, action: PayloadAction<any>) {
      state.notifications.loading = true;
      state.notifications.error = null;
    },
    loadNotificationsSuccess(state: AppState, action: PayloadAction<any>) {
      state.notifications.loading = false;
      state.notifications.data = action.payload;
    },
    loadNotificationsFailure(state: AppState, action: PayloadAction<string>) {
      state.notifications.loading = false;
      state.notifications.error = action.payload;
    },
    submitMarkAsRead(state: AppState, action: PayloadAction<any>) {
      state.notifications.saving = true;
      state.notifications.error = null;
    },
    submitMarkAsReadSuccess(state: AppState) {
      state.notifications.saving = false;
    },
    submitMarkAsReadFailure(state: AppState, action: PayloadAction<string>) {
      state.notifications.saving = false;
      state.notifications.error = action.payload;
    },
    loadClients(state: AppState, action: PayloadAction<any>) {
      state.clients.loading = true;
      state.clients.error = null;
    },
    loadClientsSuccess(state: AppState, action: PayloadAction<any>) {
      state.clients.loading = false;
      state.clients.data = action.payload;
    },
    loadClientsFailure(state: AppState, action: PayloadAction<string>) {
      state.clients.loading = false;
      state.clients.error = action.payload;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  signupStart,
  signupSuccess,
  signupFailure,
  fetchUserInfo,
  fetchUserInfoSuccess,
  fetchUserInfoFailure,
  fetchUsers,
  fetchUsersSuccess,
  fetchUsersFailure,
  loadEmailTemplates,
  loadEmailTemplatesSuccess,
  loadEmailTemplatesFailure,
  saveEmailTemplates,
  saveEmailTemplatesSuccess,
  saveEmailTemplatesFailure,
  deleteEmailTemplate,
  deleteEmailTemplateSuccess,
  deleteEmailTemplateFailure,
  changePasswordStart,
  changePasswordSuccess,
  changePasswordFailure,
  verifyEmail,
  verifyEmailSuccess,
  verifyEmailFailure,
  fetchTasks,
  fetchTasksSuccess,
  fetchTasksFailure,
  saveTasks,
  saveTasksSuccess,
  saveTasksFailure,
  deleteTasks,
  deleteTasksSuccess,
  deleteTasksFailure,
  fetchCheckout,
  fetchCheckoutSuccess,
  fetchCheckoutFailure,
  addUser,
  addUserSuccess,
  addUserFailure,
  deleteUser,
  deleteUserSuccess,
  deleteUserFailure,
  submitFeedback,
  submitFeedbackSuccess,
  submitFeedbackFailure,
  loadBilling,
  loadBillingSuccess,
  loadBillingFailure,
  loadDashboard,
  loadDashboardSuccess,
  loadDashboardFailure,
  loadPlans,
  loadPlansSuccess,
  loadPlansFailure,
  loadNotifications,
  loadNotificationsSuccess,
  loadNotificationsFailure,
  submitMarkAsRead,
  submitMarkAsReadSuccess,
  submitMarkAsReadFailure,
  loadClients,
  loadClientsSuccess,
  loadClientsFailure,
  saveTasksOrder,
  saveTasksOrderSuccess,
  saveTasksOrderFailure,
} = loginSlice.actions;

export default loginSlice.reducer;
