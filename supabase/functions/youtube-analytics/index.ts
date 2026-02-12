import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, query, channelId, videoId } = await req.json();

    if (!YOUTUBE_API_KEY) {
      console.error('YOUTUBE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'YouTube API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`YouTube API action: ${action}, query: ${query}, channelId: ${channelId}, videoId: ${videoId}`);

    switch (action) {
      case 'search': {
        // Search for channels
        const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=5&key=${YOUTUBE_API_KEY}`;
        console.log('Searching channels...');
        
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (searchData.error) {
          console.error('YouTube API search error:', searchData.error);
          return new Response(
            JSON.stringify({ error: searchData.error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get channel details for each result
        const channelIds = searchData.items?.map((item: any) => item.snippet.channelId).join(',');
        
        if (!channelIds) {
          return new Response(
            JSON.stringify({ channels: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const channelsUrl = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics,brandingSettings&id=${channelIds}&key=${YOUTUBE_API_KEY}`;
        const channelsResponse = await fetch(channelsUrl);
        const channelsData = await channelsResponse.json();

        const channels = channelsData.items?.map((channel: any) => ({
          id: channel.id,
          name: channel.snippet.title,
          handle: channel.snippet.customUrl || `@${channel.snippet.title.toLowerCase().replace(/\s+/g, '')}`,
          avatar: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url || '',
          banner: channel.brandingSettings?.image?.bannerExternalUrl || '',
          subscribers: parseInt(channel.statistics.subscriberCount) || 0,
          totalViews: parseInt(channel.statistics.viewCount) || 0,
          totalVideos: parseInt(channel.statistics.videoCount) || 0,
          joinDate: new Date(channel.snippet.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          description: channel.snippet.description || '',
          country: channel.snippet.country || 'Unknown',
          verified: channel.statistics.subscriberCount > 100000, // Approximate verification
        })) || [];

        console.log(`Found ${channels.length} channels`);

        return new Response(
          JSON.stringify({ channels }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'channel-analytics': {
        if (!channelId) {
          return new Response(
            JSON.stringify({ error: 'Channel ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get channel details
        const channelUrl = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
        const channelResponse = await fetch(channelUrl);
        const channelData = await channelResponse.json();
        
        if (!channelData.items?.length) {
          return new Response(
            JSON.stringify({ error: 'Channel not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const channel = channelData.items[0];
        const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

        // Get recent videos from uploads playlist
        let videos: any[] = [];
        if (uploadsPlaylistId) {
          const playlistUrl = `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=20&key=${YOUTUBE_API_KEY}`;
          const playlistResponse = await fetch(playlistUrl);
          const playlistData = await playlistResponse.json();

          if (playlistData.items?.length) {
            const videoIds = playlistData.items.map((item: any) => item.contentDetails.videoId).join(',');
            
            // Get video statistics
            const videosUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
            const videosResponse = await fetch(videosUrl);
            const videosData = await videosResponse.json();

            videos = videosData.items?.map((video: any) => {
              const views = parseInt(video.statistics.viewCount) || 0;
              const likes = parseInt(video.statistics.likeCount) || 0;
              const comments = parseInt(video.statistics.commentCount) || 0;
              
              // Parse duration
              const duration = video.contentDetails.duration;
              const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
              const hours = parseInt(match?.[1] || '0');
              const minutes = parseInt(match?.[2] || '0');
              const seconds = parseInt(match?.[3] || '0');
              const totalSeconds = hours * 3600 + minutes * 60 + seconds;
              const avgDuration = Math.floor(totalSeconds * 0.4); // Estimate 40% avg view time
              
              return {
                id: video.id,
                title: video.snippet.title,
                thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url || '',
                views,
                likes,
                dislikes: 0, // No longer public
                comments,
                shares: Math.floor(views * 0.01), // Estimate
                watchTime: `${Math.floor(views * avgDuration / 3600)}h`,
                avgViewDuration: `${Math.floor(avgDuration / 60)}:${(avgDuration % 60).toString().padStart(2, '0')}`,
                engagementRate: views > 0 ? parseFloat(((likes + comments) / views * 100).toFixed(2)) : 0,
                publishedAt: getTimeAgo(new Date(video.snippet.publishedAt)),
                trend: views > 1000 ? 'up' : views < 100 ? 'down' : 'stable',
                duration: `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, '0')}`,
              };
            }) || [];
          }
        }

        // Sort by views to find most/least popular
        const sortedByViews = [...videos].sort((a, b) => b.views - a.views);
        const mostPopular = sortedByViews[0] || null;
        const leastPopular = sortedByViews[sortedByViews.length - 1] || null;

        // Calculate totals
        const totalViews = parseInt(channel.statistics.viewCount) || 0;
        const totalComments = videos.reduce((sum, v) => sum + v.comments, 0);
        const totalLikes = videos.reduce((sum, v) => sum + v.likes, 0);
        
        // Generate performance data (simulated daily data for last 7 days)
        const performanceData = generatePerformanceData(videos);
        
        // Generate audience data (simulated - YouTube Analytics API requires OAuth)
        const audienceData = [
          { name: '18-24', value: 25, color: '#0EA5E9' },
          { name: '25-34', value: 35, color: '#3B82F6' },
          { name: '35-44', value: 20, color: '#6366F1' },
          { name: '45-54', value: 12, color: '#8B5CF6' },
          { name: '55+', value: 8, color: '#A855F7' },
        ];

        const analytics = {
          channelAnalytics: {
            subscribers: parseInt(channel.statistics.subscriberCount) || 0,
            subscribersTrend: 2.5, // Estimated - requires Analytics API
            totalViews,
            viewsTrend: 5.2, // Estimated
            totalComments,
            watchTime: `${Math.floor(totalViews * 180 / 3600)}K hours`, // Estimate 3 min avg
            avgViewDuration: '3:24', // Estimate
            engagementRate: totalViews > 0 ? parseFloat(((totalLikes + totalComments) / totalViews * 100).toFixed(2)) : 0,
          },
          videos,
          mostPopularVideo: mostPopular,
          leastPopularVideo: leastPopular,
          performanceData,
          audienceData,
        };

        console.log(`Loaded analytics for channel with ${videos.length} videos`);

        return new Response(
          JSON.stringify(analytics),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'video-analytics': {
        if (!videoId) {
          return new Response(
            JSON.stringify({ error: 'Video ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get video details
        const videoUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        const videoResponse = await fetch(videoUrl);
        const videoData = await videoResponse.json();

        if (!videoData.items?.length) {
          return new Response(
            JSON.stringify({ error: 'Video not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const video = videoData.items[0];
        const views = parseInt(video.statistics.viewCount) || 0;
        const likes = parseInt(video.statistics.likeCount) || 0;
        const comments = parseInt(video.statistics.commentCount) || 0;

        // Parse duration
        const duration = video.contentDetails.duration;
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        const hours = parseInt(match?.[1] || '0');
        const minutes = parseInt(match?.[2] || '0');
        const seconds = parseInt(match?.[3] || '0');
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        const avgDurationSeconds = Math.floor(totalSeconds * 0.42);

        // Generate demographics (simulated - requires Analytics API with OAuth)
        const demographics = {
          gender: [
            { name: 'Male', value: 58, color: '#0EA5E9' },
            { name: 'Female', value: 39, color: '#EC4899' },
            { name: 'Other', value: 3, color: '#8B5CF6' },
          ],
          age: [
            { name: '13-17', value: 8, color: '#10B981' },
            { name: '18-24', value: 28, color: '#0EA5E9' },
            { name: '25-34', value: 32, color: '#3B82F6' },
            { name: '35-44', value: 18, color: '#6366F1' },
            { name: '45-54', value: 9, color: '#8B5CF6' },
            { name: '55+', value: 5, color: '#A855F7' },
          ],
          country: [
            { name: 'United States', value: 42, color: '#0EA5E9' },
            { name: 'United Kingdom', value: 12, color: '#3B82F6' },
            { name: 'India', value: 10, color: '#6366F1' },
            { name: 'Canada', value: 8, color: '#8B5CF6' },
            { name: 'Others', value: 28, color: '#A855F7' },
          ],
        };

        // Generate performance data over 7 days
        const performanceData = [];
        let remainingViews = views;
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayViews = i === 0 ? remainingViews : Math.floor(remainingViews * (0.3 - i * 0.03));
          remainingViews -= dayViews;
          performanceData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            views: Math.max(0, dayViews),
          });
        }

        const videoAnalytics = {
          views,
          viewsTrend: 8.5,
          likes,
          dislikes: 0, // No longer public
          comments,
          shares: Math.floor(views * 0.008),
          avgViewDuration: `${Math.floor(avgDurationSeconds / 60)}:${(avgDurationSeconds % 60).toString().padStart(2, '0')}`,
          avgViewPercentage: 42,
          demographics,
          performanceData,
        };

        console.log(`Loaded analytics for video: ${video.snippet.title}`);

        return new Response(
          JSON.stringify({ videoAnalytics }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('YouTube Analytics error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function generatePerformanceData(videos: any[]): { date: string; views: number; likes: number }[] {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Sum up estimated daily views from recent videos
    const dailyViews = videos.reduce((sum, v) => {
      return sum + Math.floor(v.views / 7 * (Math.random() * 0.5 + 0.75));
    }, 0);
    
    const dailyLikes = videos.reduce((sum, v) => {
      return sum + Math.floor(v.likes / 7 * (Math.random() * 0.5 + 0.75));
    }, 0);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: dailyViews,
      likes: dailyLikes,
    });
  }
  return data;
}
