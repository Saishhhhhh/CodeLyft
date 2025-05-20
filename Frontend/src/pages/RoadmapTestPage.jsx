import { useState } from 'react';
import HeroAnimation from '../components/HeroAnimation';

const RoadmapTestPage = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [completedVideos, setCompletedVideos] = useState({});
  const [videoNotes, setVideoNotes] = useState({});
  const [editingNote, setEditingNote] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleVideoCompletion = (videoId) => {
    setCompletedVideos(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  const openNoteModal = (videoId) => {
    setEditingNote(videoId);
    setCurrentNote(videoNotes[videoId] || '');
    setNoteModalOpen(true);
  };

  const closeNoteModal = () => {
    setNoteModalOpen(false);
    setEditingNote(null);
    setCurrentNote('');
  };

  const saveNote = () => {
    if (editingNote) {
      setVideoNotes(prev => ({
        ...prev,
        [editingNote]: currentNote
      }));
    }
    closeNoteModal();
  };

  const formatDuration = (duration) => {
    if (typeof duration === 'number') {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return duration;
  };

  const getCompletionPercentage = (total, completed) => {
    return Math.round((completed / total) * 100);
  };

  const getCompletedVideosCount = (videos) => {
    return videos.filter(video => completedVideos[video.id]).length;
  };

  const openVideoModal = (video) => {
    setCurrentVideo(video);
    setVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setVideoModalOpen(false);
    setCurrentVideo(null);
  };

  const samplePlaylists = {
    html: {
      id: "PLbtI3_MArDOkXRLxdMt1NOMtCS-84ibHH",
      title: "HTML Complete Course for Beginners",
      url: "https://www.youtube.com/playlist?list=PLbtI3_MArDOkXRLxdMt1NOMtCS-84ibHH",
      channel: {
        name: "Sheryians Coding School"
      },
      video_count: 29,
      videos: [
        {
          id: "T55Kb8rrH1g",
          title: "HTML Introduction and Setup | Part 1",
          url: "https://www.youtube.com/watch?v=T55Kb8rrH1g",
          channel: {
            name: "Sheryians Coding School"
          },
          duration: 2588
        },
        {
          id: "OFbSqd54Wwk",
          title: "HTML Basic Tags and Elements | Part 2",
          url: "https://www.youtube.com/watch?v=OFbSqd54Wwk",
          channel: {
            name: "Sheryians Coding School"
          },
          duration: 3245
        }
      ]
    },
    css: {
      id: "PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW",
      title: "CSS Complete Course for Beginners",
      url: "https://www.youtube.com/playlist?list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW",
      channel: {
        name: "Sheryians Coding School"
      },
      video_count: 25,
      videos: [
        {
          id: "T55Kb8rrH3g",
          title: "CSS Introduction and Selectors | Part 1",
          url: "https://www.youtube.com/watch?v=T55Kb8rrH3g",
          channel: {
            name: "Sheryians Coding School"
          },
          duration: 2890
        },
        {
          id: "T55Kb8rrH4g",
          title: "CSS Box Model and Layout | Part 2",
          url: "https://www.youtube.com/watch?v=T55Kb8rrH4g",
          channel: {
            name: "Sheryians Coding School"
          },
          duration: 3567
        }
      ]
    }
  };

  const sampleVideo = {
    id: "T55Kb8rrH5g",
    title: "JavaScript Crash Course for Beginners",
    url: "https://www.youtube.com/watch?v=T55Kb8rrH5g",
    channel: {
      name: "Sheryians Coding School"
    },
    duration: 4567
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #FFF7ED, #FFFFFF)' }}>
      <style>
        {`
          @keyframes gradient-x {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-x 3s ease infinite;
          }
        `}
      </style>
      <HeroAnimation />
      
      {/* Video Modal */}
      {videoModalOpen && currentVideo && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 bg-gradient-to-b from-black/95 to-black/90"
        >
          <div className="relative mx-4 w-full max-w-2xl transform transition-all duration-300 ease-out">
            <div className="absolute -top-12 right-0 flex items-center space-x-2 z-10">
              <button
                onClick={closeVideoModal}
                className="text-white/80 hover:text-white transition-all duration-200 group"
                title="Close"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-2 group-hover:bg-white/20 transition-all duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </button>
            </div>
            <div className="relative bg-black overflow-hidden shadow-2xl" style={{ paddingTop: '56.25%' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-gradient-x opacity-70 hover:opacity-90 transition-opacity duration-300"></div>
              <div className="absolute inset-[2px] bg-black overflow-hidden">
                <iframe
                  key={currentVideo.id}
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`}
                  title={currentVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            <div className="mt-3 px-1">
              <h3 className="text-white text-sm font-medium truncate">{currentVideo.title}</h3>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-xs text-white/60 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDuration(currentVideo.duration)}
                </span>
                <span className="text-xs text-white/60 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {currentVideo.channel.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 shadow-2xl transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Add Notes</h3>
              <button
                onClick={closeNoteModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Add your notes here..."
              className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[200px] text-gray-700 placeholder-gray-400"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={closeNoteModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 font-poppins" style={{
              background: 'linear-gradient(to right, #EA580C, #9333EA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Learning Roadmap for Full Stack Web Development in MERN
            </h1>
            <p className="text-xl text-gray-600 mb-4 font-mukta">
              A comprehensive guide to mastering Full Stack Web Development
            </p>
            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Estimated Time: 6 months
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Difficulty: Intermediate
              </span>
            </div>
          </div>

          {/* Learning Path */}
          <div className="space-y-8">
            {/* Step 1: HTML */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 cursor-pointer hover:bg-gradient-to-r hover:from-orange-100 hover:to-purple-100 transition-colors"
                onClick={() => toggleSection('step1')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Step 1: Complete HTML</h2>
                    <p className="text-sm text-gray-600 mt-1">Master the fundamental concepts of web development</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {getCompletedVideosCount(samplePlaylists.html.videos)} / {samplePlaylists.html.video_count}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getCompletionPercentage(samplePlaylists.html.video_count, getCompletedVideosCount(samplePlaylists.html.videos))}% Complete
                      </div>
                    </div>
                    <svg 
                      className={`w-5 h-5 transform transition-transform ${expandedSections['step1'] ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${getCompletionPercentage(samplePlaylists.html.video_count, getCompletedVideosCount(samplePlaylists.html.videos))}%` }}
                    />
                  </div>
                </div>
              </div>

              {expandedSections['step1'] && (
                <div className="p-4 space-y-6">
                  {/* Playlist Info */}
                  <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-6 rounded-xl border border-orange-100">
                    <div className="flex items-start space-x-6">
                      <div className="flex-grow space-y-3">
                        <h3 className="text-2xl font-bold text-gray-900">{samplePlaylists.html.title}</h3>
                        <div className="flex items-center space-x-4">
                          <p className="text-gray-600">By: {samplePlaylists.html.channel.name}</p>
                          <span className="px-3 py-1 bg-white text-orange-600 text-sm font-semibold rounded-full border border-orange-200 shadow-sm">
                            {samplePlaylists.html.video_count} Videos
                          </span>
                        </div>
                      </div>
                      <div 
                        onClick={() => openVideoModal(samplePlaylists.html.videos[0])}
                        className="relative group cursor-pointer"
                      >
                        <img 
                          src={`https://img.youtube.com/vi/${samplePlaylists.html.videos[0].id}/maxresdefault.jpg`}
                          alt="Playlist thumbnail"
                          className="w-48 h-27 rounded-lg shadow-md transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video List */}
                  <div className="space-y-4">
                    {samplePlaylists.html.videos.map((video) => (
                      <div key={video.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-start space-x-6">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={completedVideos[video.id] || false}
                                onChange={() => toggleVideoCompletion(video.id)}
                                className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-gray-300 transition-all checked:border-orange-500 checked:bg-orange-500 hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                              />
                              <svg
                                className="pointer-events-none absolute left-1 top-1 h-4 w-4 opacity-0 transition-opacity peer-checked:opacity-100"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-start space-x-6">
                                <div 
                                  onClick={() => openVideoModal(video)}
                                  className="relative group flex-shrink-0 cursor-pointer"
                                >
                                  <img 
                                    src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                                    alt={video.title}
                                    className="w-48 h-27 rounded-lg shadow-sm transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                    </svg>
                                  </div>
                                </div>
                                <div className="flex-grow">
                                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{video.title}</h4>
                                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                                    <span className="flex items-center">
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {formatDuration(video.duration)}
                                    </span>
                                    <span className="flex items-center">
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      {video.channel.name}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => openNoteModal(video.id)}
                                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span className="font-medium">{videoNotes[video.id] ? 'Edit Notes' : 'Add Notes'}</span>
                                  </button>
                                </div>
                              </div>

                              {videoNotes[video.id] && (
                                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                                  <p className="text-sm text-gray-700 italic">
                                    "{videoNotes[video.id]}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: CSS */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 cursor-pointer hover:bg-gradient-to-r hover:from-orange-100 hover:to-purple-100 transition-colors"
                onClick={() => toggleSection('step2')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Step 2: Style your websites</h2>
                    <p className="text-sm text-gray-600 mt-1">Learn to create beautiful and responsive designs</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {getCompletedVideosCount(samplePlaylists.css.videos)} / {samplePlaylists.css.video_count}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getCompletionPercentage(samplePlaylists.css.video_count, getCompletedVideosCount(samplePlaylists.css.videos))}% Complete
                      </div>
                    </div>
                    <svg 
                      className={`w-5 h-5 transform transition-transform ${expandedSections['step2'] ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${getCompletionPercentage(samplePlaylists.css.video_count, getCompletedVideosCount(samplePlaylists.css.videos))}%` }}
                    />
                  </div>
                </div>
              </div>

              {expandedSections['step2'] && (
                <div className="p-4 space-y-6">
                  {/* Playlist Info */}
                  <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-6 rounded-xl border border-orange-100">
                    <div className="flex items-start space-x-6">
                      <div className="flex-grow space-y-3">
                        <h3 className="text-2xl font-bold text-gray-900">{samplePlaylists.css.title}</h3>
                        <div className="flex items-center space-x-4">
                          <p className="text-gray-600">By: {samplePlaylists.css.channel.name}</p>
                          <span className="px-3 py-1 bg-white text-orange-600 text-sm font-semibold rounded-full border border-orange-200 shadow-sm">
                            {samplePlaylists.css.video_count} Videos
                          </span>
                        </div>
                      </div>
                      <div 
                        onClick={() => openVideoModal(samplePlaylists.css.videos[0])}
                        className="relative group cursor-pointer"
                      >
                        <img 
                          src={`https://img.youtube.com/vi/${samplePlaylists.css.videos[0].id}/maxresdefault.jpg`}
                          alt="Playlist thumbnail"
                          className="w-48 h-27 rounded-lg shadow-md transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video List */}
                  <div className="space-y-4">
                    {samplePlaylists.css.videos.map((video) => (
                      <div key={video.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                          <div className="flex items-start space-x-6">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={completedVideos[video.id] || false}
                                onChange={() => toggleVideoCompletion(video.id)}
                                className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-gray-300 transition-all checked:border-orange-500 checked:bg-orange-500 hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                              />
                              <svg
                                className="pointer-events-none absolute left-1 top-1 h-4 w-4 opacity-0 transition-opacity peer-checked:opacity-100"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-start space-x-6">
                                <div 
                                  onClick={() => openVideoModal(video)}
                                  className="relative group flex-shrink-0 cursor-pointer"
                                >
                                  <img 
                                    src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                                    alt={video.title}
                                    className="w-48 h-27 rounded-lg shadow-sm transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                    </svg>
                                  </div>
                                </div>
                                <div className="flex-grow">
                                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{video.title}</h4>
                                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                                    <span className="flex items-center">
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {formatDuration(video.duration)}
                                    </span>
                                    <span className="flex items-center">
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      {video.channel.name}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => openNoteModal(video.id)}
                                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span className="font-medium">{videoNotes[video.id] ? 'Edit Notes' : 'Add Notes'}</span>
                                  </button>
                                </div>
                              </div>

                              {videoNotes[video.id] && (
                                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                                  <p className="text-sm text-gray-700 italic">
                                    "{videoNotes[video.id]}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: JavaScript */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 cursor-pointer hover:bg-gradient-to-r hover:from-orange-100 hover:to-purple-100 transition-colors"
                onClick={() => toggleSection('step3')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Step 3: JavaScript Fundamentals</h2>
                    <p className="text-sm text-gray-600 mt-1">Learn the basics of JavaScript programming</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {completedVideos[sampleVideo.id] ? 1 : 0} / 1
                      </div>
                      <div className="text-xs text-gray-500">
                        {completedVideos[sampleVideo.id] ? '100%' : '0%'} Complete
                      </div>
                    </div>
                    <svg 
                      className={`w-5 h-5 transform transition-transform ${expandedSections['step3'] ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${completedVideos[sampleVideo.id] ? '100%' : '0%'}` }}
                    />
                  </div>
                </div>
              </div>

              {expandedSections['step3'] && (
                <div className="p-4 space-y-6">
                  {/* Video Info */}
                  <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-6 rounded-xl border border-orange-100">
                    <div className="flex items-start space-x-6">
                      <div className="flex-grow space-y-3">
                        <h3 className="text-2xl font-bold text-gray-900">{sampleVideo.title}</h3>
                        <div className="flex items-center space-x-4">
                          <p className="text-gray-600">By: {sampleVideo.channel.name}</p>
                          <span className="px-3 py-1 bg-white text-orange-600 text-sm font-semibold rounded-full border border-orange-200 shadow-sm">
                            Video
                          </span>
                        </div>
                      </div>
                      <div 
                        onClick={() => openVideoModal(sampleVideo)}
                        className="relative group cursor-pointer"
                      >
                        <img 
                          src={`https://img.youtube.com/vi/${sampleVideo.id}/maxresdefault.jpg`}
                          alt="Video thumbnail"
                          className="w-48 h-27 rounded-lg shadow-md transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video Item */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start space-x-6">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={completedVideos[sampleVideo.id] || false}
                            onChange={() => toggleVideoCompletion(sampleVideo.id)}
                            className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-gray-300 transition-all checked:border-orange-500 checked:bg-orange-500 hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          />
                          <svg
                            className="pointer-events-none absolute left-1 top-1 h-4 w-4 opacity-0 transition-opacity peer-checked:opacity-100"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-start space-x-6">
                            <div 
                              onClick={() => openVideoModal(sampleVideo)}
                              className="relative group flex-shrink-0 cursor-pointer"
                            >
                              <img 
                                src={`https://img.youtube.com/vi/${sampleVideo.id}/mqdefault.jpg`}
                                alt={sampleVideo.title}
                                className="w-48 h-27 rounded-lg shadow-sm transition-transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                              </div>
                            </div>
                            <div className="flex-grow">
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">{sampleVideo.title}</h4>
                              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {formatDuration(sampleVideo.duration)}
                                </span>
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  {sampleVideo.channel.name}
                                </span>
                              </div>
                              <button
                                onClick={() => openNoteModal(sampleVideo.id)}
                                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="font-medium">{videoNotes[sampleVideo.id] ? 'Edit Notes' : 'Add Notes'}</span>
                              </button>
                            </div>
                          </div>

                          {videoNotes[sampleVideo.id] && (
                            <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                              <p className="text-sm text-gray-700 italic">
                                "{videoNotes[sampleVideo.id]}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions for step titles and counts
const getStepTitle = (stepNumber) => {
  const titles = {
    2: 'Learn Important Sorting Techniques',
    3: 'Solve Problems on Arrays [Easy -> Medium -> Hard]',
    4: 'Binary Search [1D, 2D Arrays, Search Space]',
    5: 'Strings [Basic and Medium]'
  };
  return titles[stepNumber] || '';
};

const getStepDescription = (stepNumber) => {
  const descriptions = {
    2: 'Master essential sorting algorithms and their implementations',
    3: 'Practice array manipulation and problem-solving techniques',
    4: 'Learn binary search and its applications in various scenarios',
    5: 'Understand string manipulation and common string algorithms'
  };
  return descriptions[stepNumber] || '';
};

const getStepCount = (stepNumber) => {
  const counts = {
    2: 7,
    3: 40,
    4: 32,
    5: 15
  };
  return counts[stepNumber] || 0;
};

export default RoadmapTestPage; 