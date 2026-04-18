import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem("token", token);
};

export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem("token");
};

export const saveUser = async (user: any): Promise<void> => {
  await AsyncStorage.setItem("user", JSON.stringify(user));
};

export const getUser = async (): Promise<any | null> => {
  const user = await AsyncStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const clearStorage = async (): Promise<void> => {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
};