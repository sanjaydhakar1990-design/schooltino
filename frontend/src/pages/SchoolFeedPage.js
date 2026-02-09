import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Rss, Image, Send, Heart, MessageCircle, Share2,
  Camera, Plus, Loader2, MoreHorizontal, Clock
} from 'lucide-react';

export default function SchoolFeedPage() {
  const { user, schoolData } = useAuth();
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  const [posts] = useState([
    {
      id: 1,
      author: 'Principal',
      avatar: 'P',
      time: '2 hours ago',
      content: 'Annual sports day preparations are in full swing! Students are showing great enthusiasm for various events.',
      likes: 24,
      comments: 8,
      type: 'announcement'
    },
    {
      id: 2,
      author: 'Class 10 Teacher',
      avatar: 'T',
      time: '5 hours ago',
      content: 'Science lab session was wonderful today. Students performed experiments on chemical reactions with great curiosity.',
      likes: 15,
      comments: 3,
      type: 'activity'
    },
    {
      id: 3,
      author: 'Admin Office',
      avatar: 'A',
      time: 'Yesterday',
      content: 'Fee submission deadline for Q3 has been extended to 25th March. Parents are requested to submit fees before the deadline.',
      likes: 42,
      comments: 12,
      type: 'notice'
    },
  ]);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    setTimeout(() => {
      setNewPost('');
      setPosting(false);
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Feed</h1>
          <p className="text-sm text-gray-500 mt-0.5">Share updates, activities & announcements</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex gap-3">
          <div className="w-10 h-10 gradient-card-blue rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">{user?.name?.charAt(0) || 'U'}</span>
          </div>
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share an update with your school community..."
              className="w-full px-0 py-1 text-sm text-gray-700 placeholder-gray-400 resize-none border-none focus:outline-none focus:ring-0 min-h-[60px]"
              rows={2}
            />
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
                  <Camera className="w-4 h-4" /> Photo
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
                  <Image className="w-4 h-4" /> Gallery
                </button>
              </div>
              <button onClick={handlePost} disabled={!newPost.trim() || posting} className="btn-primary flex items-center gap-2 px-5 py-2 text-xs">
                {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  post.type === 'announcement' ? 'gradient-card-purple' :
                  post.type === 'activity' ? 'gradient-card-teal' : 'gradient-card-blue'
                }`}>
                  <span className="text-white font-semibold text-sm">{post.avatar}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{post.author}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3 h-3" /> {post.time}
                  </div>
                </div>
              </div>
              <button className="p-1.5 hover:bg-gray-50 rounded-lg">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{post.content}</p>
            <div className="flex items-center gap-6 pt-3 border-t border-gray-50">
              <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors">
                <Heart className="w-4 h-4" /> {post.likes}
              </button>
              <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 transition-colors">
                <MessageCircle className="w-4 h-4" /> {post.comments}
              </button>
              <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-500 transition-colors">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
