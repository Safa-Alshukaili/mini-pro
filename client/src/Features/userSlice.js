// client/src/Features/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { UserData } from "../ExampleData";
import { API_BASE } from "../api";

const initialState = {
  value: UserData,
  user: {},
  isLoading: false,
  isSuccess: false,
  isError: false,
  errorMessage: "",
};

// ✅ Register
export const register = createAsyncThunk(
  "users/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/register`, {
        firstname: userData.firstname,
        lastname: userData.lastname,
        email: userData.email,
        password: userData.password,
      });
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ✅ Login
export const login = createAsyncThunk("users/login", async (userData, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_BASE}/login`, {
      email: userData.email,
      password: userData.password,
    });

    return response.data.user;
  } catch (error) {
    // ✅ خليها ترجع رسالة السيرفر بدل alert ثابت
    return rejectWithValue(error.response?.data?.message || "Invalid credentials");
  }
});

// ✅ Logout (اختياري - عندك endpoint /logout غير موجود بالسيرفر، نخليه safe)
export const logout = createAsyncThunk("users/logout", async () => {
  try {
    // لو ما عندك logout route ما يضر
    await axios.post(`${API_BASE}/logout`);
  } catch (error) {}
});

// (اختياري) Update profile قديم عندك - endpoint غير موجود عندك بالسيرفر
// نخليه مثل ما هو لكن نخليه ما يكسر
export const updateUserProfile = createAsyncThunk(
  "user/updateUserProfile",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE}/updateUserProfile/${userData.email}`,
        userData,
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Profile update failed");
    }
  }
);

export const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = "";
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload || "Registration failed";
      })

      // login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = "";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload || {};
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload || "Login failed";
      })

      // logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = {};
        state.isLoading = false;
        state.isSuccess = false;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
      })

      // update profile (optional)
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload || state.user;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload || "Profile update failed";
      });
  },
});

export default userSlice.reducer;
