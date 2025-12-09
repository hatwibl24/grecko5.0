import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share2, ChevronRight, Volume2, VolumeX, ShieldCheck, Play, Pause } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Course } from '../types';
const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
interface FeedItem {
  id: string;
  type: 'fact' | 'video' | 'image' | 'course_ad';
  title: string;
  media_url?: string;
  price?: number;
  description?: string;
  courseId?: string;
  author?: string;
  date?: string;
}
const FeedVideoItem = ({ item, isActive, isMuted, toggleMute }: { item: FeedItem, isActive: boolean, isMuted: boolean, toggleMute: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const youtubeId = getYoutubeId(item.media_url || '');
    const [hasUserInteraction, setHasUserInteraction] = useState(false);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const isIOS = typeof window !== 'undefined' ? /iPad|iPhone|iPod/.test(navigator.userAgent) : false;
    useEffect(() => {
        const handleInteraction = () => { setHasUserInteraction(true); };
        window.addEventListener('touchstart', handleInteraction);
        window.addEventListener('click', handleInteraction);
        return () => {
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('click', handleInteraction);
        };
    }, []);
    useEffect(() => {
        if (videoRef.current && !youtubeId) {
            const video = videoRef.current;
            if (isActive) {
                video.currentTime = 0;
                const playVideo = () => {
                    video.play().catch(e => console.log("Autoplay blocked", e));
                };
                if (video.readyState >= 2) {
                    playVideo();
                } else {
                    video.addEventListener('canplay', playVideo, { once: true });
                    return () => {
                        video.removeEventListener('canplay', playVideo);
                    };
                }
            } else {
                video.pause();
            }
        }
    }, [isActive, youtubeId]);
    useEffect(() => {
        const handleYoutubeMessage = (event: MessageEvent) => {
            if (event.origin !== 'https://www.youtube.com') return;
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'onReady') {
                    setIsPlayerReady(true);
                }
            } catch {}
        };
        if (youtubeId && isActive) {
            window.addEventListener('message', handleYoutubeMessage);
            return () => window.removeEventListener('message', handleYoutubeMessage);
        }
    }, [youtubeId, isActive]);
    useEffect(() => {
        if (iframeRef.current && youtubeId && isPlayerReady) {
            let func;
            if (!isActive) {
                func = 'pauseVideo';
            } else if (!(isIOS && !hasUserInteraction)) {
                func = 'playVideo';
            } else {
                return;
            }
            iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
        }
    }, [isActive, youtubeId, isPlayerReady, hasUserInteraction, isIOS, iframeRef]);
    useEffect(() => {
        if (iframeRef.current && youtubeId && isPlayerReady) {
            const func = isMuted ? 'mute' : 'unMute';
            iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
        }
    }, [isMuted, youtubeId, isPlayerReady, iframeRef]);
    // --- CRASH FIX: Unmount heavy video players when not active ---
    if (!isActive) {
        return (
            <div className="w-full h-full relative bg-black flex items-center justify-center">
                {/* Lightweight placeholder */}
                <img
                    src={youtubeId
                        ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
                        : 'https://via.placeholder.com/800x1600/000000/FFFFFF?text=Loading'
                    }
                    className="w-full h-full object-cover opacity-50"
                    alt="Loading"
                />
            </div>
        );
    }
    return (
        <div className="w-full h-full relative bg-black flex items-center justify-center">
            {youtubeId ? (
                <div className="w-full h-full relative">
                    <div className="relative w-full h-full">
                        {isIOS && !hasUserInteraction ? (
                            <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={() => setHasUserInteraction(true)}>
                                <img src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`} className="w-full h-full object-cover" alt="YouTube video" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                                        <div className="w-0 h-0 border-y-8 border-l-12 border-y-transparent border-l-white ml-2" />
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        <iframe
                            ref={iframeRef}
                            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&playsinline=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&rel=0${isIOS ? '&playsinline=1' : ''}`}
                            className={`absolute top-0 left-0 w-full h-full ${isIOS && !hasUserInteraction ? 'opacity-0' : 'opacity-100'}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            title={item.title}
                            frameBorder="0"
                        />
                    </div>
                </div>
            ) : (
                <video
                    ref={videoRef}
                    src={item.media_url}
                    className="w-full h-full object-cover"
                    muted={isMuted}
                    loop
                    playsInline
                    preload="auto"
                />
            )}
            <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/80" />
            <div className="absolute right-4 bottom-32 md:bottom-24 z-30 flex flex-col items-center gap-6">
                <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all active:scale-95">
                    {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                </button>
            </div>
        </div>
    );
};
export const VisualLearning: React.FC<{ onNavigateToCourse: () => void }> = ({ onNavigateToCourse }) => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [displayedFeed, setDisplayedFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null); // Added missing state
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        @keyframes slowZoom { 0% { transform: scale(1); } 100% { transform: scale(1.05); } }
        .animate-slow-zoom { animation: slowZoom 20s infinite alternate ease-in-out; }
        @supports (-webkit-touch-callout: none) { .ios-full-height { height: -webkit-fill-available !important; min-height: -webkit-fill-available !important; } img { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; } .ios-image-render { image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; } }
        .hardware-accelerate { transform: translateZ(0); backface-visibility: hidden; perspective: 1000px; }
        .full-vh { height: 100vh; min-height: 100vh; }
        @supports (height: 100dvh) { .full-vh { height: 100dvh; min-height: 100dvh; } }
        .mobile-scroll-container { -webkit-overflow-scrolling: touch; }
    `;
    document.head.appendChild(styleSheet);
    return () => { document.head.removeChild(styleSheet); };
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      const { data: visualData } = await supabase.from('visual_feed').select('*').order('created_at', { ascending: false });
      const { data: courseData } = await supabase.from('courses').select('*').eq('is_published', true);
     
      const rawVisuals = (visualData || []).map((v: any) => ({ id: `vis-${v.id}`, type: v.type, title: v.title, media_url: v.media_url, date: new Date(v.created_at).toLocaleDateString() }));
      const courseAds = (courseData || []).map((c: Course) => ({ id: `ad-${c.id}`, type: 'course_ad', title: c.title, media_url: c.image, price: c.price, description: c.description, courseId: c.id }));
     
      // Split into Pools
      let videos = rawVisuals.filter((v: any) => v.type === 'video');
      let facts = rawVisuals.filter((v: any) => v.type !== 'video');
      let ads = [...courseAds];
      // Shuffle pools initially
      videos = shuffleArray(videos);
      facts = shuffleArray(facts);
      ads = shuffleArray(ads);
      const mixedFeed: FeedItem[] = [];
     
      // --- ALGORITHM: 3-5 Videos | 2 Facts | 2 Ads ---
      while (videos.length > 0) {
          // 1. Add 3-5 Videos
          const vCount = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
          mixedFeed.push(...videos.splice(0, vCount));
          // 2. Add 2 Facts (Non-consecutive check happens during shuffle or simple interleave here)
          // We will pull 2 facts, if available. Recycling if needed.
          const batchFacts: FeedItem[] = [];
          for(let k=0; k<2; k++) {
              if (facts.length === 0) facts = shuffleArray(rawVisuals.filter((v: any) => v.type !== 'video')); // Reload pool
              batchFacts.push({ ...facts.pop(), id: `fact-${Date.now()}-${k}` } as FeedItem);
          }
          // 3. Add 2 Ads (Recycle if needed)
          const batchAds: FeedItem[] = [];
          for(let k=0; k<2; k++) {
              if (ads.length === 0) ads = shuffleArray([...courseAds]); // Reload pool
              batchAds.push({ ...ads.pop(), id: `ad-${Date.now()}-${k}` } as FeedItem);
          }
          // 4. Mix the Facts and Ads into the Video stream or append?
          // User said: "3-5 videos then 2 facts then 2 ads" but "unpredictable".
          // Let's shuffle the [2 Facts + 2 Ads] and append them AFTER the videos to maintain the "Group" feel.
          // Constraint: Facts not consecutive.
         
          const nonVideoBatch = [...batchFacts, ...batchAds];
          let shuffledNonVideos = shuffleArray(nonVideoBatch);
          // Simple check to prevent consecutive facts in the small batch of 4
          // If index 0 is fact and index 1 is fact, swap 1 with 2 (which must be an ad or end)
          for(let i=0; i<shuffledNonVideos.length-1; i++) {
              if (shuffledNonVideos[i].type !== 'course_ad' && shuffledNonVideos[i+1].type !== 'course_ad') {
                  // Found two facts. Swap i+1 with an ad.
                  const adIndex = shuffledNonVideos.findIndex(x => x.type === 'course_ad');
                  if (adIndex !== -1 && adIndex !== i && adIndex !== i+1) {
                      [shuffledNonVideos[i+1], shuffledNonVideos[adIndex]] = [shuffledNonVideos[adIndex], shuffledNonVideos[i+1]];
                  }
              }
          }
         
          mixedFeed.push(...shuffledNonVideos);
      }
      setFeed(mixedFeed);
      setDisplayedFeed([...mixedFeed]);
      if (mixedFeed.length > 0) setActiveId(mixedFeed[0].id);
      setLoading(false);
    };
    fetchData();
  }, []);
  const handleScroll = useCallback(() => {
    if (!containerRef.current || feed.length === 0) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - clientHeight * 2) {
      setDisplayedFeed(prev => {
        const repeatCount = Math.floor(prev.length / feed.length) + 1;
        const newItems = shuffleArray(feed.map(item => ({ ...item, id: `${item.id}-repeat-${repeatCount}` })));
        return [...prev, ...newItems];
      });
    }
  }, [feed]);
  useEffect(() => {
    const ref = containerRef.current;
    if (ref) ref.addEventListener('scroll', handleScroll);
    return () => { if (ref) ref.removeEventListener('scroll', handleScroll); };
  }, [handleScroll]);
  useEffect(() => {
    if (loading || !containerRef.current) return;
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
  }, [loading, displayedFeed]);
  // Added missing handleShare function to prevent error
  const handleShare = (item: FeedItem) => {
    navigator.clipboard.writeText(window.location.href).then(() => {
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
    });
  };
  if (loading) return <div className="h-full flex items-center justify-center text-slate-500 bg-black">Loading feed...</div>;
  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full overflow-y-scroll snap-y snap-mandatory bg-black no-scrollbar scroll-smooth ios-full-height mobile-scroll-container"
    >
      {displayedFeed.map((item) => (
        <div
          key={item.id}
          data-id={item.id}
          className="flex-none relative w-full full-vh snap-start snap-always flex items-center justify-center bg-black overflow-hidden group hardware-accelerate"
        >
            {item.type === 'video' && item.media_url ? (
                <FeedVideoItem
                  item={item}
                  isActive={activeId === item.id}
                  isMuted={isMuted}
                  toggleMute={() => setIsMuted(!isMuted)}
                />
            ) : (
                <>
                  {(item.type === 'image' || item.type === 'course_ad') && (
                      <img
                        src={item.media_url || 'https://via.placeholder.com/800'}
                        className="w-full h-full object-cover animate-slow-zoom ios-image-render"
                        style={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }}
                        alt="Content"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800';
                        }}
                      />
                  )}
                  {item.type === 'fact' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-900 to-black text-center">
                        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight px-4">"{item.title}"</h1>
                      </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none" />
                </>
            )}
           
            {/* SIDEBAR ACTIONS (Empty per instruction) */}
            <div className="absolute right-4 bottom-32 md:bottom-24 flex flex-col gap-6 items-center z-30">
               {/* Share button logic kept for function but UI removed as requested previously */}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-24 md:pb-8 z-20 flex flex-col pointer-events-none">
                <div className="pointer-events-auto">
                    {item.type === 'course_ad' ? (
                        <div className="mb-2">
                            <button onClick={onNavigateToCourse} className="w-fit bg-[#8B6C58]/95 backdrop-blur-md hover:bg-[#8B6C58] text-white py-2 px-5 rounded-full flex items-center gap-3 transition-all active:scale-95 mb-3 shadow-lg">
                              <span className="font-bold text-sm">Get Course • ${item.price}</span>
                              <ChevronRight className="w-4 h-4 opacity-80" />
                            </button>
                            <div className="pr-16">
                              <h3 className="text-white font-bold text-lg mb-1 drop-shadow-md">{item.title}</h3>
                              <p className="text-white/90 text-sm leading-relaxed line-clamp-2 drop-shadow-md">{item.description}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="pr-16 mb-2">
                          <div className="flex items-center gap-2 mb-2 opacity-90">
                              <div className="p-1 bg-white/20 rounded-full backdrop-blur-sm">
                                  <ShieldCheck className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-white font-bold text-sm tracking-wide drop-shadow-md">Grecko Admin</span>
                          </div>
                          <p className="text-white font-medium text-lg leading-snug drop-shadow-md">{item.title}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      ))}
    </div>
  );
};
