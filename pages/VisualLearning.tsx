import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Share2, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Search, 
  X, 
  ArrowLeft, 
  Sparkles, 
  Bookmark, 
  Check
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

    // 1. Handle HTML5 Video (Direct Uploads)
    useEffect(() => {
        if (videoRef.current && !youtubeId) {
            const video = videoRef.current;
            if (isActive) {
                video.currentTime = 0;
                video.play().catch(e => console.log("Autoplay blocked", e));
            } else {
                video.pause();
            }
        }
    }, [isActive, youtubeId]);

    // 2. Handle YouTube API Events
    useEffect(() => {
        const handleYoutubeMessage = (event: MessageEvent) => {
            if (event.origin !== 'https://www.youtube.com') return;
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'onReady') setIsPlayerReady(true);
            } catch {}
        };
        if (youtubeId && isActive) {
            window.addEventListener('message', handleYoutubeMessage);
            return () => window.removeEventListener('message', handleYoutubeMessage);
        }
    }, [youtubeId, isActive]);

    // 3. Control YouTube Playback
    useEffect(() => {
        if (iframeRef.current && youtubeId && isPlayerReady) {
            const func = !isActive ? 'pauseVideo' : 'playVideo';
            iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
        }
    }, [isActive, youtubeId, isPlayerReady]);

    // 4. Control YouTube Audio
    useEffect(() => {
        if (iframeRef.current && youtubeId && isPlayerReady) {
            const func = isMuted ? 'mute' : 'unMute';
            iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
        }
    }, [isMuted, youtubeId, isPlayerReady]);

    if (!isActive) {
        return (
            <div className="w-full h-full relative bg-black flex items-center justify-center">
                <img 
                    src={youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : ''} 
                    className="w-full h-full object-cover opacity-40 blur-sm" 
                    alt="Loading" 
                />
            </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-black flex items-center justify-center">
            {youtubeId ? (
                <div className="w-full h-full relative overflow-hidden">
                    <iframe
                        ref={iframeRef}
                        src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&playsinline=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`}
                        className="absolute top-[-25%] left-[-25%] w-[150%] h-[150%]"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title={item.title}
                        frameBorder="0"
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
            
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/90" />
            
            <div className="absolute right-4 bottom-32 z-30 flex flex-col items-center gap-6">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }} 
                  className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full hover:bg-white/20 transition-all active:scale-90"
                >
                    {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                </button>
            </div>
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

  // --- ALGORITHM: Weighted Interleave ---
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
    return finalFeed;
  }, []);

  // --- DATA FETCHING & SEARCH ---
  const fetchFeed = useCallback(async (query = "") => {
    setLoading(true);
    try {
        let visualQuery = supabase.from('visual_feed').select('*');
        
        if (query) {
            visualQuery = visualQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
        }

        const { data: visualData } = await visualQuery;
        const { data: courseData } = await supabase.from('courses').select('*').eq('is_published', true);

        // --- FIXED TYPESCRIPT MAPPING ---
        const visuals: FeedItem[] = (visualData || []).map((v: any) => ({ 
            id: v.id.toString(), 
            type: v.type as FeedItem['type'], // Explicit cast
            title: v.title, 
            description: v.description, 
            media_url: v.media_url, 
            bg_gradient: v.bg_gradient 
        }));
        
        const ads: FeedItem[] = (courseData || []).map((c: Course) => ({ 
            id: `ad-${c.id}`, 
            type: 'course_ad' as const, // Explicit literal type
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

  // --- SNAP SCROLL OBSERVER ---
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
    }, { root: containerRef.current, threshold: 0.6 });

    const slides = containerRef.current.querySelectorAll('.snap-start');
    slides.forEach(slide => observer.current?.observe(slide));

    return () => { if (observer.current) observer.current.disconnect(); };
  }, [displayedFeed]);

  // --- HANDLERS ---
  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
          setIsSearching(true);
          fetchFeed(searchQuery);
      }
  };

  const clearSearch = () => {
      setSearchQuery("");
      setIsSearching(false);
      fetchFeed(); 
  };

  const handleShare = (item: FeedItem) => {
    navigator.clipboard.writeText(`Check out "${item.title}" on Grecko!`).then(() => {
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col">
      
      {/* --- SEARCH OVERLAY --- */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-12 flex items-center gap-3 bg-gradient-to-b from-black/80 to-transparent transition-all">
          {isSearching && (
              <button onClick={clearSearch} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
              </button>
          )}
          <form onSubmit={handleSearch} className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-focus-within:text-white transition-colors" />
              <input 
                type="text"
                placeholder="Search topics, facts, or videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-xl border border-white/10 rounded-full py-3 pl-11 pr-10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-black/50 transition-all shadow-lg"
              />
              {searchQuery && (
                  <button onClick={() => setSearchQuery("")} type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20">
                      <X className="w-4 h-4 text-white/50" />
                  </button>
              )}
          </form>
      </div>

      {/* --- FEED CONTAINER --- */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar h-full scroll-smooth bg-black"
      >
          {displayedFeed.length === 0 && !loading ? (
              <div className="h-full flex flex-col items-center justify-center text-white/50 p-10 text-center space-y-4">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                      <Search className="w-8 h-8 opacity-40" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">No results found</h2>
                    <p className="text-sm mt-1">Try searching for broad terms like "Science" or "History"</p>
                  </div>
                  <button onClick={clearSearch} className="text-blue-400 font-bold text-sm hover:underline">Back to Feed</button>
              </div>
          ) : (
            displayedFeed.map((item) => (
                <div 
                  key={item.id} 
                  data-id={item.id} 
                  className="relative w-full full-vh snap-start snap-always flex-none overflow-hidden bg-black"
                >
                    {/* --- CONTENT --- */}
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
                                    className="absolute inset-0 flex flex-col items-center justify-center p-10 bg-slate-900"
                                    style={{ background: item.bg_gradient || 'linear-gradient(to bottom right, #0f172a, #1e293b)' }}
                                >
                                    <div className="absolute inset-0 grain-overlay opacity-30 pointer-events-none mix-blend-overlay" />
                                    <div className="relative z-10 text-center space-y-8 animate-in zoom-in-95 duration-700">
                                        <Sparkles className="w-12 h-12 text-white/40 mx-auto" />
                                        <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-xl italic">
                                            "{item.title}"
                                        </h1>
                                        {item.description && <p className="text-lg text-white/70 font-medium max-w-lg mx-auto">{item.description}</p>}
                                    </div>
                                </div>
                            ) : (
                                <img 
                                    src={item.media_url} 
                                    className="w-full h-full object-cover animate-slow-zoom" 
                                    alt={item.title} 
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90 pointer-events-none" />
                        </div>
                    )}

                    {/* --- RIGHT ACTIONS --- */}
                    <div className="absolute right-4 bottom-48 flex flex-col gap-6 items-center z-30">
                        <div className="flex flex-col items-center gap-1">
                            <button 
                                onClick={() => handleShare(item)}
                                className="p-3.5 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white/20 transition-all text-white active:scale-95"
                            >
                                <Share2 className="w-6 h-6" />
                            </button>
                            <span className="text-[10px] font-bold text-white/50 uppercase shadow-black drop-shadow-md">Share</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <button className="p-3.5 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white/20 transition-all text-white active:scale-95">
                                <Bookmark className="w-6 h-6" />
                            </button>
                            <span className="text-[10px] font-bold text-white/50 uppercase shadow-black drop-shadow-md">Save</span>
                        </div>
                    </div>

                    {/* --- BOTTOM INFO --- */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 pb-28 md:pb-10 z-20 pointer-events-none">
                        <div className="max-w-[85%] pointer-events-auto">
                            {item.type === 'course_ad' ? (
                                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-5 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-6 duration-500">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 rounded-full mb-2 shadow-lg shadow-amber-500/20">
                                                <Sparkles className="w-3 h-3 text-white fill-current" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-tighter">Recommended</span>
                                            </div>
                                            <h3 className="text-white font-bold text-xl leading-tight">{item.title}</h3>
                                        </div>
                                        <div className="bg-white text-black px-3 py-1.5 rounded-2xl font-black text-sm shadow-lg">
                                            ${item.price}
                                        </div>
                                    </div>
                                    <p className="text-white/70 text-sm mb-4 line-clamp-2 leading-snug">{item.description}</p>
                                    <button 
                                        onClick={onNavigateToCourse}
                                        className="w-full bg-white hover:bg-slate-100 text-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] font-bold shadow-xl"
                                    >
                                        Enroll Now <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg">
                                            <ShieldCheck className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-sm flex items-center gap-1">
                                                Grecko Learning
                                                <div className="bg-blue-500 rounded-full p-0.5">
                                                    <Check className="w-2 h-2 text-white stroke-[4]" />
                                                </div>
                                            </h4>
                                            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Verified Content</p>
                                        </div>
                                    </div>
                                    <h2 className="text-white font-bold text-lg leading-snug drop-shadow-md">
                                        {item.title}
                                    </h2>
                                    {item.type !== 'fact' && item.description && (
                                        <p className="text-white/80 text-sm line-clamp-2 drop-shadow-sm font-medium">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- TOAST --- */}
                    {copiedId === item.id && (
                        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur text-black px-6 py-2.5 rounded-full font-bold text-sm shadow-2xl animate-in fade-in zoom-in slide-in-from-top-4">
                            Link Copied!
                        </div>
                    )}
                </div>
            ))
          )}
      </div>

      {/* --- LOADING --- */}
      {loading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[60] flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest animate-pulse">Curating Feed...</p>
          </div>
      )}
    </div>
  );
};
