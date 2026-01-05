import { RootState } from './store';

// Selector to get the current user
export const selectCurrentUser = (state: RootState) => state.app.currentUser;

// Selector to get the current user
export const selectAuthUser = (state: RootState) => state.app.auth.currentUser;

// Selector to get the user logged out
export const selectLoggedOut = (state: RootState) => state.app.auth.loggedOut;

// Selector to get the current user
export const selectUsers = (state: RootState) => state.app.users;

// Selector to get the loading state
export const selectAuthLoading = (state: RootState) => state.app.auth.loading;

// Selector to get the error message
export const selectAuthError = (state: RootState) => state.app.auth.error;

// Selector to get superuser
export const selectSuperuser = (state: RootState) => state.app.currentUser?.data?.superuser;

// Selector to get role
export const selectUserRole = (state: RootState) => state.app.currentUser?.data?.role;

// Selector to get email templates
export const selectEmailTemplates = (state: RootState) => state.app.emailTemplate;

// Selector to get changing password state
export const selectChangePassword = (state: RootState) => state.app.changePassword;

// Selector to get changing password state
export const selectVerifyEmail = (state: RootState) => state.app.verifyEmail;

// Selector to get tasks
export const selectTasks = (state: RootState) => state.app.tasks;

// Selector to get checkout
export const selectCheckout = (state: RootState) => state.app.checkout;

// Selector to submit feedback
export const selectFeedback = (state: RootState) => state.app.feedback;

// Selector to get billing data
export const selectBilling = (state: RootState) => state.app.billing;

// Selector to get dashboard data
export const selectDashboard = (state: RootState) => state.app.dashboard;

// Selector to get plans
export const selectPlans = (state: RootState) => state.app.plans;

//Selector to get notifications
export const selectNotifications = (state: RootState) => state.app.notifications;

// Selector to get clients
export const selectClients = (state: RootState) => state.app.clients;
