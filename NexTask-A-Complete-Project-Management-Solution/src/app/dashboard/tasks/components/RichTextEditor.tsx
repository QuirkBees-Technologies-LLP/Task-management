'use client';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Box,
  Paper,
  Popover,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  useTheme,
  Stack,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';

const EditorContainer = styled(Box)(({ theme }) => ({
  '& .ql-container': {
    fontFamily: theme.typography.fontFamily,
    fontSize: '14px',
    minHeight: '80px',
    maxHeight: '200px',
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    overflowY: 'auto',
    borderBottomLeftRadius: theme.shape.borderRadius,
    borderBottomRightRadius: theme.shape.borderRadius,
    borderColor: theme.palette.divider,
  },
  '& .ql-editor': {
    minHeight: '80px',
    color: theme.palette.text.primary,
    '&.ql-blank::before': {
      fontStyle: 'normal',
      color: theme.palette.text.disabled,
    },
    '& .mention': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.3)' : '#e3f2fd',
      padding: '2px 6px',
      borderRadius: '4px',
      color: theme.palette.primary.main,
      fontWeight: 500,
      cursor: 'default',
    },
  },
  '& .ql-toolbar': {
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
    '& .ql-stroke': {
      stroke: theme.palette.text.primary,
    },
    '& .ql-fill': {
      fill: theme.palette.text.primary,
    },
    '& .ql-picker-label': {
      color: theme.palette.text.primary,
    },
    // Tooltip styles
    '& .ql-tooltip': {
      position: 'absolute',
      backgroundColor: '#424242',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 1000,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        border: '6px solid transparent',
        borderTopColor: '#424242',
      },
    },
    '& button': {
      position: 'relative',
      '&[data-tooltip]:hover::before': {
        content: 'attr(data-tooltip)',
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#424242',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
        whiteSpace: 'pre-line',
        textAlign: 'center',
        zIndex: 10000,
        pointerEvents: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        minWidth: '120px',
        lineHeight: '1.4',
      },
      '&[data-tooltip]:hover::after': {
        content: '""',
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        border: '6px solid transparent',
        borderTopColor: '#424242',
        zIndex: 10001,
        pointerEvents: 'none',
      },
    },
    '& .ql-picker': {
      position: 'relative',
      '&[data-tooltip]:hover::before': {
        content: 'attr(data-tooltip)',
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#424242',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
        whiteSpace: 'pre-line',
        textAlign: 'center',
        zIndex: 10000,
        pointerEvents: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        minWidth: '120px',
        lineHeight: '1.4',
      },
      '&[data-tooltip]:hover::after': {
        content: '""',
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        border: '6px solid transparent',
        borderTopColor: '#424242',
        zIndex: 10001,
        pointerEvents: 'none',
      },
    },
  },
}));

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onAddAttachment?: (attachment: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize?: number;
    attachmentType: 'file' | 'url' | 'google_drive' | 'onedrive' | 'box' | 'dropbox';
  }) => void;
}

// Custom Mention Blot
const Mention = Quill.import('blots/inline');

class MentionBlot extends Mention {
  static blotName = 'mention';
  static tagName = 'span';
  static className = 'mention';

  static create(data: { id: string; name: string }) {
    const node = super.create();
    node.setAttribute('data-mention-id', data.id);
    node.setAttribute('data-mention-name', data.name);
    node.setAttribute('contenteditable', 'false');
    // Don't set textContent here - it will be set by Quill's insertText
    node.style.backgroundColor = '#e3f2fd';
    node.style.padding = '2px 4px';
    node.style.borderRadius = '3px';
    node.style.color = '#1976d2';
    return node;
  }

  static value(node: HTMLElement) {
    return {
      id: node.getAttribute('data-mention-id'),
      name: node.getAttribute('data-mention-name'),
    };
  }
}

