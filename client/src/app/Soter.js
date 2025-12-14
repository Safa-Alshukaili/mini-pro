// client/src/Store/store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../Features/userSlice';
import postsReducer from '../Features/postSlice';

export const store = configureStore({
  reducer: {
    users: userReducer,
    posts: postsReducer,
  },
});
