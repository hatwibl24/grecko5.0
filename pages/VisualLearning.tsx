import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, Volume2, VolumeX, ShieldCheck, Play, Pause } from 'lucide-react';
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

/**
 * FeedVideoItem
 * - Supports YouTube embed URLs and direct video (mp4)
 * - Lazy-loads YouTube iframe only when item isActive (speeds up scrolling)
 * - Uses postMessage to play/pause/mute/seek for YouTube
 * - Adds a seek bar that works for mp4 and YouTube
 * - Keeps your existing props and toggleMute behavior
 */
const FeedVideoItem = ({ item, isActive, isMuted, toggleMute }: { item: FeedItem, isActive: boolean, isMuted: boolean, toggleMute: () => void }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const youtubeId = getYoutubeId(item.media_url || '');

    // Seek state
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const pollingRef = useRef<number | null>(null);

    // MP4 logic: play / pause based on isActive
    useEffect(() => {
        if (videoRef.current && !youtubeId) {
            if (isActive) {
                // start from 0 when active (your original logic)
                try { videoRef.current.currentTime = 0; } catch {}
                videoRef.current.play().catch(e => console.log("Autoplay blocked (mp4):", e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [isActive, youtubeId]);

    // YouTube play / pause via postMessage
    useEffect(() => {
        if (iframeRef.current && youtubeId) {
            const cmd = isActive ? 'playVideo' : 'pauseVideo';
            iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: cmd, args: [] }), '*');
        }
    }, [isActive, youtubeId]);

    // YouTube mute/unmute via postMessage
    useEffect(() => {
        if (iframeRef.current && youtubeId) {
            const cmd = isMuted ? 'mute' : 'unMute';
            iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: cmd, args: [] }), '*');
        }
    }, [isMuted, youtubeId]);

    // MP4 timeupdate tracking
    useEffect(() => {
        if (youtubeId) return;
        const vid = videoRef.current;
        if (!vid) return;

        const onTime = () => {
            setCurrentTime(vid.currentTime || 0);
        };
        const onMeta = () => {
            setDuration(vid.duration || 0);
            setCurrentTime(vid.currentTime || 0);
        };

        vid.addEventListener('timeupdate', onTime);
        vid.addEventListener('loadedmetadata', onMeta);

        return () => {
            vid.removeEventListener('timeupdate', onTime);
            vid.removeEventListener('loadedmetadata', onMeta);
        };
    }, [youtubeId]);

    // YouTube time polling + message listener
    useEffect(() => {
        if (!youtubeId || !iframeRef.current) return;

        // Request initial mute state and play state (safe)
        try {
          iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: isMuted ? 'mute' : 'unMute', args: [] }), '*');
        } catch {}

        // Poll YouTube for currentTime & duration while active
        const startPolling = () => {
            if (pollingRef.current) return;
            // poll every 600ms
            const id = window.setInterval(() => {
                try {
                    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'getCurrentTime' }), '*');
                    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'getDuration' }), '*');
                } catch {}
            }, 600);
            pollingRef.current = id;
        };

        const stopPolling = () => {
            if (pollingRef.current) {
                window.clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };

        // message listener: YouTube posts messages back — parse safely
        const onMessage = (e: MessageEvent) => {
            // The YouTube iframe API sometimes sends objects, sometimes strings. Try to parse safely.
            let data: any = e.data;
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch { /* not JSON — ignore */ return; }
            }
            // The shape varies, but handle common patterns:
            // - { event: 'infoDelivery', info: { currentTime: ... } } OR
            // - { func: 'getCurrentTime', info: 10.234 }
            if (!data) return;
            // direct style
            if (typeof data.func === 'string' && typeof data.info === 'number') {
                if (data.func.includes('getCurrentTime')) setCurrentTime(data.info);
                if (data.func.includes('getDuration')) setDuration(data.info);
                return;
            }
            // nested info
            if (data.event === 'infoDelivery' && data.info) {
                if (typeof data.info.currentTime === 'number') setCurrentTime(data.info.currentTime);
                if (typeof data.info.duration === 'number') setDuration(data.info.duration);
                return;
            }
            // fallback: some players send { event: 'onStateChange', info: ... } — ignore
        };

        window.addEventListener('message', onMessage);

        // Only poll when component is mounted; polling doesn't hurt but we can be conservative:
        startPolling();

        return () => {
            stopPolling();
            window.removeEventListener('message', onMessage);
        };
    }, [youtubeId]);

    // Seek handler (mp4 or youtube)
    const handleSeek = (value: number) => {
        setCurrentTime(value);
        if (youtubeId && iframeRef.current) {
            try {
                iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [value, true] }), '*');
            } catch {}
        } else if (videoRef.current) {
            try { videoRef.current.currentTime = value; } catch {}
        }
    };

    // Format time helper
    const fmt = (t: number) => {
        if (!t || isNaN(t) || !isFinite(t)) return '0:00';
        const s = Math.floor(t % 60).toString().padStart(2, '0');
        const m = Math.floor(t / 60);
        return `${m}:${s}`;
    };

    // Thumbnail for YouTube (used when not active to speed scrolling)
    const ytThumbnail = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : undefined;

    return (
        <div className="w-full h-full relative bg-black flex items-center justify-center">
            {/* If youtube and not active -> show lightweight thumbnail to avoid loading many iframes */}
            {youtubeId ? (
                isActive ? (
                    // ACTIVE: render iframe with autoplay & playsinline; note: we still send mute/unmute via postMessage
                    <div className="w-full h-full relative">
                        <iframe
                            ref={iframeRef}
                            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&mute=${isMuted ? 1 : 0}&playsinline=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&rel=0`}
                            className="w-full h-full object-contain"
                            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                            title={item.title}
                        />
                    </div>
                ) : (
                    // NOT ACTIVE: show thumbnail only (very cheap)
                    <div className="w-full h-full flex items-center justify-center bg-black">
                        <img src={ytThumbnail} alt={item.title} className="max-w-full max-h-full object-contain" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800'} />
                        {/* optional small play icon overlay but pointer-events-none to avoid interfering */}
                        <div className="absolute z-10 pointer-events-none">
                            <Play className="w-12 h-12 text-white/80" />
                        </div>
                    </div>
                )
            ) : (
                // Direct MP4 video (always render; native <video> is cheaper than iframe)
                <video
                    ref={videoRef}
                    src={item.media_url}
                    className="w-full h-full object-contain"
                    muted={isMuted}
                    loop
                    playsInline
                    // autoplay handled in useEffect when isActive changes
                />
            )}

            {/* Gradient Overlay for Text Visibility */}
            <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/80" />

            {/* Controls (mute + seek + play/pause indicator) */}
            <div className="absolute right-4 bottom-32 md:bottom-24 z-30 flex flex-col items-center gap-6 pointer-events-auto">
                <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all active:scale-95">
                    {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                </button>
            </div>

            {/* Seek bar + time (only for visible controls region) */}
            <div className="absolute left-4 right-4 bottom-6 z-30 pointer-events-auto px-4">
                <div className="flex items-center gap-3">
                    {/* Play/Pause state indicator (visual only) */}
                    <div className="flex items-center gap-2">
                        {isActive ? <Pause className="w-5 h-5 text-white/90" /> : <Play className="w-5 h-5 text-white/80" />}
                    </div>
                    {/* Seek input */}
                    <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        value={Math.min(currentTime, duration || 0)}
                        onChange={(e) => handleSeek(Number(e.target.value))}
                        className="flex-1 h-2 accent-white cursor-pointer"
                    />
                    {/* Time display */}
                    <div className="whitespace-nowrap text-sm text-white/90 ml-2">
                        {fmt(currentTime)} / {fmt(duration)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const VisualLearning: React.FC<{ onNavigateToCourse: () => void }> = ({ onNavigateToCourse }) => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [displayedFeed, setDisplayedFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // Default MUST be true for mobile autoplay
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `@keyframes slowZoom { 0% { transform: scale(1); } 100% { transform: scale(1.05); } } .animate-slow-zoom { animation: slowZoom 20s infinite alternate ease-in-out; }`;
    document.head.appendChild(styleSheet);
    return () => { document.head.removeChild(styleSheet); };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: visualData } = await supabase.from('visual_feed').select('*').order('created_at', { ascending: false });
      const { data: courseData } = await supabase.from('courses').select('*').eq('is_published', true);
      const visualItems: FeedItem[] = (visualData || []).map((v: any) => ({ id: `vis-${v.id}`, type: v.type, title: v.title, media_url: v.media_url, date: new Date(v.created_at).toLocaleDateString() }));
      const courseAds: FeedItem[] = (courseData || []).map((c: Course) => ({ id: `ad-${c.id}`, type: 'course_ad', title: c.title, media_url: c.image, price: c.price, description: c.description, courseId: c.id }));
      const mixedFeed: FeedItem[] = [];
      const shuffledVisuals = shuffleArray([...visualItems]);
      const shuffledAds = shuffleArray([...courseAds]);
      const maxLength = Math.max(shuffledVisuals.length, shuffledAds.length);
      for (let i = 0; i < maxLength; i++) { if (shuffledVisuals[i]) mixedFeed.push(shuffledVisuals[i]); if (shuffledAds[i % shuffledAds.length]) { const ad = { ...shuffledAds[i % shuffledAds.length] }; ad.id = `ad-instance-${i}-${ad.id}`; mixedFeed.push(ad); } }
      setFeed(mixedFeed); 
      setDisplayedFeed([...mixedFeed]);
      if (mixedFeed.length > 0) setActiveId(mixedFeed[0].id); setLoading(false);
    };
    fetchData();
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || feed.length === 0) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - clientHeight * 2) {
      setDisplayedFeed(prev => {
        const repeatCount = Math.floor(prev.length / feed.length) + 1;
        const newItems = feed.map(item => ({ ...item, id: `${item.id}-repeat-${repeatCount}` }));
        return [...prev, ...newItems];
      });
    }
  }, [feed]);

  useEffect(() => {
    const ref = containerRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (ref) {
        ref.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  useEffect(() => {
      if (loading || !containerRef.current) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { const id = entry.target.getAttribute('data-id'); if (id) setActiveId(id); } }); }, { root: containerRef.current, threshold: 0.6 });
      const slides = containerRef.current.querySelectorAll('.snap-start');
      slides.forEach(slide => observer.current?.observe(slide));
      return () => { if (observer.current) observer.current.disconnect(); };
  }, [loading, displayedFeed]);

  if (loading) return <div className="h-full flex items-center justify-center text-slate-500 bg-black">Loading feed...</div>;

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full overflow-y-scroll snap-y snap-mandatory bg-black no-scrollbar scroll-smooth">
      {displayedFeed.map((item) => (
        <div key={item.id} data-id={item.id} className="flex-none relative w-full h-full snap-start snap-always flex items-center justify-center bg-black overflow-hidden group">
           
            {/* CONTENT LAYER */}
            {item.type === 'video' && item.media_url ? (
                <FeedVideoItem item={item} isActive={activeId === item.id} isMuted={isMuted} toggleMute={() => setIsMuted(!isMuted)} />
            ) : (
                <>
                    {(item.type === 'image' || item.type === 'course_ad') && (
                        <div className="w-full h-full flex items-center justify-center bg-black">
                          <img src={item.media_url || 'https://via.placeholder.com/800'} className="max-w-full max-h-full object-contain animate-slow-zoom" alt="Content" onError={(e) => (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800'} />
                        </div>
                    )}
                    {item.type === 'fact' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-900 to-black text-center animate-slow-zoom"> <h1 className="text-3xl font-bold text-white leading-tight">"{item.title}"</h1> </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none" />
                </>
            )}
            {/* SIDEBAR ACTIONS (Share Removed) */}
            <div className="absolute right-4 bottom-32 md:bottom-24 flex flex-col gap-6 items-center z-30">
               {/* Share button removed as requested */}
            </div>
            {/* BOTTOM INFO */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-24 md:pb-8 z-20 flex flex-col pointer-events-none">
                <div className="pointer-events-auto">
                    {item.type === 'course_ad' ? ( <div className="mb-2"><button onClick={onNavigateToCourse} className="w-fit bg-[#8B6C58]/95 backdrop-blur-md hover:bg-[#8B6C58] text-white py-2 px-5 rounded-full flex items-center gap-3 transition-all active:scale-95 mb-3 shadow-lg"><span className="font-bold text-sm">Get Course • ${item.price}</span><ChevronRight className="w-4 h-4 opacity-80" /></button><div className="pr-16"><h3 className="text-white font-bold text-lg mb-1 drop-shadow-md">{item.title}</h3><p className="text-white/90 text-sm leading-relaxed line-clamp-2 drop-shadow-md">{item.description}</p></div></div> ) : ( <div className="pr-16 mb-2"><div className="flex items-center gap-2 mb-2 opacity-90"><div className="p-1 bg-white/20 rounded-full backdrop-blur-sm"><ShieldCheck className="w-4 h-4 text-white" /></div><span className="text-white font-bold text-sm tracking-wide drop-shadow-md">Grecko Admin</span></div><p className="text-white font-medium text-lg leading-snug drop-shadow-md">{item.title}</p></div> )}
                </div>
            </div>
        </div>
      ))}
    </div>
  );
};
