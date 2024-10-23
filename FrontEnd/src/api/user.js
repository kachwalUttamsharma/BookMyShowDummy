import { axiosInstance } from ".";

export const RegisterUser = async (values) => {
  try {
    const response = await axiosInstance.post("/users/register", values);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const LoginUser = async (values) => {
  try {
    const response = await axiosInstance.post("/users/login", values);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const GetCurrentUser = async () => {
  try {
    const response = await axiosInstance.get("/users/getCurrentUser");
    return response.data;
  } catch (error) {
    return error;
  }
};

export const ForgetPassword = async (value) => {
  try {
    const response = await axiosInstance.patch("/users/forgetPassword", value);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

export const ResetPassword = async (value) => {
  try {
    const response = await axiosInstance.patch("/users/resetPassword", value);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};
