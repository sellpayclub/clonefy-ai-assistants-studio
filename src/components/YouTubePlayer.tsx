import { useState } from "react";

const YouTubePlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
      {!isPlaying ? (
        <>
          <img
            src="https://img.youtube.com/vi/6ekAG3pJvwI/maxresdefault.jpg"
            alt="Video thumbnail"
            className="w-full h-full object-cover absolute top-0 left-0 z-10"
            onError={(e) => {
              e.currentTarget.src = "https://img.youtube.com/vi/6ekAG3pJvwI/hqdefault.jpg";
            }}
          />
          <div 
            className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-20 bg-black/45 cursor-pointer"
            onClick={handlePlay}
          >
            <button className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse hover:animate-none">
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></div>
              <svg 
                className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white ml-1" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        </>
      ) : (
        <iframe
          src="https://www.youtube.com/embed/6ekAG3pJvwI?autoplay=1&controls=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3"
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="CLONEFY - Depoimentos e Demonstração"
        />
      )}
    </div>
  );
};

export default YouTubePlayer;