import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Image, Upload, Trash2, Download, Share2, Loader2,
  Grid, List, FolderOpen, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ImageGallery() {
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    file: null,
    category: 'gallery',
    title: '',
    description: ''
  });

  const categories = [
    { id: 'all', name: 'All Images' },
    { id: 'gallery', name: 'Gallery' },
    { id: 'event', name: 'Events' },
    { id: 'notice', name: 'Notices' },
    { id: 'student', name: 'Students' },
    { id: 'staff', name: 'Staff' }
  ];

  const fetchImages = useCallback(async () => {
    try {
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const res = await axios.get(`${API}/images`, { params });
      setImages(res.data);
    } catch (error) {
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      toast.error('Please select an image');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('category', uploadForm.category);
      formData.append('title', uploadForm.title || uploadForm.file.name);
      formData.append('description', uploadForm.description);

      await axios.post(`${API}/images/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Image uploaded successfully!');
      setShowUploadDialog(false);
      setUploadForm({ file: null, category: 'gallery', title: '', description: '' });
      fetchImages();
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    
    try {
      await axios.delete(`${API}/images/${imageId}`);
      toast.success('Image deleted');
      fetchImages();
      setSelectedImage(null);
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleShare = async (image) => {
    const shareUrl = `${process.env.REACT_APP_BACKEND_URL}${image.url}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.title || 'School Image',
          text: 'Check out this image from our school!',
          url: shareUrl
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleWhatsAppShare = (image) => {
    const shareUrl = `${process.env.REACT_APP_BACKEND_URL}${image.url}`;
    const text = encodeURIComponent(`Check out this image: ${image.title || 'School Image'}`);
    const whatsappUrl = `https://wa.me/?text=${text}%20${encodeURIComponent(shareUrl)}`;
    window.open(whatsappUrl, '_blank');
  };

  const generateAIFromImage = async (image) => {
    setAiLoading(true);
    setShowAIDialog(true);
    setAiResult(null);

    try {
      const formData = new FormData();
      formData.append('image_id', image.id);
      formData.append('content_type', 'admission_pamphlet');
      formData.append('school_name', 'Our School');
      formData.append('additional_text', 'Create a professional admission pamphlet using this school image');

      const res = await axios.post(`${API}/ai/generate-from-image`, formData);
      setAiResult(res.data);
      toast.success('AI content generated!');
    } catch (error) {
      toast.error('AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="image-gallery">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Image className="w-8 h-8" />
              Image Gallery
            </h1>
            <p className="text-pink-100 mt-2">
              Upload, manage & share school images
            </p>
          </div>
          <Button 
            onClick={() => setShowUploadDialog(true)}
            className="bg-white text-pink-600 hover:bg-pink-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Image
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="bg-slate-100">
              {categories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id} className="data-[state=active]:bg-pink-600 data-[state=active]:text-white">
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Gallery */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-pink-600" />
        </div>
      ) : images.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No images found</p>
          <Button onClick={() => setShowUploadDialog(true)} className="mt-4">
            <Upload className="w-4 h-4 mr-2" />
            Upload First Image
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map(image => (
            <div 
              key={image.id} 
              className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setSelectedImage(image)}
            >
              <img 
                src={`${process.env.REACT_APP_BACKEND_URL}${image.url}`}
                alt={image.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(image); }}>
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); generateAIFromImage(image); }}>
                  <Sparkles className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDelete(image.id); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-3">
                <p className="font-medium text-slate-900 truncate">{image.title || image.original_name}</p>
                <p className="text-xs text-slate-500 capitalize">{image.category}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {images.map(image => (
            <div key={image.id} className="p-4 flex items-center gap-4 hover:bg-slate-50">
              <img 
                src={`${process.env.REACT_APP_BACKEND_URL}${image.url}`}
                alt={image.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="font-medium text-slate-900">{image.title || image.original_name}</p>
                <p className="text-sm text-slate-500 capitalize">{image.category}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleWhatsAppShare(image)}>
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
                <Button size="sm" variant="outline" onClick={() => generateAIFromImage(image)}>
                  <Sparkles className="w-4 h-4 mr-1" />
                  AI
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(image.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setUploadForm(f => ({ ...f, file: e.target.files[0] }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={uploadForm.category}
                onChange={(e) => setUploadForm(f => ({ ...f, category: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3"
              >
                <option value="gallery">Gallery</option>
                <option value="event">Event</option>
                <option value="notice">Notice</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Image title"
              />
            </div>
            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image View Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          {selectedImage && (
            <div className="space-y-4">
              <img 
                src={`${process.env.REACT_APP_BACKEND_URL}${selectedImage.url}`}
                alt={selectedImage.title}
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
              />
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{selectedImage.title || selectedImage.original_name}</p>
                  <p className="text-sm text-slate-500 capitalize">{selectedImage.category}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleWhatsAppShare(selectedImage)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button onClick={() => generateAIFromImage(selectedImage)}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Poster
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Result Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Generated Content</DialogTitle>
          </DialogHeader>
          {aiLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-pink-600 mb-4" />
              <p>Generating AI content from your image...</p>
            </div>
          ) : aiResult ? (
            <div className="space-y-4">
              {aiResult.generated_image && (
                <img 
                  src={`data:image/png;base64,${aiResult.generated_image}`}
                  alt="Generated"
                  className="w-full h-auto rounded-lg"
                />
              )}
              {aiResult.text_content && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{aiResult.text_content}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No content generated</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
