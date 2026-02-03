const ICONS = {
    LOGIN: '<svg class="fedi-icon" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 8l4 4l-4 4"/><path d="M4 12h14"/><path d="M10 4h-3a3 3 0 0 0 -3 3v10a3 3 0 0 0 3 3h3"/></svg>',
    MESSAGE: '<svg class="fedi-icon" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 9h8"/><path d="M8 13h6"/><path d="M5 5h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-9l-5 4v-4h-1a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2z"/></svg>',
    INFO: '<svg class="fedi-icon" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="12" y1="7" x2="12.01" y2="7"/></svg>',
    REPLY: '<svg class="fedi-icon" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 15l-4 -4l4 -4"/><path d="M5 11h9a4 4 0 0 1 4 4v2"/></svg>',
    HEART: '<svg class="fedi-icon" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 12.5l-7.5 7.5l-7.5 -7.5a5 5 0 1 1 7.5 -6.5a5 5 0 1 1 7.5 6.5"/></svg>',
}

class FediComments extends HTMLElement {
  connectedCallback() {
    const host = this.getAttribute('host');
    const id = this.getAttribute('id');
    this.commentLimit = 20;
    this.maxDepth = 3;
    if (!host || !id) {
      this.innerHTML = '<p>Missing host or id for fedi comments</p>';
      return;
    }

    // Handle OAuth callback
    this.handleOAuthCallback();
    
    this.fetchComments(host, id);
  }

  async handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (!code) return;
    
    const clientData = JSON.parse(localStorage.getItem('fedi_client_data'));
    if (!clientData) return;
    
    try {
      // Exchange code for token
      const tokenResponse = await fetch(`https://${clientData.instance}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientData.client_id,
          client_secret: clientData.client_secret,
          redirect_uri: window.location.origin + window.location.pathname,
          grant_type: 'authorization_code',
          code: code,
          scope: 'read write'
        })
      });
      
      if (!tokenResponse.ok) throw new Error('Failed to get token');
      
      const tokenData = await tokenResponse.json();
      localStorage.setItem('fedi_access_token', tokenData.access_token);
      
      // Get user info
      const userResponse = await fetch(`https://${clientData.instance}/api/v1/accounts/verify_credentials`, {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      });
      
      if (!userResponse.ok) throw new Error('Failed to get user data');
      
      const userData = await userResponse.json();
      localStorage.setItem('fedi_user_data', JSON.stringify(userData));
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      location.reload();
    } catch (error) {
      console.error('OAuth callback error:', error);
      localStorage.removeItem('fedi_client_data');
    }
  }


  async fetchComments(host, id) {
    try {
      const url = `https://${host}/api/v1/statuses/${id}/context`;
      const options = {};
      
      // If logged in, include auth token to get accurate favourited status
      if (this.isLoggedIn()) {
        const token = localStorage.getItem('fedi_access_token');
        options.headers = {
          'Authorization': `Bearer ${token}`
        };
      }
      
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      this.render(data, host);
    } catch (error) {
      this.innerHTML = `<p class="fedi-error">Failed to load comments: ${error.message}</p>`;
      console.error('Fedi comments error:', error);
    }
  }
  
  /**
   * 
   * @param {object} data - { ancestors: [], descendants: [] } 
   * @param {string} host - Mastodon instance host (e.g., mastodon.social)
   */
  render(data, host) {
    const { ancestors = [], descendants = [] } = data;
    const allComments = [...ancestors, ...descendants];
    const postUrl = `https://${host}/statuses/${this.getAttribute('id')}`;

    let html = '<div class="fedi-comments-container">';
    html += '<h2>Comments</h2>';
    
    html += this.renderLeaveComment(postUrl, host);
    
    if (allComments.length === 0) {
      html += '<p class="fedi-no-comments">No comments yet. Be the first to comment!</p>';
    } else {
      html += '<div class="fedi-comments-thread">';
      
      const commentTree = this.buildCommentTree(allComments);
      
      // Render top-level comments
      const postId = this.getAttribute('id');
      let commentCount = 0;
      commentTree.forEach(comment => {
        if (comment.in_reply_to_id === postId) {
          if (this.commentLimit <= 0 || commentCount < this.commentLimit) {
            html += this.renderCommentWithReplies(comment, commentTree, 0);
            commentCount++;
          }
        }
      });
      
      html += '</div>';
    }
    
    html += `<p class="fedi-comments-footer"><a href="${postUrl}" target="_blank" rel="noopener noreferrer">View on Mastodon</a></p>`;
    html += '</div>';

    this.innerHTML = html;
  }

