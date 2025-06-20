import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import API from '../api/api';
import { PencilSquare } from 'react-bootstrap-icons';

// This component renders the page for creating a new forum post.
// It includes a form where the user can enter the post title, content, and optionally set a maximum number of comments.
// On successful creation, the user is redirected to the new post's detail page.
export default function NewPostPage() {
  // State variables for form fields and error handling
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [maxComments, setMaxComments] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Handles form submission for creating a new post
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Trim input values to avoid leading/trailing spaces
    const trimmedTitle = title.trim();
    const trimmedText = text.trim();
    // Parse maxComments as integer, or set to null if empty
    const parsedMax = maxComments.trim() === '' ? null : parseInt(maxComments);

    // Validate input: all fields must be filled, maxComments must be a number if provided
    if (!trimmedTitle || !trimmedText || (maxComments && isNaN(parsedMax))) {
      setError('Please fill in all fields correctly');
      return;
    }

    try {
      // Call API to create the post with the provided data
      const post = await API.createPost({
        title: trimmedTitle,
        text: trimmedText,
        maxComments: parsedMax
      });

      // Redirect to the newly created post's page
      navigate(`/posts/${post.id}`);
    } catch (err) {
      // Show error message if API call fails
      setError(err.message || 'Failed to create post');
    }
  };

  return (
    <>
      {/* Card container for the new post form */}
      <Card className="shadow-sm border-0 p-4" style={{ background: '#f8fbff', borderLeft: '4px solid #4fc3f7' }}>
        {/* Page title with icon */}
        <h3 className="mb-4 text-primary-emphasis d-flex align-items-center">
          <PencilSquare className="me-2" />
          Start a New Discussion
        </h3>

        {/* Error alert if form fails */}
        {error && <Alert variant="danger">{error}</Alert>}

        {/* New post form */}
        <Form onSubmit={handleSubmit}>
          {/* Title input */}
          <Form.Group className="mb-3" controlId="postTitle">
            <Form.Label className="fw-semibold">Post Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. How does async/await work under the hood?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Form.Group>

          {/* Content input */}
          <Form.Group className="mb-3" controlId="postText">
            <Form.Label className="fw-semibold">Post Content</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              placeholder="Explain your issue, question, or idea in detail..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              {/* Optional maximum comments input.
                  If left empty, there will be no limit. Only accepts numbers >= 1. */}
              <Form.Group className="mb-4" controlId="maxComments">
                <Form.Label className="fw-semibold">Maximum Comments (optional)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  placeholder="e.g. 10"
                  value={maxComments}
                  onChange={(e) => setMaxComments(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Submit button */}
          <div className="text-end">
            <Button
              type="submit"
              size="lg"
              variant="info"
              className="fw-bold"
              style={{ color: '#03396c' }}
            >
              Create Post
            </Button>
          </div>
        </Form>
      </Card>

      {/* Button to back to homepage */}
      <div className="mt-3">
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back to HomePage
        </Button>
      </div>
    </>
  );
}
