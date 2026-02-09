import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Rss, Image, Send, Heart, MessageCircle, Share2,
  Camera, Loader2, MoreHorizontal, Clock, Trash2, X,
  ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEMO_POSTS = [
  {
    id: 'demo-1',
    author_name: 'Principal',
    author_avatar: 'P',
    author_role: 'principal',
    author_id: 'demo',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    content: 'Annual sports day preparations are in full swing! Students are showing great enthusiasm for various events.',
    likes: [],
    likes_count: 24,
    comments: [],
    comments_count: 8,
    type: 'announcement',
    photo_url: null
  },
  {
    id: 'demo-2',
    author_name: 'Class 10 Teacher',
    author_avatar: 'T',
    author_role: 'teacher',
    author_id: 'demo',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    content: 'Science lab session was wonderful today. Students performed experiments on chemical reactions with great curiosity.',
    likes: [],
    likes_count: 15,
    comments: [],
    comments_count: 3,
    type: 'activity',
    photo_url: null
  },
  {
    id: 'demo-3',
    author_name: 'Admin Office',
    author_avatar: 'A',
    author_role: 'admin',
    author_id: 'demo',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    content: 'Fee submission deadline for Q3 has been extended to 25th March. Parents are requested to submit fees before the deadline.',
    likes: [],
    likes_count: 42,
    comments: [],
    comments_count: 12,
    type: 'notice',
    photo_url: null
  },
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function SchoolFeedPage() {
  const { user, schoolData } = useAuth();
  const schoolId = user?.school_id || schoolData?.id || '';
  const userId = user?.id || '';
  const userName = user?.name || 'User';
  const userRole = user?.role || 'teacher';

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState('activity');
  const [posting, setPosting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [toastMsg, setToastMsg] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  const fileInputRef = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const isAdmin = ['director', 'principal', 'vice_principal', 'admin', 'super_admin'].includes(userRole);

  const fetchPosts = useCallback(async () => {
    if (!schoolId) {
      setPosts(DEMO_POSTS);
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API}/school-feed/${schoolId}`);
      const fetched = res.data?.posts || [];
      setPosts(fetched.length > 0 ? fetched : DEMO_POSTS);
    } catch {
      setPosts(DEMO_POSTS);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    setSelectedPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadPhoto = async () => {
    if (!selectedPhoto) return null;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedPhoto);
      formData.append('school_id', schoolId);
      const res = await axios.post(`${API}/school-feed/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data?.photo_url || null;
    } catch {
      showToast('Photo upload failed', 'error');
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() && !selectedPhoto) return;
    setPosting(true);
    try {
      let photoUrl = null;
      if (selectedPhoto) {
        photoUrl = await uploadPhoto();
      }

      const res = await axios.post(`${API}/school-feed`, {
        school_id: schoolId,
        content: newPost.trim(),
        type: postType,
        photo_url: photoUrl
      });

      if (res.data?.post) {
        setPosts(prev => [res.data.post, ...prev.filter(p => !p.id.startsWith('demo-'))]);
      }
      setNewPost('');
      removePhoto();
      setPostType('activity');
      showToast('Post shared successfully!');
    } catch {
      const fallbackPost = {
        id: `local-${Date.now()}`,
        author_name: userName,
        author_avatar: userName[0]?.toUpperCase() || 'U',
        author_role: userRole,
        author_id: userId,
        created_at: new Date().toISOString(),
        content: newPost.trim(),
        type: postType,
        photo_url: photoPreview,
        likes: [],
        likes_count: 0,
        comments: [],
        comments_count: 0
      };
      setPosts(prev => [fallbackPost, ...prev]);
      setNewPost('');
      removePhoto();
      setPostType('activity');
      showToast('Posted locally (server unavailable)', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const alreadyLiked = (p.likes || []).includes(userId);
      const newLikes = alreadyLiked
        ? (p.likes || []).filter(id => id !== userId)
        : [...(p.likes || []), userId];
      return { ...p, likes: newLikes, likes_count: newLikes.length > 0 ? newLikes.length : Math.max((p.likes_count || 0) + (alreadyLiked ? -1 : 1), 0) };
    }));

    try {
      await axios.post(`${API}/school-feed/${postId}/like`, { user_id: userId });
    } catch {}
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleComment = async (postId) => {
    const text = (commentTexts[postId] || '').trim();
    if (!text) return;

    const newComment = {
      id: `cmt-${Date.now()}`,
      user_id: userId,
      user_name: userName,
      text,
      created_at: new Date().toISOString()
    };

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: [...(p.comments || []), newComment],
        comments_count: (p.comments_count || 0) + 1
      };
    }));
    setCommentTexts(prev => ({ ...prev, [postId]: '' }));

    try {
      await axios.post(`${API}/school-feed/${postId}/comment`, {
        user_id: userId,
        user_name: userName,
        text
      });
    } catch {}
  };

  const handleShare = (postId) => {
    const url = `${window.location.origin}/school-feed?post=${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copied to clipboard!');
    }).catch(() => {
      showToast('Could not copy link', 'error');
    });
  };

  const handleDelete = async (postId) => {
    setMenuOpen(null);
    try {
      await axios.delete(`${API}/school-feed/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Post deleted');
    } catch {
      setPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Post removed');
    }
  };

  const typeColors = {
    announcement: 'gradient-card-purple',
    activity: 'gradient-card-teal',
    notice: 'gradient-card-blue'
  };

  const typeLabels = {
    announcement: 'Announcement',
    activity: 'Activity',
    notice: 'Notice'
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
          toastMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {toastMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
          {toastMsg.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Feed</h1>
          <p className="text-sm text-gray-500 mt-0.5">Share updates, activities & announcements</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex gap-3">
          <div className="w-10 h-10 gradient-card-blue rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">{userName?.charAt(0) || 'U'}</span>
          </div>
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share an update with your school community..."
              className="w-full px-0 py-1 text-sm text-gray-700 placeholder-gray-400 resize-none border-none focus:outline-none focus:ring-0 min-h-[60px]"
              rows={2}
            />

            {photoPreview && (
              <div className="relative mt-2 inline-block">
                <img src={photoPreview} alt="Preview" className="max-h-48 rounded-xl object-cover border border-gray-100" />
                <button
                  onClick={removePhoto}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Camera className="w-4 h-4" /> Photo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Image className="w-4 h-4" /> Gallery
                </button>

                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
                  className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-300"
                >
                  <option value="activity">Activity</option>
                  <option value="announcement">Announcement</option>
                  <option value="notice">Notice</option>
                </select>
              </div>
              <button
                onClick={handlePost}
                disabled={(!newPost.trim() && !selectedPhoto) || posting}
                className="btn-primary flex items-center gap-2 px-5 py-2 text-xs disabled:opacity-50"
              >
                {posting || uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Rss className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post) => {
              const isLiked = (post.likes || []).includes(userId);
              const commentsOpen = expandedComments[post.id];
              const canDelete = isAdmin || post.author_id === userId;

              return (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeColors[post.type] || 'gradient-card-blue'}`}>
                        <span className="text-white font-semibold text-sm">{post.author_avatar || post.author_name?.[0] || '?'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{post.author_name}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            post.type === 'announcement' ? 'bg-purple-100 text-purple-700' :
                            post.type === 'notice' ? 'bg-blue-100 text-blue-700' :
                            'bg-teal-100 text-teal-700'
                          }`}>
                            {typeLabels[post.type] || post.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Clock className="w-3 h-3" /> {timeAgo(post.created_at)}
                          {post.author_role && (
                            <span className="text-gray-300">• {post.author_role}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                        className="p-1.5 hover:bg-gray-50 rounded-lg"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                      {menuOpen === post.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-10 min-w-[140px]">
                          <button
                            onClick={() => handleShare(post.id)}
                            className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Copy Link
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{post.content}</p>

                  {post.photo_url && (
                    <div className="mb-3">
                      <img
                        src={post.photo_url.startsWith('http') || post.photo_url.startsWith('data:') ? post.photo_url : `${process.env.REACT_APP_BACKEND_URL}${post.photo_url}`}
                        alt="Post"
                        className="w-full max-h-96 object-cover rounded-xl border border-gray-100"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-6 pt-3 border-t border-gray-50">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
                      {post.likes_count || 0}
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {post.comments_count || 0}
                      {commentsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => handleShare(post.id)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-500 transition-colors"
                    >
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>

                  {commentsOpen && (
                    <div className="mt-3 pt-3 border-t border-gray-50 space-y-3">
                      {(post.comments || []).length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(post.comments || []).map((c, idx) => (
                            <div key={c.id || idx} className="flex gap-2">
                              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-semibold text-gray-500">
                                  {(c.user_name || 'U')[0].toUpperCase()}
                                </span>
                              </div>
                              <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                                <p className="text-xs font-semibold text-gray-700">{c.user_name || 'User'}</p>
                                <p className="text-xs text-gray-600 mt-0.5">{c.text}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{timeAgo(c.created_at)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentTexts[post.id] || ''}
                          onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                          placeholder="Write a comment..."
                          className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                        />
                        <button
                          onClick={() => handleComment(post.id)}
                          disabled={!(commentTexts[post.id] || '').trim()}
                          className="px-3 py-2 bg-blue-500 text-white rounded-xl text-xs hover:bg-blue-600 disabled:opacity-50 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