  buildCommentTree(comments) {
    // Create a map of comments by ID
    const commentMap = {};
    comments.forEach(comment => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });
    
    // Build parent-child relationships
    comments.forEach(comment => {
      if (comment.in_reply_to_id && commentMap[comment.in_reply_to_id]) {
        commentMap[comment.in_reply_to_id].replies.push(commentMap[comment.id]);
      }
    });
    
    return Object.values(commentMap);
  }

  renderCommentWithReplies(comment, commentTree, depth) {
    const isNested = depth > 0;
    
    let html = `<div class="fedi-comment-wrapper ${isNested ? 'fedi-comment-nested' : ''}" style="--depth: ${Math.min(depth, this.maxDepth)}">`;
    html += this.renderComment(comment);
    
    // Render replies (only if not at max depth)
    if (comment.replies && comment.replies.length > 0 && depth < this.maxDepth) {
      html += '<div class="fedi-comment-replies">';
      comment.replies.forEach(reply => {
        html += this.renderCommentWithReplies(reply, commentTree, depth + 1);
      });
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  }

  renderLeaveComment(postUrl, host) {
    const isLoggedIn = this.isLoggedIn();
    const userData = this.getUserData();

    return `
      <fedi-comment-composer
        post-url="${postUrl}"
        logged-in="${isLoggedIn ? 'true' : 'false'}"
        user-data='${isLoggedIn ? JSON.stringify(userData).replace(/'/g, '&#39;') : ''}'
      ></fedi-comment-composer>
    `;
  }

  renderCommentForm(postUrl, userData) {
    return '';
  }

  isLoggedIn() {
    return !!localStorage.getItem('fedi_access_token');
  }

  getUserData() {
    const data = localStorage.getItem('fedi_user_data');
    return data ? JSON.parse(data) : null;
  }

  signOut() {
    localStorage.removeItem('fedi_access_token');
    localStorage.removeItem('fedi_user_data');
    localStorage.removeItem('fedi_client_data');
    location.reload();
  }

  showReplyForm(commentId, username) {
    // Hide any other open reply forms
    this.querySelectorAll('.fedi-reply-form-container').forEach(container => {
      container.style.display = 'none';
      container.innerHTML = '';
    });
    
    const container = this.querySelector(`[data-reply-to="${commentId}"]`);
    const userData = this.getUserData();
    
    container.style.display = 'block';
    container.innerHTML = `
      <fedi-comment-composer
        mode="reply"
        reply-to="${commentId}"
        replying-to="${username}"
        logged-in="true"
        user-data='${JSON.stringify(userData).replace(/'/g, '&#39;')}'
      ></fedi-comment-composer>
    `;
    
    const textarea = container.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }
  }

  async submitComment(replyToId = null) {
    const container = replyToId
      ? this.querySelector(`[data-reply-to="${replyToId}"]`)
      : this;
    const textarea = container?.querySelector('.fedi-comment-textarea');
    const button = container?.querySelector('.fedi-comment-button-primary');
    if (!textarea || !button) return;

    const content = textarea.value.trim();
    if (!content) return;

    const token = localStorage.getItem('fedi_access_token');
    const instance = JSON.parse(localStorage.getItem('fedi_client_data')).instance;
    const inReplyToId = replyToId || this.getAttribute('id');

    // Disable button and show loading state
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = '⏳ Posting...';
    button.style.opacity = '0.6';

    try {
      const response = await fetch(`https://${instance}/api/v1/statuses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: content,
          in_reply_to_id: inReplyToId,
          visibility: 'public'
        })
      });

      if (!response.ok) throw new Error('Failed to post comment');

      // Show success message briefly then reload
      button.textContent = '✓ Posted!';

      setTimeout(() => {
        location.reload();
      }, 1000);

    } catch (error) {
      alert('Failed to post comment. Please try again.');
      console.error('Post error:', error);
      button.textContent = originalText;
      button.disabled = false;
      button.style.opacity = '1';
    }
  }

  renderComment(comment, host) {
    const { account, content, created_at, url, replies_count, favourites_count, emojis } = comment;
    const date = new Date(created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Extract host from account URI
    const accountHost = account.url.split('/')[2];
    const isLoggedIn = this.isLoggedIn();
    
    // Process custom emojis in display name and content
    const displayName = this.replaceEmojis(account.display_name, account.emojis || []);
    const processedContent = this.replaceEmojis(content, emojis || []);

    const likeButton = `
            <fedi-like-button
              comment-id="${comment.id}"
              count="${favourites_count}"
              favourited="${comment.favourited ? 'true' : 'false'}"
              logged-in="${isLoggedIn ? 'true' : 'false'}"
            ></fedi-like-button>
        `;

    return `
      <div class="fedi-comment" data-comment-id="${comment.id}">
        <div class="fedi-comment-header">
          <img src="${account.avatar}" alt="${account.display_name}" class="fedi-comment-avatar">
          <div class="fedi-comment-author-info">
            <a href="${account.url}" target="_blank" rel="noopener noreferrer" class="fedi-comment-author">
              <span class="fedi-comment-name-row">
                <strong>${displayName}</strong>
                <span class="fedi-comment-name-spacer"></span>
                <span class="fedi-comment-date">${formattedDate}</span>
              </span>
            </a>
            <div class="fedi-comment-meta">
              <span class="fedi-comment-handle">@${account.username}@${accountHost}</span>
              <a href="${url}" target="_blank" rel="noopener noreferrer" class="fedi-comment-date-link">Permalink</a>
            </div>
          </div>
        </div>
        <div class="fedi-comment-content">${processedContent}</div>
             <div class="fedi-comment-stats">
               ${likeButton}
               <span class="fedi-comment-stat">${ICONS.MESSAGE} ${replies_count}</span>
            ${isLoggedIn ? `
              <button class="fedi-reply-button" onclick="document.querySelector('fedi-comments').showReplyForm('${comment.id}', '@${account.username}')">
                ${ICONS.REPLY} Reply
              </button>
            ` : ''}        </div>
        <div class="fedi-reply-form-container" data-reply-to="${comment.id}" style="display:none"></div>
      </div>
    `;
  }

  replaceEmojis(text, emojis) {
    if (!emojis || emojis.length === 0) return text;
    
    let processed = text;    
    // Then replace emoji shortcodes
    emojis.forEach(emoji => {
      const emojiRegex = new RegExp(`:${emoji.shortcode}:`, 'g');
      processed = processed.replace(
        emojiRegex, 
        `<img src="${emoji.url}" alt=":${emoji.shortcode}:" class="fedi-custom-emoji" title=":${emoji.shortcode}:">`
      );
    });
    
    return processed;
  }
}

class FediLikeButton extends HTMLElement {
  static get observedAttributes() {
    return ['count', 'favourited', 'logged-in'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const count = this.getAttribute('count') || '0';
    const favourited = this.getAttribute('favourited') === 'true';
    const loggedIn = this.getAttribute('logged-in') === 'true';

    this.innerHTML = `
      <button class="fedi-like-button ${favourited ? 'fedi-liked' : ''}" ${loggedIn ? '' : 'disabled'} title="${loggedIn ? 'Like this comment' : 'Sign in to like'}">
        ${ICONS.HEART}
        <span class="fedi-like-count">${count}</span>
      </button>
    `;

    const button = this.querySelector('button');
    if (button) {
      button.onclick = () => this.handleClick(button);
    }
  }

  async handleClick(button) {
    const commentId = this.getAttribute('comment-id');
    const token = localStorage.getItem('fedi_access_token');
    const clientData = localStorage.getItem('fedi_client_data');
    if (!token || !clientData) {
      alert('Please sign in to like comments');
      return;
    }

    try {
      const instance = JSON.parse(clientData).instance;
      const isLiked = button.classList.contains('fedi-liked');
      const endpoint = isLiked ? '/unfavourite' : '/favourite';

      const response = await fetch(`https://${instance}/api/v1/statuses/${commentId}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to like comment');

      const updatedStatus = await response.json();
      this.setAttribute('favourited', updatedStatus.favourited ? 'true' : 'false');
      if (typeof updatedStatus.favourites_count === 'number') {
        this.setAttribute('count', String(updatedStatus.favourites_count));
      }
    } catch (error) {
      console.error('Like error:', error);
      alert('Failed to like comment');
    }
  }
}

