import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Share2, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Search, 
  ArrowLeft, 
  Sparkles, 
  Check,
  Play
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Course } from '../types';

// --- HELPER FUNCTIONS ---

const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// --- TYPES ---

interface FeedItem {
  id: string;
  type: 'fact' | 'video' | 'image' | 'course_ad';
  title: string;
  media_url?: string;
  price?: number;
  description?: string;
  bg_gradient?: string;
  courseId?: string;
  author?: string;
}

// --- SUB-COMPONENT: SMART VIDEO PLAYER ---

const FeedVideoItem = ({ item, isActive, isMuted, toggleMute }: { item: FeedItem, isActive: boolean, isMuted: boolean, toggleMute: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const youtubeId = getYoutubeId(item.media_url || '');
    
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);

    // 1. Handle HTML5 Video Progress & Playback
    useEffect(() => {
        if (videoRef.current && !youtubeId) {
            const video = videoRef.current;
            if (isActive) {
                video.currentTime = 0;
                video.play().catch(() => setIsPlaying(false));
                setIsPlaying(true);
            } else {
                video.pause();
            }

            const updateProgress = () => {
                const p = (video.currentTime / video.duration) * 100;
                setProgress(p);
            };
            video.addEventListener('timeupdate', updateProgress);
            return () => video.removeEventListener('timeupdate', updateProgress);
        }
    }, [isActive, youtubeId]);

    // 2. Control YouTube Playback
    useEffect(() => {
        if (iframeRef.current && youtubeId && isPlayerReady) {
            const func = (!isActive || !isPlaying) ? 'pauseVideo' : 'playVideo';
            iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
        }
    }, [isActive, youtubeId, isPlayerReady, isPlaying]);

    // 3. Control Mute
    useEffect(() => {
        if (iframeRef.current && youtubeId && isPlayerReady) {
            const func = isMuted ? 'mute' : 'unMute';
            iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
        }
    }, [isMuted, youtubeId, isPlayerReady]);

    const togglePlayback = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsPlaying(!isPlaying);
        if (videoRef.current && !youtubeId) {
            isPlaying ? videoRef.current.pause() : videoRef.current.play();
        }
    };

    return (
        <div 
            className="w-full h-full relative bg-black flex items-center justify-center cursor-pointer"
            onClick={togglePlayback}
        >
            {youtubeId ? (
                <div className="w-full h-full relative overflow-hidden pointer-events-none">
                    <iframe
                        ref={iframeRef}
                        src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&playsinline=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&autoplay=1&mute=${isMuted ? 1 : 0}`}
                        className="absolute top-[-25%] left-[-25%] w-[150%] h-[150%]"
                        onLoad={() => setIsPlayerReady(true)}
                        allow="autoplay"
                    />
                </div>
            ) : (
                <video
                    ref={videoRef}
                    src={item.media_url}
                    className="w-full h-full object-cover"
                    muted={isMuted}
                    loop
                    playsInline
                />
            )}
            
            {/* Visual Feedback for Pause */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/20">
                    <div className="p-6 rounded-full bg-white/20 backdrop-blur-md animate-in zoom-in-50 duration-200">
                        <Play className="w-12 h-12 text-white fill-current" />
                    </div>
                </div>
            )}

            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/90" />
            
            {/* Mute Button Overlay */}
            <div className="absolute right-4 bottom-32 z-30 flex flex-col items-center gap-6">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }} 
                  className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full hover:bg-white/20 transition-all active:scale-90"
                >
                    {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                </button>
            </div>

            {/* Video Progress Bar */}
            {!youtubeId && (
                <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full z-40">
                    <div 
                        className="h-full bg-indigo-500 transition-all duration-100 ease-linear" 
                        style={{ width: `${progress}%` }} 
                    />
                </div>
            )}
        </div>
    );
};

// --- MAIN VISUAL LEARNING FEED ---

export const VisualLearning: React.FC<{ onNavigateToCourse: () => void }> = ({ onNavigateToCourse }) => {
  const [displayedFeed, setDisplayedFeed] = useState<FeedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  // Keyboard Navigation Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!containerRef.current) return;
        if (e.key === 'ArrowDown') {
            containerRef.current.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        } else if (e.key === 'ArrowUp') {
            containerRef.current.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        @keyframes slowZoom { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
        .animate-slow-zoom { animation: slowZoom 30s infinite alternate ease-in-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .grain-overlay { background-image: url("https://grainy-gradients.vercel.app/noise.svg"); filter: contrast(150%) brightness(100%); }
        .full-vh { height: 100vh; height: 100dvh; }
    `;
    document.head.appendChild(styleSheet);
    return () => { document.head.removeChild(styleSheet); };
  }, []);

  const constructFeed = useCallback((visuals: FeedItem[], ads: FeedItem[]) => {
    const videos = visuals.filter(v => v.type === 'video').sort(() => Math.random() - 0.5);
    const nonVideos = visuals.filter(v => v.type !== 'video').sort(() => Math.random() - 0.5);
    const shuffledAds = [...ads].sort(() => Math.random() - 0.5);
    
    const finalFeed: FeedItem[] = [];
    let nvPointer = 0;
    let adPointer = 0;

    for (let i = 0; i < videos.length; i += 3) {
        finalFeed.push(...videos.slice(i, i + 3));
        if (nonVideos[nvPointer]) {
            finalFeed.push(nonVideos[nvPointer]);
            nvPointer++;
        }
        if (shuffledAds.length > 0) {
            finalFeed.push(shuffledAds[adPointer]);
            adPointer = (adPointer + 1) % shuffledAds.length;
        }
    }
    return finalFeed.length > 0 ? finalFeed : [...visuals, ...ads];
  }, []);

  const fetchFeed = useCallback(async (query = "") => {
    setLoading(true);
    try {
        let visualQuery = supabase.from('visual_feed').select('*');
        if (query) visualQuery = visualQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);

        const { data: visualData } = await visualQuery;
        const { data: courseData } = await supabase.from('courses').select('*').eq('is_published', true);

        const visuals: FeedItem[] = (visualData || []).map((v: any) => ({ 
            id: v.id.toString(), 
            type: v.type as FeedItem['type'], 
            title: v.title, 
            description: v.description, 
            media_url: v.media_url, 
            bg_gradient: v.bg_gradient 
        }));
        
        const ads: FeedItem[] = (courseData || []).map((c: Course) => ({ 
            id: `ad-${c.id}`, 
            type: 'course_ad' as const, 
            title: c.title, 
            media_url: c.image, 
            price: c.price, 
            description: c.description, 
            courseId: c.id 
        }));

        const mix = query ? [...visuals, ...ads] : constructFeed(visuals, ads);
        setDisplayedFeed(mix);
        if (mix.length > 0) setActiveId(mix[0].id);
    } catch (e) {
        console.error("Feed error:", e);
    } finally {
        setLoading(false);
    }
  }, [constructFeed]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('data-id');
                if (id) setActiveId(id);
            }
        });
    }, { root: containerRef.current, threshold: 0.5 });

    const slides = containerRef.current.querySelectorAll('.snap-start');
    slides.forEach(slide => observer.current?.observe(slide));

    return () => { if (observer.current) observer.current.disconnect(); };
  }, [displayedFeed]);

  const handleShare = (item: FeedItem) => {
    navigator.clipboard.writeText(`Check out "${item.title}" on Grecko!`).then(() => {
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col">
      
      {/* Search Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-12 flex items-center gap-3 bg-gradient-to-b from-black/90 to-transparent">
          {isSearching && (
              <button onClick={() => { setIsSearching(false); fetchFeed(); }} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
              </button>
          )}
          <form 
            onSubmit={(e) => { e.preventDefault(); if(searchQuery) { setIsSearching(true); fetchFeed(searchQuery); } }} 
            className="flex-1 relative group"
          >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
              <input 
                type="text"
                placeholder="Search topics, facts, or videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-xl border border-white/10 rounded-full py-3 pl-11 pr-10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
          </form>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar h-full scroll-smooth"
      >
          {displayedFeed.map((item) => (
                <div 
                  key={item.id} 
                  data-id={item.id} 
                  className="relative w-full full-vh snap-start snap-always flex-none overflow-hidden bg-black"
                >
                    {item.type === 'video' ? (
                        <FeedVideoItem 
                            item={item} 
                            isActive={activeId === item.id} 
                            isMuted={isMuted} 
                            toggleMute={() => setIsMuted(!isMuted)} 
                        />
                    ) : (
                        <div className="w-full h-full relative">
                            {item.type === 'fact' ? (
                                <div 
                                    className="absolute inset-0 flex flex-col items-center justify-center p-10"
                                    style={{ background: item.bg_gradient || 'linear-gradient(to bottom right, #1e1b4b, #312e81)' }}
                                >
                                    <div className="absolute inset-0 grain-overlay opacity-30 pointer-events-none mix-blend-overlay" />
                                    <div className="relative z-10 text-center space-y-8 animate-in zoom-in-95 duration-700 px-4">
                                        <Sparkles className="w-12 h-12 text-indigo-300 mx-auto animate-pulse" />
                                        <h1 className="text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-2xl">
                                            {item.title}
                                        </h1>
                                        {item.description && <p className="text-lg text-white/80 font-medium max-w-lg mx-auto">{item.description}</p>}
                                    </div>
                                </div>
                            ) : (
                                <img src={item.media_url} className="w-full h-full object-cover animate-slow-zoom" alt={item.title} />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />
                        </div>
                    )}

                    {/* Interaction Sidebar (SAVE REMOVED) */}
                    <div className="absolute right-4 bottom-48 flex flex-col gap-6 items-center z-30">
                        <div className="flex flex-col items-center gap-1 group">
                            <button 
                                onClick={() => handleShare(item)}
                                className="p-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full hover:bg-indigo-500 transition-all text-white active:scale-90"
                            >
                                <Share2 className="w-6 h-6" />
                            </button>
                            <span className="text-[10px] font-bold text-white/70 uppercase">Share</span>
                        </div>
                    </div>

                    {/* Bottom Content Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 pb-32 md:pb-12 z-20 pointer-events-none">
                        <div className="max-w-[85%] pointer-events-auto">
                            {item.type === 'course_ad' ? (
                                <div className="bg-white/10 backdrop-blur-3xl border border-white/20 p-5 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mb-3 shadow-lg">
                                                <Sparkles className="w-3 h-3 text-white fill-current" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-wider">Premium Course</span>
                                            </div>
                                            <h3 className="text-white font-bold text-xl leading-tight">{item.title}</h3>
                                        </div>
                                        <div className="bg-white text-indigo-900 px-4 py-2 rounded-2xl font-black text-base shadow-xl">
                                            ${item.price}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={onNavigateToCourse}
                                        className="w-full bg-white hover:bg-indigo-50 text-indigo-900 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] font-black shadow-xl"
                                    >
                                        Enroll Now <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white/30 shadow-indigo-500/40 shadow-lg">
                                            <ShieldCheck className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="text-white font-bold text-sm">Grecko Learning</h4>
                                                <div className="bg-blue-400 rounded-full p-0.5">
                                                    <Check className="w-2 h-2 text-white stroke-[4]" />
                                                </div>
                                            </div>
                                            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Global Campus</p>
                                        </div>
                                    </div>
                                    <h2 className="text-white font-bold text-xl leading-snug">{item.title}</h2>
                                    {item.description && (
                                        <p className="text-white/70 text-sm line-clamp-2 font-medium bg-black/20 backdrop-blur-sm p-2 rounded-lg inline-block">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Success Toast */}
                    {copiedId === item.id && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-2xl animate-in zoom-in-75">
                            LINK COPIED
                        </div>
                    )}
                </div>
            ))}
      </div>

      {loading && (
          <div className="absolute inset-0 bg-black z-[60] flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <Sparkles className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="text-white font-bold tracking-[0.2em] animate-pulse">GENERATING FEED</p>
          </div>
      )}
    </div>
  );
};
