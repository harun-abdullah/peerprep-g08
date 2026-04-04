import axios, { AxiosError } from "axios";

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_USER_API_URL}/auth/login`,
      { email, password },
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    if (axiosError.response?.data) {
      throw new Error(axiosError.response.data.message || "Login failed");
    }
    throw new Error(axiosError.message || "An unexpected error occurred");
  }
};

export const registerUser = async (userData: {
  username: string;
  email: string;
  password: string;
  code?: string;
}) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_USER_API_URL}/users`,
      userData,
    );

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    if (axiosError.response?.data) {
      throw new Error(axiosError.response.data.message || "Registration failed");
    }
    throw new Error(axiosError.message || "An unexpected error occurred");
  }
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await axios.get(
      `${import.meta.env.VITE_USER_API_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    if (axiosError.response?.data) {
      throw new Error(axiosError.response.data.message || "Failed to fetch user data");
    }
    throw new Error(axiosError.message || "An unexpected error occurred");
  }
};

