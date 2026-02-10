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
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Image, Upload, Trash2, Share2, Loader2,
  Grid, FolderOpen, Sparkles, Plus, ArrowLeft, Calendar, Camera
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ImageGallery() {
  const { user, schoolId } = useAuth();
  const sId = schoolId || user?.school_id || '';
  const isAdmin = ['director', 'principal', 'vice_principal', 'admin'].includes(user?.role);
  
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [eventForm, setEventForm] = useState({
    event_name: '',
    event_date: new Date().toISOString().split('T')[0],
    event_type: 'other',
    description: '',
    is_public: true
  });

  const [uploadFiles, setUploadFiles] = useState(null);
  const [uploadCaption, setUploadCaption] = useState('');

  const eventTypes = [
    { id: 'annual_function', name: 'Annual Function' },
    { id: 'sports_day', name: 'Sports Day' },
    { id: 'independence_day', name: 'Independence Day' },
    { id: 'republic_day', name: 'Republic Day' },
    { id: 'teachers_day', name: "Teachers Day" },
    { id: 'childrens_day', name: "Children's Day" },
    { id: 'farewell', name: 'Farewell' },
    { id: 'cultural_program', name: 'Cultural Program' },
    { id: 'science_fair', name: 'Science Fair' },
    { id: 'prize_distribution', name: 'Prize Distribution' },
    { id: 'excursion', name: 'Excursion/Trip' },
    { id: 'other', name: 'Other Event' }
  ];

  const fetchEvents = useCallback(async () => {
    if (!sId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/gallery/events/${sId}`);
      setEvents(res.data?.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [sId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const fetchEventPhotos = async (event) => {
    setSelectedEvent(event);
    setLoadingPhotos(true);
    try {
      const res = await axios.get(`${API}/gallery/events/${sId}/${event.id}`);
      setPhotos(res.data?.photos || []);
    } catch (error) {
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.event_name) {
      toast.error('Event name is required');
      return;
    }
    try {
      await axios.post(`${API}/gallery/events`, {
        school_id: sId,
        event_name: eventForm.event_name,
        event_date: eventForm.event_date,
        event_type: eventForm.event_type,
        description: eventForm.description,
        is_public: eventForm.is_public,
        created_by: user?.name || user?.id || 'Admin'
      });
      toast.success('Event created! / इवेंट बना दिया गया!');
      setShowEventDialog(false);
      setEventForm({ event_name: '', event_date: new Date().toISOString().split('T')[0], event_type: 'other', description: '', is_public: true });
      fetchEvents();
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const handleUploadPhotos = async (e) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0 || !selectedEvent) {
      toast.error('Please select photos');
      return;
    }

    setUploading(true);
    try {
      if (uploadFiles.length === 1) {
        const formData = new FormData();
        formData.append('file', uploadFiles[0]);
        formData.append('uploaded_by', user?.name || user?.id || 'Admin');
        if (uploadCaption) formData.append('caption', uploadCaption);

        await axios.post(`${API}/gallery/upload/${sId}/${selectedEvent.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        const formData = new FormData();
        for (let i = 0; i < uploadFiles.length; i++) {
          formData.append('files', uploadFiles[i]);
        }
        formData.append('uploaded_by', user?.name || user?.id || 'Admin');

        await axios.post(`${API}/gallery/upload-multiple/${sId}/${selectedEvent.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success(`${uploadFiles.length} photo(s) uploaded! / फ़ोटो अपलोड हो गई!`);
      setShowUploadDialog(false);
      setUploadFiles(null);
      setUploadCaption('');
      fetchEventPhotos(selectedEvent);
    } catch (error) {
      toast.error('Upload failed / अपलोड विफल');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Delete this photo? / यह फ़ोटो डिलीट करें?')) return;
    try {
      await axios.delete(`${API}/gallery/photos/${photoId}?school_id=${sId}`);
      toast.success('Photo deleted / फ़ोटो डिलीट हो गई');
      setPhotos(photos.filter(p => p.id !== photoId));
      setSelectedPhoto(null);
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleSharePhoto = (photo) => {
    const shareUrl = `${process.env.REACT_APP_BACKEND_URL}${photo.photo_url}`;
    const text = encodeURIComponent(`${selectedEvent?.event_name || 'School Photo'}`);
    const whatsappUrl = `https://wa.me/?text=${text}%20${encodeURIComponent(shareUrl)}`;
    window.open(whatsappUrl, '_blank');
  };

  const goBackToEvents = () => {
    setSelectedEvent(null);
    setPhotos([]);
  };

  if (selectedEvent) {
    return (
      <div className="space-y-6" data-testid="image-gallery">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={goBackToEvents}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{selectedEvent.event_name}</h1>
              <p className="text-sm text-slate-500">
                {selectedEvent.event_date} • {selectedEvent.event_type?.replace(/_/g, ' ')}
                {selectedEvent.description && ` • ${selectedEvent.description}`}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowUploadDialog(true)} className="bg-pink-600 hover:bg-pink-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Photos
            </Button>
          )}
        </div>

        {loadingPhotos ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-pink-600" />
          </div>
        ) : photos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Camera className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No photos in this event yet / अभी कोई फ़ोटो नहीं</p>
              {isAdmin && (
                <Button onClick={() => setShowUploadDialog(true)} className="mt-4" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Photo
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map(photo => (
              <div 
                key={photo.id}
                className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img 
                  src={`${process.env.REACT_APP_BACKEND_URL}${photo.photo_url}`}
                  alt={photo.caption || 'Photo'}
                  className="w-full h-48 object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleSharePhoto(photo); }}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                  {isAdmin && (
                    <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {photo.caption && (
                  <div className="p-2">
                    <p className="text-sm text-slate-700 truncate">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Photos / फ़ोटो अपलोड करें</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUploadPhotos} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Photos</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setUploadFiles(e.target.files)}
                  required
                />
                {uploadFiles && (
                  <p className="text-sm text-slate-500">{uploadFiles.length} file(s) selected</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Caption (optional)</Label>
                <Input
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Photo caption..."
                />
              </div>
              <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700" disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-3xl">
            {selectedPhoto && (
              <div className="space-y-4">
                <img 
                  src={`${process.env.REACT_APP_BACKEND_URL}${selectedPhoto.photo_url}`}
                  alt={selectedPhoto.caption || 'Photo'}
                  className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                />
                <div className="flex justify-between items-center">
                  <div>
                    {selectedPhoto.caption && <p className="font-semibold">{selectedPhoto.caption}</p>}
                    <p className="text-sm text-slate-500">
                      By {selectedPhoto.uploaded_by} • {selectedPhoto.uploaded_at ? new Date(selectedPhoto.uploaded_at).toLocaleDateString('en-IN') : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleSharePhoto(selectedPhoto)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                    {isAdmin && (
                      <Button variant="destructive" onClick={() => handleDeletePhoto(selectedPhoto.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="image-gallery">
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Image className="w-8 h-8" />
              School Gallery / स्कूल गैलरी
            </h1>
            <p className="text-pink-100 mt-2">
              Event photos & memories / इवेंट फ़ोटो
            </p>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setShowEventDialog(true)}
              className="bg-white text-pink-600 hover:bg-pink-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-pink-600" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No events yet / अभी कोई इवेंट नहीं</p>
            {isAdmin && (
              <Button onClick={() => setShowEventDialog(true)} className="mt-4" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create First Event
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <Card 
              key={event.id} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => fetchEventPhotos(event)}
            >
              <div className="h-40 bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center relative overflow-hidden">
                {event.cover_photo ? (
                  <img 
                    src={`${process.env.REACT_APP_BACKEND_URL}${event.cover_photo}`}
                    alt={event.event_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <Camera className="w-16 h-16 text-pink-300" />
                )}
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                  {event.photo_count || 0} photos
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg text-slate-900 truncate">{event.event_name}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{event.event_date}</span>
                  <span className="capitalize">• {event.event_type?.replace(/_/g, ' ')}</span>
                </div>
                {event.description && (
                  <p className="text-sm text-slate-400 mt-2 line-clamp-2">{event.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Event / नया इवेंट बनाएं</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Event Name *</Label>
              <Input
                value={eventForm.event_name}
                onChange={(e) => setEventForm(f => ({ ...f, event_name: e.target.value }))}
                placeholder="Annual Function 2025"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Date</Label>
                <Input
                  type="date"
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm(f => ({ ...f, event_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Event Type</Label>
                <select
                  value={eventForm.event_type}
                  onChange={(e) => setEventForm(f => ({ ...f, event_type: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-slate-200 px-3"
                >
                  {eventTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={eventForm.description}
                onChange={(e) => setEventForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Event details..."
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreateEvent} className="flex-1 bg-pink-600 hover:bg-pink-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
              <Button variant="outline" onClick={() => setShowEventDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
