
import React, { useState, useRef } from 'react';
import { ShieldAlert, Upload, Image as ImageIcon, Video, Type, Save, Eye, Bell, Send, Calendar, BookOpen, Info, BadgeCheck } from 'lucide-react';
import { Card, Button, Input, Tabs } from '../components/UI';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AdminProps {
  user: User;
  onNavigate: (route: any) => void;
}

export const Admin: React.FC<AdminProps> = ({ user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('Courses');
  
  if (user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
           <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access Denied</h1>
        <p className="text-slate-500 max-w-md">You do not have permission to view the Admin Dashboard.</p>
        <Button onClick={() => onNavigate('dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
           <p className="text-sm text-slate-500">Manage platform content</p>
        </div>
      </div>

      <Tabs tabs={['Courses', 'Visual Learning', 'Notifications']} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'Courses' && <CourseManager user={user} />}
      {activeTab === 'Visual Learning' && <VisualManager />}
      {activeTab === 'Notifications' && <NotificationManager />}
    </div>
  );
};

// HELPER: Production-ready upload with validation
const uploadToSupabase = async (file: File, bucket: 'images' | 'videos' = 'images'): Promise<string | null> => {
    // 1. Validate File Size
    const MAX_IMG_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_VID_SIZE = 50 * 1024 * 1024; // 50MB
    
    if (bucket === 'images' && file.size > MAX_IMG_SIZE) {
        alert("Image file is too large. Max size is 5MB.");
        return null;
    }
    if (bucket === 'videos' && file.size > MAX_VID_SIZE) {
        alert("Video file is too large. Max size is 50MB.");
        return null;
    }

    // 2. Validate File Type (Match DB Policy)
    if (bucket === 'images' && !file.type.startsWith('image/')) {
        alert("Invalid file type. Please upload an image.");
        return null;
    }
    if (bucket === 'videos' && !file.type.startsWith('video/')) {
        alert("Invalid file type. Please upload a video.");
        return null;
    }

    try {
        const fileExt = file.name.split('.').pop();
        // Sanitize filename
        const safeName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${Date.now()}_${safeName}.${fileExt}`;
        
        const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
            upsert: true
        });

        if (error) throw error;

        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return publicData.publicUrl;
    } catch (error) {
        console.error('Upload error:', error);
        alert(`Error uploading file: ${(error as any).message}`);
        return null;
    }
};

const CourseManager = ({ user }: { user: User }) => {
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    author: 'Admin',
    price: '5.99',
    content: ''
  });
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const contentImgInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCourseData({ ...courseData, [e.target.name]: e.target.value });
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadToSupabase(file, 'images');
      if (url) setThumbnailUrl(url);
    }
  };

  const handleContentImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const url = await uploadToSupabase(file, 'images');
        if (url) insertImageAtCursor(url);
    }
    if (contentImgInputRef.current) contentImgInputRef.current.value = '';
  };

  const insertImageAtCursor = (url: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = courseData.content;
    const imgTag = `\n<img src="${url}" alt="Course content" class="w-full md:w-4/5 mx-auto h-auto rounded-2xl shadow-lg my-8 object-cover border border-slate-100 dark:border-zinc-800" />\n`;
    const newContent = text.substring(0, start) + imgTag + text.substring(end);
    setCourseData(prev => ({ ...prev, content: newContent }));
  };

  const handleSave = async () => {
    if (!courseData.title || !courseData.description) {
      alert("Please fill in the required fields.");
      return;
    }
    setIsSaving(true);
    try {
        const { error } = await supabase.from('courses').insert({
            title: courseData.title,
            description: courseData.description,
            author: courseData.author,
            price: parseFloat(courseData.price),
            image: thumbnailUrl,
            content: courseData.content,
            is_published: isPublished,
            user_id: user.id // Required for RLS insert policy
        });

        if (error) throw error;
        alert("Course saved successfully!");
        setCourseData({ title: '', description: '', author: 'Admin', price: '5.99', content: '' });
        setThumbnailUrl(null);
    } catch (e: any) {
        alert("Error saving course: " + e.message);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Editor Column */}
      <div className="space-y-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Course Details</h3>
          <Input label="Course Title" name="title" value={courseData.title} onChange={handleInputChange} placeholder="e.g. Advanced Chemistry" />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea name="description" value={courseData.description} onChange={handleInputChange} className="w-full rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 min-h-[100px] text-sm focus:ring-2 focus:ring-primary outline-none border" placeholder="Short summary..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <Input label="Author Name" name="author" value={courseData.author} onChange={handleInputChange} />
             <Input label="Price ($)" name="price" type="number" value={courseData.price} onChange={handleInputChange} />
          </div>
          <div className="space-y-1.5">
             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Course Thumbnail</label>
             <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="Preview" className="h-32 object-cover rounded-lg shadow-sm" />
                ) : (
                  <><ImageIcon className="w-8 h-8 text-slate-400 mb-2" /><span className="text-xs text-slate-500">Click to upload image (Max 5MB)</span></>
                )}
             </div>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleThumbnailUpload} />
          </div>
        </Card>
        <Card className="p-6 space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Content Editor</h3>
              <div className="flex gap-2">
                 <button onClick={() => contentImgInputRef.current?.click()} className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 transition-colors">
                    <ImageIcon className="w-4 h-4" /> Insert Image
                 </button>
                 <input type="file" ref={contentImgInputRef} className="hidden" accept="image/*" onChange={handleContentImageSelect} />
              </div>
           </div>
           <textarea ref={contentTextareaRef} name="content" value={courseData.content} onChange={handleInputChange} className="w-full rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 min-h-[400px] font-mono text-sm focus:ring-2 focus:ring-primary outline-none border resize-y leading-relaxed" placeholder="<h1>Chapter 1...</h1>" />
        </Card>
      </div>

      {/* Preview Column */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Eye className="w-4 h-4" /> Live Preview</h3>
            <div className="flex items-center gap-3">
               <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary"/>
                  <span>Publish</span>
               </label>
               <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
                  <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Course'}
               </Button>
            </div>
         </div>
         <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 bg-slate-50 dark:bg-zinc-950/50">
            <p className="text-xs font-bold text-slate-400 uppercase mb-3">Reader Preview</p>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8 min-h-[400px] max-w-lg mx-auto shadow-sm prose dark:prose-invert prose-sm overflow-hidden">
                {courseData.content ? <div dangerouslySetInnerHTML={{ __html: courseData.content }} /> : <p className="text-slate-400 italic text-center mt-20">Content will appear here...</p>}
            </div>
         </div>
      </div>
    </div>
  );
};

type VisualType = 'fact' | 'image' | 'video';

const VisualManager = () => {
  const [type, setType] = useState<VisualType>('fact');
  const [content, setContent] = useState({
     title: '',
     description: '',
     bgGradient: 'from-blue-600 to-purple-600',
     price: ''
  });
  const [mediaFileUrl, setMediaFileUrl] = useState<string | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Explicitly choose bucket based on type
      const bucket = type === 'video' ? 'videos' : 'images';
      const url = await uploadToSupabase(file, bucket);
      if (url) setMediaFileUrl(url);
    }
  };

  const handleSave = async () => {
      try {
          const { error } = await supabase.from('visual_feed').insert({
              type: type === 'image' ? 'course-ad' : type, 
              title: content.title,
              description: content.description,
              bg_gradient: content.bgGradient,
              media_url: type === 'fact' ? null : mediaFileUrl,
              price: type === 'image' ? content.price : null,
              author_name: 'Grecko Admin',
              is_verified: true
          });
          if (error) throw error;
          alert("Visual content saved!");
          setContent({ title: '', description: '', bgGradient: 'from-blue-600 to-purple-600', price: '' });
          setMediaFileUrl(null);
      } catch (e: any) {
          alert("Error: " + e.message);
      }
  };

  const gradients = [
    { name: 'Blue/Purple', val: 'from-blue-600 to-purple-600' },
    { name: 'Amber/Orange', val: 'from-amber-600 to-orange-800' },
    { name: 'Emerald/Teal', val: 'from-emerald-600 to-teal-900' },
    { name: 'Pink/Rose', val: 'from-pink-500 to-rose-500' },
    { name: 'Violet/Fuchsia', val: 'from-violet-600 to-fuchsia-600' }
  ];

  return (
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Column */}
        <div className="space-y-6">
           <Card className="p-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Create New Post</h3>
              <div className="grid grid-cols-3 gap-3 mb-6">
                  {['fact', 'image', 'video'].map(t => (
                      <button key={t} onClick={() => { setType(t as VisualType); setMediaFileUrl(null); }} className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${type === t ? 'bg-primary/10 border-primary text-primary' : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}>
                          {t === 'fact' ? <Type className="w-6 h-6 mb-2"/> : t === 'image' ? <ImageIcon className="w-6 h-6 mb-2"/> : <Video className="w-6 h-6 mb-2"/>}
                          <span className="text-xs font-bold capitalize">{t}</span>
                      </button>
                  ))}
              </div>

              <div className="space-y-4">
                  {type === 'fact' ? (
                     <div className="space-y-4">
                        <textarea value={content.title} onChange={e => setContent({...content, title: e.target.value})} className="w-full rounded-xl border p-3 min-h-[100px] bg-transparent text-slate-900 dark:text-white border-slate-200 dark:border-zinc-800 focus:ring-primary" placeholder="Fact text..." />
                        <div className="flex flex-wrap gap-2">
                            {gradients.map(g => (
                                <button key={g.name} onClick={() => setContent({...content, bgGradient: g.val})} className={`w-8 h-8 rounded-full bg-gradient-to-br ${g.val} ring-2 ${content.bgGradient === g.val ? 'ring-primary' : 'ring-transparent'}`} title={g.name} />
                            ))}
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        <div onClick={() => mediaInputRef.current?.click()} className="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl min-h-[200px] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 relative overflow-hidden group">
                             {mediaFileUrl ? (
                                type === 'video' ? (
                                    <video src={mediaFileUrl} className="absolute inset-0 w-full h-full object-cover" muted loop autoPlay />
                                ) : (
                                    <img src={mediaFileUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                )
                             ) : (
                                <>
                                    {type === 'video' ? <Video className="w-8 h-8 text-slate-400 mb-2" /> : <Upload className="w-8 h-8 text-slate-400 mb-2" />}
                                    <span className="text-xs text-slate-500">Click to upload {type}</span>
                                </>
                             )}
                             
                             {mediaFileUrl && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-xs font-bold flex items-center gap-1"><Upload className="w-3 h-3"/> Change File</p>
                                </div>
                             )}
                        </div>
                        <input type="file" ref={mediaInputRef} className="hidden" accept={type === 'image' ? "image/*" : "video/*"} onChange={handleMediaUpload} />
                        <Input label="Caption / Title" value={content.title} onChange={e => setContent({...content, title: e.target.value})} />
                        {type === 'image' && (
                            <Input label="Price (e.g. $19.99)" value={content.price} onChange={e => setContent({...content, price: e.target.value})} />
                        )}
                     </div>
                  )}
                  <Input label="Description (Optional)" value={content.description} onChange={e => setContent({...content, description: e.target.value})} />
              </div>
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-zinc-800">
                  <Button fullWidth onClick={handleSave}>Save Visual Content</Button>
              </div>
           </Card>
        </div>

        {/* Live Preview Column */}
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Live Preview
                </h3>
            </div>
            
            <div className="flex justify-center p-8 bg-slate-100 dark:bg-zinc-950/50 rounded-2xl border border-slate-200 dark:border-zinc-800">
                {/* Mock Phone Frame */}
                <div className="relative w-[300px] max-w-full aspect-[9/16] bg-black rounded-[2rem] overflow-hidden shadow-2xl border-[6px] border-zinc-800">
                    <div className="absolute top-0 inset-x-0 h-6 bg-transparent z-30 flex justify-center pt-2">
                        <div className="w-20 h-4 bg-black rounded-full" />
                    </div>

                    <div className="relative w-full h-full">
                         {type === 'fact' ? (
                            <div className={`absolute inset-0 bg-gradient-to-br ${content.bgGradient} flex items-center justify-center p-6`}>
                                <div className="text-center">
                                    <div className="mb-3 inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/90 border border-white/10">
                                        Did You Know?
                                    </div>
                                    <h2 className="text-2xl font-bold text-white leading-tight drop-shadow-lg break-words">
                                        {content.title || "Your fact text here..."}
                                    </h2>
                                </div>
                            </div>
                         ) : (
                            <div className="absolute inset-0 bg-zinc-900">
                                {mediaFileUrl ? (
                                    type === 'video' ? (
                                        <video src={mediaFileUrl} className="w-full h-full object-cover" muted loop autoPlay />
                                    ) : (
                                        <img src={mediaFileUrl} alt="Preview" className="w-full h-full object-cover" />
                                    )
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                        {type === 'video' ? <Video className="w-12 h-12" /> : <ImageIcon className="w-12 h-12" />}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90 pointer-events-none" />
                            </div>
                         )}

                         <div className="absolute bottom-0 left-0 right-12 p-4 pb-6 z-10 pt-20">
                             <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                    <h3 className="text-white font-bold text-sm shadow-black drop-shadow-md tracking-wide">@Grecko Admin</h3>
                                    <BadgeCheck className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
                                </div>
                                
                                {type !== 'fact' && (
                                     <p className="text-white/95 text-xs font-medium leading-relaxed line-clamp-3 drop-shadow-md break-words">
                                        {content.title || "Title goes here..."}
                                        {content.price && <span className="block mt-1 font-bold text-amber-400">${content.price}</span>}
                                     </p>
                                )}
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
     </div>
  );
};

const NotificationManager = () => {
    const [data, setData] = useState({
      title: '',
      message: '',
      type: 'system' as 'system' | 'course' | 'assignment'
    });
    const [isSending, setIsSending] = useState(false);
  
    const handleSend = async () => {
      if (!data.title || !data.message) return alert("Please fill in all fields");
      
      setIsSending(true);
      try {
        const { error } = await supabase.from('notifications').insert({
          title: data.title,
          message: data.message,
          type: data.type,
          user_id: null,
          is_read: false 
        });
  
        if (error) throw error;
  
        alert('Broadcast sent to all current and future users!');
        setData({ title: '', message: '', type: 'system' });
      } catch (e: any) {
        alert("Error sending notifications: " + e.message);
      } finally {
        setIsSending(false);
      }
    };
  
    const getIcon = (type: string) => {
      switch (type) {
        case 'assignment': return <Calendar className="w-5 h-5 text-amber-500" />;
        case 'course': return <BookOpen className="w-5 h-5 text-blue-500" />;
        default: return <Info className="w-5 h-5 text-slate-500" />;
      }
    };
  
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Create Notification</h3>
                    <p className="text-xs text-slate-500">Send an alert to all registered users</p>
                </div>
            </div>
            
            <Input label="Title" value={data.title} onChange={e => setData({...data, title: e.target.value})} placeholder="e.g. System Update" />
            
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
                <textarea 
                    value={data.message} 
                    onChange={e => setData({...data, message: e.target.value})} 
                    className="w-full rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 min-h-[100px] text-sm focus:ring-2 focus:ring-primary outline-none border" 
                    placeholder="Enter notification content..." 
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                <div className="grid grid-cols-3 gap-3">
                   {['system', 'course', 'assignment'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setData({...data, type: t as any})}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all text-sm font-medium capitalize ${data.type === t ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                      >
                         {t}
                      </button>
                   ))}
                </div>
            </div>

            <div className="pt-4 mt-2">
                <Button fullWidth onClick={handleSend} disabled={isSending} className="flex items-center justify-center gap-2">
                   <Send className="w-4 h-4" /> {isSending ? 'Sending...' : 'Send to All Users'}
                </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4" /> Live Preview
              </h3>
          </div>
          
          <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 bg-slate-50 dark:bg-zinc-950/50 flex flex-col items-center justify-center min-h-[300px]">
             <div className="w-full max-w-md">
                 <p className="text-xs font-bold text-slate-400 uppercase mb-3 text-center">User Notification Card</p>
                 <Card className="p-4 flex gap-4 border-l-4 border-l-primary bg-white dark:bg-zinc-900 relative overflow-hidden">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-900/20 shadow-sm ring-1 ring-slate-200 dark:ring-zinc-700">
                      {getIcon(data.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {data.title || 'Notification Title'}
                        </h3>
                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">Just now</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5 leading-relaxed line-clamp-2 break-words">
                        {data.message || 'Notification message will appear here...'}
                      </p>
                    </div>
                 </Card>
             </div>
          </div>
        </div>
      </div>
    );
};
