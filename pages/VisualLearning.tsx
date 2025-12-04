import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Course } from '../types';

const getYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
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

/* -----------------------------------------------------------
   FEED VIDEO ITEM – TIKTOK AUTOPLAY + MUTE BUTTON ONLY
----------------------------------------------------------- */
const FeedVideoItem = ({
  item,
  isActive,
  isMuted,
  toggleMute
}: {
  item: FeedItem;
  isActive: boolean;
  isMuted: boolean;
  toggleMute: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const youtubeId = getYoutubeId(item.media_url || '');

  // Auto play/pause for MP4
  useEffect(() => {
    if (!videoRef.current || youtubeId) return;

    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive, youtubeId]);

  // Auto play/pause for YouTube
  useEffect(() => {
    if (!iframeRef.current || !youtubeId) return;

    const cmd = isActive ? 'playVideo' : 'pauseVideo';
    iframeRef.current.contentWindow?.postMessage(
      JSON.stringify({
        event: 'command',
        func: cmd,
        args: []
      }),
      '*'
    );
  }, [isActive, youtubeId]);

  // Mute / unmute YouTube
  useEffect(() => {
    if (!iframeRef.current || !youtubeId) return;

    const cmd = isMuted ? 'mute' : 'unMute';
    iframeRef.current.contentWindow?.postMessage(
      JSON.stringify({
        event: 'command',
        func: cmd,
        args: []
      }),
      '*'
    );
  }, [isMuted, youtubeId]);

  const thumbnail = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : '';

  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center">
      {youtubeId ? (
        isActive ? (
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&mute=${
              isMuted ? 1 : 0
            }&playsinline=1&controls=0&loop=1&playlist=${youtubeId}`}
            className="w-full h-full object-cover"
            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="w-full h-full relative">
            <img
              src={thumbnail}
              className="w-full h-full object-cover"
            />
            <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80 w-14 h-14" />
          </div>
        )
      ) : (
        <video
          ref={videoRef}
          src={item.media_url}
          className="w-full h-full object-cover"
          muted={isMuted}
          playsInline
          loop
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 pointer-events-none" />

      {/* Mute button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
        className="absolute right-4 bottom-24 z-20 p-3 bg-white/15 rounded-full backdrop-blur-md"
      >
        {isMuted ? (
          <VolumeX className="text-white w-6 h-6" />
        ) : (
          <Volume2 className="text-white w-6 h-6" />
        )}
      </button>
    </div>
  );
};

/* -----------------------------------------------------------
   MAIN FEED – TIKTOK AUTOPLAY ON SCROLL
----------------------------------------------------------- */
const VisualLearning = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const loadFeed = async () => {
      const { data } = await supabase.from('facts').select('*');

      setItems(
        data?.map((x: any) => ({
          id: x.id,
          title: x.title,
          type: x.type,
          media_url: x.media_url,
          description: x.description
        })) || []
      );
    };

    loadFeed();
  }, []);

  // TikTok scroll detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) {
            const idx = Number(ent.target.getAttribute('data-index'));
            setActiveIndex(idx);
          }
        });
      },
      {
        threshold: 0.65
      }
    );

    itemRefs.current.forEach((el) => el && observer.observe(el));

    return () => observer.disconnect();
  }, [items]);

  return (
    <div className="w-full h-screen snap-y snap-mandatory overflow-scroll">
      {items.map((item, i) => (
        <div
          key={item.id}
          data-index={i}
          ref={(el) => (itemRefs.current[i] = el)}
          className="w-full h-screen snap-start"
        >
          {item.type === 'video' ? (
            <FeedVideoItem
              item={item}
              isActive={activeIndex === i}
              isMuted={isMuted}
              toggleMute={() => setIsMuted((m) => !m)}
            />
          ) : item.type === 'image' ? (
            <div className="w-full h-full">
              <img
                src={item.media_url}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black text-white text-xl p-6">
              {item.title}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default VisualLearning;
