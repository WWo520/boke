const BASE_URL = '/api';

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getToken() {
  try {
    return sessionStorage.getItem('blog_token');
  } catch {
    return null;
  }
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json;
  try {
    json = await res.json();
  } catch {
    const text = await res.text();
    throw new ApiError(res.status, 'PARSE_ERROR', text || '服务器返回无效响应');
  }

  if (!res.ok) {
    const err = json.error || { code: 'UNKNOWN', message: '请求失败' };
    throw new ApiError(res.status, err.code, err.message);
  }

  return json;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
};

// Auth
export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword, confirmPassword) => api.put('/auth/password', { currentPassword, newPassword, confirmPassword }),
};

// Posts
export const postsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    if (params.category) qs.set('category', params.category);
    if (params.search) qs.set('search', params.search);
    if (params.sort) qs.set('sort', params.sort);
    if (params.tag) qs.set('tag', params.tag);
    const query = qs.toString();
    return api.get(`/posts${query ? '?' + query : ''}`);
  },
  popular: (limit = 5) => api.get(`/posts/popular?limit=${limit}`),
  getBySlug: (slug) => api.get(`/posts/${slug}`),
  getById: (id) => api.get(`/posts/id/${id}`),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  publish: (id) => api.post(`/posts/${id}/publish`),
  getUserPosts: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    if (params.status) qs.set('status', params.status);
    const query = qs.toString();
    return api.get(`/users/posts${query ? '?' + query : ''}`);
  },
};

// Comments
export const commentsApi = {
  list: (slug, page = 1, pageSize = 10) => api.get(`/posts/${slug}/comments?page=${page}&pageSize=${pageSize}`),
  create: (slug, content) => api.post(`/posts/${slug}/comments`, { content }),
  recent: (limit = 5) => api.get(`/comments/recent?limit=${limit}`),
  like: (id) => api.post(`/comments/${id}/like`),
};

// Author
export const authorApi = {
  get: () => api.get('/author'),
};

// Categories & Tags
export const categoriesApi = {
  list: () => api.get('/categories'),
};

export const tagsApi = {
  list: () => api.get('/tags'),
};

// Likes
export const likesApi = {
  toggle: (slug) => api.post(`/posts/${slug}/like`),
  getStatus: (slug) => api.get(`/posts/${slug}/like-status`),
};

// Favorites
export const favoritesApi = {
  toggle: (slug) => api.post(`/posts/${slug}/favorite`),
  getStatus: (slug) => api.get(`/posts/${slug}/favorite-status`),
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    const query = qs.toString();
    return api.get(`/users/favorites${query ? '?' + query : ''}`);
  },
};

// Profile
export const profileApi = {
  update: (data) => api.put('/auth/profile', data),
};

// User
export const usersApi = {
  getByUsername: (username) => api.get(`/users/${username}`),
  getPosts: (username, params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    if (params.status) qs.set('status', params.status);
    const query = qs.toString();
    return api.get(`/users/${username}/posts${query ? '?' + query : ''}`);
  },
  getColumns: (username) => api.get(`/users/${username}/columns`),
};

// Search
export const searchApi = {
  all: (query, params = {}) => {
    const qs = new URLSearchParams({ q: query });
    if (params.type) qs.set('type', params.type);
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    return api.get(`/search?${qs.toString()}`);
  },
  posts: (query, params = {}) => {
    const qs = new URLSearchParams({ q: query });
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    return api.get(`/search/posts?${qs.toString()}`);
  },
  users: (query, params = {}) => {
    const qs = new URLSearchParams({ q: query });
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    return api.get(`/search/users?${qs.toString()}`);
  },
  tags: (query) => api.get(`/search/tags?q=${encodeURIComponent(query)}`),
};

