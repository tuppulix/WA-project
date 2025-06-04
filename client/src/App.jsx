// src/App.jsx
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';

import Navbar from './components/Navbar';
import LoginForm from './components/LoginForm';
import HomePage from './pages/HomePage';
import PostPage from './pages/PostPage';
import NewPostPage from './pages/NewPostPage';
import { useUser } from './context/UserContext';

function App() {
  const { loggedIn, loading, loginSuccessful } = useUser(); // Access user context

  // ─── Show loading spinner while checking session ──────────
  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  // ─── Fallback page for invalid routes ─────────────────────
  const DefaultRoute = () => (
    <Container className="mt-5 text-center">
      <h1>404 - Page not found</h1>
      <p>This route does not exist.</p>
      <Link to="/">Go back to home</Link>
    </Container>
  );

  // ─── Main app layout ──────────────────────────────────────
  return (
    <>
      <Navbar />
      <Container className="mt-4">
        <Routes>
          {/* Fallback route for any unknown paths */}
          <Route path="*" element={<DefaultRoute />} />
          {/* Home Page - accessible to everyone */}
          <Route path="/" element={<HomePage />} />
          {/* Login Page - only visible if not logged in */}
          <Route path="/login" element={!loggedIn ? (<LoginForm loginSuccessful={loginSuccessful} />) : (<Navigate to="/" replace />)} />
          <Route path="/posts/:id" element={<PostPage />} />
          {/* New Post - only for authenticated users */}
          <Route path="/new" element={loggedIn ? (<NewPostPage />) : (<Navigate to="/login" replace />)} />
          {/* Single Post View */}
        </Routes>
      </Container>
    </>
  );
}

export default App;
