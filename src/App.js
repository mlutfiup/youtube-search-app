import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [comments, setComments] = useState({});
  const [regionCode, setRegionCode] = useState('ID');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [todayChecked, setTodayChecked] = useState(false);

  const apiKey = '';

  const fetchTrendingVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,statistics',
          chart: 'mostPopular',
          maxResults: 6,
          regionCode: regionCode,
          key: apiKey
        }
      });
      setTrendingVideos(response.data.items);
    } catch (error) {
      console.error('Error fetching YouTube data', error);
      setError('Failed to fetch trending videos.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentsForVideo = async (video) => {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/commentThreads', {
        params: {
          part: 'snippet',
          videoId: video.id.videoId || video.id,
          maxResults: 1,
          key: apiKey
        }
      });
      return response.data.items.map(item => ({
        author: item.snippet.topLevelComment.snippet.authorDisplayName,
        timestamp: new Date(item.snippet.topLevelComment.snippet.publishedAt).toLocaleString(),
        videoTitle: video.snippet.title,
        videoLink: `https://www.youtube.com/watch?v=${video.id.videoId || video.id}`,
        likeCount: item.snippet.topLevelComment.snippet.likeCount,
        text: item.snippet.topLevelComment.snippet.textDisplay
      }));
    } catch (error) {
      console.error('Error fetching YouTube comments', error);
      return [];
    }
  };

  const searchYouTube = async () => {
    setLoading(true);
    setError(null);
    setShowSearchResults(false);
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: 6,
          publishedAfter: startDate + 'T00:00:00Z',
          publishedBefore: endDate + 'T23:59:59Z',
          key: apiKey
        }
      });

      const videoItems = response.data.items;

      setSearchResults(videoItems);

      const commentsData = {};
      for (const video of videoItems) {
        const videoId = video.id.videoId;
        commentsData[videoId] = await fetchCommentsForVideo(video);
      }
      setComments(commentsData);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error fetching YouTube data', error);
      setError('Failed to fetch search results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingVideos();
  }, [regionCode]);

  useEffect(() => {
    if (!startDate && !endDate) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      setTodayChecked(true);
    }
  }, [startDate, endDate]);

  const truncateDescription = (description) => {
    if (description.length > 200) {
      return description.substring(0, 200) + '...';
    }
    return description;
  };

  const handleStartDateChange = (date) => {
    if (!todayChecked) {
      setStartDate(date);
    }
  };

  const handleEndDateChange = (date) => {
    if (!todayChecked) {
      setEndDate(date);
    }
  };

  const handleTodayCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setTodayChecked(isChecked);
    if (isChecked) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim() !== '') {
      searchYouTube();
    } else {
      console.log("Search query can't be empty");
    }
  };

  const getVideoId = (video) => {
    return video.id.videoId || video.id;
  };

  return (
    <div className="App">
      <header className="App-header">
		  <h1>YouTube Videos</h1><br/>
		  <form onSubmit={handleSearch}>
			<input
			  type="text"
			  id="search"
			  value={query}
			  onChange={(e) => setQuery(e.target.value)}
			  placeholder="Search for videos"
			/>
			<label htmlFor="startDate">Start Date:</label>
			<input
			  type="date"
			  id="startDate"
			  value={startDate}
			  onChange={(e) => handleStartDateChange(e.target.value)}
			  disabled={todayChecked}
			/>
			<label htmlFor="endDate">End Date:</label>
			<input
			  type="date"
			  id="endDate"
			  value={endDate}
			  onChange={(e) => handleEndDateChange(e.target.value)}
			  disabled={todayChecked}
			/>
			<label htmlFor="today">Today:</label>&nbsp;
			<input
			  type="checkbox"
			  id="today"
			  checked={todayChecked}
			  onChange={handleTodayCheckboxChange}
			/>
			<button type="submit" disabled={!query.trim()}>Search</button>
		  </form>
		</header>

      <main>
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        <section>
          <div className="videos-title">
            <h2>Trending Videos</h2>
            <div className="region-selector">
              <label htmlFor="region">Select Region:</label>
              <select
                id="region"
                value={regionCode}
                onChange={(e) => setRegionCode(e.target.value)}
              >
                <option value="ID">Indonesia</option>
                <option value="US">United States</option>
                <option value="JP">Japan</option>
              </select>
            </div>
          </div>
          <div className="videos-container">
            {trendingVideos.map((video, index) => (
              <div key={getVideoId(video)} className="video">
                <span className="trending-label">Trending #{index + 1}</span>
                <a href={`https://www.youtube.com/watch?v=${getVideoId(video)}`} target="_blank" rel="noopener noreferrer">
                  <img src={video.snippet.thumbnails.medium.url} alt={video.snippet.title} />
                </a>
                <div className="video-info">
                  <h3>{video.snippet.title}</h3>
                  <p className="video-details">
                    <span><a href={`https://www.youtube.com/channel/${video.snippet.channelId}`} target="_blank" rel="noopener noreferrer">{video.snippet.channelTitle}</a></span> | 
                    <span> Published {new Date(video.snippet.publishedAt).toLocaleDateString()}</span>
                  </p>
                  <p className="video-description">Description: <br/>{truncateDescription(video.snippet.description)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        {showSearchResults && (
          <div className="results-comments-wrapper">
            <section className="search-results-section">
              <h2 className="search-results-title">Search Results</h2>
              {searchResults.length > 0 ? (
                <div className="videos-container">
                  {searchResults.map((video) => (
                    <div key={getVideoId(video)} className="video">
                      <a href={`https://www.youtube.com/watch?v=${getVideoId(video)}`} target="_blank" rel="noopener noreferrer">
                        <img src={video.snippet.thumbnails.medium.url} alt={video.snippet.title} />
                      </a>
                      <div className="video-info">
                        <h3>{video.snippet.title}</h3>
                        <p className="video-details">
                          <span><a href={`https://www.youtube.com/channel/${video.snippet.channelId}`} target="_blank" rel="noopener noreferrer">{video.snippet.channelTitle}</a></span> | 
                          <span> Published {new Date(video.snippet.publishedAt).toLocaleDateString()}</span>
                        </p>
                        <p className="video-description">Description: <br/>{truncateDescription(video.snippet.description)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No search results found.</p>
              )}
            </section>
            <section className="comments-section">
				<h2>All Comments</h2>
				{Object.keys(comments).length > 0 ? (
				<div className="comments-table">
				  <table>
					<thead>
					  <tr>
						<th>Timestamp</th>
						<th>Username</th>
						<th>Comment</th>
						<th>Sentiment</th>
						<th>Title</th>
					  </tr>
					</thead>
					<tbody>
					  {Object.entries(comments).map(([videoId, commentsList]) => (
						commentsList.map((comment, index) => (
						  <tr key={`${videoId}-${index}`}>
							<td>{comment.timestamp}</td>
							<td>{comment.author}</td>
							<td>{comment.text}</td>
							<td>(+)</td>
							<td>
							  <a href={comment.videoLink} target="_blank" rel="noopener noreferrer">
								{comment.videoTitle}
							  </a>
							</td>
						  </tr>
						))
					  ))}
					</tbody>
				  </table>
				</div>
				) : (
				<p>No comments found.</p>
				)}
			</section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
