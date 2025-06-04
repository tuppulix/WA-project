import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Form, Button, Alert, Card, Row, Col } from "react-bootstrap";
import API from "../api/api";
import { useUser } from "../context/UserContext";

function LoginForm() {
  const { loginSuccessful } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isAdmin = params.get("admin") === "true";

  const [email, setEmail] = useState(import.meta.env.DEV ? "marta.rossi@example.com" : "");
  const [password, setPassword] = useState(import.meta.env.DEV ? "sunshine123" : "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await API.login({ email, password, otp, adminLogin: isAdmin });
      loginSuccessful(user);
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.error ||
        err.message ||
        "Login failed";
      setError(msg);
      setPassword("");
      setOtp("");
    }
  };

  const toggleLink = isAdmin ? location.pathname : `${location.pathname}?admin=true`;

  return (
    <Row className="justify-content-center mt-5">
      <Col xs={12} md={6} lg={4}>
        <Card
          className="shadow-lg"
          style={{ background: "linear-gradient(135deg, #a0e9fd, #4fc3f7)", color: "#03396c" }}
        >
          <Card.Header className="text-center" style={{ background: "transparent", borderBottom: "none" }}>
            <h3>{isAdmin ? "🔒 Admin Login" : "👤 User Login"}</h3>
          </Card.Header>
          <Card.Body style={{ background: "transparent" }}>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="loginEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="marta.rossi@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="loginPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              {isAdmin && (
                <Form.Group className="mb-3" controlId="loginOtp">
                  <Form.Label>OTP (2FA)</Form.Label>
                  <Form.Control
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </Form.Group>
              )}

              <Button
                type="submit"
                className="w-100 fw-bold"
                style={{ backgroundColor: "#5bc0eb", borderColor: "#5bc0eb" }}
              >
                {isAdmin ? "Login as Admin" : "Login"}
              </Button>
            </Form>

            <div className="text-center mt-3">
              <Link to={toggleLink} style={{ color: "#03396c", textDecoration: "underline" }}>
                {isAdmin ? "🔓 Standard Login" : "🔒 Login as Admin"}
              </Link>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

export default LoginForm;
