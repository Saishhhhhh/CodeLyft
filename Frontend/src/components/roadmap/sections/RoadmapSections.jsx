import React from 'react';
import SectionHeader from './SectionHeader';
import TopicSection from './TopicSection';
import { groupSectionsBySharedResources } from '../utils/progressUtils';

const RoadmapSections = ({
  sections,
  expandedSections,
  completedVideos,
  videoNotes,
  onToggleSection,
  onToggleVideoComplete,
  onPlayVideo,
  onAddNote,
  onPlaylistClick,
  getCompletedVideosCount,
  getTotalVideosCount,
  getCompletionPercentage
}) => {
  return (
    <div className="space-y-8">
      {groupSectionsBySharedResources(sections).map((section, sectionIndex) => (
        <div key={sectionIndex} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Section Header */}
          <SectionHeader
            title={`Step ${sectionIndex + 1}: ${section.title.replace(/^Complete\s+/i, '')}`}
            description={section.technologies?.[0]?.description}
            completedCount={getCompletedVideosCount(section, completedVideos)}
            totalCount={getTotalVideosCount(section)}
            completionPercentage={getCompletionPercentage(section, completedVideos)}
            isExpanded={expandedSections[`section${sectionIndex}`]}
            onToggle={() => onToggleSection(`section${sectionIndex}`)}
          />

          {/* Section Content */}
          {expandedSections[`section${sectionIndex}`] && (
            <div className="p-6">
              {/* Topics */}
              <div className="space-y-8">
                {section.topics.map((topic, topicIndex) => (
                  <TopicSection
                    key={topicIndex}
                    topic={topic}
                    completedVideos={completedVideos}
                    videoNotes={videoNotes}
                    onToggleVideoComplete={onToggleVideoComplete}
                    onPlayVideo={onPlayVideo}
                    onAddNote={onAddNote}
                    onPlaylistClick={onPlaylistClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RoadmapSections; 