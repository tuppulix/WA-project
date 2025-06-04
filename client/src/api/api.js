/* ================================================
 *  api/index.js  –  Front-end helper for REST APIs
 *  (Forum – Exam #1)
 * -----------------------------------------------
 *  All requests use credentials: 'include'
 *  to maintain session-based login.
 * ================================================ */

const API_URL = 'http://localhost:3001/api';

/* ────────────────────────────────────────── */
/*  Utility – Handles response errors safely  */
/* ────────────────────────────────────────── */
const handleResponse = async (res) => {
  if (res.ok) return res.json();

  // Handle non-JSON or empty body (e.g. 204 No Content)
  let error = 'API error';
  try {
    const body = await res.json();
    error = body.error || error;
  } catch {
    /* ignore parsing error */
  }
  throw new Error(error);
};

const jsonHeaders = { 'Content-Type': 'application/json' };

/* ────────────────────────────────────────── */
/*  AUTH – login, logout, session info        */
/* ────────────────────────────────────────── */

// Login user with optional 2FA OTP (admin only)
export async function login({ email, password, otp, adminLogin = false }) {
  const res = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify({ email, password, otp, adminLogin }),
  });
  return handleResponse(res);
}

// Logout user
export async function logout() {
  const res = await fetch(`${API_URL}/sessions/current`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Logout failed');
}

// Fetch current session user data
export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/sessions/current`, {
    credentials: 'include',
  });
  return handleResponse(res);
}

/* ────────────────────────────────────────── */
/*  POSTS – View, create, delete posts        */
/* ────────────────────────────────────────── */

// Get paginated list of posts (visible to everyone)
export async function getAllPosts() {
  const res = await fetch(`${API_URL}/posts`);
  return handleResponse(res);
}

// Get a single post by ID
export async function getPostById(id) {
  const res = await fetch(`${API_URL}/posts/${id}`);
  return handleResponse(res);
}

// Create a new post (logged-in users only)
export async function createPost({ title, text, maxComments }) {
  const res = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify({ title, text, maxComments }),
  });
  return handleResponse(res);
}

// Delete a post (only author can do this)
export async function deletePost(id) {
  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete post');
}

// Admin deletes any post (requires 2FA)
export async function adminDeletePost(id) {
  const res = await fetch(`${API_URL}/admin/posts/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete post (admin)');
}

/* ────────────────────────────────────────── */
/*  COMMENTS – Add/view/edit/delete comments  */
/* ────────────────────────────────────────── */

// Get comments for a post (only visible to authenticated users)
export async function getCommentsForPost(postId) {
  const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
    credentials: 'include',
  });
  return handleResponse(res);
}

// Alias for compatibility
export const getComments = getCommentsForPost;

// Get comment count (used also for limit validation)
export async function getCommentCount(postId) {
  const res = await fetch(`${API_URL}/posts/${postId}/comments/count`);
  return handleResponse(res);
}

// Add comment (can be anonymous if not logged in)
export async function addComment(postId, content) {
  const text =
    typeof content === 'string' ? content : (content?.text ?? '').toString();
  const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify({ text }),
  });
  return handleResponse(res);
}

// Edit comment (only by author)
export async function editComment(commentId, newText) {
  const res = await fetch(`${API_URL}/comments/${commentId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify({ text: newText.trim() }),
  });
  if (!res.ok) throw new Error('Edit comment failed');
}

// Admin edits any comment
export async function adminEditComment(commentId, newText) {
  const res = await fetch(`${API_URL}/admin/comments/${commentId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify({ text: newText.trim() }),
  });
  if (!res.ok) throw new Error('Admin edit comment failed');
}

// Delete comment (only by author)
export async function deleteComment(commentId) {
  const res = await fetch(`${API_URL}/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Delete comment failed');
}

// Admin deletes any comment
export async function adminDeleteComment(commentId) {
  const res = await fetch(`${API_URL}/admin/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Admin delete comment failed');
}

/* ────────────────────────────────────────── */
/*  FLAGS – Mark comments as interesting      */
/* ────────────────────────────────────────── */

// Add a "flag" to mark comment as interesting (user-specific)
export async function addFlag(commentId) {
  const res = await fetch(`${API_URL}/comments/${commentId}/flag`, {
    method: 'POST',
    credentials: 'include',
  });
  return handleResponse(res);
}

// Remove user's flag on a comment
export async function removeFlag(commentId) {
  const res = await fetch(`${API_URL}/comments/${commentId}/flag`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Remove flag failed');
}

// Get list of comment IDs flagged by the current user
export async function getUserFlags() {
  const res = await fetch(`${API_URL}/users/me/flags`, {
    credentials: 'include',
  });
  return handleResponse(res);
}

/* ────────────────────────────────────────── */
/*  Aggregated export                         */
/* ────────────────────────────────────────── */
const API = {
  // Auth
  login,
  logout,
  getCurrentUser,

  // Posts
  getAllPosts,
  getPostById,
  createPost,
  deletePost,
  adminDeletePost,

  // Comments
  getCommentsForPost,
  getComments,
  getCommentCount,
  addComment,
  editComment,
  adminEditComment,
  deleteComment,
  adminDeleteComment,

  // Flags
  addFlag,
  removeFlag,
  getUserFlags,
};

export default API;
