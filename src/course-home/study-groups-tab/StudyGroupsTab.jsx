import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { 
  Badge, 
  Container, 
  ProgressBar, 
  Row, 
  Col, 
  Button,
  Modal,
  Form,
  FormGroup,
  FormControl,
  Alert,
  Dropdown,
  DropdownButton,
  DropdownItem,
  Spinner,
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
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo nhóm học tập mới" size="md">
      <Form onSubmit={handleSubmit}>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
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
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Tạo nhóm
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

// Add Member Modal
const AddMemberModal = ({ isOpen, onClose, groupId, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    logInfo('Adding member to study group', { groupId, username });
    
    try {
      // Note: API expects user ID, but we'll use username for now
      // You may need to adjust based on your API
      const result = await addStudyGroupMember(groupId, username);
      logInfo('Member added successfully', { groupId, username, result });
      setUsername('');
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Có lỗi xảy ra khi thêm thành viên';
      logError('Failed to add member', {
        groupId,
        username,
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
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm thành viên" size="md">
      <Form onSubmit={handleSubmit}>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
        <FormGroup>
          <FormControl
            type="text"
            placeholder="Username hoặc Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </FormGroup>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Thêm
          </Button>
        </div>
      </Form>
    </Modal>
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
            <span>{comment.reactionCounts?.[userReaction] || 0}</span>
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
const CommentCard = ({ comment, group, onUpdate, currentUserId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const canEdit = comment.canEdit || comment.user?.id === currentUserId;
  const canDelete = comment.canDelete || comment.user?.id === currentUserId;

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
        <button className="reaction-btn">
          <span>💬</span>
          <span>{comment.repliesCount || 0} bình luận</span>
        </button>
      </div>
    </div>
  );
};

// Group Card Component
const GroupCard = ({ group, courseId, currentUserId, onUpdate }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [uploadingFile, setUploadingFile] = useState(null);
  const [showComments, setShowComments] = useState(false);

  const canEdit = group.canEdit;
  const canDelete = group.canDelete;
  const canManageMembers = group.canManageMembers;
  const isMember = group.isMember;
  const commentsLoadedRef = useRef(false);

  const loadComments = useCallback(async () => {
    if (loadingComments) {
      logInfo('Comments already loading, skipping', { groupId: group.id });
      return;
    }
    
    setLoadingComments(true);
    logInfo('Loading comments', { groupId: group.id });
    
    try {
      const data = await getStudyGroupComments(group.id);
      logInfo('Comments loaded successfully', { groupId: group.id, count: data.results?.length || 0 });
      setComments(data.results || []);
      commentsLoadedRef.current = true;
    } catch (err) {
      logError('Failed to load comments', {
        groupId: group.id,
        error: err.response?.data,
        status: err.response?.status,
        message: err.message,
      });
    } finally {
      setLoadingComments(false);
    }
  }, [group.id]);

  useEffect(() => {
    if (showComments && comments.length === 0 && !loadingComments && !commentsLoadedRef.current) {
      loadComments();
    }
  }, [showComments, loadComments]);

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
      commentsLoadedRef.current = false; // Reset to allow reload
      loadComments();
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
      commentsLoadedRef.current = false; // Reset to allow reload
      loadComments();
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
          <div className="group-menu-container">
            {(canEdit || canDelete) && (
              <Dropdown>
                <DropdownButton
                  id={`group-menu-${group.id}`}
                  variant="link"
                  className="group-menu-btn"
                >
                  ⋮
                </DropdownButton>
                <Dropdown.Menu>
                  {canEdit && (
                    <DropdownItem onClick={() => {/* TODO: Edit modal */}}>
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
                        <div className="member-avatar">
                          {member.user?.username?.substring(0, 2).toUpperCase() || 'U'}
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
                      const newShowComments = !showComments;
                      setShowComments(newShowComments);
                      if (newShowComments && !commentsLoadedRef.current) {
                        loadComments();
                      }
                    }}
                  >
                    💬 {showComments ? 'Ẩn' : 'Xem'} thảo luận ({comments.length})
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
                            loadComments();
                          }}
                          currentUserId={currentUserId}
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
  const currentUserId = currentUser?.id;

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

    if (courseId && (!welcomeModel.userStats || !welcomeModel.success) && !welcomeFetchedRef.current) {
      logInfo('Fetching welcome tab data', { courseId });
      dispatch(fetchWelcomeTab(courseId));
      welcomeFetchedRef.current = true;
    }
  }, [courseId, dispatch]);

  // Track last courseId to reset state when course changes
  const lastCourseIdRef = useRef(null);
  
  // Reset fetch state when courseId changes
  useEffect(() => {
    if (courseId && lastCourseIdRef.current !== courseId) {
      logInfo('Course ID changed, resetting fetch state', { 
        oldCourseId: lastCourseIdRef.current, 
        newCourseId: courseId 
      });
      hasInitialFetchedRef.current = false;
      lastCourseIdRef.current = courseId;
    }
  }, [courseId]);

  // Initial fetch - only once per course
  useEffect(() => {
    if (!courseId) return;
    
    // Only fetch if we haven't fetched for this course yet
    if (!hasInitialFetchedRef.current) {
      logInfo('Fetching study groups data (initial)', { courseId });
      hasInitialFetchedRef.current = true; // Set flag BEFORE dispatch to prevent re-triggering
      dispatch(fetchStudyGroupsTab(courseId));
    }
  }, [courseId]); // Remove dispatch from dependencies - it's stable from Redux

  // Explicit refresh - only when refreshKey changes and is > 0
  const lastRefreshKeyRef = useRef(0);
  const refreshTimeoutRef = useRef(null);
  
  useEffect(() => {
    if (!courseId) return;
    
    if (refreshKey > 0 && refreshKey !== lastRefreshKeyRef.current) {
      // Clear any pending refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Debounce refresh to prevent rapid successive calls
      refreshTimeoutRef.current = setTimeout(() => {
        logInfo('Refreshing study groups (refreshKey changed)', { 
          courseId, 
          refreshKey, 
          lastRefreshKey: lastRefreshKeyRef.current 
        });
        dispatch(fetchStudyGroupsTab(courseId));
        lastRefreshKeyRef.current = refreshKey;
      }, 300); // 300ms debounce
    }
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [courseId, dispatch, refreshKey]);

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
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              + Tạo nhóm mới
            </Button>
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
                  <p>Chưa có nhóm học tập nào. Hãy tạo nhóm mới để bắt đầu!</p>
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
