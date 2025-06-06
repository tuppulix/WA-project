import React, { useState, useEffect } from 'react';
import { ListGroup, Button, Form } from 'react-bootstrap';
import { StarFill, Star, PencilSquare, Trash } from 'react-bootstrap-icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import API from '../api/api';
import { useUser } from '../context/UserContext';

dayjs.extend(customParseFormat);
const TS_FMT = 'YYYY-MM-DD HH:mm:ss';

function CommentList({ comments, refreshComments }) {
  /* ───────────────────────── state/context ───────────────────────── */
  const { user: currentUser } = useUser();

  const [userFlags, setUserFlags] = useState([]);
  const [localComms, setLocalComms] = useState(comments);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  /* ───────────────────────── effects ───────────────────────── */
  useEffect(() => setLocalComms(comments), [comments]);

  useEffect(() => {
    if (currentUser)
      API.getUserFlags().then(setUserFlags).catch(() => { });
  }, [currentUser]);

  const isAdmin = currentUser?.is_admin && currentUser?.isAdminAuthenticated;

  /* ───────────────────────── handlers ───────────────────────── */
  const toggleFlag = async (c, flagged) => {
    try {
      flagged ? await API.removeFlag(c.id) : await API.addFlag(c.id);
      setUserFlags(prev =>
        flagged ? prev.filter(id => id !== c.id) : [...prev, c.id]
      );
      setLocalComms(prev =>
        prev.map(x =>
          x.id === c.id
            ? { ...x, interesting_count: x.interesting_count + (flagged ? -1 : 1) }
            : x
        )
      );
      refreshComments?.();
    } catch {/* ignore */ }
  };

  const handleDelete = async (c) => {
    try {
      isAdmin
        ? await API.adminDeleteComment(c.id)
        : await API.deleteComment(c.id);
      refreshComments?.();
    } catch {/* ignore */ }
  };

  const handleSave = async (c) => {
    const txt = editText.trim();
    if (!txt) return;
    try {
      isAdmin
        ? await API.adminEditComment(c.id, txt)
        : await API.editComment(c.id, txt);
      setEditingId(null);
      refreshComments?.();
    } catch {/* ignore */ }
  };

  /* ───────────────────────── render ───────────────────────── */
  return (
    <ListGroup className="mb-4">
      {localComms.map(c => {
        const flagged = userFlags.includes(c.id);
        const canEdit = currentUser && (c.author_id === currentUser.id || isAdmin);
        const editing = editingId === c.id;

        return (
          <ListGroup.Item key={c.id} className="d-flex flex-column gap-1">
            {/* ---------- main row ---------- */}
            <div className="d-flex justify-content-between">
              {/* Author and text */}
              <span className="flex-grow-1">
                <strong>{c.author || 'Anonymous'}:</strong>{' '}
                {editing ? (
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className="mt-1"
                    autoFocus
                  />
                ) : (
                  c.text.split('\n').map((l, i) => (
                    <React.Fragment key={i}>
                      {l}<br />
                    </React.Fragment>
                  ))
                )}
              </span>

              {/* Action icons */}
              <div className="ms-2 d-flex flex-column align-items-end">
                {/* Flag icon + count */}
                <div className="d-flex align-items-center gap-1 mb-1">
                  {currentUser ? (
                    <Button
                      variant="light"
                      size="sm"
                      className="border-0 p-0"
                      style={{ lineHeight: 0 }}
                      title={flagged ? 'Remove flag' : 'Mark as interesting'}
                      onClick={() => toggleFlag(c, flagged)}
                    >
                      {flagged ? <StarFill className="text-warning" /> : <Star className="text-secondary" />}
                    </Button>
                  ) : (
                    <span title="Only logged-in users can mark comments">
                      <Star className="text-muted" />
                    </span>
                  )}
                  <span className="text-muted small">{c.interesting_count}</span>
                </div>


                {/* edit / delete */}
                {canEdit ? (
                  <div className="btn-group">
                    {editing ? (
                      <>
                        <Button size="sm" variant="success" onClick={() => handleSave(c)}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => { setEditingId(null); setEditText(''); }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => { setEditingId(c.id); setEditText(c.text); }}
                        >
                          <PencilSquare />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(c)}
                        >
                          <Trash />
                        </Button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {/* timestamp + edited label */}
            <small className="text-muted">
              {dayjs(c.timestamp, TS_FMT).format(TS_FMT)}{' '}
              {c.edited ? <em>(edited)</em> : null}
            </small>
          </ListGroup.Item>
        );
      })}
    </ListGroup>
  );
}

export default CommentList;