Quill.register(MentionBlot);

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Type / for menu',
  onAddAttachment,
}) => {
  const theme = useTheme();
  const quillRef = useRef<ReactQuill>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionAnchor, setMentionAnchor] = useState<{ el: HTMLElement; index: number } | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add tooltips to toolbar buttons
  useEffect(() => {
    if (!quillRef.current) return;

    const toolbar = quillRef.current.getEditor().getModule('toolbar').container;
    if (!toolbar) return;

    // Tooltip mappings with keyboard shortcuts
    const tooltipMap: { [key: string]: { name: string; shortcut?: string } } = {
      'ql-bold': { name: 'Bold', shortcut: 'Ctrl+B' },
      'ql-italic': { name: 'Italic', shortcut: 'Ctrl+I' },
      'ql-underline': { name: 'Underline', shortcut: 'Ctrl+U' },
      'ql-strike': { name: 'Strikethrough', shortcut: 'Ctrl+Shift+X' },
      'ql-list[value="ordered"]': { name: 'Ordered List', shortcut: 'Ctrl+Shift+7' },
      'ql-list[value="bullet"]': { name: 'Bullet List', shortcut: 'Ctrl+Shift+8' },
      'ql-list[value="check"]': { name: 'Checklist', shortcut: 'Ctrl+Shift+9' },
    };

    const showTooltip = (e: MouseEvent, name: string, shortcut?: string) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setTooltip({
        text: shortcut ? `${name}\n${shortcut}` : name,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    };

    const hideTooltip = () => {
      setTooltip(null);
    };

    // Add tooltips to buttons
    const buttons = toolbar.querySelectorAll('button');
    buttons.forEach((button) => {
      let tooltipText = '';
      let tooltipName = '';
      let tooltipShortcut = '';
      
      for (const [selector, tooltip] of Object.entries(tooltipMap)) {
        if (selector.includes('[')) {
          const [baseClass, attr] = selector.split('[');
          const [attrName, attrValue] = attr.replace(']', '').split('=');
          const value = attrValue.replace(/"/g, '');
          
          if (button.classList.contains(baseClass) && button.getAttribute(attrName) === value) {
            tooltipName = tooltip.name;
            tooltipShortcut = tooltip.shortcut || '';
            tooltipText = tooltip.shortcut 
              ? `${tooltip.name}\n${tooltip.shortcut}` 
              : tooltip.name;
            break;
          }
        } else if (button.classList.contains(selector)) {
          tooltipName = tooltip.name;
          tooltipShortcut = tooltip.shortcut || '';
          tooltipText = tooltip.shortcut 
            ? `${tooltip.name}\n${tooltip.shortcut}` 
            : tooltip.name;
          break;
        }
      }

      if (tooltipText) {
        button.setAttribute('data-tooltip-name', tooltipName);
        button.setAttribute('data-tooltip-shortcut', tooltipShortcut);
        button.addEventListener('mouseenter', (e) => showTooltip(e, tooltipName, tooltipShortcut));
        button.addEventListener('mouseleave', hideTooltip);
      }
    });

    // Add tooltip to header picker
    const headerPicker = toolbar.querySelector('.ql-header');
    if (headerPicker) {
      const pickerButton = headerPicker.querySelector('button') || headerPicker;
      pickerButton.addEventListener('mouseenter', (e) => showTooltip(e, 'Text Style'));
      pickerButton.addEventListener('mouseleave', hideTooltip);
    }

    return () => {
      buttons.forEach((button) => {
        button.removeEventListener('mouseenter', showTooltip as any);
        button.removeEventListener('mouseleave', hideTooltip);
      });
      if (headerPicker) {
        const pickerButton = headerPicker.querySelector('button') || headerPicker;
        pickerButton.removeEventListener('mouseenter', showTooltip as any);
        pickerButton.removeEventListener('mouseleave', hideTooltip);
      }
    };
  }, [value]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const response = await axios.get('/api/staff?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const staffUsers = (response.data.staff || []).map((s: any) => ({
          _id: s._id,
          firstName: s.firstName || '',
          lastName: s.lastName || '',
          email: s.email || '',
          role: s.role || '',
        }));
        setUsers(staffUsers);
      } else {
        // Fallback to users API
        const usersResponse = await axios.get('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (Array.isArray(usersResponse.data)) {
          const usersList = usersResponse.data.map((u: any) => ({
            _id: typeof u._id === 'string' ? u._id : (u._id?.toString() || ''),
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            email: u.email || '',
            role: u.role || '',
          }));
          setUsers(usersList);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!mentionSearch) return users.slice(0, 5);
    const search = mentionSearch.toLowerCase();
    return users
      .filter(
        (user) =>
          user.firstName?.toLowerCase().includes(search) ||
          user.lastName?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search)
      )
      .slice(0, 5);
  }, [users, mentionSearch]);

  const handleTextChange = (content: string, delta: any, source: string, editor: ReactQuill.UnprivilegedEditor) => {
    onChange(content);

    if (source === 'user') {
      const selection = editor.getSelection();
      if (selection) {
        const text = editor.getText();
        const cursorIndex = selection.index;
        const textBeforeCursor = text.substring(0, cursorIndex);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
          const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
          // Check if there's no space or newline after @ (meaning we're still typing the mention)
          if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n') && textAfterAt.length < 50) {
            // Show mention suggestions
            setMentionSearch(textAfterAt);
            const quill = quillRef.current?.getEditor();
            if (quill) {
              const editorEl = quill.root;
              setMentionAnchor({
                el: editorEl,
                index: lastAtIndex,
              });
            }
            return;
          }
        }
      }
    }

    setMentionAnchor(null);
    setMentionSearch('');
  };

  const handleMentionSelect = (user: User) => {
    if (!mentionAnchor) return;

    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    // Get current selection or set to end of document
    let selection = quill.getSelection(true);
    if (!selection) {
      const length = quill.getLength();
      selection = { index: length, length: 0 };
    }

    const text = quill.getText();
    const cursorIndex = selection.index;
    const textBeforeCursor = text.substring(0, cursorIndex);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const deleteLength = textAfterAt.length + 1; // +1 for '@'

      // Delete the @ and text after it
      quill.deleteText(lastAtIndex, deleteLength, 'user');
      
      // Insert the mention text with format
      // Quill's insertText signature: insertText(index, text, format, value, source)
      const mentionText = `@${user.firstName} ${user.lastName}`;
      quill.insertText(
        lastAtIndex,
        mentionText,
        'mention',
        {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
        },
        'user'
      );
      
      // Move cursor after the mention
      quill.setSelection({ index: lastAtIndex + mentionText.length, length: 0 }, 'user');
    }

    setMentionAnchor(null);
    setMentionSearch('');
  };


  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
        ],
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'ordered',
    'mention',
  ];

  return (
    <Box>
      <EditorContainer>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleTextChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
        />
        {tooltip && (
          <Box
            sx={{
              position: 'fixed',
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translate(-50%, -100%)',
              backgroundColor: '#424242',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              zIndex: 10000,
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              minWidth: '140px',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                border: '6px solid transparent',
                borderTopColor: '#424242',
              },
            }}
          >
            <Box sx={{ textAlign: 'center', mb: tooltip.text.includes('\n') ? 1 : 0 }}>
              {tooltip.text.split('\n')[0]}
            </Box>
            {tooltip.text.includes('\n') && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  justifyContent: 'center',
                  alignItems: 'center',
                  mt: 0.5,
                }}
              >
                {tooltip.text.split('\n')[1].split('+').map((key, idx, arr) => (
                  <React.Fragment key={idx}>
                    <Box
                      sx={{
                        backgroundColor: '#616161',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {key.trim()}
                    </Box>
                    {idx < arr.length - 1 && (
                      <Box sx={{ color: '#fff', fontSize: '12px' }}>+</Box>
                    )}
                  </React.Fragment>
                ))}
              </Box>
            )}
          </Box>
        )}
      </EditorContainer>

      {/* Mention hint */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '11px' }}>
          Type @ to mention users
        </Typography>
      </Box>

      {/* Mention Suggestions Popover */}
      <Popover
        open={Boolean(mentionAnchor)}
        anchorEl={mentionAnchor?.el}
        onClose={() => {
          setMentionAnchor(null);
          setMentionSearch('');
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            maxHeight: 300,
            width: 300,
            mt: 0.5,
          },
        }}
      >
        <List dense>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <ListItem
                key={user._id}
                component="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMentionSelect(user);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '12px' }}>
                    {user.firstName?.[0] || ''}
                    {user.lastName?.[0] || ''}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${user.firstName || ''} ${user.lastName || ''}`}
                  secondary={user.email}
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No users found" />
            </ListItem>
          )}
        </List>
      </Popover>
    </Box>
  );
};

export default RichTextEditor;

