const API_URL = import.meta.env.VITE_API_URL;

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache utility functions
function getCacheKey(endpoint: string, idToken: string): string {
  return `${endpoint}_${idToken.slice(-10)}`; // Use last 10 chars of token for cache key
}

function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function clearCache(): void {
  cache.clear();
}

// Export cache utilities for use in components
export { clearCache, getCachedData, setCachedData };

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
  
  // Clear cache when new entry is created
  clearCache();
  return await response.json();
}

export async function fetchEntries(idToken: string, useCache: boolean = true): Promise<any[]> {
  const cacheKey = getCacheKey('entries', idToken);
  
  // Check cache first
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('📦 Using cached entries data');
      return cached;
    }
  }

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
  
  const data = await response.json();
  
  // Cache the result
  if (useCache) {
    setCachedData(cacheKey, data);
  }
  
  return data;
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

export async function fetchCategories(idToken: string, useCache: boolean = true): Promise<any[]> {
  const cacheKey = getCacheKey('categories', idToken);
  
  // Check cache first
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('📦 Using cached categories data');
      return cached;
    }
  }

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
  
  const data = await response.json();
  
  // Cache the result
  if (useCache) {
    setCachedData(cacheKey, data);
  }
  
  return data;
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
  
  // Clear cache when entry is deleted
  clearCache();
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
  
  // Clear cache when category is updated
  clearCache();
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
  
  // Clear cache when category is deleted
  clearCache();
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
  
  // Clear cache when entry is updated
  clearCache();
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
  
  // Clear cache when new category is created
  clearCache();
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
  
  // Clear cache when cleanup is performed
  clearCache();
  return await response.json();
}

export async function checkCleanupNeeded(idToken: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/check-cleanup-needed`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to check cleanup status');
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
