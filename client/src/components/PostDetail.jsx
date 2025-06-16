import { useState } from 'react';
import { Card, Button, Alert, Modal } from 'react-bootstrap';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import API from '../api/api';
import { useUser } from '../context/UserContext';

dayjs.extend(customParseFormat);
const TS_FMT = 'YYYY-MM-DD HH:mm:ss';

export default function PostDetail({ post, onPostDeleted }) {
  const { user: currentUser } = useUser(); // Access current user from context

  const [error, setError] = useState('');             // Error message for deletion
  const [showConfirm, setShowConfirm] = useState(false); // Modal visibility state

  // Check if user can delete this post (author or authenticated admin)
  const isAuthor      = currentUser && post.author_id === currentUser.id;
  const isAuthAdmin   = Boolean(currentUser?.is_admin) && Boolean(currentUser?.isAdminAuthenticated);
  const canDelete     = isAuthor || isAuthAdmin;

  const confirmDelete = () => setShowConfirm(true);    // Show confirmation modal
  const cancelDelete = () => setShowConfirm(false);    // Hide confirmation modal

  // Handle post deletion
  const handleDelete = async () => {
    setError('');
    try {
      if (currentUser?.is_admin && currentUser?.isAdminAuthenticated) {
        await API.adminDeletePost(post.id); // Admin deletes post
      } else {
        await API.deletePost(post.id);      // Author deletes own post
      }
      setShowConfirm(false);
      onPostDeleted?.(); // Trigger callback (e.g., navigate to home)
    } catch (err) {
      setError(err.message || 'Failed to delete post');
      setShowConfirm(false);
    }
  };

  // If no post is loaded, render nothing
  if (!post) return null;

  return (
    <>
      <Card className="mb-4">
        <Card.Body>
          {/* Post title */}
          <Card.Title>{post.title}</Card.Title>

          {/* Author and timestamp */}
          <Card.Subtitle className="mb-2 text-muted">
            by {post.author || 'Anonymous'} &middot; {dayjs(post.timestamp, TS_FMT).format(TS_FMT)}
            {post.edited && <em className="text-muted ms-2">(edited)</em>}
          </Card.Subtitle>

          {/* Post text with line breaks */}
          <Card.Text>
            {post.text.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </Card.Text>

          {/* Show any deletion error */}
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

          {/* Show delete button only if user is allowed */}
          {canDelete && (
            <Button variant="danger" className="mt-2" onClick={confirmDelete}>
              Delete Post
            </Button>
          )}
        </Card.Body>
      </Card>

      {/* Confirmation Modal */}
      <Modal show={showConfirm} onHide={cancelDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this post? All associated comments will be removed.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

