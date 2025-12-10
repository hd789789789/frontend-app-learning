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
const CreateGroupModal = ({ isOpen, onClose, courseId, onSuccess }) => {
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
      logInfo('Study group created successfully', { groupId: result.id, courseId });
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
const EditGroupModal = ({ isOpen, onClose, group, onSuccess }) => {
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
    
    try {
      const result = await updateStudyGroup(group.id, formData);
      logInfo('Study group updated successfully', { groupId: group.id, result });
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
      await addStudyGroupMember(groupId, usernameOrEmail);
      onSuccess();
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
    
    try {
      if (userReaction === reactionType) {
        // Remove reaction
        logInfo('Removing reaction', { commentId: comment.id, reactionType });
        await removeReaction(comment.id);
        logInfo('Reaction removed successfully', { commentId: comment.id });
      } else {
        // Add or change reaction
        logInfo('Adding/changing reaction', { commentId: comment.id, reactionType });
        const result = await addReaction(comment.id, reactionType);
        logInfo('Reaction added/changed successfully', { commentId: comment.id, result });
      }
      onReactionChange();
      setShowPicker(false);
    } catch (err) {
      logError('Failed to handle reaction', {
        commentId: comment.id,
        reactionType,
        error: err.response?.data,
        status: err.response?.status,
        message: err.message,
      });
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
const CommentCard = ({ comment, group, onUpdate, currentUserId, onDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const canEdit = comment.canEdit !== false || comment.user?.id === currentUserId;
  const canDelete = comment.canDelete !== false || comment.user?.id === currentUserId;

  const handleUpdate = async () => {
    setLoading(true);
    logInfo('Updating comment', { commentId: comment.id, content: editContent });
    
    try {
      const result = await updateComment(comment.id, editContent);
      logInfo('Comment updated successfully', { commentId: comment.id, result });
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      logError('Failed to update comment', {
        commentId: comment.id,
        error: err.response?.data,
        status: err.response?.status,
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa bình luận này?')) {
      setLoading(true);
      logInfo('Deleting comment', { commentId: comment.id });
      
      try {
        await deleteComment(comment.id);
        logInfo('Comment deleted successfully', { commentId: comment.id });
        onUpdate();
        if (onDeleted) {
          onDeleted();
        }
      } catch (err) {
        logError('Failed to delete comment', {
          commentId: comment.id,
          error: err.response?.data,
          status: err.response?.status,
          message: err.message,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
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

  const userInitials = comment.user?.username?.substring(0, 2).toUpperCase() || 'U';
  const userColor = `#${(comment.user?.id || 0).toString(16).padStart(6, '0').substring(0, 6)}`;

  return (
    <div className="feed-post">
      <div className="post-header">
        <div className="user-avatar" style={{ background: userColor }}>{userInitials}</div>
        <div className="post-author-info">
          <div className="post-author-name">
            {comment.user?.username || 'Người dùng đã xóa'}
            {comment.user?.id === currentUserId && ' (Bạn)'}
          </div>
          <div className="post-time">{formatDate(comment.createdAt)} • 👥 Nhóm</div>
        </div>
        {(canEdit || canDelete) && (
          <Dropdown>
            <DropdownButton
              id={`comment-menu-${comment.id}`}
              variant="link"
              className="icon-button"
            >
              ⋯
            </DropdownButton>
            <Dropdown.Menu>
              {canEdit && (
                <DropdownItem onClick={() => setIsEditing(true)}>Chỉnh sửa</DropdownItem>
              )}
              {canDelete && (
                <DropdownItem onClick={handleDelete} className="text-danger">Xóa</DropdownItem>
              )}
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>
      
      {isEditing ? (
        <div className="edit-comment-form">
          <FormControl
            as="textarea"
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <div className="d-flex gap-2 mt-2">
            <Button size="sm" onClick={handleUpdate} disabled={loading}>
              Lưu
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}>
              Hủy
            </Button>
          </div>
        </div>
      ) : (
        <div className="post-content">{comment.content}</div>
      )}

      {comment.attachments && comment.attachments.length > 0 && (
        <div className="post-attachments">
          {comment.attachments.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="attachment-link"
            >
              📎 {attachment.fileName}
            </a>
          ))}
        </div>
      )}

      <div className="post-reactions">
        <ReactionPicker comment={comment} onReactionChange={onUpdate} />
        {/* Display all reaction types with counts */}
        {comment.reactionCounts && Object.keys(comment.reactionCounts).length > 0 && (
          <div className="reaction-counts">
            {REACTION_TYPES.map((reaction) => {
              const count = comment.reactionCounts[reaction.type] || 0;
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
const GroupCard = ({ group, courseId, currentUserId, onUpdate }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(group.commentCount || 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [uploadingFile, setUploadingFile] = useState(null);
  const [showComments, setShowComments] = useState(false);

  const ownerId = group.ownerId || group.owner?.id || group.createdById;
  const currentUserKey = currentUserId;
  const isOwner = ownerId && currentUserKey && (ownerId === currentUserKey || ownerId?.toString() === currentUserKey?.toString());
  const currentMember =
    (group.members || []).find((m) => {
      const memberId = m.user?.id;
      const memberUsername = m.user?.username;
      const matchesId =
        currentUserKey &&
        (memberId === currentUserKey || memberId?.toString() === currentUserKey?.toString());
      const matchesUsername =
        (currentUsername && memberUsername && memberUsername.toLowerCase() === currentUsername.toLowerCase()) ||
        (currentUserKey &&
          memberUsername &&
          memberUsername.toLowerCase() === currentUserKey.toString().toLowerCase());
      return matchesId || matchesUsername;
    }) || null;
  const currentRole = currentMember?.role || group.currentUserRole;
  const isGroupAdmin = ['admin', 'owner', 'creator', 'manager'].includes((currentRole || '').toLowerCase());

  const apiCanManage = group.canManageMembers !== false ? (group.canManageMembers ?? false) : false;
  const apiCanEdit = group.canEdit !== false ? (group.canEdit ?? false) : false;
  const apiCanDelete = group.canDelete !== false ? (group.canDelete ?? false) : false;

  const canManageMembers = apiCanManage || apiCanEdit || apiCanDelete || isOwner || isGroupAdmin;
  const canEdit = apiCanEdit || canManageMembers || isOwner || isGroupAdmin;
  const canDelete = apiCanDelete || canManageMembers || isOwner || isGroupAdmin;
  const showGroupMenu = canEdit || canDelete || canManageMembers;

  // Debug logs for permission issues
  useEffect(() => {
    const payload = {
      groupId: group.id,
      currentUserId,
      ownerId,
      currentRole,
      isOwner,
      isGroupAdmin,
      flags: {
        canManageMembersFromApi: group.canManageMembers,
        canEditFromApi: group.canEdit,
        canDeleteFromApi: group.canDelete,
      },
      derived: { canManageMembers, canEdit, canDelete, showGroupMenu },
    };
    logInfo('GroupCard permission check', payload);
    // Fallback console log to ensure visibility when logInfo is filtered
    // eslint-disable-next-line no-console
    console.log('[GroupCard permission check]', payload);
  }, [group.id, currentUserId, ownerId, currentRole, isOwner, isGroupAdmin, canManageMembers, canEdit, canDelete, showGroupMenu, group.canManageMembers, group.canEdit, group.canDelete]);
  const isMember = group.isMember;
  const commentsLoadedRef = useRef(false);

  useEffect(() => {
    setCommentCount(group.commentCount || comments.length || 0);
  }, [group.commentCount, group.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadComments = useCallback(async () => {
    // Use a ref to track if we're currently loading to prevent concurrent calls
    if (commentsLoadedRef.current === 'loading') {
      logInfo('Comments already loading, skipping', { groupId: group.id });
      return;
    }
    
    commentsLoadedRef.current = 'loading';
    setLoadingComments(true);
    logInfo('Loading comments', { groupId: group.id });
    
    try {
      const data = await getStudyGroupComments(group.id);
      logInfo('Comments loaded successfully', { groupId: group.id, count: data.results?.length || 0 });
      const fetchedComments = data.results || [];
      setComments(fetchedComments);
      setCommentCount(typeof data.count === 'number' ? data.count : fetchedComments.length);
      commentsLoadedRef.current = true;
    } catch (err) {
      logError('Failed to load comments', {
        groupId: group.id,
        error: err.response?.data,
        status: err.response?.status,
        message: err.message,
      });
      commentsLoadedRef.current = false; // Reset on error to allow retry
    } finally {
      setLoadingComments(false);
    }
  }, [group.id]);

  useEffect(() => {
    if (showComments && comments.length === 0 && !loadingComments && commentsLoadedRef.current !== true && commentsLoadedRef.current !== 'loading') {
      loadComments();
    }
  }, [showComments, comments.length, loadingComments, loadComments]);

  const handleAddComment = async () => {
    if (!commentContent.trim()) {
      logInfo('Comment content is empty, skipping');
      return;
    }

    logInfo('Adding comment', { groupId: group.id, contentLength: commentContent.length });
    
    try {
      const result = await createComment(group.id, { content: commentContent });
      logInfo('Comment added successfully', { groupId: group.id, commentId: result.id });
      setCommentContent('');
      setShowComments(true);
      setComments((prev) => [result, ...prev]);
      setCommentCount((prev) => prev + 1);
      commentsLoadedRef.current = true;
    } catch (err) {
      logError('Failed to add comment', {
        groupId: group.id,
        error: err.response?.data,
        status: err.response?.status,
        message: err.message,
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      logInfo('No file selected for upload');
      return;
    }

    logInfo('Uploading file attachment', { 
      groupId: group.id, 
      fileName: file.name, 
      fileSize: file.size,
      fileType: file.type 
    });

    // Create comment first, then upload attachment
    try {
      const comment = await createComment(group.id, { content: commentContent || 'Đã đính kèm file' });
      logInfo('Comment created for attachment', { commentId: comment.id });
      
      setUploadingFile(true);
      const attachment = await uploadCommentAttachment(comment.id, file);
      logInfo('File uploaded successfully', { 
        commentId: comment.id, 
        attachmentId: attachment.id,
        fileName: attachment.fileName 
      });
      
      setCommentContent('');
      setUploadingFile(null);
      e.target.value = '';
      commentsLoadedRef.current = true;
      setShowComments(true);
      setCommentCount((prev) => prev + 1);
      setComments((prev) => [{ ...comment, attachments: [attachment] }, ...prev]);
    } catch (err) {
      logError('Failed to upload file', {
        groupId: group.id,
        fileName: file.name,
        error: err.response?.data,
        status: err.response?.status,
        message: err.message,
      });
      setUploadingFile(null);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Bạn có chắc muốn xóa thành viên này khỏi nhóm?')) {
      logInfo('Removing member from group', { groupId: group.id, userId });
      
      try {
        await removeStudyGroupMember(group.id, userId);
        logInfo('Member removed successfully', { groupId: group.id, userId });
        onUpdate();
      } catch (err) {
        logError('Failed to remove member', {
          groupId: group.id,
          userId,
          error: err.response?.data,
          status: err.response?.status,
          message: err.message,
        });
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
            <h3>{group.name}</h3>
            <div className="group-stats">
              <span>👥 {group.memberCount || 0} thành viên</span>
              <span>📅 Tạo: {formatDate(group.createdAt)}</span>
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
              <Dropdown>
                <DropdownButton
                  id={`group-menu-${group.id}`}
                  variant="link"
                  className="group-menu-btn"
                  aria-label="Mở menu nhóm"
                >
                  ⋮
                </DropdownButton>
                <Dropdown.Menu align="end" renderMenuOnMount className="group-menu-dropdown">
                  {canEdit && (
                    <DropdownItem onClick={() => setShowEditGroup(true)}>
                      Chỉnh sửa
                    </DropdownItem>
                  )}
                  {canDelete && (
                    <DropdownItem 
                      onClick={async () => {
                        if (window.confirm('Bạn có chắc muốn xóa nhóm này?')) {
                          try {
                            await deleteStudyGroup(group.id);
                            onUpdate();
                          } catch (err) {
                            logError(err);
                          }
                        }
                      }}
                      className="text-danger"
                    >
                      Xóa nhóm
                    </DropdownItem>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            )}
          </div>
        </div>

        {collapsed && (
          <div className="collapsed-group-summary">
            <div className="collapsed-stat">
              <span>👥</span>
              <strong>{group.memberCount || 0}</strong>
              <span>thành viên</span>
            </div>
            <div className="collapsed-stat">
              <span>📅</span>
              <strong>{formatDate(group.createdAt)}</strong>
            </div>
          </div>
        )}

        {!collapsed && (
          <>
            <div className="group-subtitle">{group.description || 'Chưa có mô tả'}</div>

            <div className="members-block">
              <div className="members-head">
                <span>Thành viên ({group.memberCount || 0})</span>
                {canManageMembers && (
                  <Button size="sm" variant="primary" onClick={() => setShowAddMember(true)}>
                    + Thêm
                  </Button>
                )}
              </div>
                  {group.members && group.members.length > 0 ? (
                <div className="members-list">
                  {group.members.slice(0, 5).map((member) => (
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
                          onClick={() => handleRemoveMember(member.user.id)}
                          title="Xóa khỏi nhóm"
                        >
                          🗑️
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
                  <div className="create-post-actions">
                    <label className="post-action-btn" title="Thêm ảnh">
                      📷
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                    </label>
                    <label className="post-action-btn" title="Thêm file">
                      📎
                      <input
                        type="file"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                    </label>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!commentContent.trim() || uploadingFile}
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
                      comments.map((comment) => (
                        <CommentCard
                          key={comment.id}
                          comment={comment}
                          group={group}
                          onUpdate={() => {
                            commentsLoadedRef.current = false;
                            // Reload comments after reaction/update/delete
                            if (showComments) {
                              loadComments();
                            }
                          }}
                          currentUserId={currentUserId}
                          onDeleted={() => setCommentCount((prev) => Math.max(0, prev - 1))}
                        />
                      ))
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
        groupId={group.id}
        onSuccess={() => {
          onUpdate();
          setShowAddMember(false);
        }}
      />

      <EditGroupModal
        isOpen={showEditGroup}
        onClose={() => setShowEditGroup(false)}
        group={group}
        onSuccess={() => {
          onUpdate();
          setShowEditGroup(false);
        }}
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

  const groups = useMemo(() => {
    if (studyGroupsModel.results && studyGroupsModel.results.length > 0) {
      return studyGroupsModel.results;
    }
    return [];
  }, [studyGroupsModel.results]);

  // Get permission to create group from model
  const canCreateGroup = studyGroupsModel.canCreateGroup !== false; // Default to true if not set (for backward compatibility)

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
      />
    </Container>
  );
};

export default StudyGroupsTab;