class FediCommentComposer extends HTMLElement {
  static get observedAttributes() {
    return ['post-url', 'logged-in', 'user-data', 'mode', 'reply-to', 'replying-to'];
  }

  connectedCallback() {
    this.render();
    this.setupListeners();
  }

  attributeChangedCallback() {
    this.render();
    this.setupListeners();
  }

  showSignInForm() {
    const overlay = document.createElement('div');
    overlay.className = 'fedi-overlay';
    overlay.innerHTML = `
      <div class="fedi-modal">
        <div class="fedi-modal-header">
          <h3>Sign in</h3>
          <button class="fedi-modal-close" onclick="this.closest('.fedi-overlay').remove()">×</button>
        </div>
        <div class="fedi-modal-body">
          <p>Enter your Mastodon compliant instance URL:</p>
          <input 
            type="text" 
            class="fedi-instance-input" 
            placeholder="mastodon.social" 
            value=""
          />
          <p class="fedi-instance-hint">Example: mastodon.social, fosstodon.org</p>
          <div class="fedi-modal-error" style="display:none"></div>
        </div>
        <div class="fedi-modal-footer">
          <button class="fedi-comment-button fedi-comment-button-secondary" onclick="this.closest('.fedi-overlay').remove()">Cancel</button>
          <button class="fedi-comment-button fedi-comment-button-primary" onclick="document.querySelector('fedi-comment-composer').initiateOAuth()">Continue</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.fedi-instance-input').focus();
  }

  async initiateOAuth() {
    const input = document.querySelector('.fedi-instance-input');
    let instance = input.value.trim();
    
    // Clean up instance URL
    instance = instance.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    if (!instance) {
      this.showError('Please enter your Mastodon instance');
      return;
    }

    const errorDiv = document.querySelector('.fedi-modal-error');
    errorDiv.style.display = 'none';
    
    try {
      // Register app with the instance
      const clientData = await this.registerApp(instance);
      
      // Store client credentials
      localStorage.setItem('fedi_client_data', JSON.stringify({
        instance,
        ...clientData
      }));
      
      // Build OAuth URL
      const authUrl = `https://${instance}/oauth/authorize?` + new URLSearchParams({
        client_id: clientData.client_id,
        scope: 'read write',
        redirect_uri: window.location.origin + window.location.pathname,
        response_type: 'code'
      });
      
      // Redirect to OAuth
      window.location.href = authUrl;
    } catch (error) {
      this.showError('Failed to connect to instance. Please check the URL.');
      console.error('OAuth error:', error);
    }
  }

  async registerApp(instance) {
    const response = await fetch(`https://${instance}/api/v1/apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: 'Blog Comments',
        redirect_uris: window.location.origin + window.location.pathname,
        scopes: 'read write',
        website: window.location.origin
      })
    });
    
    if (!response.ok) throw new Error('Failed to register app');
    return await response.json();
  }

  showError(message) {
    const errorDiv = document.querySelector('.fedi-modal-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }

  getUserData() {
    const raw = this.getAttribute('user-data');
    if (!raw) return null;
    try {
      return JSON.parse(raw.replace(/&#39;/g, "'"));
    } catch {
      return null;
    }
  }

  render() {
    const postUrl = this.getAttribute('post-url') || '';
    const loggedIn = this.getAttribute('logged-in') === 'true';
    const userData = this.getUserData();
    const mode = this.getAttribute('mode') || 'comment';
    const replyTo = this.getAttribute('reply-to') || '';
    const replyingTo = this.getAttribute('replying-to') || '';

    if (loggedIn && userData) {
      const displayName = this.replaceEmojis(userData.display_name, userData.emojis || []);
      const isReply = mode === 'reply';
      const rows = isReply ? 3 : 4;
      const placeholder = isReply ? 'Write your reply...' : 'Write your comment...';
      const submitLabel = isReply ? 'Post Reply' : 'Post Comment';
      const submitAction = isReply
        ? `document.querySelector('fedi-comments').submitComment('${replyTo}')`
        : `document.querySelector('fedi-comments').submitComment()`;

      this.innerHTML = `
        <div class="${isReply ? 'fedi-inline-reply-form' : 'fedi-leave-comment'}">
          ${isReply ? `
            <div class="fedi-reply-form-header">
              <span class="fedi-replying-to">Replying to ${replyingTo}</span>
              <button class="fedi-cancel-reply" onclick="this.closest('.fedi-reply-form-container').style.display='none';this.closest('.fedi-reply-form-container').innerHTML=''">×</button>
            </div>
          ` : ''}
          ${isReply ? `
            <div class="fedi-user-info">
              <img src="${userData.avatar}" alt="${userData.display_name}" class="fedi-user-avatar">
              <span><strong>${displayName}</strong></span>
            </div>
          ` : `
            <div class="fedi-logged-in-header">
              <div class="fedi-user-info">
                <img src="${userData.avatar}" alt="${userData.display_name}" class="fedi-user-avatar">
                <div>
                  <strong>${displayName}</strong>
                  <span class="fedi-user-handle">@${userData.acct}</span>
                </div>
              </div>
              <button class="fedi-sign-out-button" onclick="document.querySelector('fedi-comments').signOut()">Sign out</button>
            </div>
          `}
          <div class="fedi-textarea-wrapper">
            <textarea 
              class="fedi-comment-textarea ${isReply ? 'fedi-inline-textarea' : ''}" 
              placeholder="${placeholder}" 
              maxlength="500"
              rows="${rows}"
            ></textarea>
            <span class="fedi-char-count">0</span>
          </div>
          <div class="fedi-comment-form-actions">
            <button class="fedi-comment-button fedi-comment-button-primary" onclick="${submitAction}">
              ${submitLabel}
            </button>
          </div>
        </div>
      `;
      return;
    }

    this.innerHTML = `
      <div class="fedi-leave-comment">
        <h3>Leave a Comment</h3>
        <p class="fedi-leave-comment-text">Choose how you'd like to join the conversation:</p>
        <div class="fedi-leave-comment-actions">
          <div class="fedi-option-group">
            <h4 class="fedi-option-title">Sign in to comment directly</h4>
            <button class="fedi-comment-button fedi-comment-button-primary" onclick="document.querySelector('fedi-comment-composer').showSignInForm()">
                 ${ICONS.LOGIN} Sign in with Fedi
            </button>
          </div>
          <div class="fedi-option-divider">
            <span>or</span>
          </div>
          <div class="fedi-option-group">
            <h4 class="fedi-option-title">Reply without signing in</h4>
            <a href="${postUrl}" target="_blank" rel="noopener noreferrer" class="fedi-comment-button fedi-comment-button-secondary">
                 ${ICONS.MESSAGE} Reply on Fedi
            </a>
            <button class="fedi-comment-button fedi-comment-button-tertiary" onclick="this.closest('.fedi-leave-comment').querySelector('.fedi-reply-instructions').style.display='block';this.style.display='none'">
                 ${ICONS.INFO} How does this work?
            </button>
          </div>
        </div>
        <div class="fedi-reply-instructions" style="display:none">
          <p><strong>Reply from your Fedi instance:</strong></p>
          <ol>
            <li>Copy this post URL: <code>${postUrl}</code></li>
            <li>Paste it into your instance's search</li>
            <li>Reply to the post from your account</li>
          </ol>
          <p>Your reply will appear here automatically!</p>
        </div>
      </div>
    `;
  }

  setupListeners() {
    const textarea = this.querySelector('.fedi-comment-textarea');
    const counter = this.querySelector('.fedi-char-count');
    if (textarea && counter) {
      textarea.addEventListener('input', (e) => {
        counter.textContent = `${e.target.value.length}`;
      });
    }
  }

  replaceEmojis(text, emojis) {
    if (!emojis || emojis.length === 0) return text;
    let processed = text;
    emojis.forEach(emoji => {
      const emojiRegex = new RegExp(`:${emoji.shortcode}:`, 'g');
      processed = processed.replace(
        emojiRegex,
        `<img src="${emoji.url}" alt=":${emoji.shortcode}:" class="fedi-custom-emoji" title=":${emoji.shortcode}:">`
      );
    });
    return processed;
  }
}

customElements.define('fedi-comments', FediComments);
customElements.define('fedi-like-button', FediLikeButton);
customElements.define('fedi-comment-composer', FediCommentComposer);
