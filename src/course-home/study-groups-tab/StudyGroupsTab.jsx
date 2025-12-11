import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { 
  Badge, 
  Container, 
  ProgressBar, 
  Row, 
  Col, 
  Button,
  ModalDialog,
  Form,
  FormGroup,
  FormControl,
  Alert,
  Dropdown,
  DropdownButton,
  DropdownItem,
  Spinner,
  ActionRow,
} from '@openedx/paragon';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useModel } from '../../generic/model-store';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { logError, logInfo } from '@edx/frontend-platform/logging';
import StreakCalendar from '../welcome-tab/StreakCalendar';
import GroupStreaks from '../welcome-tab/GroupStreaks';
import StudyTip from '../welcome-tab/StudyTip';
import ReferralWidget from '../welcome-tab/ReferralWidget';
import { fetchWelcomeTab, fetchStudyGroupsTab } from '../data';
import {
  createStudyGroup,
  updateStudyGroup,
  deleteStudyGroup,
  addStudyGroupMember,
  removeStudyGroupMember,
  getAvailableMembers,
  getStudyGroupMembers,
  getStudyGroupComments,
  createComment,
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
  uploadCommentAttachment,
} from '../data/api';

import './StudyGroupsTab.scss';

const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'haha', emoji: '😂', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😠', label: 'Angry' },
];

const getAvatarColor = (id) => {
  const num = (id || 1) * 2654435761; // Knuth multiplicative
  return `#${(num >>> 0).toString(16).padStart(6, '0').slice(0, 6)}`;
};

const getInitials = (text) => (text ? text.substring(0, 2).toUpperCase() : 'U');

