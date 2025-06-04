import { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import API from '../api/api';

function CommentForm({ postId, onCommentAdded, maxComments, currentCount }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    if (maxComments != null && currentCount >= maxComments) {
      setError('Comment limit reached for this post.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await API.addComment(postId, trimmed);
      try {
        const updated = await API.getCommentsForPost(postId);
        onCommentAdded(updated);
      } catch {
        const { count } = await API.getCommentCount(postId);
        onCommentAdded((prev) => {
          const dummy = [...prev];
          dummy.length = count;
          return dummy;
        });
      }
      setText('');
    } catch (err) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const limitReached = maxComments != null && currentCount >= maxComments;

  return (
    <Card className="p-3 mt-4 shadow-sm border-0" style={{ backgroundColor: '#f7fbff' }}>
      <Form onSubmit={handleSubmit}>
        {error && <Alert variant="danger">{error}</Alert>}
        {limitReached && (
          <Alert variant="warning" className="py-1">
            ⚠️ You cannot add more comments to this post.
          </Alert>
        )}

        <Form.Group controlId="commentText">
          <Form.Control
            as="textarea"
            rows={4}
            maxLength={1000}
            placeholder="💬 Share your thoughts..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={submitting || limitReached}
            className="rounded-3"
            style={{ resize: 'none', backgroundColor: '#fff' }}
          />
        </Form.Group>

        <div className="d-flex justify-content-end mt-2">
          <Button
            type="submit"
            variant="info"
            className="fw-bold px-4"
            disabled={submitting || !text.trim() || limitReached}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </Form>
    </Card>
  );
}

export default CommentForm;
