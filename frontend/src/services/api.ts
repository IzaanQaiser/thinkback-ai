const API_URL = 'http://localhost:8000'; // Or your deployed backend URL

export async function verifyUserToken(idToken: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Token verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API call to verify token failed:', error);
    throw error;
  }
}

export async function changePassword(idToken: string, newPassword: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ new_password: newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Password change failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API call to change password failed:', error);
    throw error;
  }
}