// Create Group Modal
const CreateGroupModal = ({ isOpen, onClose, courseId, onSuccess, onGroupCreated }) => {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    logInfo('Creating study group', { courseId, formData });
    
    try {
      const result = await createStudyGroup(courseId, formData);
      logInfo('Study group created successfully', { groupId: result.id, courseId, result });
      
      // Add group to list immediately (optimistic update)
      if (onGroupCreated && result) {
        onGroupCreated(result);
      }
      
      setFormData({ name: '', description: '' });
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Có lỗi xảy ra khi tạo nhóm';
      logError('Failed to create study group', {
        courseId,
        formData,
        error: err.response?.data,
        status: err.response?.status,
        message: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo nhóm học tập mới"
      size="md"
      hasCloseButton
      isFullscreenOnMobile
    >
      <ModalDialog.Header>
        <ModalDialog.Title>Tạo nhóm học tập mới</ModalDialog.Title>
      </ModalDialog.Header>
      <ModalDialog.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">{error}</Alert>}
        <Form id="create-group-form" onSubmit={handleSubmit}>
          <FormGroup>
            <FormControl
              type="text"
              placeholder="Tên nhóm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup>
            <FormControl
              as="textarea"
              rows={4}
              placeholder="Mô tả nhóm"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </FormGroup>
        </Form>
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <ActionRow>
          <ModalDialog.CloseButton variant="tertiary" onClick={onClose}>
            Hủy
          </ModalDialog.CloseButton>
          <Button
            type="submit"
            form="create-group-form"
            variant="primary"
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Tạo nhóm
          </Button>
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

// Edit Group Modal
const EditGroupModal = ({ isOpen, onClose, group, onSuccess, onGroupUpdated }) => {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form data when group changes or modal opens
  useEffect(() => {
    if (group && isOpen) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
      });
      setError(null);
    }
  }, [group, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    logInfo('Updating study group', { groupId: group.id, formData });
    
    // Optimistic update
    if (onGroupUpdated) {
      onGroupUpdated(group.id, formData);
    }
    
    try {
      const result = await updateStudyGroup(group.id, formData);
      logInfo('Study group updated successfully', { groupId: group.id, result });
      
      // Update with server response
      if (onGroupUpdated && result) {
        onGroupUpdated(group.id, {
          name: result.name,
          description: result.description,
          updatedAt: result.updatedAt,
        });
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Có lỗi xảy ra khi cập nhật nhóm';
      logError('Failed to update study group', {
        groupId: group.id,
        formData,
        error: err.response?.data,
        status: err.response?.status,
        message: errorMessage,
      });
      setError(errorMessage);
      
      // Revert optimistic update on error
      if (onGroupUpdated && group) {
        onGroupUpdated(group.id, {
          name: group.name,
          description: group.description,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!group) return null;

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa nhóm học tập"
      size="md"
      hasCloseButton
      isFullscreenOnMobile
    >
      <ModalDialog.Header>
        <ModalDialog.Title>Chỉnh sửa nhóm học tập</ModalDialog.Title>
      </ModalDialog.Header>
      <ModalDialog.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">{error}</Alert>}
        <Form id="edit-group-form" onSubmit={handleSubmit}>
          <FormGroup>
            <FormControl
              type="text"
              placeholder="Tên nhóm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup>
            <FormControl
              as="textarea"
              rows={4}
              placeholder="Mô tả nhóm"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </FormGroup>
        </Form>
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <ActionRow>
          <ModalDialog.CloseButton variant="tertiary" onClick={onClose}>
            Hủy
          </ModalDialog.CloseButton>
          <Button
            type="submit"
            form="edit-group-form"
            variant="primary"
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Lưu thay đổi
          </Button>
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

// Add Member Modal with search + pagination
const AddMemberModal = ({ isOpen, onClose, groupId, onSuccess }) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [error, setError] = useState(null);
  const searchTimerRef = useRef(null);
  const pageRef = useRef(1);
  const lastSearchRef = useRef('');

  const loadUsers = useCallback(async ({ reset = false, searchTerm } = {}) => {
    const activeSearch = searchTerm !== undefined ? searchTerm : lastSearchRef.current;
    const nextPage = reset ? 1 : pageRef.current;

    if (reset) {
      pageRef.current = 1;
      setUsers([]);
      setHasMore(false);
    }

    setLoadingList(true);
    setError(null);
    try {
      const data = await getAvailableMembers(groupId, { search: activeSearch, page: nextPage, pageSize: 5 });
      const newResults = data.results || [];
      setUsers((prev) => (reset ? newResults : [...prev, ...newResults]));
      setHasMore(Boolean(data.next));
      pageRef.current = nextPage + 1;
      lastSearchRef.current = activeSearch;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Có lỗi khi tải danh sách người dùng';
      setError(msg);
      logError('Failed to load available members', {
        groupId,
        search: activeSearch,
        page: nextPage,
        error: err.response?.data,
        status: err.response?.status,
        message: err.message,
      });
    } finally {
      setLoadingList(false);
    }
  }, [groupId]);

  // Load when open
  useEffect(() => {
    if (isOpen) {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      setUsers([]);
      setSearch('');
      pageRef.current = 1;
      setHasMore(false);
      lastSearchRef.current = '';
      loadUsers({ reset: true, searchTerm: '' });
    } else if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Search change
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    // reload after small delay to debounce
    searchTimerRef.current = setTimeout(() => loadUsers({ reset: true, searchTerm: val }), 150);
  };

  const handleAddUser = async (usernameOrEmail) => {
    setLoadingAdd(true);
    setError(null);
    try {
      const result = await addStudyGroupMember(groupId, usernameOrEmail);
      logInfo('Member added successfully', { groupId, usernameOrEmail, result });
      
      // Ensure the member data is properly formatted
      // Backend may return user as collapsed reference (just username) or expanded (full user object)
      const formattedMember = {
        id: result.id,
        user_id: result.user_id || result.userId || result.user?.id,
        user: result.user || (typeof result.user === 'string' ? { username: result.user } : null),
        role: result.role || 'member',
        joinedAt: result.joinedAt || result.joined_at || new Date().toISOString(),
      };
      
      // If user is just a string (username), try to get full user info from the users list
      if (typeof formattedMember.user === 'string' || !formattedMember.user) {
        const foundUser = users.find(u => u.username === usernameOrEmail || u.email === usernameOrEmail);
        if (foundUser) {
          formattedMember.user = {
            id: foundUser.id,
            username: foundUser.username,
            email: foundUser.email,
            fullName: foundUser.full_name || foundUser.fullName,
          };
        } else if (typeof formattedMember.user === 'string') {
          // Fallback: create minimal user object from username
          formattedMember.user = {
            username: formattedMember.user,
          };
        }
      }
      
      // Pass the formatted member to onSuccess callback
      if (onSuccess) {
        onSuccess(formattedMember);
      }
      
      // refresh list to remove added user
      setUsers([]);
      setHasMore(false);
      pageRef.current = 1;
      loadUsers({ reset: true, searchTerm: lastSearchRef.current });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Có lỗi xảy ra khi thêm thành viên';
      setError(msg);
      logError('Failed to add member', {
        groupId,
        usernameOrEmail,
        error: err.response?.data,
        status: err.response?.status,
        message: msg,
      });
    } finally {
      setLoadingAdd(false);
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm thành viên"
      size="md"
      hasCloseButton
      isFullscreenOnMobile
    >
      <ModalDialog.Header>
        <ModalDialog.Title>Thêm thành viên</ModalDialog.Title>
      </ModalDialog.Header>
      <ModalDialog.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">{error}</Alert>}
        <FormGroup>
          <FormControl
            type="text"
            placeholder="Tìm theo username hoặc email"
            value={search}
            onChange={handleSearchChange}
          />
        </FormGroup>

        <div className="available-users-list">
          {users.map((user) => (
            <div key={user.id} className="available-user-row">
              <div className="member-info">
                <div className="member-avatar" style={{ background: getAvatarColor(user.id) }}>
                  {getInitials(user.username)}
                </div>
                <div>
                  <div className="member-name">{user.username}</div>
                  <div className="member-sub">{user.fullName || user.email || ''}</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => handleAddUser(user.username)}
                disabled={loadingAdd}
                className="icon-pill"
              >
                +
              </Button>
            </div>
          ))}

          {loadingList && (
            <div className="text-center py-2">
              <Spinner animation="border" size="sm" />
            </div>
          )}

          {!loadingList && users.length === 0 && (
            <div className="text-center py-2 text-muted">Không có người dùng phù hợp</div>
          )}

          {hasMore && (
            <div className="text-center">
              <Button size="sm" variant="outline-secondary" onClick={() => loadUsers(false)} disabled={loadingList}>
                Tải thêm
              </Button>
            </div>
          )}
        </div>
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <ActionRow>
          <ModalDialog.CloseButton variant="tertiary" onClick={onClose}>
            Hủy
          </ModalDialog.CloseButton>
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

// Reaction Picker
const ReactionPicker = ({ comment, onReactionChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const currentUser = getAuthenticatedUser();
  const userReaction = comment.userReaction;

  const handleReaction = async (reactionType) => {
    logInfo('Handling reaction', { commentId: comment.id, reactionType, currentReaction: userReaction });
    
    // Optimistic update: update UI immediately
    const isRemoving = userReaction === reactionType;
    const newReactionType = isRemoving ? null : reactionType;
    
    // Calculate new reaction counts optimistically
    const newReactionCounts = { ...comment.reactionCounts };
    if (isRemoving) {
      // Removing reaction
      if (userReaction) {
        newReactionCounts[userReaction] = Math.max(0, (newReactionCounts[userReaction] || 0) - 1);
      }
    } else {
      // Adding/changing reaction
      const oldReaction = userReaction;
      if (oldReaction && oldReaction !== reactionType) {
        newReactionCounts[oldReaction] = Math.max(0, (newReactionCounts[oldReaction] || 0) - 1);
      }
      newReactionCounts[reactionType] = (newReactionCounts[reactionType] || 0) + 1;
    }
    
    // Update UI immediately
    onReactionChange(comment.id, newReactionType, newReactionCounts);
    setShowPicker(false);
    
    try {
      if (isRemoving) {
        // Remove reaction
        logInfo('Removing reaction', { commentId: comment.id, reactionType });
        await removeReaction(comment.id);
        logInfo('Reaction removed successfully', { commentId: comment.id });
      } else {
        // Add or change reaction
        logInfo('Adding/changing reaction', { commentId: comment.id, reactionType });
        const result = await addReaction(comment.id, reactionType);
        logInfo('Reaction added/changed successfully', { commentId: comment.id, result });
        
        // Update with server response if available
        if (result && result.reactionCounts) {
          onReactionChange(comment.id, reactionType, result.reactionCounts);
        }
      }
    } catch (err) {
      logError('Failed to handle reaction', {
        commentId: comment.id,
        reactionType,
        error: err.response?.data,
        status: err.response?.status,
        message: err.message,
      });
      
      // Revert optimistic update on error
      onReactionChange(comment.id, userReaction, comment.reactionCounts);
    }
  };

  return (
    <div className="reaction-picker-wrapper">
      <button 
        className="reaction-btn" 
        onClick={() => setShowPicker(!showPicker)}
        title="Thả reaction"
      >
        {userReaction ? (
          <>
            <span>{REACTION_TYPES.find(r => r.type === userReaction)?.emoji}</span>
            <span>Đã {REACTION_TYPES.find(r => r.type === userReaction)?.label}</span>
          </>
        ) : (
          <>
            <span>👍</span>
            <span>Thả reaction</span>
          </>
        )}
      </button>
      {showPicker && (
        <div className="reaction-picker">
          {REACTION_TYPES.map((reaction) => (
            <button
              key={reaction.type}
              className={`reaction-option ${userReaction === reaction.type ? 'active' : ''}`}
              onClick={() => handleReaction(reaction.type)}
              title={reaction.label}
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Comment Card Component
const CommentCard = ({ comment, group, onReactionChange, onCommentUpdate, onCommentDelete, currentUserId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [localComment, setLocalComment] = useState(comment);

  // Update local comment when prop changes
  useEffect(() => {
    setLocalComment(comment);
  }, [comment]);

  const canEdit = localComment.canEdit !== false || localComment.user?.id === currentUserId;
  const canDelete = localComment.canDelete !== false || localComment.user?.id === currentUserId;

  const handleUpdate = async () => {
    setLoading(true);
    logInfo('Updating comment', { commentId: localComment.id, content: editContent });
    
    // Optimistic update
    const oldContent = localComment.content;
    setLocalComment((prev) => ({ ...prev, content: editContent }));
    setIsEditing(false);
    
    try {
      const result = await updateComment(localComment.id, editContent);
      logInfo('Comment updated successfully', { commentId: localComment.id, result });
      
      // Update with server response
      const updatedData = {
        content: result.content || editContent,
        updatedAt: result.updatedAt || new Date().toISOString(),
      };
      onCommentUpdate(localComment.id, updatedData);
    } catch (err) {
      logError('Failed to update comment', {
        commentId: localComment.id,
        error: err.response?.data,
        status: err.response?.status,
        message: err.message,
      });
      
      // Revert on error
      setLocalComment((prev) => ({ ...prev, content: oldContent }));
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa bình luận này?')) {
      setLoading(true);
      
      // Ensure we have a valid ID
      const commentId = localComment.id || localComment.Id || localComment.ID;
      if (!commentId) {
        logError('Cannot delete comment: no ID found', { localComment });
        alert('Không thể xóa bình luận: Không tìm thấy ID. Vui lòng refresh trang.');
        setLoading(false);
        return;
      }
      
      logInfo('Deleting comment', { commentId });
      
      // Optimistic update: remove from UI immediately
      onCommentDelete(commentId);
      
      try {
        await deleteComment(commentId);
        logInfo('Comment deleted successfully', { commentId });
      } catch (err) {
        logError('Failed to delete comment', {
          commentId,
          error: err.response?.data,
          status: err.response?.status,
          message: err.message,
        });
        
        // Revert on error - show error message
        alert('Không thể xóa bình luận. Vui lòng thử lại.');
        // Note: Comment is already removed from UI optimistically
        // In a production app, you might want to reload comments here
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Vừa xong';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Vừa xong';

    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const fallbackUser = localComment.user || (localComment.createdBy ? { username: localComment.createdBy } : null);
  const displayUsername = fallbackUser?.username || 'Người dùng đã xóa';
  const userInitials = displayUsername.substring(0, 2).toUpperCase();
  const userColor = `#${(fallbackUser?.id || 0).toString(16).padStart(6, '0').substring(0, 6)}`;

  return (
    <div className="feed-post">
      <div className="post-header">
        <div className="user-avatar" style={{ background: userColor }}>{userInitials}</div>
        <div className="post-author-info">
          <div className="post-author-name">
            {localComment.user?.username || 'Người dùng đã xóa'}
            {localComment.user?.id === currentUserId && ' (Bạn)'}
          </div>
          <div className="post-time">{formatDate(localComment.createdAt)} • 👥 Nhóm</div>
        </div>
        {(canEdit || canDelete) && (
          <div className="comment-menu-inline">
            {canEdit && (
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => setIsEditing(true)}
                disabled={loading}
              >
                <span className="fa fa-edit me-1" aria-hidden="true" /> Sửa
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="outline-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                <span className="fa fa-trash me-1" aria-hidden="true" /> Xóa
              </Button>
            )}
          </div>
        )}
      </div>
      
      {isEditing ? (
        <div className="edit-comment-form">
          <FormControl
            as="textarea"
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={loading}
          />
          <div className="d-flex gap-2 mt-2">
            <Button size="sm" onClick={handleUpdate} disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
              Lưu
            </Button>
            <Button size="sm" variant="secondary" onClick={() => {
              setIsEditing(false);
              setEditContent(localComment.content);
            }} disabled={loading}>
              Hủy
            </Button>
          </div>
        </div>
      ) : (
        <div className="post-content">{localComment.content}</div>
      )}

      {localComment.attachments && localComment.attachments.length > 0 && (
        <div className="post-attachments">
          {localComment.attachments.map((attachment) => {
            // Ensure attachment has proper format
            const att = {
              id: attachment.id,
              fileName: attachment.fileName || attachment.file_name || 'Unknown file',
              fileUrl: attachment.fileUrl || attachment.file_url || attachment.url,
              fileType: attachment.fileType || attachment.file_type || 'document',
            };
            
            // Only show image if we have a valid URL
            if (att.fileType === 'image' && att.fileUrl) {
              return (
                <div key={att.id || attachment.id} className="attachment-image-container">
                  <img
                    src={att.fileUrl}
                    alt={att.fileName}
                    className="attachment-image"
                    onClick={() => window.open(att.fileUrl, '_blank')}
                    onError={(e) => {
                      // If image fails to load, show as regular file link
                      logError('Image failed to load', { attachment: att, error: e });
                      e.target.style.display = 'none';
                    }}
                  />
                  <a
                    href={att.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="attachment-link"
                  >
                    {att.fileName}
                  </a>
                </div>
              );
            }
            
            // Show as file link (for documents or images without URL yet)
            return (
              <a
                key={att.id || attachment.id}
                href={att.fileUrl || '#'}
                target={att.fileUrl ? '_blank' : undefined}
                rel={att.fileUrl ? 'noopener noreferrer' : undefined}
                className="attachment-link"
                onClick={!att.fileUrl ? (e) => { e.preventDefault(); } : undefined}
                style={!att.fileUrl ? { cursor: 'default', opacity: 0.7 } : {}}
              >
                📎 {att.fileName}
                {!att.fileUrl && ' (Đang xử lý...)'}
              </a>
            );
          })}
        </div>
      )}

      <div className="post-reactions">
        <ReactionPicker comment={localComment} onReactionChange={onReactionChange} />
        {/* Display all reaction types with counts */}
        {localComment.reactionCounts && Object.keys(localComment.reactionCounts).length > 0 && (
          <div className="reaction-counts">
            {REACTION_TYPES.map((reaction) => {
              const count = localComment.reactionCounts[reaction.type] || 0;
              if (count > 0) {
                return (
                  <span key={reaction.type} className="reaction-count-badge" title={reaction.label}>
                    {reaction.emoji} {count}
                  </span>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Group Card Component
const getInitialCommentCount = (group) =>
  group?.commentCount ??
  group?.commentsCount ??
  group?.comments_count ??
  group?.comment_count ??
  (Array.isArray(group?.comments) ? group.comments.length : 0) ??
  0;

const GroupCard = ({ group, courseId, currentUserId, onUpdate, onGroupUpdated, onGroupDeleted, onMemberAdded, onMemberRemoved }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(getInitialCommentCount(group));
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentContent, setCommentContent] = useState('');
  const [uploadingFile, setUploadingFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [localGroup, setLocalGroup] = useState(group);

  // Sync local group with prop when it changes
  useEffect(() => {
    setLocalGroup(group);
  }, [group]);

  const ownerId = localGroup.ownerId || localGroup.owner?.id || localGroup.createdById;
  const currentUserKey = currentUserId;
  const isOwner = ownerId && currentUserKey && (ownerId === currentUserKey || ownerId?.toString() === currentUserKey?.toString());
  const currentMember =
    (localGroup.members || []).find((m) => {
      const memberId = m.user?.id;
      const memberUsername = m.user?.username;
      const matchesId =
        currentUserKey &&
        (memberId === currentUserKey || memberId?.toString() === currentUserKey?.toString());
      const matchesUsername =
        currentUserKey &&
        memberUsername &&
        memberUsername.toLowerCase() === currentUserKey.toString().toLowerCase();
      return matchesId || matchesUsername;
    }) || null;
  const currentRole = currentMember?.role || group.currentUserRole;
  const isGroupAdmin = ['admin', 'owner', 'creator', 'manager'].includes((currentRole || '').toLowerCase());

  const apiCanManage = localGroup.canManageMembers !== false ? (localGroup.canManageMembers ?? false) : false;
  const apiCanEdit = localGroup.canEdit !== false ? (localGroup.canEdit ?? false) : false;
  const apiCanDelete = localGroup.canDelete !== false ? (localGroup.canDelete ?? false) : false;

  const canManageMembers = apiCanManage || apiCanEdit || apiCanDelete || isOwner || isGroupAdmin;
  const canEdit = apiCanEdit || canManageMembers || isOwner || isGroupAdmin;
  const canDelete = apiCanDelete || canManageMembers || isOwner || isGroupAdmin;
  const showGroupMenu = canEdit || canDelete || canManageMembers;

  // Debug logs for permission issues
  useEffect(() => {
    const payload = {
      groupId: localGroup.id,
      currentUserId,
      ownerId,
      currentRole,
      isOwner,
      isGroupAdmin,
      flags: {
        canManageMembersFromApi: localGroup.canManageMembers,
        canEditFromApi: localGroup.canEdit,
        canDeleteFromApi: localGroup.canDelete,
      },
      derived: { canManageMembers, canEdit, canDelete, showGroupMenu },
    };
    logInfo('GroupCard permission check', payload);
  }, [localGroup.id, currentUserId, ownerId, currentRole, isOwner, isGroupAdmin, canManageMembers, canEdit, canDelete, showGroupMenu, localGroup.canManageMembers, localGroup.canEdit, localGroup.canDelete]);
  const isMember = localGroup.isMember;
  const commentsLoadedRef = useRef(false);
  const commentCountLoadedRef = useRef(false);

  useEffect(() => {
    const initialCount = getInitialCommentCount(localGroup);
    setCommentCount(initialCount);
    commentCountLoadedRef.current = initialCount > 0;
  }, [localGroup.commentCount, localGroup.commentsCount, localGroup.comments_count, localGroup.comment_count, localGroup.comments, localGroup.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadComments = useCallback(async (reset = true, page = 1) => {
    // Use a ref to track if we're currently loading to prevent concurrent calls
    if (commentsLoadedRef.current === 'loading' && reset) {
      logInfo('Comments already loading, skipping', { groupId: localGroup.id });
      return;
    }
    
    if (reset) {
      commentsLoadedRef.current = 'loading';
      setLoadingComments(true);
      setCommentsPage(1);
    } else {
      setLoadingMoreComments(true);
    }
    
    logInfo('Loading comments', { groupId: localGroup.id, page, reset });
    
    try {
      // Load 5 comments for first page, 10 for subsequent pages
      const pageSize = page === 1 ? 5 : 10;
      const data = await getStudyGroupComments(localGroup.id, { page, pageSize });
      logInfo('Comments loaded successfully', { 
        groupId: localGroup.id, 
        page,
        pageSize,
        count: data.results?.length || 0,
        hasNext: !!data.next,
        totalCount: data.count,
      });
      
      const fetchedComments = (data.results || []).map(comment => {
        // Ensure attachments are properly formatted
        if (comment.attachments && Array.isArray(comment.attachments)) {
          comment.attachments = comment.attachments.map(att => ({
            id: att.id,
            fileName: att.fileName || att.file_name || 'Unknown',
            fileUrl: att.fileUrl || att.file_url || att.url,
            fileType: att.fileType || att.file_type || 'document',
            fileSize: att.fileSize || att.file_size || 0,
            uploadedAt: att.uploadedAt || att.uploaded_at,
          }));
        }
        return comment;
      });
      
      if (reset) {
        // Replace comments for first load
        setComments(fetchedComments);
      } else {
        // Append comments for load more
        setComments((prev) => [...prev, ...fetchedComments]);
      }
      
      // Update pagination state
      setHasMoreComments(!!data.next);
      setCommentsPage(page);
      
      // Update comment count
      if (typeof data.count === 'number') {
        setCommentCount(data.count);
      } else if (reset) {
        setCommentCount(getInitialCommentCount(localGroup) || fetchedComments.length);
      }
      
      commentsLoadedRef.current = true;
      commentCountLoadedRef.current = true;
    } catch (err) {
      logError('Failed to load comments', {
        groupId: localGroup.id,
        page,
        error: err.response?.data,
        status: err.response?.status,
        message: err.message,
      });
      if (reset) {
        commentsLoadedRef.current = false; // Reset on error to allow retry
      }
    } finally {
      setLoadingComments(false);
      setLoadingMoreComments(false);
    }
  }, [localGroup.id]);

  const loadMoreComments = useCallback(async () => {
    const nextPage = commentsPage + 1;
    await loadComments(false, nextPage);
  }, [commentsPage, loadComments]);

  // Fetch comment count on mount if not present
  useEffect(() => {
    if (!commentCountLoadedRef.current) {
      getStudyGroupComments(localGroup.id)
        .then((data) => {
          const newCount = typeof data.count === 'number'
            ? data.count
            : getInitialCommentCount(localGroup) || (data.results || []).length || 0;
          setCommentCount(newCount);
          commentCountLoadedRef.current = true;
        })
        .catch((err) => {
          logError('Failed to preload comment count', {
            groupId: localGroup.id,
            error: err.response?.data,
            status: err.response?.status,
            message: err.message,
          });
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localGroup.id]);

  useEffect(() => {
    if (showComments && comments.length === 0 && !loadingComments && commentsLoadedRef.current !== true && commentsLoadedRef.current !== 'loading') {
      loadComments(true, 1); // Load first page with 5 comments
    }
  }, [showComments, comments.length, loadingComments, loadComments]);

  // Helper functions to update comments state without reloading
  const updateCommentInList = useCallback((commentId, updatedData) => {
    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (comment.id === commentId) {
          // Deep merge to handle nested objects like reactionCounts
          return {
            ...comment,
            ...updatedData,
            // Preserve nested objects if not explicitly updated
            reactionCounts: updatedData.reactionCounts !== undefined 
              ? updatedData.reactionCounts 
              : comment.reactionCounts,
            attachments: updatedData.attachments !== undefined 
              ? updatedData.attachments 
              : comment.attachments,
            reactions: updatedData.reactions !== undefined 
              ? updatedData.reactions 
              : comment.reactions,
          };
        }
        return comment;
      })
    );
  }, []);

  const updateCommentReaction = useCallback((commentId, reactionType, reactionCounts) => {
    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (comment.id === commentId) {
          const currentUser = getAuthenticatedUser();
          const newUserReaction = reactionType || null;
          
          // Update reaction counts
          const updatedReactionCounts = { ...comment.reactionCounts };
          if (reactionCounts) {
            Object.keys(reactionCounts).forEach((type) => {
              updatedReactionCounts[type] = reactionCounts[type];
            });
          } else if (reactionType) {
            // Optimistic update: increment the new reaction, decrement old if exists
            const oldReaction = comment.userReaction;
            if (oldReaction && oldReaction !== reactionType) {
              updatedReactionCounts[oldReaction] = Math.max(0, (updatedReactionCounts[oldReaction] || 0) - 1);
            }
            updatedReactionCounts[reactionType] = (updatedReactionCounts[reactionType] || 0) + 1;
          } else {
            // Removing reaction
            const oldReaction = comment.userReaction;
            if (oldReaction) {
              updatedReactionCounts[oldReaction] = Math.max(0, (updatedReactionCounts[oldReaction] || 0) - 1);
            }
          }
          
          return {
            ...comment,
            userReaction: newUserReaction,
            reactionCounts: updatedReactionCounts,
          };
        }
        return comment;
      })
    );
  }, []);

  const removeCommentFromList = useCallback((commentId) => {
    setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));
    setCommentCount((prev) => Math.max(0, prev - 1));
  }, []);

  const addCommentToList = useCallback((newComment) => {
    setComments((prevComments) => [newComment, ...prevComments]);
    setCommentCount((prev) => prev + 1);
    // Reset pagination when new comment is added
    setCommentsPage(1);
    setHasMoreComments(true); // Assume there are more comments
  }, []);

  const handleFileSelect = (e, isImage = false) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    // Validate file size
    const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for images, 10MB for files
    if (file.size > maxSize) {
      alert(isImage ? 'Kích thước ảnh không được vượt quá 5MB' : 'Kích thước file không được vượt quá 10MB');
      e.target.value = '';
      return;
    }

    // Add file to selected files
    const newFile = { file, id: Date.now(), isImage };
    setSelectedFiles((prev) => [...prev, newFile]);

    // Create preview for images
    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, { id: newFile.id, url: reader.result }]);
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    e.target.value = '';
  };

  const handleRemoveFile = (fileId) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
    setImagePreviews((prev) => prev.filter((p) => p.id !== fileId));
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    // Create comment first with content
    let commentId = null;
    let commentCreated = false;
    
    try {
      const content = commentContent.trim() || (selectedFiles.length === 1 && selectedFiles[0].isImage 
        ? 'Đã đính kèm ảnh' 
        : 'Đã đính kèm file');
      
      const comment = await createComment(localGroup.id, { content });
      logInfo('Comment created for attachment', { comment, commentId: comment.id, commentType: typeof comment, commentKeys: Object.keys(comment || {}) });
      
      // Ensure we have a valid ID - check multiple possible formats
      commentId = comment?.id || comment?.Id || comment?.ID || comment?.data?.id || comment?.data?.Id;
      
      if (!commentId) {
        logError('Comment created but no ID returned', { comment, status: comment?.status });
        // Even if no ID, try to reload comments to get the new comment from server
        commentsLoadedRef.current = false;
        await loadComments(true, 1); // Reset to first page
        setCommentContent('');
        setSelectedFiles([]);
        setImagePreviews([]);
        setUploadingFile(null);
        setShowComments(true);
        return;
      }
      
      commentCreated = true;
      setUploadingFile(true);
      
      // Upload all selected files
      const uploadedAttachments = [];
      let uploadErrors = [];
      
      for (const fileItem of selectedFiles) {
        try {
          const attachment = await uploadCommentAttachment(commentId, fileItem.file);
          logInfo('File uploaded successfully', { 
            commentId, 
            fileName: fileItem.file.name,
            attachment,
            attachmentKeys: Object.keys(attachment || {}),
            hasFileUrl: !!attachment?.fileUrl,
            hasFileType: !!attachment?.fileType,
          });
          
          // Ensure attachment has all required fields
          // Backend returns: id, file_name, file_url, file_type, file_size, uploaded_at
          // camelCaseObject should convert to: id, fileName, fileUrl, fileType, fileSize, uploadedAt
          const formattedAttachment = {
            id: attachment.id || attachment.Id || attachment.ID,
            fileName: attachment.fileName || attachment.file_name || fileItem.file.name,
            fileUrl: attachment.fileUrl || attachment.file_url || attachment.url || attachment.fileUrl,
            fileType: attachment.fileType || attachment.file_type || (fileItem.isImage ? 'image' : 'document'),
            fileSize: attachment.fileSize || attachment.file_size || fileItem.file.size,
            uploadedAt: attachment.uploadedAt || attachment.uploaded_at || new Date().toISOString(),
          };
          
          logInfo('Formatted attachment', { 
            original: attachment, 
            formatted: formattedAttachment,
            hasFileUrl: !!formattedAttachment.fileUrl 
          });
          
          if (formattedAttachment.id) {
            // Even without fileUrl, add it - fileUrl might be generated later
            uploadedAttachments.push(formattedAttachment);
          } else {
            logError('Attachment missing ID', { attachment, formattedAttachment });
          }
        } catch (err) {
          logError('Failed to upload file', {
            commentId,
            fileName: fileItem.file.name,
            error: err.response?.data,
            status: err.response?.status,
            message: err.message,
          });
          uploadErrors.push({ fileName: fileItem.file.name, error: err });
          // Continue with other files even if one fails
        }
      }
      
      // If comment was created successfully, add it to list even if some files failed
      if (commentCreated && commentId) {
        // Add comment to list with attachments
        const camelCasedResult = {
          id: commentId,
          content: comment.content || comment.data?.content || content,
          user: comment.user || comment.data?.user || getAuthenticatedUser(),
          createdAt: comment.createdAt || comment.data?.createdAt || comment.created_at || comment.data?.created_at || new Date().toISOString(),
          updatedAt: comment.updatedAt || comment.data?.updatedAt || comment.updated_at || comment.data?.updated_at || new Date().toISOString(),
          attachments: uploadedAttachments.length > 0 ? uploadedAttachments : (comment.attachments || comment.data?.attachments || []),
          reactions: comment.reactions || comment.data?.reactions || [],
          reactionCounts: comment.reactionCounts || comment.data?.reactionCounts || {},
          userReaction: comment.userReaction || comment.data?.userReaction || null,
          canEdit: comment.canEdit !== false,
          canDelete: comment.canDelete !== false,
        };
        
        logInfo('Adding comment with attachments', { 
          camelCasedResult, 
          attachmentsCount: camelCasedResult.attachments.length,
          uploadedAttachmentsCount: uploadedAttachments.length 
        });
        addCommentToList(camelCasedResult);
        
        // If some files failed to upload, show warning but don't block
        if (uploadErrors.length > 0 && uploadErrors.length < selectedFiles.length) {
          alert(`Bình luận đã được đăng, nhưng ${uploadErrors.length} file không thể tải lên. Vui lòng thử lại sau.`);
        }
        
        // Always reload comments after uploads complete to ensure sync with server
        // Wait longer to ensure backend has processed all attachments
        // Use a longer delay to ensure all files are processed and URLs are generated
        // Reset to first page when new comment with attachments is added
        setTimeout(async () => {
          logInfo('Reloading comments after file upload', { 
            commentId, 
            uploadedAttachmentsCount: uploadedAttachments.length,
            uploadedFiles: uploadedAttachments.map(a => ({ id: a.id, fileName: a.fileName, hasUrl: !!a.fileUrl }))
          });
          commentsLoadedRef.current = false;
          await loadComments(true, 1); // Reset to first page
          
          // Check again after a delay to see if attachments are loaded
          setTimeout(async () => {
            // Reload one more time to ensure attachments are included
            commentsLoadedRef.current = false;
            await loadComments(true, 1); // Reset to first page
            logInfo('Second reload completed to ensure attachments are loaded');
          }, 1000);
        }, 2000); // Increased delay to ensure backend processing and URL generation
      }
      
      // Clear form
      setCommentContent('');
      setSelectedFiles([]);
      setImagePreviews([]);
      setUploadingFile(null);
      setShowComments(true);
    } catch (err) {
      logError('Failed to create comment with attachments', {
        groupId: localGroup.id,
        error: err.response?.data,
        status: err.response?.status,
        message: err.message,
        fullError: err,
      });
      setUploadingFile(null);
      
      // Check if comment was actually created (status 201 or 200)
      if (err.response?.status === 201 || err.response?.status === 200 || commentCreated) {
        // Comment was created, reload to get it with attachments
        logInfo('Comment was created despite error, reloading comments');
        commentsLoadedRef.current = false;
        await loadComments();
        setCommentContent('');
        setSelectedFiles([]);
        setImagePreviews([]);
        setShowComments(true);
      } else {
        alert('Không thể đăng bình luận với file đính kèm. Vui lòng thử lại.');
      }
    }
  };

  const handleAddComment = async () => {
    // If there are files selected, use file upload handler
    if (selectedFiles.length > 0) {
      await handleFileUpload();
      return;
    }

    // Otherwise, create comment normally
    if (!commentContent.trim()) {
      logInfo('Comment content is empty, skipping');
      return;
    }

    logInfo('Adding comment', { groupId: localGroup.id, contentLength: commentContent.length });
    
    let commentCreatedSuccessfully = false;
    
    try {
      const result = await createComment(localGroup.id, { content: commentContent });
      commentCreatedSuccessfully = true;
      
      logInfo('Comment API response', { 
        groupId: localGroup.id, 
        result, 
        resultType: typeof result, 
        resultKeys: Object.keys(result || {}),
        hasId: !!result?.id,
        hasData: !!result?.data,
        stringified: JSON.stringify(result).substring(0, 200)
      });
      
      // Ensure we have a valid ID - check multiple possible formats
      const commentId = result?.id || result?.Id || result?.ID || result?.data?.id || result?.data?.Id;
      
      if (!commentId) {
        logError('Comment created but no ID returned - reloading comments', { 
          result, 
          status: result?.status, 
          response: result,
          stringified: JSON.stringify(result)
        });
        // Even if no ID, try to reload comments to get the new comment from server
        commentsLoadedRef.current = false;
        await loadComments(true, 1); // Reset to first page
        setCommentContent('');
        setShowComments(true);
        return;
      }
      
      // Add comment to list immediately (optimistic update)
      const camelCasedResult = {
        id: commentId,
        content: result.content || result.data?.content || commentContent,
        user: result.user || result.data?.user || getAuthenticatedUser(),
        createdAt: result.createdAt || result.data?.createdAt || result.created_at || result.data?.created_at || new Date().toISOString(),
        updatedAt: result.updatedAt || result.data?.updatedAt || result.updated_at || result.data?.updated_at || new Date().toISOString(),
        attachments: result.attachments || result.data?.attachments || [],
        reactions: result.reactions || result.data?.reactions || [],
        reactionCounts: result.reactionCounts || result.data?.reactionCounts || {},
        userReaction: result.userReaction || result.data?.userReaction || null,
        canEdit: result.canEdit !== false,
        canDelete: result.canDelete !== false,
      };
      
      logInfo('Adding comment to list', { camelCasedResult });
      addCommentToList(camelCasedResult);
      
      // Reload comments after a short delay to ensure sync with server
      // This handles cases where response format might be different
      setTimeout(async () => {
        commentsLoadedRef.current = false;
        await loadComments(true, 1); // Reset to first page
      }, 500);
      
      setCommentContent('');
      setShowComments(true);
    } catch (err) {
      const httpStatus = err.response?.status;
      const errorData = err.response?.data;
      
      logError('Error adding comment', {
        groupId: localGroup.id,
        error: errorData,
        status: httpStatus,
        message: err.message,
        commentCreatedSuccessfully,
        fullError: err,
        errorString: JSON.stringify(err).substring(0, 300),
      });
      
      // If we got here, the API call completed (either success or error)
      // Check if comment was actually created (status 201 or 200)
      // Sometimes API returns error but comment is still created
      if (httpStatus === 201 || httpStatus === 200 || commentCreatedSuccessfully) {
        // Comment was created, just reload to get it
        logInfo('Comment was created (status 201/200 or flag set) despite error, reloading comments');
        commentsLoadedRef.current = false;
        await loadComments(true, 1); // Reset to first page
        setCommentContent('');
        setShowComments(true);
      } else {
        // Check if error response contains comment data (some APIs return error with data)
        const commentInError = errorData?.id || errorData?.Id || errorData?.ID;
        if (commentInError) {
          logInfo('Comment data found in error response, reloading comments');
          commentsLoadedRef.current = false;
          await loadComments();
          setCommentContent('');
          setShowComments(true);
        } else {
          // Only show error if we're sure comment wasn't created
          // But still try to reload in case it was created
          logInfo('Uncertain if comment was created, reloading comments to check');
          commentsLoadedRef.current = false;
          await loadComments();
          setCommentContent('');
          setShowComments(true);
          // Don't show alert - let user see if comment appears after reload
        }
      }
    }
  };

  const handleRemoveMember = async (memberIdentifier, memberObj) => {
    // Try multiple possible fields for user id - prioritize user_id from backend
    const target = memberObj?.user_id ||  // Backend now returns user_id field
                   memberObj?.user?.id || 
                   memberIdentifier || 
                   memberObj?.userId ||
                   memberObj?.user?.userId ||
                   null;

    logInfo('Removing member from group (client)', {
      groupId: localGroup.id,
      target,
      memberObj,
      availableFields: {
        'memberObj.user_id': memberObj?.user_id,
        'memberObj.user?.id': memberObj?.user?.id,
        memberIdentifier,
        'memberObj.userId': memberObj?.userId,
        'memberObj.user?.userId': memberObj?.user?.userId,
        allKeys: Object.keys(memberObj || {}),
      },
    });

    if (!target) {
      logError('Cannot remove member: user id not found in member object', { 
        memberObj,
        availableFields: Object.keys(memberObj || {}),
        memberString: JSON.stringify(memberObj),
      });
      alert('Không thể xóa thành viên: Không tìm thấy ID người dùng. Vui lòng thử lại sau.');
      return;
    }
    if (window.confirm('Bạn có chắc muốn xóa thành viên này khỏi nhóm?')) {
      logInfo('Removing member from group', { groupId: localGroup.id, userId: target });
      
      // Optimistic update: remove member from UI immediately
      if (onMemberRemoved) {
        onMemberRemoved(localGroup.id, target);
        // Update local group
        setLocalGroup((prev) => ({
          ...prev,
          members: (prev.members || []).filter((m) => {
            const memberId = m.user_id || m.user?.id || m.userId;
            return memberId !== target;
          }),
          memberCount: Math.max(0, (prev.memberCount || 0) - 1),
        }));
      }
      
      try {
        await removeStudyGroupMember(localGroup.id, target);
        logInfo('Member removed successfully', { groupId: localGroup.id, userId: target });
      } catch (err) {
        logError('Failed to remove member', {
          groupId: localGroup.id,
          userId: target,
          error: err.response?.data,
          status: err.response?.status,
          message: err.message,
        });
        alert('Không thể xóa thành viên. Vui lòng thử lại.');
        // Revert on error - reload group data
        if (onUpdate) onUpdate();
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <>
      <div className={`group-card ${collapsed ? 'collapsed' : ''}`}>
        <div className="group-header">
          <button className="group-collapse-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '▶' : '▼'}
          </button>
          <div className="group-info">
            <h3>{localGroup.name}</h3>
            <div className="group-stats">
              <span>👥 {localGroup.memberCount || localGroup.members?.length || 0} thành viên</span>
              <span>📅 Tạo: {formatDate(localGroup.createdAt)}</span>
            </div>
          </div>
          <div
            className="group-menu-container"
            data-debug-show-menu={showGroupMenu ? 'true' : 'false'}
            data-debug-can-edit={canEdit ? 'true' : 'false'}
            data-debug-can-delete={canDelete ? 'true' : 'false'}
            data-debug-can-manage={canManageMembers ? 'true' : 'false'}
          >
            {showGroupMenu && (
              <div className="group-menu-inline">
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => setShowEditGroup(true)}
                  >
                    <span className="fa fa-edit me-1" aria-hidden="true" /> Sửa nhóm
                  </Button>
                )}
                {canDelete && (
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={async () => {
                      if (window.confirm('Bạn có chắc muốn xóa nhóm này?')) {
                        const groupId = localGroup.id;
                        
                        // Optimistic update: remove from UI immediately
                        if (onGroupDeleted) {
                          onGroupDeleted(groupId);
                        }
                        
                        try {
                          await deleteStudyGroup(groupId);
                          logInfo('Group deleted successfully', { groupId });
                        } catch (err) {
                          logError('Failed to delete group', {
                            groupId,
                            error: err.response?.data,
                            status: err.response?.status,
                            message: err.message,
                          });
                          alert('Không thể xóa nhóm. Vui lòng thử lại.');
                          // Revert on error - reload groups
                          if (onUpdate) onUpdate();
                        }
                      }
                    }}
                  >
                    <span className="fa fa-trash me-1" aria-hidden="true" /> Xóa nhóm
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {collapsed && (
          <div className="collapsed-group-summary">
            <div className="collapsed-stat">
              <span>👥</span>
              <strong>{localGroup.memberCount || localGroup.members?.length || 0}</strong>
              <span>thành viên</span>
            </div>
            <div className="collapsed-stat">
              <span>📅</span>
              <strong>{formatDate(localGroup.createdAt)}</strong>
            </div>
          </div>
        )}

        {!collapsed && (
          <>
            <div className="group-subtitle">{localGroup.description || 'Chưa có mô tả'}</div>

            <div className="members-block">
              <div className="members-head">
                <span>Thành viên ({localGroup.memberCount || localGroup.members?.length || 0})</span>
                {canManageMembers && (
                  <Button size="sm" variant="primary" onClick={() => setShowAddMember(true)}>
                    + Thêm
                  </Button>
                )}
              </div>
                  {localGroup.members && localGroup.members.length > 0 ? (
                <div className="members-list">
                  {localGroup.members.slice(0, 5).map((member) => (
                    <div key={member.id} className="member-row">
                      <div className="member-info">
                        <div className="member-avatar" style={{ background: getAvatarColor(member.user?.id) }}>
                          {getInitials(member.user?.username)}
                        </div>
                        <div>
                          <div className="member-name">
                            {member.user?.username || 'Người dùng đã xóa'}
                            {member.role && ` (${member.role})`}
                          </div>
                          <div className="member-sub">Tham gia: {formatDate(member.joinedAt)}</div>
                        </div>
                      </div>
                      {canManageMembers && member.user?.id !== currentUserId && (
                        <button
                          className="friend-action-btn"
                          onClick={() => handleRemoveMember(null, member)}
                          title="Xóa khỏi nhóm"
                        >
                          <svg
                            aria-hidden="true"
                            focusable="false"
                            width="16"
                            height="16"
                            viewBox="0 0 448 512"
                            className="icon-trash"
                          >
                            <path
                              fill="currentColor"
                              d="M135.2 17.7c5.5-10.7 16.5-17.7 28.7-17.7h120.3c12.2 0 23.2 6.9 28.7 17.7L328 32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32H120l15.2-14.3zM32 128H416L397.6 467c-1.6 25.3-22.6 45-47.9 45H98.3C72.9 512 51.9 492.3 50.4 467L32 128z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-2">Chưa có thành viên</div>
              )}
            </div>

            {isMember && (
              <div className="discussion-container">
                <div className="create-post-box">
                  <div className="create-post-input">
                    <div className="user-avatar">
                      {getAuthenticatedUser()?.username?.substring(0, 2).toUpperCase() || 'U'}
                    </div>
                    <textarea
                      className="create-post-textarea"
                      placeholder="Chia sẻ suy nghĩ của bạn với nhóm..."
                      rows="2"
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                    />
                  </div>
                  {/* File previews */}
                  {selectedFiles.length > 0 && (
                    <div className="file-previews mb-2">
                      {imagePreviews.map((preview) => (
                        <div key={preview.id} className="image-preview-container">
                          <img src={preview.url} alt="Preview" className="image-preview" />
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() => handleRemoveFile(preview.id)}
                            title="Xóa ảnh"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {selectedFiles.filter((f) => !f.isImage).map((fileItem) => (
                        <div key={fileItem.id} className="file-preview-item">
                          <span>📎 {fileItem.file.name}</span>
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() => handleRemoveFile(fileItem.id)}
                            title="Xóa file"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="create-post-actions">
                    <label className="post-action-btn" title="Thêm ảnh">
                      📷
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect(e, true)}
                        disabled={uploadingFile}
                      />
                    </label>
                    <label className="post-action-btn" title="Thêm file">
                      📎
                      <input
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect(e, false)}
                        disabled={uploadingFile}
                      />
                    </label>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddComment}
                      disabled={(!commentContent.trim() && selectedFiles.length === 0) || uploadingFile}
                    >
                      {uploadingFile ? <Spinner animation="border" size="sm" /> : 'Đăng'}
                    </Button>
                  </div>
                </div>

                <div className="discussion-actions mt-3">
                  <Button
                    variant="outline-primary"
                    onClick={() => {
                      setShowComments(!showComments);
                    }}
                  >
                    💬 {showComments ? 'Ẩn' : 'Xem'} thảo luận ({commentCount})
                  </Button>
                </div>

                {showComments && (
                  <div className="discussion-feed mt-3">
                    {loadingComments ? (
                      <div className="text-center p-3">
                        <Spinner animation="border" />
                      </div>
                    ) : comments.length > 0 ? (
                      <>
                        {comments.map((comment) => (
                          <CommentCard
                            key={comment.id}
                            comment={comment}
                            group={localGroup}
                            onReactionChange={(commentId, reactionType, reactionCounts) => {
                              updateCommentReaction(commentId, reactionType, reactionCounts);
                            }}
                            onCommentUpdate={(commentId, updatedData) => {
                              updateCommentInList(commentId, updatedData);
                            }}
                            onCommentDelete={(commentId) => {
                              removeCommentFromList(commentId);
                            }}
                            currentUserId={currentUserId}
                          />
                        ))}
                        {hasMoreComments && (
                          <div className="text-center mt-3">
                            <Button
                              variant="outline-primary"
                              onClick={loadMoreComments}
                              disabled={loadingMoreComments}
                            >
                              {loadingMoreComments ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-2" />
                                  Đang tải...
                                </>
                              ) : (
                                'Tải thêm bình luận'
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-3">Chưa có bình luận nào</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        groupId={localGroup.id}
        onSuccess={async (newMember) => {
          // Fetch full member list to ensure we have complete data
          try {
            const membersData = await getStudyGroupMembers(localGroup.id);
            logInfo('Fetched members after adding', { groupId: localGroup.id, membersData });
            
            // Handle different response formats
            const allMembers = Array.isArray(membersData) 
              ? membersData 
              : (membersData.results || membersData.members || []);
            
            if (allMembers.length > 0) {
              // Format all members to ensure consistency
              const formattedMembers = allMembers.map(m => ({
                id: m.id,
                user_id: m.user_id || m.userId || m.user?.id,
                user: m.user || (typeof m.user === 'string' ? { username: m.user } : { username: 'Người dùng đã xóa' }),
                role: m.role || 'member',
                joinedAt: m.joinedAt || m.joined_at || new Date().toISOString(),
              }));
              
              // Update local group with full member list
              setLocalGroup((prev) => ({
                ...prev,
                members: formattedMembers,
                memberCount: formattedMembers.length,
              }));
              
              // Also update parent groups list
              if (onMemberAdded) {
                // Find the newly added member
                const addedMember = formattedMembers.find(m => 
                  m.id === newMember.id || 
                  (m.user?.username && newMember.user?.username && m.user.username === newMember.user.username) ||
                  (m.user_id === (newMember.user_id || newMember.userId))
                );
                if (addedMember) {
                  onMemberAdded(localGroup.id, addedMember);
                }
              }
            } else {
              // Fallback: use the returned member data
              const formattedMember = {
                id: newMember.id,
                user_id: newMember.user_id || newMember.userId || newMember.user?.id,
                user: newMember.user || (typeof newMember.user === 'string' ? { username: newMember.user } : { username: 'Người dùng đã xóa' }),
                role: newMember.role || 'member',
                joinedAt: newMember.joinedAt || newMember.joined_at || new Date().toISOString(),
              };
              
              if (onMemberAdded) {
                onMemberAdded(localGroup.id, formattedMember);
              }
              
              setLocalGroup((prev) => ({
                ...prev,
                members: [...(prev.members || []), formattedMember],
                memberCount: (prev.memberCount || 0) + 1,
              }));
            }
          } catch (err) {
            logError('Failed to fetch members after adding', {
              groupId: localGroup.id,
              error: err.response?.data,
              status: err.response?.status,
              message: err.message,
            });
            
            // Fallback: use the returned member data with better formatting
            const formattedMember = {
              id: newMember.id,
              user_id: newMember.user_id || newMember.userId || newMember.user?.id,
              user: newMember.user || (typeof newMember.user === 'string' ? { username: newMember.user } : { username: 'Người dùng đã xóa' }),
              role: newMember.role || 'member',
              joinedAt: newMember.joinedAt || newMember.joined_at || new Date().toISOString(),
            };
            
            if (onMemberAdded) {
              onMemberAdded(localGroup.id, formattedMember);
            }
            
            setLocalGroup((prev) => ({
              ...prev,
              members: [...(prev.members || []), formattedMember],
              memberCount: (prev.memberCount || 0) + 1,
            }));
          }
          
          setShowAddMember(false);
        }}
      />

      <EditGroupModal
        isOpen={showEditGroup}
        onClose={() => setShowEditGroup(false)}
        group={localGroup}
        onSuccess={() => {
          setShowEditGroup(false);
        }}
        onGroupUpdated={onGroupUpdated}
      />
    </>
  );
};

// Main Component
const StudyGroupsTab = () => {
  const { courseId } = useParams();
  const dispatch = useDispatch();
  const welcomeModel = useModel('welcome', courseId) || {};
  const studyGroupsModel = useModel('study-groups', courseId) || {};
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasInitialFetchedRef = useRef(false);

  const currentUser = getAuthenticatedUser();
  // Fallback to username when id is missing to keep permission checks working
  const currentUserId = currentUser?.id || currentUser?.username || null;
  const currentUsername = currentUser?.username || null;

  const userStats = welcomeModel.userStats || {
    streakDays: 0,
    lastDayOfStreak: null,
  };

  // Local state for groups to enable optimistic updates
  const [localGroups, setLocalGroups] = useState([]);
  
  // Sync local groups with model when model changes
  useEffect(() => {
    if (studyGroupsModel.results && studyGroupsModel.results.length > 0) {
      setLocalGroups(studyGroupsModel.results);
    } else if (studyGroupsModel.results && studyGroupsModel.results.length === 0) {
      setLocalGroups([]);
    }
  }, [studyGroupsModel.results]);

  const groups = useMemo(() => {
    // Use local groups if available, otherwise fall back to model
    if (localGroups.length > 0) {
      return localGroups;
    }
    if (studyGroupsModel.results && studyGroupsModel.results.length > 0) {
      return studyGroupsModel.results;
    }
    return [];
  }, [localGroups, studyGroupsModel.results]);

  // Get permission to create group from model
  const canCreateGroup = studyGroupsModel.canCreateGroup !== false; // Default to true if not set (for backward compatibility)

  // Helper functions to update groups state without reloading
  const addGroupToList = useCallback((newGroup) => {
    setLocalGroups((prevGroups) => [newGroup, ...prevGroups]);
  }, []);

  const updateGroupInList = useCallback((groupId, updatedData) => {
    setLocalGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId ? { ...group, ...updatedData } : group
      )
    );
  }, []);

  const removeGroupFromList = useCallback((groupId) => {
    setLocalGroups((prevGroups) => prevGroups.filter((group) => group.id !== groupId));
  }, []);

  const groupStreaks = useMemo(() => (welcomeModel.groupStreaks || []), [welcomeModel.groupStreaks]);

  // Fetch welcome tab data only once per course
  const welcomeFetchedRef = useRef(false);
  const lastWelcomeCourseIdRef = useRef(null);
  useEffect(() => {
    // Reset when courseId changes
    if (lastWelcomeCourseIdRef.current !== courseId) {
      welcomeFetchedRef.current = false;
      lastWelcomeCourseIdRef.current = courseId;
    }

    // Only fetch if:
    // 1. We have a courseId
    // 2. We haven't fetched yet for this course
    // 3. The model doesn't have data yet (empty object or no userStats)
    // 4. The model doesn't indicate success (if success exists and is false, don't refetch)
    const hasData = welcomeModel.userStats !== undefined;
    const isSuccess = welcomeModel.success === true;
    const shouldFetch = courseId && !welcomeFetchedRef.current && !hasData && !isSuccess;

    if (shouldFetch) {
      logInfo('Fetching welcome tab data', { courseId });
      dispatch(fetchWelcomeTab(courseId));
      welcomeFetchedRef.current = true;
    }
  }, [courseId, dispatch, welcomeModel.userStats, welcomeModel.success]);

  // Track fetch state - use refs to persist across renders
  const lastCourseIdRef = useRef(null);
  const isFetchingRef = useRef(false);
  const lastRefreshKeyRef = useRef(0);
  
  // Reset state when courseId changes (separate effect to avoid interference)
  useEffect(() => {
    if (courseId && lastCourseIdRef.current !== courseId) {
      logInfo('Course ID changed, resetting fetch state', { 
        oldCourseId: lastCourseIdRef.current, 
        newCourseId: courseId 
      });
      hasInitialFetchedRef.current = false;
      isFetchingRef.current = false;
      lastRefreshKeyRef.current = 0;
      lastCourseIdRef.current = courseId;
    }
  }, [courseId]);
  
  // Initial fetch - ONLY ONCE when component mounts with a courseId
  useEffect(() => {
    if (!courseId) return;
    
    // Only fetch if we haven't fetched for this course yet
    if (hasInitialFetchedRef.current) {
      return;
    }
    
    // Double-check we're not already fetching
    if (isFetchingRef.current) {
      return;
    }
    
    // Check if model already has data (from previous load or cache)
    // If it has results array (even if empty), consider it loaded
    const hasModelData = studyGroupsModel.results !== undefined;
    if (hasModelData) {
      logInfo('Study groups model already has data, skipping initial fetch', { 
        courseId, 
        hasResults: Array.isArray(studyGroupsModel.results),
        resultsCount: studyGroupsModel.results?.length || 0
      });
      hasInitialFetchedRef.current = true;
      return;
    }
    
    logInfo('Fetching study groups data (initial - mount)', { courseId });
    
    // Set flags IMMEDIATELY before any async operation
    hasInitialFetchedRef.current = true;
    isFetchingRef.current = true;
    
    // Dispatch fetch
    dispatch(fetchStudyGroupsTab(courseId));
    
    // Reset fetching flag after a reasonable delay
    const timeoutId = setTimeout(() => {
      isFetchingRef.current = false;
    }, 3000);
    
    return () => {
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, studyGroupsModel.results]); // Include studyGroupsModel.results to check if data exists

  // Refresh fetch - only when refreshKey explicitly changes
  useEffect(() => {
    if (!courseId) return;
    if (refreshKey === 0) return; // Initial state, skip
    if (refreshKey === lastRefreshKeyRef.current) return; // No change, skip
    if (isFetchingRef.current) return; // Already fetching, skip
    
    logInfo('Refreshing study groups (refreshKey changed)', { 
      courseId, 
      refreshKey,
      lastRefreshKey: lastRefreshKeyRef.current
    });
    
    // Update tracking immediately
    lastRefreshKeyRef.current = refreshKey;
    isFetchingRef.current = true;
    
    // Dispatch fetch
    dispatch(fetchStudyGroupsTab(courseId));
    
    // Reset fetching flag after a delay
    const timeoutId = setTimeout(() => {
      isFetchingRef.current = false;
    }, 3000);
    
    return () => {
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, refreshKey]); // Only courseId and refreshKey

  const handleRefresh = useCallback(() => {
    logInfo('Refreshing study groups (handleRefresh called)', { courseId });
    // Only increment refreshKey if it hasn't been incremented recently
    setRefreshKey(prev => {
      const newKey = prev + 1;
      logInfo('Incrementing refreshKey', { oldKey: prev, newKey });
      return newKey;
    });
  }, [courseId]);

  return (
    <Container className="study-groups-tab px-0">
      <Row>
        <Col lg={8} md={12}>
          <div className="groups-header">
            <h2>Nhóm học tập</h2>
            {canCreateGroup && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                + Tạo nhóm mới
              </Button>
            )}
          </div>

          <section className="panel">
            <div className="panel-head">
              <h3>Nhóm của bạn</h3>
            </div>
            <div className="group-list">
              {groups.length > 0 ? (
                groups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    courseId={courseId}
                    currentUserId={currentUserId}
                    onUpdate={handleRefresh}
                    onGroupUpdated={updateGroupInList}
                    onGroupDeleted={removeGroupFromList}
                    onMemberAdded={(groupId, newMember) => {
                      updateGroupInList(groupId, {
                        members: [...(groups.find(g => g.id === groupId)?.members || []), newMember],
                        memberCount: (groups.find(g => g.id === groupId)?.memberCount || 0) + 1,
                      });
                    }}
                    onMemberRemoved={(groupId, userId) => {
                      const group = groups.find(g => g.id === groupId);
                      if (group) {
                        updateGroupInList(groupId, {
                          members: (group.members || []).filter((m) => {
                            const memberId = m.user_id || m.user?.id || m.userId;
                            return memberId !== userId;
                          }),
                          memberCount: Math.max(0, (group.memberCount || 0) - 1),
                        });
                      }
                    }}
                  />
                ))
              ) : (
                <div className="text-center p-4">
                  <p>
                    {canCreateGroup 
                      ? 'Chưa có nhóm học tập nào. Hãy tạo nhóm mới để bắt đầu!'
                      : 'Chưa có nhóm học tập nào. Bạn cần được thêm vào nhóm để tham gia thảo luận.'}
                  </p>
                </div>
              )}
            </div>
          </section>
        </Col>

        <Col lg={4} md={12} className="mt-3 mt-lg-0">
          <div className="study-groups-sidebar">
            <StreakCalendar
              streakDays={userStats.streakDays}
              lastDayOfStreak={userStats.lastDayOfStreak}
            />
            <GroupStreaks groups={groupStreaks} disableFallback />
            <StudyTip />
            <ReferralWidget />
          </div>
        </Col>
      </Row>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        courseId={courseId}
        onSuccess={handleRefresh}
        onGroupCreated={addGroupToList}
      />
    </Container>
  );
};

export default StudyGroupsTab;
