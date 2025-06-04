import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  ListGroup,
  Spinner,
  Alert,
  Row,
  Col,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import { ChatDotsFill } from 'react-bootstrap-icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import API from '../api/api';

dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);

export default function HomePage() {
  // State for storing the list of posts and the loading status
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fmt = 'YYYY-MM-DD HH:mm';

  // Fetch all posts and their comment counts when the component mounts
  useEffect(() => {
    const loadAll = async () => {
      try {
        // Retrieve all posts from the backend API
        const data = await API.getAllPosts();

        // For each post, also fetch the number of comments associated with it
        const combined = await Promise.all(
          data.map(async p => {
            const { count } = await API.getCommentCount(p.id);
            return { ...p, commentCount: count };
          })
        );

        // Sort posts by timestamp, showing the most recent first
        combined.sort((a, b) =>
          dayjs(b.timestamp, fmt).valueOf() - dayjs(a.timestamp, fmt).valueOf()
        );

        setPosts(combined);
      } catch (err) {
        // Store error message in state
        setError(err.message || 'Unable to fetch posts');
      } finally {
        // Hide the loading spinner once fetching is complete
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  return (
    <Container className="mt-4">
      {/* Page title */}
      <h2 className="mb-4 text-primary-emphasis fw-bold">Forum Topics</h2>

      {/* Error alert */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* List of all forum posts */}
      <ListGroup variant="flush">
        {posts.map(post => {
          // Check if the post has reached its maximum allowed number of comments
          const isFull = post.max_comments && post.commentCount >= post.max_comments;
          // Prepare the text to display next to the comment icon
          const commentText = post.max_comments
            ? `${post.commentCount} of ${post.max_comments}`
            : `${post.commentCount}`;

          return (
            // Each post is a clickable ListGroup item that links to the post's detail page
            <ListGroup.Item
              key={post.id}
              as={Link}
              to={`/posts/${post.id}`}
              action
              className="mb-3 rounded shadow-sm"
              style={{
                background: '#f0f8ff',
                // The border color indicates if the post is full (red) or open (green)
                borderLeft: `5px solid ${isFull ? '#dc3545' : '#198754'}`,
                padding: '1rem'
              }}
            >
              <Row>
                {/* Left column: post title and author information */}
                <Col xs={12} md={8}>
                  <h5 className="mb-1 text-dark">{post.title}</h5>
                  <small className="text-muted">
                    By <strong>{post.author || 'Anonymous'}</strong> •{' '}
                    {dayjs(post.timestamp).format(fmt)}
                  </small>
                </Col>

                {/* Right column: comment icon and comment count, with tooltip */}
                <Col xs={12} md={4} className="text-md-end mt-2 mt-md-0">
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip>
                        {post.max_comments
                          ? `${post.commentCount} of ${post.max_comments} comments used`
                          : `${post.commentCount} comments`}
                      </Tooltip>
                    }
                  >
                    <span
                      className="d-inline-flex align-items-center gap-1 fw-semibold"
                      style={{
                        color: isFull ? '#dc3545' : '#198754',
                        fontSize: '0.95rem'
                      }}
                    >
                      <ChatDotsFill /> {commentText}
                    </span>
                  </OverlayTrigger>
                </Col>
              </Row>
            </ListGroup.Item>
          );
        })}
      </ListGroup>

      {/* Show a loading spinner while posts are being fetched */}
      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" role="status" />
        </div>
      )}

      {/* Display a message if there are no posts available */}
      {!loading && posts.length === 0 && (
        <p className="text-center text-muted mt-4">No posts available yet.</p>
      )}
    </Container>
  );
}
