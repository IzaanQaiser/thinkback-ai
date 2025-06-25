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

// --- ENTRIES API ---

export async function createEntry(idToken: string, entryData: { url: string; notes?: string; }): Promise<any> {
  const response = await fetch(`${API_URL}/api/entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(entryData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create entry');
  }
  return await response.json();
}

export async function fetchEntries(idToken: string): Promise<any[]> {
  const response = await fetch(`${API_URL}/api/entries`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch entries');
  }
  return await response.json();
}

export async function fetchEntry(idToken: string, entryId: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/entries/${entryId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch entry');
  }
  return await response.json();
}

export async function fetchCategories(idToken: string): Promise<any[]> {
  const response = await fetch(`${API_URL}/api/categories`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch categories');
  }
  return await response.json();
}

export async function deleteEntry(idToken: string, entryId: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/entries/${entryId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete entry');
  }
  return await response.json();
}

export async function updateCategory(idToken: string, categoryId: string, newName: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/categories/${categoryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ name: newName }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update category');
  }
  return await response.json();
}

export async function deleteCategory(idToken: string, categoryId: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/categories/${categoryId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete category');
  }
  return await response.json();
}

export async function updateEntry(idToken: string, entryId: string, updateData: any): Promise<any> {
  const response = await fetch(`${API_URL}/api/entries/${entryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(updateData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update entry');
  }
  return await response.json();
}
