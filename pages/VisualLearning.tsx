import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
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

    useEffect(() => {
        if (videoRef.current && !youtubeId) {
            if (isActive) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(e => console.log("Autoplay blocked", e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [isActive, youtubeId]);

    useEffect(() => {
        if (iframeRef.current && youtubeId) {
            const command = isActive ? 'playVideo' : 'pauseVideo';
            iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: command, args: '' }), '*');
        }
    }, [isActive, youtubeId]);

    useEffect(() => {
        if (iframeRef.current && youtubeId) {
            const command = isMuted ? 'mute' : 'unMute';
            iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: command, args: '' }), '*');
        }
    }, [isMuted, youtubeId]);

    return (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
            {youtubeId ? (
                <div className="relative w-full h-full">
                    <iframe
                        ref={iframeRef}
                        src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&mute=1&playsinline=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&rel=0`}
                        className="absolute top-0 left-0 w-full h-full"
                        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                        title={item.title}
                        frameBorder="0"
                        style={{ pointerEvents: 'none' }}
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
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
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

  useEffect(() => {
    // Add viewport meta tag for mobile
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
    document.head.appendChild(meta);

    // Add CSS for full coverage
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        @keyframes slowZoom { 
            0% { transform: scale(1); } 
            100% { transform: scale(1.05); } 
        } 
        .animate-slow-zoom { 
            animation: slowZoom 20s infinite alternate ease-in-out; 
        }
        
        /* Force full screen coverage */
        html, body, #root {
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        
        /* Consistent full coverage */
        .full-cover {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        
        /* Mobile-specific fixes */
        @media (max-width: 768px) {
            .full-cover {
                height: 100vh !important;
            }
            
            /* iOS Safari fix */
            @supports (-webkit-touch-callout: none) {
                .full-cover {
                    height: -webkit-fill-available !important;
                }
            }
        }
        
        /* Hide scrollbar but keep functionality */
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
      document.head.removeChild(meta);
    };
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
      for (let i = 0; i < maxLength; i++) { 
        if (shuffledVisuals[i]) mixedFeed.push(shuffledVisuals[i]); 
        if (shuffledAds[i % shuffledAds.length]) { 
          const ad = { ...shuffledAds[i % shuffledAds.length] }; 
          ad.id = `ad-instance-${i}-${ad.id}`; 
          mixedFeed.push(ad); 
        } 
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
        const newItems = feed.map(item => ({ ...item, id: `${item.id}-repeat-${repeatCount}` }));
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

  if (loading) return <div className="full-cover flex items-center justify-center text-slate-500 bg-black">Loading feed...</div>;

  return (
    <div 
      ref={containerRef} 
      className="full-cover overflow-y-scroll snap-y snap-mandatory bg-black no-scrollbar"
    >
      {displayedFeed.map((item) => (
        <div 
          key={item.id} 
          data-id={item.id} 
          className="full-cover snap-start snap-always relative bg-black overflow-hidden"
        >
            {item.type === 'video' && item.media_url ? (
                <FeedVideoItem item={item} isActive={activeId === item.id} isMuted={isMuted} toggleMute={() => setIsMuted(!isMuted)} />
            ) : (
                <>
                  {(item.type === 'image' || item.type === 'course_ad') && (
                      <div className="full-cover">
                        <img 
                          src={item.media_url || 'https://via.placeholder.com/800'} 
                          className="full-cover object-cover animate-slow-zoom"
                          alt="Content" 
                          onError={(e) => ((e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800')}
                          style={{ objectPosition: 'center center' }}
                        />
                      </div>
                  )}
                  {item.type === 'fact' && (
                      <div className="full-cover flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-900 to-black text-center">
                        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight px-4">"{item.title}"</h1>
                      </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
                </>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4 pb-24 md:pb-8 z-20">
                <div>
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
