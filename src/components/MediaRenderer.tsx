import React, { useState } from 'react';
import { X, Play, ExternalLink } from 'lucide-react';

interface MediaRendererProps {
    content: string;
    className?: string;
}

// Regex patterns for detecting media URLs
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const VIMEO_REGEX = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)/;

// URL detection regex
const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;

interface MediaItem {
    type: 'image' | 'video' | 'youtube' | 'vimeo';
    url: string;
    embedUrl?: string;
}

const detectMedia = (url: string): MediaItem | null => {
    if (IMAGE_EXTENSIONS.test(url)) {
        return { type: 'image', url };
    }

    if (VIDEO_EXTENSIONS.test(url)) {
        return { type: 'video', url };
    }

    const youtubeMatch = url.match(YOUTUBE_REGEX);
    if (youtubeMatch) {
        return {
            type: 'youtube',
            url,
            embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`
        };
    }

    const vimeoMatch = url.match(VIMEO_REGEX);
    if (vimeoMatch) {
        return {
            type: 'vimeo',
            url,
            embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`
        };
    }

    return null;
};

const parseContent = (content: string): { text: string; media: MediaItem[] } => {
    const media: MediaItem[] = [];
    let text = content;

    const urls = content.match(URL_REGEX) || [];

    for (const url of urls) {
        const mediaItem = detectMedia(url);
        if (mediaItem) {
            media.push(mediaItem);
            // Remove URL from text for cleaner display
            text = text.replace(url, '').trim();
        }
    }

    // Clean up multiple spaces and newlines
    text = text.replace(/\n\s*\n/g, '\n').trim();

    return { text, media };
};

const MediaRenderer: React.FC<MediaRendererProps> = ({ content, className = '' }) => {
    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<Record<string, boolean>>({});

    const { text, media } = parseContent(content);

    if (media.length === 0) {
        // No media found, return null to let parent handle text-only rendering
        return null;
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Text content */}
            {text && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {text}
                </p>
            )}

            {/* Media items */}
            {media.map((item, index) => (
                <div key={index} className="mt-2">
                    {item.type === 'image' && (
                        <div
                            className="relative cursor-pointer group"
                            onClick={() => setExpandedImage(item.url)}
                        >
                            <img
                                src={item.url}
                                alt="Mídia compartilhada"
                                className="max-w-full rounded-lg max-h-48 object-cover hover:opacity-90 transition-opacity"
                                loading="lazy"
                                onError={(e) => {
                                    // Hide broken images
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <ExternalLink className="h-6 w-6 text-white drop-shadow-lg" />
                            </div>
                        </div>
                    )}

                    {item.type === 'video' && !videoError[item.url] && (
                        <div className="relative rounded-lg overflow-hidden">
                            <video
                                src={item.url}
                                controls
                                className="max-w-full max-h-48 rounded-lg"
                                preload="metadata"
                                onError={() => setVideoError(prev => ({ ...prev, [item.url]: true }))}
                            >
                                Seu navegador não suporta vídeo.
                            </video>
                        </div>
                    )}

                    {item.type === 'video' && videoError[item.url] && (
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-500 hover:underline text-sm"
                        >
                            <Play className="h-4 w-4" />
                            Abrir vídeo
                        </a>
                    )}

                    {(item.type === 'youtube' || item.type === 'vimeo') && item.embedUrl && (
                        <div className="relative rounded-lg overflow-hidden aspect-video max-w-full">
                            <iframe
                                src={item.embedUrl}
                                className="w-full h-full min-h-[150px] rounded-lg"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                loading="lazy"
                                title="Vídeo incorporado"
                            />
                        </div>
                    )}
                </div>
            ))}

            {/* Lightbox for expanded images */}
            {expandedImage && (
                <div
                    className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
                    onClick={() => setExpandedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                        onClick={() => setExpandedImage(null)}
                        aria-label="Fechar"
                    >
                        <X className="h-8 w-8" />
                    </button>
                    <img
                        src={expandedImage}
                        alt="Imagem expandida"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

// Export utility function for checking if content has media
export const hasMedia = (content: string): boolean => {
    const urls = content.match(URL_REGEX) || [];
    return urls.some(url => detectMedia(url) !== null);
};

export default MediaRenderer;
