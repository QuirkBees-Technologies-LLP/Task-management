import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import rootSaga from './sagas';
import appReducer from './slices';
import type { AppState } from './slices';

// Create the saga middleware
const sagaMiddleware = createSagaMiddleware();

export const makeStore = () => {
  const store = configureStore({
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

  return store;
};

// Create a single store instance
export const store = makeStore();

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Explicitly define RootState using the AppState interface
export type RootState = {
  app: AppState;
};
export type AppDispatch = AppStore['dispatch'];
