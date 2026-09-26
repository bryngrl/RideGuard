const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://rideguard-api-gvanehe0gbdvf9bw.japaneast-01.azurewebsites.net/v1";

export const checkIsOldUser = async (firebaseToken: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/is-old-user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to check user status.");
  }

  return data.data;
};