// Ranking
export const rankingApi = {
  posts: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.period) qs.set('period', params.period);
    if (params.limit) qs.set('limit', params.limit);
    return api.get(`/ranking/posts${qs.toString() ? '?' + qs.toString() : ''}`);
  },
  authors: (limit = 20) => api.get(`/ranking/authors?limit=${limit}`),
  tags: (limit = 30) => api.get(`/ranking/tags?limit=${limit}`),
  views: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.period) qs.set('period', params.period);
    if (params.limit) qs.set('limit', params.limit);
    return api.get(`/ranking/views${qs.toString() ? '?' + qs.toString() : ''}`);
  },
  comments: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.period) qs.set('period', params.period);
    if (params.limit) qs.set('limit', params.limit);
    return api.get(`/ranking/comments${qs.toString() ? '?' + qs.toString() : ''}`);
  },
};

// Columns
export const columnsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    const query = qs.toString();
    return api.get(`/columns${query ? '?' + query : ''}`);
  },
  get: (slug) => api.get(`/columns/${slug}`),
  create: (data) => api.post('/columns', data),
  update: (id, data) => api.put(`/columns/${id}`, data),
  delete: (id) => api.delete(`/columns/${id}`),
  addPost: (columnId, postId) => api.post(`/columns/${columnId}/posts`, { postId }),
  removePost: (columnId, postId) => api.delete(`/columns/${columnId}/posts/${postId}`),
  getUserColumns: (username) => api.get(`/users/${username}/columns`),
};

// Follow
export const followApi = {
  toggle: (userId) => api.post(`/follow/${userId}`),
  check: (userId) => api.get(`/follow/${userId}`),
  followers: (username, params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    const query = qs.toString();
    return api.get(`/users/${username}/followers${query ? '?' + query : ''}`);
  },
  following: (username, params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    const query = qs.toString();
    return api.get(`/users/${username}/following${query ? '?' + query : ''}`);
  },
};

// Points
export const pointsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    const query = qs.toString();
    return api.get(`/users/points${query ? '?' + query : ''}`);
  },
};

// Questions
export const questionsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    if (params.status) qs.set('status', params.status);
    if (params.tag) qs.set('tag', params.tag);
    const query = qs.toString();
    return api.get(`/questions${query ? '?' + query : ''}`);
  },
  get: (id) => api.get(`/questions/${id}`),
  create: (data) => api.post('/questions', data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
  answer: (questionId, content) => api.post(`/questions/${questionId}/answers`, { content }),
  likeAnswer: (answerId) => api.post(`/answers/${answerId}/like`),
  acceptAnswer: (answerId) => api.post(`/answers/${answerId}/accept`),
};

// Admin
export const adminApi = {
  stats: () => api.get('/admin/stats'),
  posts: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    if (params.status) qs.set('status', params.status);
    const query = qs.toString();
    return api.get(`/admin/posts${query ? '?' + query : ''}`);
  },
  deletePost: (id) => api.delete(`/admin/posts/${id}`),
  comments: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    const query = qs.toString();
    return api.get(`/admin/comments${query ? '?' + query : ''}`);
  },
  deleteComment: (id) => api.delete(`/comments/${id}`),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  users: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    const query = qs.toString();
    return api.get(`/admin/users${query ? '?' + query : ''}`);
  },
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
};

// File upload (uses FormData, not JSON)
export async function uploadImage(file, onProgress) {
  const token = getToken();
  if (!token) throw new ApiError(401, 'UNAUTHORIZED', '请先登录');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(json.data);
        } else {
          reject(new ApiError(xhr.status, json.error?.code || 'UNKNOWN', json.error?.message || '上传失败'));
        }
      } catch {
        reject(new ApiError(500, 'PARSE_ERROR', '响应解析失败'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new ApiError(0, 'NETWORK_ERROR', '网络错误，请检查连接'));
    });

    xhr.addEventListener('abort', () => {
      reject(new ApiError(0, 'ABORTED', '上传已取消'));
    });

    const formData = new FormData();
    formData.append('image', file);
    xhr.send(formData);
  });
}
