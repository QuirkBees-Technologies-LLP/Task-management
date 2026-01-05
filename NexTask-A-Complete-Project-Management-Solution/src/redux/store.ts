import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import rootSaga from './sagas';
import appReducer from './slices';

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
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
