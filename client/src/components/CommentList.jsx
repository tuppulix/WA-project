import React, { useState, useEffect } from 'react';
import { ListGroup, Button, Form } from 'react-bootstrap';
import { StarFill, Star, PencilSquare, Trash } from 'react-bootstrap-icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import API from '../api/api';
import { useUser } from '../context/UserContext';

dayjs.extend(customParseFormat);

const TS_FMT = 'YYYY-MM-DD HH:mm:ss';

// This component displays the list of comments for a post,
// allows users to flag comments as interesting, edit or delete their own comments,
// and lets admins edit or delete any comment.
function CommentList({ comments, refreshComments }) {
  // Get the current user from context
  const { user: currentUser } = useUser();
  // Store the IDs of comments flagged by the user
  const [userFlags, setUserFlags] = useState([]);
  // Local state for comments to allow immediate UI updates
  const [localComments, setLocalComments] = useState(comments);
  // State for editing functionality
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Update local comments when the prop changes
  useEffect(() => setLocalComments(comments), [comments]);
  // Fetch the list of comment IDs flagged by the user
  useEffect(() => {
    API.getUserFlags().then(setUserFlags).catch(() => {});
  }, []);

  // Determine if the current user is an admin
  const isAdmin = currentUser?.is_admin && currentUser?.isAdminAuthenticated;

  // Handle flagging or unflagging a comment as interesting
  const handleFlag = async (c, flagged) => {
    try {
      flagged ? await API.removeFlag(c.id) : await API.addFlag(c.id);
      setUserFlags((prev) =>
        flagged ? prev.filter((id) => id !== c.id) : [...prev, c.id]
      );
      setLocalComments((prev) =>
        prev.map((x) =>
          x.id === c.id
            ? { ...x, interesting_count: x.interesting_count + (flagged ? -1 : 1) }
            : x
        )
      );
      refreshComments?.();
    } catch {}
  };

  // Handle deleting a comment (admin can delete any, users only their own)
  const handleDelete = async (c) => {
    try {
      isAdmin ? await API.adminDeleteComment(c.id) : await API.deleteComment(c.id);
      refreshComments?.();
    } catch {}
  };

  // Handle saving an edited comment
  const handleSave = async (c) => {
    const txt = editText.trim();
    if (!txt) return;
    try {
      isAdmin
        ? await API.adminEditComment(c.id, txt)
        : await API.editComment(c.id, txt);
      setEditingId(null);
      refreshComments?.();
    } catch {}
  };

  return (
    // List of comments
    <ListGroup className="mb-4">
      {localComments.map((c) => {
        // Check if the current user has flagged this comment
        const flagged = userFlags.includes(c.id);
        // User can edit if they are the author or an admin
        const canEdit = currentUser && (c.author_id === currentUser.id || isAdmin);
        // Check if this comment is currently being edited
        const editing = editingId === c.id;

        return (
          <ListGroup.Item key={c.id} className="d-flex flex-column gap-1">
            <div className="d-flex justify-content-between">
              <span className="flex-grow-1">
                <strong>{c.author || 'Anonymous'}:</strong>{' '}
                {editing ? (
                  // Show textarea for editing
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  // Display comment text, preserving line breaks
                  c.text.split('\n').map((l, i) => (
                    <React.Fragment key={i}>
                      {l}
                      <br />
                    </React.Fragment>
                  ))
                )}
              </span>

              <div className="ms-2 d-flex flex-column align-items-end">
                {/* Button to flag/unflag as interesting */}
                <Button
                  variant="light"
                  size="sm"
                  className="border-0 p-0 mb-1"
                  style={{ lineHeight: 0 }}
                  title={flagged ? 'Remove flag' : 'Mark as interesting'}
                  onClick={() => handleFlag(c, flagged)}
                >
                  {flagged ? <StarFill /> : <Star />}
                </Button>

                {/* Edit and delete buttons, shown only if user can edit */}
                {canEdit && (
                  <div className="btn-group">
                    {editing ? (
                      <>
                        {/* Save edited comment */}
                        <Button size="sm" variant="success" onClick={() => handleSave(c)}>
                          Save
                        </Button>
                        {/* Cancel editing */}
                        <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Start editing */}
                        <Button size="sm" variant="outline-primary" onClick={() => {
                          setEditingId(c.id);
                          setEditText(c.text);
                        }}>
                          <PencilSquare />
                        </Button>
                        {/* Delete comment */}
                        <Button size="sm" variant="outline-danger" onClick={() => handleDelete(c)}>
                          <Trash />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Show timestamp and edited status */}
            <small className="text-muted">
              {dayjs(c.timestamp, TS_FMT).format(TS_FMT)}{' '}
              {c.edited && <em>(edited)</em>}
            </small>
          </ListGroup.Item>
        );
      })}
    </ListGroup>
  );
}

export default CommentList;
