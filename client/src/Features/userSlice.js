//src/Features/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { UserData } from "../ExampleData";
// Initialize the initial state
const initialState = {
  value: UserData,
  user: {},
  isLoading: false,
  isSuccess: false,
  isError: false,
  errorMessage: "",
};
 
// Thunk for registering a user
export const register = createAsyncThunk("users/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post("http://localhost:3001/register", {
        firstname:userData.firstname,
        lastname: userData.lastname,
        email: userData.email,
        password: userData.password,
      });
      return response.data.user; // Return user data directly
    } catch (error) {
      // Reject and pass error message to the reducer
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const login = createAsyncThunk("users/login", async (userData) => {
  try {
    const response = await axios.post("http://localhost:3001/login", {
      email: userData.email,
      password: userData.password,
    });
 
    const user = response.data.user;
    console.log(response);
    return user;
  } catch (error) {
    //handle the error
    const errorMessage = "Invalid credentials";
    alert(errorMessage);
    throw new Error(errorMessage);
  }
},
 
 
);
export const logout = createAsyncThunk("/users/logout", async () => {
  try {
    // Send a request to your server to log the user out
    const response = await axios.post("http://localhost:3001/logout");
  } catch (error) { }
});
export const updateUserProfile = createAsyncThunk(
  "user/updateUserProfile",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `http://localhost:3001/updateUserProfile/${userData.email}`,
        userData,
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Profile update failed");
    }
  }
);
// Define the slice
export const userSlice = createSlice({
 
  name: "users",
  initialState,
  reducers: {
  
  },
  extraReducers: (builder) => {
    //Asynchronous actions that update the state directly,
    builder
        .addCase(register.pending, (state) => {
            state.isLoading = true;
        })
        .addCase(register.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isSuccess = true;
        })
        .addCase(register.rejected, (state) => {
            state.isLoading = false;
        })
 
   
 
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload; //assign the payload which is the user object return from the server after authentication
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(login.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        // Clear user data or perform additional cleanup if needed
        state.user = {};
        state.isLoading = false;
        state.isSuccess = false;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload;
      });
  },

  
});
 
// Export actions and reducer
//export const { deleteUser, updateUser } = userSlice.actions;
export default userSlice.reducer;
 
 