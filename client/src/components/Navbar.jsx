// src/components/Navbar.jsx
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { ChatDots, PersonCircle } from 'react-bootstrap-icons';
import { useUser } from '../context/UserContext';


function NavbarComponent({}) {
  const navigate = useNavigate();
  const { user, handleLogout } = useUser(); // Access user context
  // Inline style definitions for reusability and clarity
  const styles = {
    navbar: {
      background: 'linear-gradient(90deg, #002B5B, #1A5276)', // forum-style blue gradient
    },
    logo: {
      color: '#a0e9fd',         // light cyan
      fontWeight: '700',
      fontSize: '1.7rem',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    navLink: {
      color: '#ccefff',
      fontWeight: '500',
      marginLeft: '1rem',
      textDecoration: 'none',
    },
    button: {
      color: '#1B263B',              // dark gray text
      backgroundColor: '#a0e9fd',    // cyan bg
      border: 'none',
      fontWeight: '600',
      padding: '6px 14px',
      borderRadius: '8px',
    },
    userText: {
      color: '#a0e9fd',
      fontSize: '0.95rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
  };

  return (
    <Navbar expand="lg" style={styles.navbar} className="shadow-sm py-2">
      <Container className="d-flex justify-content-between align-items-center">
        {/* ─────────────────────── */}
        {/* Left: Logo + Navigation */}
        {/* ─────────────────────── */}
        <div className="d-flex align-items-center gap-4">
          {/* Brand with icon */}
          <Link to="/" style={styles.logo}>
            <ChatDots size={24} />
            PropSwap
          </Link>

          {/* Navigation links */}
          <Nav className="d-flex align-items-center">
            <Nav.Link as={Link} to="/" style={styles.navLink}>
              Home
            </Nav.Link>

            {/* Show New Post only if logged in */}
            {user && (
              <Button
                style={styles.button}
                onClick={() => navigate('/new')}
                className="ms-2"
              >
                ➕ New Post
              </Button>
            )}
          </Nav>
        </div>

        {/* ─────────────────────── */}
        {/* Right: User Info / Auth */}
        {/* ─────────────────────── */}
        <div className="d-flex align-items-center gap-3">
          {user ? (
            <>
              {/* Logged-in user display */}
              <div className="d-flex align-items-center gap-2 bg-dark px-3 py-1 rounded-3">
                {/* Icon + name */}
                <PersonCircle size={20} color="#a0e9fd" />
                <div className="d-flex flex-column">
                  <span style={{ color: '#a0e9fd', fontSize: '0.95rem' }}>
                    <strong>{user.name}</strong>
                  </span>

                  {/* Admin badge shown only if authenticated as admin */}
                  {user.is_admin && user.isAdminAuthenticated && (
                    <Badge
                      bg="warning"
                      text="dark"
                      className="mt-1"
                      style={{ fontSize: '0.7rem', width: 'fit-content' }}
                    >
                      Admin
                    </Badge>
                  )}
                </div>
              </div>

              {/* Logout button */}
              <Button style={styles.button} onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            // Not logged in → show login button
            <Link to="/login">
              <Button style={styles.button}>Login</Button>
            </Link>
          )}
        </div>
      </Container>
    </Navbar>
  );
}

export default NavbarComponent;
