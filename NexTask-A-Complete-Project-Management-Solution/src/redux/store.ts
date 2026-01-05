import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import rootSaga from './sagas';
import appReducer from './slices';

let appStore: any;

// Create the saga middleware
const sagaMiddleware = createSagaMiddleware();

export const makeStore = () => {
  if (!appStore) {
    appStore = configureStore({
      reducer: {
        app: appReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }).concat(sagaMiddleware),
      devTools: process.env.NODE_ENV !== 'production',
    });

    // Run the root saga
    sagaMiddleware.run(rootSaga);
  }

  return appStore;
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
