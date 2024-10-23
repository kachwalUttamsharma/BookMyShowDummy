import { axiosInstance } from ".";

export const addTheatre = async (payload) => {
  try {
    const response = await axiosInstance.post("/theatres/addTheatre", payload);
    return response.data;
  } catch (err) {
    return err.response;
  }
};

// Get all theatres for the Admin route
export const getAllTheatresForAdmin = async () => {
  try {
    const response = await axiosInstance.get("/theatres/getAllTheatres");
    return response.data;
  } catch (err) {
    return err.response;
  }
};

// Get theatres of a specific owner
export const getAllTheatres = async (payload) => {
  try {
    const response = await axiosInstance.post(
      "/theatres/getAllTheatresByOwner",
      payload
    );
    return response.data;
  } catch (err) {
    return err.response;
  }
};

// Update Theatre
export const updateTheatre = async (payload) => {
  try {
    const response = await axiosInstance.patch(
      "/theatres/updateTheatre",
      payload
    );
    return response.data;
  } catch (err) {
    return err.resposne;
  }
};

// Delete Theatre
export const deleteTheatre = async (payload) => {
  try {
    const response = await axiosInstance.delete(
      `/theatres/deleteTheatre/${payload?.theatreId}`
    );
    return response.data;
  } catch (err) {
    return err.response;
  }
};
