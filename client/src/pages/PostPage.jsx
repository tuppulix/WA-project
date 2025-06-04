import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import API from '../api/api';
import PostDetail from '../components/PostDetail';
import CommentList from '../components/CommentList';
import CommentForm from '../components/CommentForm';
import { useUser } from '../context/UserContext';

export default function PostPage() {
  // Get the post ID from the URL parameters
  const { id } = useParams();
  const navigate = useNavigate();
  // Get the current user from context
  const { user: currentUser } = useUser();

  // State variables for post data, comments, loading, and error handling
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  // Fetch all comments for this post
  const loadComments = useCallback(() => {
    return API.getCommentsForPost(id)
      .then(setComments)
      .catch(() => setError('Could not load comments.'));
  }, [id]);

  // Fetch the current comment count for this post
  const loadCommentCount = useCallback(() => {
    return API.getCommentCount(id)
      .then(data => setCommentCount(data.count))
      .catch(() => setError('Could not load comment count.'));
  }, [id]);

  // Load post details, comments, and comment count when the component mounts or dependencies change
  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setNotFound(false);
    setError('');

    // Fetch post details by ID
    API.getPostById(id)
      .then(p => {
        if (!isActive) return;
        setPost(p);
        // If user is logged in, load comments; always load comment count
        return Promise.all([
          loadComments(),      // sempre carica i commenti, anche per anonimi
          loadCommentCount()
        ]);
      })
      .catch(err => {
        if (!isActive) return;
        // If post not found, set notFound to true for redirect
        if (err.message.includes('404')) setNotFound(true);
        else setError('Could not load the post.');
      })
      .finally(() => isActive && setLoading(false));

    // Cleanup function to avoid setting state on unmounted component
    return () => { isActive = false; };
  }, [id, loadComments, loadCommentCount, currentUser]);

  // Show a loading spinner while fetching data
  if (loading)
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
      </Container>
    );

  // Redirect to 404 page if post not found
  if (notFound) return <Navigate to="/404" replace />;

  return (
    <Container className="mt-4">
      {/* Show error message if any error occurs */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Show post details and handle post deletion */}
      <PostDetail post={post} onPostDeleted={() => navigate('/')} />

      {/* Show comment count and max comments if set */}
      <h5 className="mt-4">
        Comments ({commentCount}
        {post.max_comments != null && ` / ${post.max_comments}`})
      </h5>

      {/* If user is not logged in, show a message but allow adding a comment */}
      {!currentUser && (
        <Alert variant="info" className="mb-3">
          You must <strong>log in</strong> to view author comments. But you can still add one!
        </Alert>

      )}

      {/* If user is logged in, show the list of comments */}
      {comments.length > 0 && (
        <CommentList
          postId={id}
          comments={comments}
          refreshComments={() => {
            loadComments();
            loadCommentCount();
          }}
        />
      )}


      {/* Show the comment form for adding a new comment */}
      <CommentForm
        postId={id}
        onCommentAdded={(newList) => {
          // If the API returns a new list of comments, update state
          if (Array.isArray(newList) && newList.every(c => typeof c === 'object')) {
            setComments(newList);
          }
          // Always refresh the comment count
          loadCommentCount();
        }}
        maxComments={post.max_comments}
        currentCount={commentCount}
      />
    </Container>
  );
}
