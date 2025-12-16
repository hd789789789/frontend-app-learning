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
  getCommentDetail,
  createComment,
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
  uploadCommentAttachment,
  deleteCommentAttachment,
  getGroupStreaks,
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

// Post Comments Section Component - Displays comments under a post
const PostCommentsSection = ({ post, group, currentUserId, onCommentUpdate, onCommentDelete, openConfirmDialog, showErrorDialog }) => {
  const repliesCount = post.repliesCount || post.replies_count || (post.replies ? post.replies.length : 0);
  const initialReplies = post.replies || [];
  const [showComments, setShowComments] = useState(repliesCount > 0);
  const [replies, setReplies] = useState(initialReplies);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(false);
  const currentUser = getAuthenticatedUser();

  useEffect(() => {
    // Update replies when post changes
    const newReplies = post.replies || [];
    setReplies(newReplies);
    // Auto-show comments if there are replies
    if (newReplies.length > 0) {
      setShowComments(true);
    }
  }, [post.replies, post.repliesCount]);

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

  const handleAddComment = async () => {
    if (!commentContent.trim()) return;

    setLoading(true);
    const commentText = commentContent.trim();
    setCommentContent(''); // Clear input immediately

    try {
      const result = await createComment(group.id, {
        content: commentText,
        parent_comment: post.id,
      });

      logInfo('Comment created successfully', {
        postId: post.id,
        result,
        resultUser: result.user,
      });

      // Ensure result has proper format - use camelCaseObject if needed
      const camelCasedResult = result;
      const userData = camelCasedResult.user || {};
      
      // Ensure user object has username
      if (!userData.username && currentUser?.username) {
        userData.username = currentUser.username;
      }
      if (!userData.id && currentUser?.id) {
        userData.id = currentUser.id;
      }

      const newComment = {
        id: camelCasedResult.id || camelCasedResult.Id || camelCasedResult.ID,
        content: camelCasedResult.content || commentText,
        user: {
          id: userData.id || userData.Id || userData.ID || currentUser?.id,
          username: userData.username || userData.email || currentUser?.username || currentUser?.email || 'Người dùng',
          email: userData.email || currentUser?.email,
        },
        createdAt: camelCasedResult.createdAt || camelCasedResult.created_at || new Date().toISOString(),
        updatedAt: camelCasedResult.updatedAt || camelCasedResult.updated_at,
        canEdit: camelCasedResult.canEdit !== undefined ? camelCasedResult.canEdit : true,
        canDelete: camelCasedResult.canDelete !== undefined ? camelCasedResult.canDelete : true,
        attachments: camelCasedResult.attachments || [],
        reactions: camelCasedResult.reactions || [],
        reactionCounts: camelCasedResult.reactionCounts || camelCasedResult.reaction_counts || {},
        replies: [],
        repliesCount: 0,
      };

      logInfo('Formatted new comment', { newComment, user: newComment.user });

      // Add new comment to replies
      setReplies((prev) => [...prev, newComment]);
      
      // Update post's replies count
      if (onCommentUpdate) {
        const updatedReplies = [...replies, newComment];
        onCommentUpdate(post.id, {
          replies: updatedReplies,
          repliesCount: updatedReplies.length,
        });
      }
    } catch (err) {
      logError('Failed to add comment', {
        postId: post.id,
        error: err.response?.data,
        status: err.response?.status,
        message: err.message,
      });
      
      // Restore comment content on error
      setCommentContent(commentText);
      showErrorDialog('Không thể thêm bình luận', err.response?.data?.error || 'Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReply = (commentId, updatedData) => {
    setReplies((prev) => prev.map((c) => (c.id === commentId ? { ...c, ...updatedData } : c)));
    if (onCommentUpdate) {
      onCommentUpdate(commentId, updatedData);
    }
  };

  const handleDeleteReply = (commentId) => {
    setReplies((prev) => prev.filter((c) => c.id !== commentId));
    if (onCommentDelete) {
      onCommentDelete(commentId);
    }
    // Update post's replies count
    if (onCommentUpdate) {
      onCommentUpdate(post.id, {
        replies: replies.filter((c) => c.id !== commentId),
        repliesCount: Math.max(0, (post.repliesCount || 0) - 1),
      });
    }
  };

  const currentRepliesCount = replies.length || 0;
  const hasReplies = currentRepliesCount > 0 || repliesCount > 0;

  return (
    <div className="post-comments-section" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7f0' }}>
      {/* Show/Hide Comments Button */}
      {hasReplies && (
        <div style={{ marginBottom: '0.75rem' }}>
          <Button
            variant="link"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            style={{ padding: 0, color: '#6c5ce7', textDecoration: 'none' }}
          >
            {showComments ? (
              <>
                <span style={{ marginRight: '0.5rem' }}>▲</span>
                Ẩn {repliesCount} bình luận
              </>
            ) : (
              <>
                <span style={{ marginRight: '0.5rem' }}>▼</span>
                Xem {repliesCount} bình luận
              </>
            )}
          </Button>
        </div>
      )}

      {/* Comments List */}
      {showComments && replies.length > 0 && (
        <div className="comments-list" style={{ marginBottom: '1rem' }}>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onUpdate={handleUpdateReply}
              onDelete={handleDeleteReply}
              openConfirmDialog={openConfirmDialog}
              showErrorDialog={showErrorDialog}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Comment Input */}
      <div className="comment-input-wrapper">
        <div className="user-avatar" style={{ 
          background: currentUser?.id ? getAvatarColor(currentUser.id) : '#6c5ce7',
          width: '32px',
          height: '32px',
          fontSize: '0.85rem'
        }}>
          {getInitials(currentUser?.username || currentUser?.email || 'U')}
        </div>
        <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <FormControl
            type="text"
            placeholder="Viết bình luận..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
            style={{ flex: 1, borderRadius: '20px', padding: '0.5rem 1rem' }}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddComment}
            disabled={!commentContent.trim() || loading}
            style={{ 
              borderRadius: '20px',
              padding: '0.5rem 1.5rem',
              backgroundColor: '#6c5ce7',
              border: 'none'
            }}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Gửi'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Comment Item Component - Individual comment/reply
const CommentItem = ({ comment, currentUserId, onUpdate, onDelete, openConfirmDialog, showErrorDialog, formatDate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEditContent(comment.content);
  }, [comment.content]);

  const commentOwnerId = comment.user?.id || comment.userId || comment.user_id;
  const currentUser = getAuthenticatedUser();
  const currentUserKey = currentUserId || currentUser?.id;
  
  // Check if user can edit/delete - check both canEdit/canDelete flags and ownership
  const isOwner = (
    commentOwnerId && currentUserKey && (
      commentOwnerId === currentUserKey ||
      commentOwnerId?.toString() === currentUserKey?.toString() ||
      String(commentOwnerId) === String(currentUserKey) ||
      Number(commentOwnerId) === Number(currentUserKey)
    )
  );
  
  // Use canEdit/canDelete from backend if available, otherwise check ownership
  const canEdit = comment.canEdit !== undefined 
    ? (comment.canEdit && isOwner)
    : isOwner;
  const canDelete = comment.canDelete !== undefined
    ? (comment.canDelete && isOwner)
    : isOwner;

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const result = await updateComment(comment.id, editContent);
      onUpdate(comment.id, {
        content: result.content || editContent,
        updatedAt: result.updatedAt || new Date().toISOString(),
      });
      setIsEditing(false);
    } catch (err) {
      logError('Failed to update comment', {
        commentId: comment.id,
        error: err.response?.data,
        status: err.response?.status,
        message: err.message,
      });
      showErrorDialog('Không thể cập nhật bình luận', err.response?.data?.error || 'Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    openConfirmDialog({
      title: 'Xóa bình luận',
      message: 'Bạn có chắc muốn xóa bình luận này?',
      confirmText: 'Xóa',
      onConfirm: async () => {
        setLoading(true);
        try {
          await deleteComment(comment.id);
          onDelete(comment.id);
        } catch (err) {
          logError('Failed to delete comment', {
            commentId: comment.id,
            error: err.response?.data,
            status: err.response?.status,
            message: err.message,
          });
          showErrorDialog('Không thể xóa bình luận', 'Vui lòng thử lại.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Get user info with fallbacks
  const userInfo = comment.user || {};
  const username = userInfo.username || userInfo.email || 'Người dùng đã xóa';
  const userId = userInfo.id || comment.userId || comment.user_id;
  const userColor = userId ? getAvatarColor(userId) : '#6c5ce7';
  const userInitials = getInitials(username);

  return (
    <div className="comment-item" style={{ 
      display: 'flex', 
      gap: '0.75rem', 
      marginBottom: '0.75rem',
      padding: '0.5rem 0'
    }}>
      <div className="user-avatar" style={{ 
        background: userColor,
        width: '32px',
        height: '32px',
        fontSize: '0.85rem',
        flexShrink: 0
      }}>
        {userInitials}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            {username}
          </span>
          <span style={{ color: '#7a8396', fontSize: '0.85rem' }}>
            {formatDate(comment.createdAt || comment.created_at)}
          </span>
          {(canEdit || canDelete) && (
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <Dropdown>
                <Dropdown.Toggle
                  variant="link"
                  size="sm"
                  className="comment-menu-toggle"
                  disabled={loading}
                  style={{
                    padding: '0.25rem',
                    minWidth: 'auto',
                    border: 'none',
                    background: 'transparent',
                    color: '#65676b',
                    boxShadow: 'none',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⋯</span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="comment-dropdown-menu">
                  {canEdit && (
                    <DropdownItem
                      onClick={() => setIsEditing(true)}
                      disabled={loading}
                      className="comment-menu-item"
                    >
                      <span className="fa fa-edit me-2" aria-hidden="true" />
                      Sửa bình luận
                    </DropdownItem>
                  )}
                  {canDelete && (
                    <DropdownItem
                      onClick={handleDelete}
                      disabled={loading}
                      className="comment-menu-item comment-menu-item-danger"
                    >
                      <span className="fa fa-trash me-2" aria-hidden="true" />
                      Xóa bình luận
                    </DropdownItem>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          )}
        </div>
        {isEditing ? (
          <div>
            <FormControl
              as="textarea"
              rows={2}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={loading}
              style={{ marginBottom: '0.5rem' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button size="sm" onClick={handleUpdate} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Lưu'}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                disabled={loading}
              >
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ color: '#2f3641', fontSize: '0.9rem' }}>
            {comment.content}
          </div>
        )}
      </div>
    </div>
  );
};

// Comment Card Component
const CommentCard = ({ comment, group, onReactionChange, onCommentUpdate, onCommentDelete, currentUserId, openConfirmDialog, showErrorDialog }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [localComment, setLocalComment] = useState(comment);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [errorModal, setErrorModal] = useState(null);
  const currentUsername = getAuthenticatedUser()?.username || getAuthenticatedUser()?.email || null;
  const [editUploadingFile, setEditUploadingFile] = useState(false);

  // Update local comment when prop changes
  useEffect(() => {
    setLocalComment(comment);
  }, [comment]);

  // Chỉ người đăng mới có quyền sửa/xóa bài đăng của mình
  const commentOwnerId = localComment.user?.id || localComment.userId || localComment.user_id;
  const commentOwnerUsername = localComment.user?.username || localComment.user?.email;
  // Kiểm tra owner bằng nhiều cách để đảm bảo khớp (id hoặc username)
  const isCommentOwner = (
    (currentUserId && commentOwnerId && (
      currentUserId === commentOwnerId || 
      currentUserId?.toString() === commentOwnerId?.toString() ||
      String(currentUserId) === String(commentOwnerId) ||
      Number(currentUserId) === Number(commentOwnerId)
    )) ||
    (commentOwnerUsername && currentUsername && commentOwnerUsername.toLowerCase() === currentUsername.toLowerCase())
  );
  
  
  const canEdit = isCommentOwner;
  const canDelete = isCommentOwner;

  // Local confirm dialog handler if not provided
  const handleOpenConfirmDialog = openConfirmDialog || (({ title, message, onConfirm, confirmText = 'Xác nhận', cancelText = 'Hủy' }) => {
    setConfirmDialog({ title, message, onConfirm, confirmText, cancelText });
  });

  const handleShowErrorDialog = showErrorDialog || ((title, message) => {
    setErrorModal({ title, message });
  });

  const handleUpdate = async () => {
    setLoading(true);
    // Optimistic update
    const oldContent = localComment.content;
    setLocalComment((prev) => ({ ...prev, content: editContent }));
    setIsEditing(false);
    
    try {
      const result = await updateComment(localComment.id, editContent);
      
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
    handleOpenConfirmDialog({
      title: 'Xóa bình luận',
      message: 'Bạn có chắc muốn xóa bình luận này?',
      confirmText: 'Xóa',
      onConfirm: async () => {
        setLoading(true);
        
        // Ensure we have a valid ID
        const commentId = localComment.id || localComment.Id || localComment.ID;
        if (!commentId) {
          logError('Cannot delete comment: no ID found', { localComment });
          handleShowErrorDialog('Không thể xóa bình luận', 'Không tìm thấy ID. Vui lòng refresh trang.');
          setLoading(false);
          return;
        }
        
        // Optimistic update: remove from UI immediately
        onCommentDelete(commentId);
        
        try {
          await deleteComment(commentId);
        } catch (err) {
          logError('Failed to delete comment', {
            commentId,
            error: err.response?.data,
            status: err.response?.status,
            message: err.message,
          });
          
          handleShowErrorDialog('Không thể xóa bình luận', 'Vui lòng thử lại.');
          // Note: Comment is already removed from UI optimistically
          // In a production app, you might want to reload comments here
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleRemoveAttachment = async (attachmentId) => {
    if (!attachmentId) return;
    setEditUploadingFile(true);
    try {
      await deleteCommentAttachment(attachmentId);
      const updatedAttachments = (localComment.attachments || []).filter(att => att.id !== attachmentId && att.Id !== attachmentId && att.ID !== attachmentId);
      setLocalComment((prev) => ({ ...prev, attachments: updatedAttachments }));
      onCommentUpdate(localComment.id, { attachments: updatedAttachments });
    } catch (err) {
      handleShowErrorDialog('Không thể xóa file đính kèm', err.response?.data?.error || err.message || 'Vui lòng thử lại.');
    } finally {
      setEditUploadingFile(false);
    }
  };

  const handleAddAttachment = async (e, isImage = false) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setEditUploadingFile(true);
    try {
      const uploaded = await uploadCommentAttachment(localComment.id, file);
      const newAttachment = {
        id: uploaded.id || uploaded.Id || uploaded.ID,
        fileName: uploaded.fileName || uploaded.file_name || file.name,
        fileUrl: uploaded.fileUrl || uploaded.file_url || uploaded.url,
        fileType: uploaded.fileType || uploaded.file_type || (isImage ? 'image' : 'document'),
        fileSize: uploaded.fileSize || uploaded.file_size,
        uploadedAt: uploaded.uploadedAt || uploaded.uploaded_at,
      };
      const updatedAttachments = [...(localComment.attachments || []), newAttachment];
      setLocalComment((prev) => ({ ...prev, attachments: updatedAttachments }));
      onCommentUpdate(localComment.id, { attachments: updatedAttachments });
    } catch (err) {
      handleShowErrorDialog('Không thể tải file đính kèm', err.response?.data?.error || err.message || 'Vui lòng thử lại.');
    } finally {
      setEditUploadingFile(false);
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
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ fontSize: '10px', color: 'red', marginBottom: '5px' }}>
            Debug Comment: isCommentOwner={String(isCommentOwner)}, canEdit={String(canEdit)}, canDelete={String(canDelete)}, commentOwnerId={String(commentOwnerId)}, currentUserId={String(currentUserId)}
          </div>
        )}
        
        {(canEdit || canDelete) && (
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <Dropdown>
              <Dropdown.Toggle
                variant="link"
                size="sm"
                className="comment-menu-toggle"
                disabled={loading}
                style={{
                  padding: '0.25rem',
                  minWidth: 'auto',
                  border: 'none',
                  background: 'transparent',
                  color: '#65676b',
                  boxShadow: 'none',
                }}
              >
                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⋯</span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="comment-dropdown-menu">
                {canEdit && (
                  <DropdownItem
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                    className="comment-menu-item"
                  >
                    <span className="fa fa-edit me-2" aria-hidden="true" />
                    Sửa bài đăng
                  </DropdownItem>
                )}
                {canDelete && (
                  <DropdownItem
                    onClick={handleDelete}
                    disabled={loading}
                    className="comment-menu-item comment-menu-item-danger"
                  >
                    <span className="fa fa-trash me-2" aria-hidden="true" />
                    Xóa bài đăng
                  </DropdownItem>
                )}
              </Dropdown.Menu>
            </Dropdown>
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
          {/* Existing attachments with remove */}
          {(localComment.attachments && localComment.attachments.length > 0) && (
            <div className="edit-attachments mt-2">
              {localComment.attachments.map((att) => (
                <div key={att.id || att.Id || att.ID} className="d-flex align-items-center justify-content-between mb-2">
                  <a
                    href={att.fileUrl || att.file_url || '#'}
                    target={att.fileUrl ? '_blank' : undefined}
                    rel={att.fileUrl ? 'noopener noreferrer' : undefined}
                  >
                    {att.fileName || att.file_name || 'File đính kèm'}
                  </a>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleRemoveAttachment(att.id || att.Id || att.ID)}
                    disabled={editUploadingFile}
                    title="Xóa file đính kèm"
                  >
                    🗑️
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new attachment while editing */}
          <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
            <label className="post-action-btn" title="Thêm ảnh mới">
              📷
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleAddAttachment(e, true)}
                disabled={editUploadingFile}
              />
            </label>
            <label className="post-action-btn" title="Thêm file mới">
              📎
              <input
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => handleAddAttachment(e, false)}
                disabled={editUploadingFile}
              />
            </label>
            {editUploadingFile && <Spinner animation="border" size="sm" />}
          </div>

          <div className="d-flex gap-4 mt-2" style="gap: 5px;">
            <Button size="sm" onClick={handleUpdate} disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
              Lưu
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setIsEditing(false);
                setEditContent(localComment.content);
              }}
              disabled={loading}
            >
              Hủy
            </Button>
          </div>
        </div>
      ) : (
        <div className="post-content">{localComment.content}</div>
      )}

      {(() => {
        const attachments = localComment.attachments || localComment.Attachments || [];
        const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
        
        if (!hasAttachments) {
          return null;
        }
        
        return (
          <div className="post-attachments">
            {attachments.map((attachment, index) => {
              // Ensure attachment has proper format - check all possible field names
              const att = {
                id: attachment.id || attachment.Id || attachment.ID || `attachment-${localComment.id}-${index}`,
                fileName: attachment.fileName || attachment.file_name || attachment.fileName || 'Unknown file',
                fileUrl: attachment.fileUrl || attachment.file_url || attachment.url || attachment.fileUrl,
                fileType: attachment.fileType || attachment.file_type || (attachment.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'document'),
              };
              
              // Only show image if we have a valid URL and file type is image
              if (att.fileType === 'image' && att.fileUrl) {
                return (
                  <div key={att.id} className="attachment-image-container">
                    <img
                      src={att.fileUrl}
                      alt={att.fileName}
                      className="attachment-image"
                      onClick={() => window.open(att.fileUrl, '_blank')}
                      onError={(e) => {
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
                  key={att.id}
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
        );
      })()}

      <div className="post-actions" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7f0' }}>
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
        {/* Comment count - only show for top-level posts */}
        {!localComment.parentComment && !localComment.parent_comment && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#5b6477', fontSize: '0.9rem' }}>
            <span>💬</span>
            <span>{localComment.repliesCount || localComment.replies_count || (localComment.replies ? localComment.replies.length : 0)} bình luận</span>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ModalDialog
          isOpen={!!confirmDialog}
          onClose={() => setConfirmDialog(null)}
          size="sm"
          hasCloseButton
        >
          <ModalDialog.Header>
            <ModalDialog.Title>{confirmDialog?.title || 'Xác nhận'}</ModalDialog.Title>
          </ModalDialog.Header>
          <ModalDialog.Body>
            {confirmDialog?.message || 'Bạn chắc chắn muốn tiếp tục?'}
          </ModalDialog.Body>
          <ModalDialog.Footer>
            <ActionRow>
              <ModalDialog.CloseButton variant="tertiary" onClick={() => setConfirmDialog(null)}>
                {confirmDialog?.cancelText || 'Hủy'}
              </ModalDialog.CloseButton>
              <Button
                variant="danger"
                onClick={async () => {
                  const onConfirm = confirmDialog?.onConfirm;
                  setConfirmDialog(null);
                  if (onConfirm) {
                    await onConfirm();
                  }
                }}
              >
                {confirmDialog?.confirmText || 'Xác nhận'}
              </Button>
            </ActionRow>
          </ModalDialog.Footer>
        </ModalDialog>
      )}

      {/* Error Dialog */}
      {errorModal && (
        <ModalDialog
          isOpen={!!errorModal}
          onClose={() => setErrorModal(null)}
          size="sm"
          hasCloseButton={false}
        >
          <ModalDialog.Header>
            <ModalDialog.Title>{errorModal?.title || 'Thông báo'}</ModalDialog.Title>
          </ModalDialog.Header>
          <ModalDialog.Body>
            {errorModal?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.'}
          </ModalDialog.Body>
          <ModalDialog.Footer>
            <ActionRow>
              <ModalDialog.CloseButton variant="primary" onClick={() => setErrorModal(null)}>
                Đóng
              </ModalDialog.CloseButton>
            </ActionRow>
          </ModalDialog.Footer>
        </ModalDialog>
      )}

      {/* Comments Section - Only show for top-level posts (no parent_comment) */}
      {!localComment.parentComment && !localComment.parent_comment && (
        <PostCommentsSection
          post={localComment}
          group={group}
          currentUserId={currentUserId}
          onCommentUpdate={onCommentUpdate}
          onCommentDelete={onCommentDelete}
          openConfirmDialog={handleOpenConfirmDialog}
          showErrorDialog={handleShowErrorDialog}
        />
      )}
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
  const [allComments, setAllComments] = useState([]); // Store all loaded comments
  const [displayedComments, setDisplayedComments] = useState([]); // Comments to display
  const [commentCount, setCommentCount] = useState(getInitialCommentCount(group));
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(5); // Start with 5 comments
  const [commentContent, setCommentContent] = useState('');
  const [uploadingFile, setUploadingFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [localGroup, setLocalGroup] = useState(group);

  // Sync local group with prop when it changes
  useEffect(() => {
    setLocalGroup(group);
  }, [group]);

  // Lấy username hiện tại (fallback null)
  const currentUsername = getAuthenticatedUser()?.username || null;

  // Check if user is owner: match by id OR username to avoid type mismatches
  const ownerId = localGroup.createdBy?.id || localGroup.created_by?.id || localGroup.ownerId || localGroup.owner?.id || localGroup.createdById;
  const ownerUsername = localGroup.createdBy?.username || localGroup.created_by?.username || localGroup.owner?.username;
  const currentUserKey = currentUserId;
  const isOwner = (
    (ownerId !== undefined && ownerId !== null && currentUserKey !== undefined && currentUserKey !== null &&
      (ownerId === currentUserKey ||
        ownerId?.toString() === currentUserKey?.toString() ||
        String(ownerId) === String(currentUserKey) ||
        Number(ownerId) === Number(currentUserKey))) ||
    (ownerUsername && currentUsername && ownerUsername.toLowerCase() === currentUsername.toLowerCase())
  );
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
  const isMember = localGroup.isMember !== undefined
    ? localGroup.isMember
    : Boolean(currentMember || isOwner);

  // Chỉ trưởng nhóm mới có quyền quản lý, sửa và xóa nhóm
  const apiCanManage = localGroup.canManageMembers !== false ? (localGroup.canManageMembers ?? false) : false;
  const apiCanEdit = localGroup.canEdit !== false ? (localGroup.canEdit ?? false) : false;
  const apiCanDelete = localGroup.canDelete !== false ? (localGroup.canDelete ?? false) : false;

  // Chỉ owner mới có các quyền này, nhưng nếu BE trả về quyền thì vẫn ưu tiên owner
  const canManageMembers = isOwner || (isOwner && apiCanManage);
  const canEdit = isOwner || (isOwner && apiCanEdit);
  const canDelete = isOwner || (isOwner && apiCanDelete);
  const showGroupMenu = isOwner;

  // Log quyền của tài khoản trong nhóm (một lần theo group/id)
  useEffect(() => {
    logInfo('StudyGroup permissions', {
      groupId: localGroup.id,
      currentUserId,
      currentUsername,
      ownerId,
      ownerUsername,
      currentRole,
      isOwner,
      isMember,
      flagsFromApi: {
        canManageMembers: localGroup.canManageMembers,
        canEdit: localGroup.canEdit,
        canDelete: localGroup.canDelete,
      },
      derived: {
        canManageMembers,
        canEdit,
        canDelete,
        showGroupMenu,
      },
    });
  }, [
    localGroup.id,
    currentUserId,
    currentUsername,
    ownerId,
    ownerUsername,
    currentRole,
    isOwner,
    isMember,
    canManageMembers,
    canEdit,
    canDelete,
    showGroupMenu,
    localGroup.canManageMembers,
    localGroup.canEdit,
    localGroup.canDelete,
  ]);

  // Debug logs for permission issues (giữ tối thiểu)
  useEffect(() => {
    logInfo('GroupCard permission check', {
      groupId: localGroup.id,
      currentUserId,
      ownerId,
      currentRole,
      isOwner,
      isGroupAdmin,
      canManageMembers,
      canEdit,
      canDelete,
      showGroupMenu,
    });
  }, [localGroup.id, currentUserId, ownerId, currentRole, isOwner, isGroupAdmin, canManageMembers, canEdit, canDelete, showGroupMenu]);
  const commentsLoadedRef = useRef(false);
  const commentCountLoadedRef = useRef(false);

  useEffect(() => {
    const initialCount = getInitialCommentCount(localGroup);
    setCommentCount(initialCount);
    commentCountLoadedRef.current = initialCount > 0;
  }, [localGroup.commentCount, localGroup.commentsCount, localGroup.comments_count, localGroup.comment_count, localGroup.comments, localGroup.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadComments = useCallback(async (reset = true) => {
    // Use a ref to track if we're currently loading to prevent concurrent calls
    if (commentsLoadedRef.current === 'loading' && reset) {
      logInfo('Comments already loading, skipping', { groupId: localGroup.id });
      return;
    }
    
    commentsLoadedRef.current = 'loading';
    setLoadingComments(true);
    
    try {
      // Load all comments from server (no pagination parameters)
      const data = await getStudyGroupComments(localGroup.id);
      
      const fetchedComments = (data.results || []).map(comment => {
        
        // Ensure attachments are properly formatted
        // Check multiple possible field names
        let attachments = comment.attachments || comment.Attachments || comment.ATTACHMENTS || [];
        
        if (!Array.isArray(attachments)) {
          attachments = [];
        }
        
        if (attachments.length > 0) {
          comment.attachments = attachments.map((att, idx) => {
            return {
              id: att.id || att.Id || att.ID || `att-${comment.id}-${idx}`,
              fileName: att.fileName || att.file_name || att.fileName || 'Unknown',
              fileUrl: att.fileUrl || att.file_url || att.url || att.fileUrl,
              fileType: att.fileType || att.file_type || (att.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'document'),
              fileSize: att.fileSize || att.file_size || 0,
              uploadedAt: att.uploadedAt || att.uploaded_at,
            };
          });
        } else {
          comment.attachments = [];
        }
        return comment;
      });
      
      // Store all comments
      setAllComments(fetchedComments);
      
      // Update displayed comments based on current limit
      const currentLimit = reset ? 5 : displayLimit;
      const commentsToDisplay = fetchedComments.slice(0, currentLimit);
      setDisplayedComments(commentsToDisplay);
      
      if (reset) {
        setDisplayLimit(5);
      }
      
      // Update pagination state (client-side)
      setHasMoreComments(fetchedComments.length > currentLimit);
      
      // Update comment count
      if (typeof data.count === 'number') {
        setCommentCount(data.count);
      } else {
        setCommentCount(getInitialCommentCount(localGroup) || fetchedComments.length);
      }
      
      commentsLoadedRef.current = true;
      commentCountLoadedRef.current = true;
    } catch (err) {
      logError('Failed to load comments', {
        groupId: localGroup.id,
        error: err.response?.data,
        status: err.response?.status,
        message: err.message,
      });
      commentsLoadedRef.current = false; // Reset on error to allow retry
    } finally {
      setLoadingComments(false);
      setLoadingMoreComments(false);
    }
  }, [localGroup.id, displayLimit]);

  const loadMoreComments = useCallback(() => {
    // Load 10 more comments (client-side pagination)
    setLoadingMoreComments(true);
    const newLimit = displayLimit + 10;
    setDisplayLimit(newLimit);
    setDisplayedComments(allComments.slice(0, newLimit));
    setHasMoreComments(allComments.length > newLimit);
    setLoadingMoreComments(false);
  }, [displayLimit, allComments]);

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
    if (showComments && allComments.length === 0 && !loadingComments && commentsLoadedRef.current !== true && commentsLoadedRef.current !== 'loading') {
      loadComments(true); // Load all comments
    }
  }, [showComments, allComments.length, loadingComments, loadComments]);

  // Helper functions to update comments state without reloading
  const updateCommentInList = useCallback((commentId, updatedData) => {
    setAllComments((prevComments) => {
      const updated = prevComments.map((comment) => {
        if (comment.id === commentId) {
          // Deep merge để giữ lại các field lồng như reactionCounts
          return {
            ...comment,
            ...updatedData,
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
      });

      const currentLimit = displayLimit || 5;
      setDisplayedComments(updated.slice(0, currentLimit));
      setHasMoreComments(updated.length > currentLimit);

      return updated;
    });
  }, [displayLimit]);

  const updateCommentReaction = useCallback((commentId, reactionType, reactionCounts) => {
    setAllComments((prevComments) => {
      const updated = prevComments.map((comment) => {
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
      });

      const currentLimit = displayLimit || 5;
      setDisplayedComments(updated.slice(0, currentLimit));
      setHasMoreComments(updated.length > currentLimit);

      return updated;
    });
  }, [displayLimit]);

  const removeCommentFromList = useCallback((commentId) => {
    setAllComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));
    setDisplayedComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));
    setCommentCount((prev) => Math.max(0, prev - 1));
    // Update hasMoreComments
    setHasMoreComments(allComments.length - 1 > displayLimit);
  }, [allComments.length, displayLimit]);

  const addCommentToList = useCallback((newComment) => {
    // Add to all comments
    setAllComments((prevComments) => [newComment, ...prevComments]);
    setCommentCount((prev) => prev + 1);
    // Reset display limit and update displayed comments
    setDisplayLimit(5);
    setDisplayedComments((prev) => [newComment, ...prev.slice(0, 4)]);
    setHasMoreComments(true); // Assume there are more comments
  }, []);

  const showErrorDialog = (title, message) => {
    setErrorModal({ title, message });
  };

  const openConfirmDialog = ({ title, message, onConfirm, confirmText = 'Xác nhận', cancelText = 'Hủy' }) => {
    setConfirmDialog({ title, message, onConfirm, confirmText, cancelText });
  };

  const handleFileSelect = (e, isImage = false) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    // Validate file size
    const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for images, 10MB for files
    if (file.size > maxSize) {
      showErrorDialog(
        'File quá lớn',
        isImage ? 'Ảnh không được vượt quá 5MB.' : 'File đính kèm không được vượt quá 10MB.',
      );
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
      console.warn('[File Upload] selectedFiles is empty, aborting upload');
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
      
      // Ensure we have a valid ID - check multiple possible formats
      commentId = comment?.id || comment?.Id || comment?.ID || comment?.data?.id || comment?.data?.Id;
      
      // Backend comment create serializer currently does not return id; fallback: fetch latest comment
      if (!commentId) {
        try {
          const latestComments = await getStudyGroupComments(localGroup.id);
          const newest = latestComments?.results?.[0];
          if (newest?.id) {
            commentId = newest.id;
          }
        } catch (fetchErr) {
          // Ignore error
        }
      }
      
      if (!commentId) {
        // Even if no ID, try to reload comments to get the new comment from server
        commentsLoadedRef.current = false;
        await loadComments(true); // Reload all comments
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
        if (!fileItem?.file) {
          uploadErrors.push({ fileName: '(missing)', error: new Error('Missing file object') });
          continue;
        }
        try {
          const attachment = await uploadCommentAttachment(commentId, fileItem.file);
          
          // Ensure attachment has all required fields
          const formattedAttachment = {
            id: attachment.id || attachment.Id || attachment.ID,
            fileName: attachment.fileName || attachment.file_name || fileItem.file.name,
            fileUrl: attachment.fileUrl || attachment.file_url || attachment.url || attachment.fileUrl,
            fileType: attachment.fileType || attachment.file_type || (fileItem.isImage ? 'image' : 'document'),
            fileSize: attachment.fileSize || attachment.file_size || fileItem.file.size,
            uploadedAt: attachment.uploadedAt || attachment.uploaded_at || new Date().toISOString(),
          };
          
          if (formattedAttachment.id) {
            uploadedAttachments.push(formattedAttachment);
          }
        } catch (err) {
          logError('Failed to upload file', {
            commentId,
            fileName: fileItem.file.name,
            error: err.response?.data,
            status: err.response?.status,
            message: err.message,
          });
          const status = err?.response?.status;
          let userMessage = 'Không thể tải lên file. Vui lòng thử lại.';
          if (status === 413) {
            userMessage = 'File vượt quá giới hạn (ảnh tối đa 5MB, tài liệu tối đa 10MB).';
          } else if (status === 400 && err?.response?.data?.error) {
            userMessage = err.response.data.error;
          }
          showErrorDialog('Lỗi tải file', userMessage);
          uploadErrors.push({ fileName: fileItem.file.name, error: err });
          // Continue with other files even if one fails
        }
      }
    
      // If any upload failed, block posting and clean up the created comment
      if (uploadErrors.length > 0) {
        const failedNames = uploadErrors.map(e => e.fileName).filter(Boolean).join(', ');
        showErrorDialog(
          'Tải file thất bại',
          failedNames
            ? `Các file không tải lên được: ${failedNames}. Bình luận chưa được đăng.`
            : 'Một số file không tải lên được. Bình luận chưa được đăng.'
        );
        // Best-effort cleanup: delete the newly created comment without attachments
        if (commentCreated && commentId) {
          try {
            await deleteComment(commentId);
          } catch (cleanupErr) {
            logError('Failed to delete comment after attachment errors', { commentId, error: cleanupErr });
          }
        }
        setUploadingFile(null);
        setCommentContent('');
        setSelectedFiles([]);
        setImagePreviews([]);
        return;
      }
    
      // If comment was created successfully and uploads succeeded
      if (commentCreated && commentId) {
        // Add comment to list immediately with uploaded attachments
        const camelCasedResult = {
          id: commentId,
          content: comment.content || comment.data?.content || content,
          user: comment.user || comment.data?.user || getAuthenticatedUser(),
          createdAt: comment.createdAt || comment.data?.createdAt || comment.created_at || comment.data?.created_at || new Date().toISOString(),
          updatedAt: comment.updatedAt || comment.data?.updatedAt || comment.updated_at || comment.data?.updated_at || new Date().toISOString(),
          attachments: uploadedAttachments, // Use uploaded attachments initially
          reactions: comment.reactions || comment.data?.reactions || [],
          reactionCounts: comment.reactionCounts || comment.data?.reactionCounts || {},
          userReaction: comment.userReaction || comment.data?.userReaction || null,
          canEdit: comment.canEdit !== false,
          canDelete: comment.canDelete !== false,
        };
        
        addCommentToList(camelCasedResult);
        
        // Reload comments once after uploads complete to ensure sync with server
        setTimeout(async () => {
          commentsLoadedRef.current = false;
          await loadComments(true);
        }, 1500);
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
        await loadComments(true);
        setCommentContent('');
        setSelectedFiles([]);
        setImagePreviews([]);
        setShowComments(true);
      } else {
        const status = err?.response?.status;
        let userMessage = 'Không thể đăng bình luận với file đính kèm. Vui lòng thử lại.';
        if (status === 413) {
          userMessage = 'File vượt quá giới hạn (ảnh tối đa 5MB, tài liệu tối đa 10MB).';
        } else if (status === 400 && err?.response?.data?.error) {
          userMessage = err.response.data.error;
        }
        showErrorDialog('Đăng bình luận thất bại', userMessage);
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
      return;
    }

    try {
      const result = await createComment(localGroup.id, { content: commentContent });
      
      // Ensure we have a valid ID - check multiple possible formats
      const commentId = result?.id || result?.Id || result?.ID || result?.data?.id || result?.data?.Id;
      
      if (!commentId) {
        // Even if no ID, try to reload comments to get the new comment from server
        commentsLoadedRef.current = false;
        await loadComments(true);
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
      
      addCommentToList(camelCasedResult);
      
      // Reload comments after a short delay to ensure sync with server
      setTimeout(async () => {
        commentsLoadedRef.current = false;
        await loadComments(true);
      }, 500);
      
      setCommentContent('');
      setShowComments(true);
    } catch (err) {
      const httpStatus = err.response?.status;
      const errorData = err.response?.data;
      
      // If comment was created (status 201 or 200), reload to get it
      if (httpStatus === 201 || httpStatus === 200) {
        commentsLoadedRef.current = false;
        await loadComments(true);
        setCommentContent('');
        setShowComments(true);
      } else {
        // Check if error response contains comment data
        const commentInError = errorData?.id || errorData?.Id || errorData?.ID;
        if (commentInError) {
          commentsLoadedRef.current = false;
          await loadComments(true);
          setCommentContent('');
          setShowComments(true);
        } else {
          // Try to reload in case it was created
          commentsLoadedRef.current = false;
          await loadComments(true);
          setCommentContent('');
          setShowComments(true);
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
    openConfirmDialog({
      title: 'Xóa thành viên',
      message: 'Bạn có chắc muốn xóa thành viên này khỏi nhóm?',
      confirmText: 'Xóa',
      onConfirm: async () => {
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
          showErrorDialog('Không thể xóa thành viên', 'Vui lòng thử lại.');
          // Revert on error - reload group data
          if (onUpdate) onUpdate();
        }
      },
    });
  };

  const handleLeaveGroup = async () => {
    if (!isMember) {
      alert('Bạn chưa tham gia nhóm này.');
      return;
    }

    if (isOwner) {
      alert('Trưởng nhóm không thể rời nhóm. Bạn có thể chuyển quyền hoặc xóa nhóm.');
      return;
    }

    // Prefer numeric user id from membership to call API
    const targetId = currentMember?.user_id || currentMember?.user?.id || currentUserId;
    if (!targetId) {
      alert('Không thể xác định người dùng hiện tại.');
      return;
    }

    openConfirmDialog({
      title: 'Rời nhóm',
      message: 'Bạn có chắc muốn rời nhóm này?',
      confirmText: 'Rời nhóm',
      onConfirm: async () => {
        logInfo('Member leaving group', { groupId: localGroup.id, userId: targetId });

        // Optimistic update: cập nhật UI ngay
        if (onMemberRemoved) {
          onMemberRemoved(localGroup.id, targetId);
        }
        setLocalGroup((prev) => ({
          ...prev,
          members: (prev.members || []).filter((m) => {
            const memberId = m.user_id || m.user?.id || m.userId || m.user?.userId;
            return !(memberId === targetId || memberId?.toString() === targetId?.toString());
          }),
          memberCount: Math.max(0, (prev.memberCount || 0) - 1),
          isMember: false,
        }));

        try {
          await removeStudyGroupMember(localGroup.id, targetId);
          logInfo('Left group successfully', { groupId: localGroup.id, userId: targetId });
        } catch (err) {
          logError('Failed to leave group', {
            groupId: localGroup.id,
            userId: targetId,
            error: err.response?.data,
            status: err.response?.status,
            message: err.message,
          });
          showErrorDialog('Không thể rời nhóm', 'Vui lòng thử lại.');
          if (onUpdate) onUpdate();
        }
      },
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <>
      <ModalDialog
        isOpen={!!errorModal}
        onClose={() => setErrorModal(null)}
        size="sm"
        hasCloseButton={false}
      >
        <ModalDialog.Header>
          <ModalDialog.Title>{errorModal?.title || 'Thông báo'}</ModalDialog.Title>
        </ModalDialog.Header>
        <ModalDialog.Body>
          {errorModal?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.'}
        </ModalDialog.Body>
        <ModalDialog.Footer>
          <ActionRow>
            <ModalDialog.CloseButton variant="primary" onClick={() => setErrorModal(null)}>
              Đóng
            </ModalDialog.CloseButton>
          </ActionRow>
        </ModalDialog.Footer>
      </ModalDialog>

      <ModalDialog
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        size="sm"
        hasCloseButton
      >
        <ModalDialog.Header>
          <ModalDialog.Title>{confirmDialog?.title || 'Xác nhận'}</ModalDialog.Title>
        </ModalDialog.Header>
        <ModalDialog.Body>
          {confirmDialog?.message || 'Bạn chắc chắn muốn tiếp tục?'}
        </ModalDialog.Body>
        <ModalDialog.Footer>
          <ActionRow>
            <ModalDialog.CloseButton variant="tertiary" onClick={() => setConfirmDialog(null)}>
              {confirmDialog?.cancelText || 'Hủy'}
            </ModalDialog.CloseButton>
            <Button
              variant="danger"
              onClick={async () => {
                const onConfirm = confirmDialog?.onConfirm;
                setConfirmDialog(null);
                if (onConfirm) {
                  await onConfirm();
                }
              }}
            >
              {confirmDialog?.confirmText || 'Xác nhận'}
            </Button>
          </ActionRow>
        </ModalDialog.Footer>
      </ModalDialog>

      <div className={`group-card ${collapsed ? 'collapsed' : ''}`}>
        <div className="group-header">
          <button className="group-collapse-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '▶' : '▼'}
          </button>
          <div className="group-info">
            <h3>{localGroup.name}</h3>
            {isOwner && (
              <Badge variant="primary" className="ms-2">
                Trưởng nhóm
              </Badge>
            )}
            <div className="group-stats">
              <span>👥 {localGroup.memberCount || localGroup.members?.length || 0} thành viên</span>
              {localGroup.streakLength !== undefined && localGroup.streakLength > 0 && (
                <span>🔥 Chuỗi nhóm: {localGroup.streakLength} ngày</span>
              )}
              {localGroup.averageProgress !== undefined && (
                <span>📊 Tiến độ TB: {Math.round(localGroup.averageProgress)}%</span>
              )}
            </div>
          </div>
          <div
            className="group-menu-container"
            data-debug-show-menu={showGroupMenu ? 'true' : 'false'}
            data-debug-can-edit={canEdit ? 'true' : 'false'}
            data-debug-can-delete={canDelete ? 'true' : 'false'}
            data-debug-can-manage={canManageMembers ? 'true' : 'false'}
          >
            {/* Nút cho trưởng nhóm - dùng icon FA cho gọn */}
            {isOwner && (
              <div className="group-menu-inline">
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => setShowEditGroup(true)}
                  title="Sửa nhóm"
                >
                  Sửa nhóm
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => {
                    openConfirmDialog({
                      title: 'Xóa nhóm học tập',
                      message: 'Bạn có chắc muốn xóa nhóm này?',
                      confirmText: 'Xóa nhóm',
                      onConfirm: async () => {
                        const groupId = localGroup.id;
                        
                        // Optimistic update: remove from UI immediately
                        if (onGroupDeleted) {
                          onGroupDeleted(groupId);
                        }
                        
                        try {
                          await deleteStudyGroup(groupId);
                          logInfo('Group deleted successfully', { groupId });
                          if (onUpdate) onUpdate();
                        } catch (err) {
                          logError('Failed to delete group', {
                            groupId,
                            error: err.response?.data,
                            status: err.response?.status,
                            message: err.message,
                          });
                          showErrorDialog('Không thể xóa nhóm', 'Vui lòng thử lại.');
                          if (onUpdate) onUpdate();
                        }
                      },
                    });
                  }}
                  title="Xóa nhóm"
                >
                  Xoá nhóm
                </Button>
              </div>
            )}
            
            {/* Nút cho thành viên (không phải trưởng nhóm) */}
            {isMember && !isOwner && (
              <Button
                size="sm"
                variant="secondary"
                className="ms-2"
                onClick={handleLeaveGroup}
              >
                <span className="fa fa-sign-out me-1" aria-hidden="true" /> Rời nhóm
              </Button>
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
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setShowAddMember(true)}
                    title="Thêm thành viên"
                  >
                    +
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
                            {(() => {
                              const memberId = member.user_id || member.user?.id || member.userId || member.user?.userId;
                              const isLeader = ownerId && memberId && (ownerId === memberId || ownerId?.toString() === memberId?.toString());
                              if (isLeader) {
                                return (
                                  <>
                                    {' '}
                                    <span className="fa fa-crown" style={{ color: '#f59e0b', marginLeft: '4px' }} aria-hidden="true" />
                                  </>
                                );
                              }
                              return null;
                            })()}
                            {(() => {
                              const memberId = member.user_id || member.user?.id || member.userId || member.user?.userId;
                              const isCurrentUser = currentUserId && memberId && (currentUserId === memberId || currentUserId?.toString() === memberId?.toString());
                              if (isCurrentUser) return ' (Bạn)';
                              return null;
                            })()}
                          </div>
                          <div className="member-sub">
                            {member.streakDays !== undefined && member.streakDays > 0 && (
                              <span>🔥 {member.streakDays} ngày</span>
                            )}
                            {member.progress !== undefined && (
                              <span className="ms-2">{Math.round(member.progress)}%</span>
                            )}
                            {(!member.streakDays && !member.progress) && (
                              <span>Tham gia: {formatDate(member.joinedAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="member-actions">
                        {(() => {
                          const memberId = member.user_id || member.user?.id || member.userId || member.user?.userId;
                          const isLeader = ownerId && memberId && (ownerId === memberId || ownerId?.toString() === memberId?.toString());
                          const isCurrentUser = currentUserId && memberId && (currentUserId === memberId || currentUserId?.toString() === memberId?.toString());
                          
                          if (isLeader) {
                            return (
                              <Button size="sm" variant="primary" disabled>
                                Admin
                              </Button>
                            );
                          }
                          if (isCurrentUser && !isOwner) {
                            return (
                              <Button size="sm" variant="secondary" disabled>
                                Thành viên
                              </Button>
                            );
                          }
                          // Chỉ trưởng nhóm mới có quyền xóa thành viên khác
                          if (isOwner && canManageMembers && !isLeader && !isCurrentUser) {
                            return (
                              <>
                                <button
                                  className="post-action-btn"
                                  onClick={() => {/* View profile - TODO */}}
                                  title="Xem hồ sơ"
                                  style={{ border: '1px solid #e5e7f0', background: '#ffffff', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                  👁
                                </button>
                                <button
                                  className="post-action-btn"
                                  onClick={() => handleRemoveMember(null, member)}
                                  title="Xóa khỏi nhóm"
                                  style={{ border: '1px solid #e5e7f0', background: '#ffffff', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                  🗑
                                </button>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  ))}
                  {localGroup.members && localGroup.members.length > 5 && (
                    <div className="member-more">
                      <a href="#" onClick={(e) => { e.preventDefault(); /* TODO: Show all members modal */ }}>
                        ► Xem thêm {localGroup.members.length - 5} thành viên...
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-2">Chưa có thành viên</div>
              )}
            </div>

            {isMember && (
              <>
                <div className="discussion-actions">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => {
                      if (!showComments) {
                        setShowComments(true);
                        loadComments(true);
                      } else {
                        setShowComments(false);
                      }
                    }}
                    className="w-100 discussion-btn"
                    style={{
                      background: '#6c5ce7',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: '600',
                    }}
                  >
                    <span className="fa fa-comments me-2" aria-hidden="true" />
                    Thảo luận
                  </Button>
                </div>
                {showComments && (
                  <div className="discussion-container">
                    <div className="create-post-box">
                  <div className="create-post-input">
                    <div className="user-avatar">
                      {getAuthenticatedUser()?.username?.substring(0, 2).toUpperCase() || 'U'}
                    </div>
                    <FormControl
                      as="textarea"
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

                    <div className="discussion-feed mt-3">
                    {loadingComments ? (
                      <div className="text-center p-3">
                        <Spinner animation="border" />
                      </div>
                    ) : displayedComments.length > 0 ? (
                      <>
                        {displayedComments.map((comment) => (
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
                            openConfirmDialog={openConfirmDialog}
                            showErrorDialog={showErrorDialog}
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
                  </div>
                )}
              </>
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

  // Dựa trên cờ từ BE, mặc định cho phép (giữ tương thích), nhưng vẫn cần user đăng nhập
  const canCreateGroup = (studyGroupsModel.canCreateGroup !== false) && Boolean(currentUserId);

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

  // Fetch group streaks
  const [groupStreaks, setGroupStreaks] = useState([]);
  const [loadingStreaks, setLoadingStreaks] = useState(true);
  
  useEffect(() => {
    const fetchGroupStreaks = async () => {
      if (!courseId) {
        setLoadingStreaks(false);
        return;
      }
      
      setLoadingStreaks(true);
      try {
        const data = await getGroupStreaks(courseId);
        console.log('[StudyGroupsTab] Group streaks data:', data);
        if (data && data.success && data.groups) {
          setGroupStreaks(data.groups);
        } else {
          setGroupStreaks([]);
        }
      } catch (error) {
        console.error('[StudyGroupsTab] Error fetching group streaks:', error);
        setGroupStreaks([]);
      } finally {
        setLoadingStreaks(false);
      }
    };

    fetchGroupStreaks();
  }, [courseId]);

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
            {loadingStreaks ? (
              <div className="group-streaks-loading text-center p-3">
                <Spinner animation="border" size="sm" />
                <span className="ms-2 text-muted">Đang tải chuỗi nhóm...</span>
              </div>
            ) : (
              <GroupStreaks groups={groupStreaks} disableFallback={true} />
            )}
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
