const API_URL = import.meta.env.VITE_API_URL;

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

export async function updateCategory(idToken: string, categoryId: string, updateData: any): Promise<any> {
  const response = await fetch(`${API_URL}/api/categories/${categoryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(updateData),
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

export async function createCategory(idToken: string, name: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ name, ai_generated: false }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create category');
  }
  return await response.json();
}

export async function cleanupEmptyCategories(idToken: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/cleanup-empty-categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to cleanup empty categories');
  }
  return await response.json();
}

export const submitAIFeedback = async (
  idToken: string,
  feedback: {
    entry_id: string;
    original_category: string;
    suggested_category?: string;
    type: 'correction' | 'rating' | 'suggestion';
    rating?: number;
    notes?: string;
  }
): Promise<any> => {
  const response = await fetch(`${API_URL}/api/ai-feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(feedback),
  });

  if (!response.ok) {
    throw new Error('Failed to submit AI feedback');
  }

  return response.json();
};

export const submitUserFeedback = async (
  idToken: string,
  feedback: {
    type: 'bug' | 'feature';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    userAgent?: string;
    url?: string;
  }
): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to submit feedback');
    }

    return await response.json();
  } catch (error) {
    console.error('API call to submit user feedback failed:', error);
    throw error;
  }
};
