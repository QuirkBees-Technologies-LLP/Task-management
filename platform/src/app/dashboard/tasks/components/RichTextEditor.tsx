'use client';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Popover,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { jwtDecode } from 'jwt-decode';

// Dynamically import ReactQuill to prevent SSR issues
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => null,
});

// Dynamically import Quill CSS only on client
if (typeof window !== 'undefined') {
  require('react-quill/dist/quill.snow.css');
}

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

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Type / for menu',
}) => {
  const theme = useTheme();
  const quillRef = useRef<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionAnchor, setMentionAnchor] = useState<{ el: HTMLElement; index: number } | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [isQuillReady, setIsQuillReady] = useState(false);
  const isInteractingWithPopover = useRef(false);

  // Register Quill MentionBlot only on client side (only once)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use a module-level flag to prevent duplicate registration
    if ((window as any).__quillMentionRegistered) {
      setIsQuillReady(true);
      return;
    }

    const registerQuillBlot = async () => {
      try {
        // Import react-quill to get access to Quill
        const ReactQuillModule = await import('react-quill');
        const ReactQuillDefault = ReactQuillModule.default;
        
        // Access Quill from react-quill
        const Quill = (ReactQuillDefault as any).Quill || (ReactQuillModule as any).Quill;
        
        if (!Quill) {
          setIsQuillReady(true);
          return;
        }
        
        // Check if already registered
        if (Quill.imports && Quill.imports['blots/mention']) {
          (window as any).__quillMentionRegistered = true;
          setIsQuillReady(true);
          return;
        }
        
        // Custom Mention Blot
        const Mention = (Quill as any).import('blots/inline');

        class MentionBlot extends Mention {
          static blotName = 'mention';
          static tagName = 'span';
          static className = 'mention';

          static create(data: { id: string; name: string }) {
            const node = super.create();
            node.setAttribute('data-mention-id', data.id);
            node.setAttribute('data-mention-name', data.name);
            node.setAttribute('contenteditable', 'false');
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

        (Quill as any).register(MentionBlot);
        (window as any).__quillMentionRegistered = true;
        setIsQuillReady(true);
      } catch (error) {
        console.error('Error registering Quill blot:', error);
        // Still set ready to allow editor to render even if mention fails
        setIsQuillReady(true);
      }
    };

    registerQuillBlot();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const token = safeLocalStorageGet(accessTokenKey);
        if (!token) return;

        const decoded: any = jwtDecode(token);
        const canUseAdminUsersApi = decoded?.role === 'Admin' || decoded?.superuser === true;

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
          console.log('Loaded organization users:', staffUsers.length);
          setUsers(staffUsers);
        } else {
          // Only Admins can access /api/users (without currentUser=true). For Regular users,
          // calling it returns 401 which triggers the global "Session expired" logout.
          if (canUseAdminUsersApi) {
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
          } else {
            setUsers([]);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Add keyboard event listener for @ mention detection
  useEffect(() => {
    if (!quillRef.current || !isQuillReady) {
      return;
    }

    const quill = quillRef.current.getEditor();
    if (!quill) return;
    
    const editorEl = quill.root;
    if (!editorEl) return;

    const checkForMention = () => {
      try {
        const selection = quill.getSelection(true);
        if (!selection) {
          setMentionAnchor(null);
          setMentionSearch('');
          return;
        }

        const text = quill.getText();
        const cursorIndex = selection.index;
        const textBeforeCursor = text.substring(0, cursorIndex);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
          const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
          
          // Simple check: if there's no space, newline after @
          if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n') && textAfterAt.length < 50) {
            // Check if we're inside an existing mention by checking the HTML
            // Get the HTML content up to the cursor position
            const htmlContent = quill.root.innerHTML;
            const textUpToCursor = textBeforeCursor;
            
            // Find the position in HTML that corresponds to our text position
            // Simple approach: check if there's a mention tag before the @ symbol
            const htmlBeforeAt = htmlContent.substring(0, htmlContent.indexOf('@') !== -1 ? htmlContent.lastIndexOf('@', htmlContent.indexOf(textUpToCursor)) : 0);
            const isInMention = htmlBeforeAt.includes('data-mention-id') && !htmlBeforeAt.endsWith('>');
            
            if (!isInMention) {
              console.log('✅ Mention detected:', textAfterAt, 'Users available:', users.length);
              setMentionSearch(textAfterAt);
              // Use the editor container as anchor for better positioning
              const editorContainer = editorEl.closest('.ql-container') || editorEl;
              console.log('✅ Setting mention anchor');
              setMentionAnchor({
                el: editorContainer as HTMLElement,
                index: lastAtIndex,
              });
              return;
            } else {
              console.log('❌ Already inside mention tag');
            }
          } else {
            // Space or newline found, hide mentions
            setMentionAnchor(null);
            setMentionSearch('');
          }
        } else {
          // No @ found, hide mentions
          setMentionAnchor(null);
          setMentionSearch('');
        }
      } catch (error) {
        console.error('❌ Error checking for mention:', error);
        // On error, try to show mentions anyway if @ is present
        try {
          const selection = quill.getSelection(true);
          if (selection) {
            const text = quill.getText();
            const cursorIndex = selection.index;
            const textBeforeCursor = text.substring(0, cursorIndex);
            const lastAtIndex = textBeforeCursor.lastIndexOf('@');
            if (lastAtIndex !== -1) {
              const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
              if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n') && textAfterAt.length < 50) {
                setMentionSearch(textAfterAt);
                const editorContainer = editorEl.closest('.ql-container') || editorEl;
                setMentionAnchor({
                  el: editorContainer as HTMLElement,
                  index: lastAtIndex,
                });
                return;
              }
            }
          }
        } catch (fallbackError) {
          console.error('❌ Fallback mention check also failed:', fallbackError);
        }
        setMentionAnchor(null);
        setMentionSearch('');
      }
    };

    // Use Quill's text-change event which is more reliable
    quill.on('text-change', checkForMention);
    quill.on('selection-change', checkForMention);
    
    return () => {
      quill.off('text-change', checkForMention);
      quill.off('selection-change', checkForMention);
    };
  }, [isQuillReady, users]);

  // Add tooltips to toolbar buttons
  useEffect(() => {
    if (!quillRef.current || !isQuillReady) return;

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
  }, [value, isQuillReady]);

  const filteredUsers = useMemo(() => {
    // When just typing @ (no search), show first 20 organization users
    if (!mentionSearch) return users.slice(0, 20);
    
    // When typing letters after @, filter and suggest users
    const search = mentionSearch.toLowerCase();
    return users
      .filter(
        (user) =>
          user.firstName?.toLowerCase().includes(search) ||
          user.lastName?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search) ||
          `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(search)
      )
      .slice(0, 20); // Show up to 20 filtered results
  }, [users, mentionSearch]);

  const handleTextChange = (
    content: string,
    delta: any,
    source: string,
    editor: any
  ) => {
    onChange(content);
    // Note: Mention detection is handled by the useEffect with Quill event listeners
    // This keeps the logic centralized and more reliable
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

  // Don't render ReactQuill until it's ready
  if (!isQuillReady || typeof window === 'undefined') {
    return (
      <Box>
        <EditorContainer>
          <Box sx={{ minHeight: '80px', p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Loading editor...
            </Typography>
          </Box>
        </EditorContainer>
      </Box>
    );
  }

  return (
    <Box>
      <EditorContainer>
        <ReactQuill
          // @ts-ignore - Dynamic import causes ref typing issues, but ref works at runtime
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
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        PaperProps={{
          sx: {
            maxHeight: 400,
            width: 320,
            mt: 0.5,
            overflowY: 'auto',
            zIndex: 1300, // Ensure it's above other elements
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          },
        }}
        sx={{
          zIndex: 1300,
        }}
      >
        <List dense>
          {loadingUsers ? (
            <ListItem>
              <ListItemText primary="Loading organization users..." />
            </ListItem>
          ) : filteredUsers.length > 0 ? (
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
              <ListItemText 
                primary={users.length === 0 ? 'No organization users found' : `No users match "${mentionSearch}"`} 
              />
            </ListItem>
          )}
        </List>
      </Popover>
    </Box>
  );
};

export default RichTextEditor;
