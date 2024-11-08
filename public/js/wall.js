/**
* DOCU: Handle post creation form submission <br>
* Triggered: When user submits the create post form <br>
* Last Updated Date: November 17, 2024
* @async
* @function
* @param {Event} e - Form submit event
* @author Aaron
*/
document.getElementById('createPostForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const textarea = form.querySelector('textarea');
    const content = textarea.value;

    try {
        const response = await fetch('/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        if (!response.ok) {
            throw new Error('Failed to create post');
        }

        const response_data = await response.json();

        if (!response_data.status) {
            throw new Error(response_data.error || 'Failed to create post');
        }

        const post = response_data.result;

        /* Create new post HTML using template literal */
        const postHTML = `
            <article class="post" data-post-id="${post.id}">
                <div class="post-header">
                    <h3>${post.user_name}</h3>
                    <span class="timestamp">${formatDate(post.created_at)}</span>
                </div>
                <p class="post-content">${post.content}</p>
                <div class="post-actions">
                    <button class="edit-post">Edit</button>
                    <button class="delete-post">Delete</button>
                </div>
                <div class="post-stats">
                    <span class="comment-count">0</span> comments
                </div>
                <form class="comment-form">
                    <textarea placeholder="Write a comment..." required></textarea>
                    <button type="submit">Comment</button>
                </form>
                <div class="comments"></div>
            </article>
        `;

        /* Add new post to the top of the posts section */
        const postsSection = document.querySelector('.posts');
        postsSection.insertAdjacentHTML('afterbegin', postHTML);

        /* Clear the form */
        textarea.value = '';
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
    }
});

/**
* DOCU: Handle post deletion <br>
* Triggered: When user clicks delete button on their post <br>
* Last Updated Date: November 17, 2024
* @async
* @function
* @param {Event} e - Click event
* @author Aaron
*/
const handlePostDeletion = async (e) => {
    if (!e.target.classList.contains('delete-post')) {
        return;
    }

    e.preventDefault();

    const postElement = e.target.closest('.post');
    const postId = postElement.dataset.postId;

    if (!postId) {
        console.error('No post ID found');
        return;
    }

    if (confirm('Are you sure you want to delete this post?')) {
        try {
            const response = await fetch(`/posts/${postId}`, {
                method: 'DELETE'
            });

            const response_data = await response.json();

            if (!response_data.status) {
                throw new Error(response_data.error || 'Failed to delete post');
            }

            /* Remove post from DOM after successful deletion */
            postElement.remove();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error deleting post. Please try again.');
        }
    }
};

/**
* DOCU: Handle post editing <br>
* Triggered: When user clicks edit button on their post <br>
* Last Updated Date: November 17, 2024
* @async
* @function
* @param {Event} e - Click event
* @author Aaron
*/
const handlePostEdit = async (e) => {
    if (!e.target.classList.contains('edit-post')) {
        return;
    }

    const postElement = e.target.closest('.post');
    const postId = postElement.dataset.postId;
    const contentElement = postElement.querySelector('.post-content');
    const currentContent = contentElement.textContent;

    /* Create edit form */
    const editForm = document.createElement('form');
    editForm.className = 'edit-post-form';
    editForm.innerHTML = `
        <textarea required>${currentContent}</textarea>
        <button type="submit">Save</button>
        <button type="button" class="cancel-edit">Cancel</button>
    `;

    /* Replace content with edit form */
    contentElement.style.display = 'none';
    contentElement.insertAdjacentElement('afterend', editForm);

    /* Handle cancel */
    editForm.querySelector('.cancel-edit').addEventListener('click', () => {
        editForm.remove();
        contentElement.style.display = 'block';
    });

    /* Handle form submission */
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newContent = editForm.querySelector('textarea').value;

        try {
            const response = await fetch(`/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newContent })
            });

            const response_data = await response.json();

            if (!response_data.status) {
                throw new Error(response_data.error || 'Failed to update post');
            }

            /* Update the post content in the DOM */
            contentElement.textContent = response_data.result.content;
            editForm.remove();
            contentElement.style.display = 'block';
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Failed to update post. Please try again.');
        }
    });
};

/**
* DOCU: Handle comment submission and update UI <br>
* Triggered: When user submits new comment form <br>
* Last Updated Date: November 17, 2024
* @async
* @function
* @param {Event} e - Form submit event
* @author Aaron
*/
const handleCommentSubmission = async (e) => {
    if (!e.target.classList.contains('comment-form')) {
        return;
    }

    e.preventDefault();

    const form = e.target;
    const postElement = form.closest('.post');
    const postId = postElement.dataset.postId;
    const textarea = form.querySelector('textarea');
    const content = textarea.value.trim();

    if (!content) {
        alert('Comment content cannot be empty');
        return;
    }

    try {
        /* Send request to create comment */
        const response = await fetch(`/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Server response:', errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const response_data = await response.json();

        if (!response_data.status) {
            throw new Error(response_data.error || 'Failed to create comment');
        }

        const comment = response_data.result;

        /* Create new comment HTML using template literal */
        const commentHTML = `
            <div class="comment" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <h4>${comment.user_name}</h4>
                    <span class="timestamp">${formatDate(comment.created_at)}</span>
                </div>
                <p class="comment-content">${comment.content}</p>
                <div class="comment-actions">
                    <button class="edit-comment">Edit</button>
                    <button class="delete-comment">Delete</button>
                </div>
                ${generateReplyFormHTML(comment.id)}
            </div>
        `;

        /* Add new comment to the comments section */
        const commentsSection = postElement.querySelector('.comments');
        commentsSection.insertAdjacentHTML('beforeend', commentHTML);

        /* Clear the form */
        textarea.value = '';

        /* Update comment count */
        const commentCountElement = postElement.querySelector('.comment-count');
        if (commentCountElement) {
            const currentCount = parseInt(commentCountElement.textContent);
            commentCountElement.textContent = currentCount + 1;
        }
    } catch (error) {
        console.error('Error creating comment:', error);
        alert('Failed to create comment. Please try again.');
    }
};

/**
* DOCU: Handle comment deletion and update comment count <br>
* Triggered: When user clicks delete button on their comment <br>
* Last Updated Date: November 17, 2024
* @async
* @function
* @param {Event} e - Click event
* @author Aaron
*/
const handleCommentDeletion = async (e) => {
    if (!e.target.classList.contains('delete-comment')) {
        return;
    }

    e.preventDefault();

    const commentElement = e.target.closest('.comment');
    const postElement = commentElement.closest('.post');
    const commentId = commentElement.dataset.commentId;

    /* Validate required elements and data */
    if (!commentId || !postElement) {
        console.error('Required elements not found');
        return;
    }

    if (confirm('Are you sure you want to delete this comment?')) {
        try {
            const response = await fetch(`/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const response_data = await response.json();

            if (!response_data.status) {
                throw new Error(response_data.error || 'Failed to delete comment');
            }

            /* Update the post's comment count in the UI before removing the comment */
            const commentCountElement = postElement.querySelector('.comment-count');
            if (commentCountElement) {
                const currentCount = parseInt(commentCountElement.textContent);
                commentCountElement.textContent = Math.max(0, currentCount - 1);
            }

            /* Remove comment from DOM after successful deletion */
            commentElement.remove();
        } catch (error) {
            console.error('Delete comment error:', error);
            alert('Error deleting comment. Please try again.');
        }
    }
};

/**
* DOCU: Handle comment editing <br>
* Triggered: When user clicks edit button on their comment <br>
* Last Updated Date: November 17, 2024
* @async
* @function
* @param {Event} e - Click event
* @author Aaron
*/
const handleCommentEdit = async (e) => {
    if (!e.target.classList.contains('edit-comment')) {
        return;
    }

    const commentElement = e.target.closest('.comment');
    const commentId = commentElement.dataset.commentId;
    const contentElement = commentElement.querySelector('.comment-content');
    const currentContent = contentElement.textContent;

    /* Create edit form */
    const editForm = document.createElement('form');
    editForm.className = 'edit-comment-form';
    editForm.innerHTML = `
        <textarea required>${currentContent}</textarea>
        <button type="submit">Save</button>
        <button type="button" class="cancel-edit">Cancel</button>
    `;

    /* Replace content with edit form */
    contentElement.style.display = 'none';
    contentElement.insertAdjacentElement('afterend', editForm);

    /* Handle cancel */
    editForm.querySelector('.cancel-edit').addEventListener('click', () => {
        editForm.remove();
        contentElement.style.display = 'block';
    });

    /* Handle form submission */
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newContent = editForm.querySelector('textarea').value;

        try {
            const response = await fetch(`/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newContent })
            });

            const response_data = await response.json();

            if (!response_data.status) {
                throw new Error(response_data.error || 'Failed to update comment');
            }

            /* Update the comment content in the DOM */
            contentElement.textContent = response_data.result.content;
            editForm.remove();
            contentElement.style.display = 'block';
        } catch (error) {
            console.error('Error updating comment:', error);
            alert('Failed to update comment. Please try again.');
        }
    });
};

/**
* DOCU: Handle reply submission for comments <br>
* Triggered: When user submits a new reply form <br>
* Last Updated Date: November 17, 2024
* @async
* @function
* @param {Event} e - Form submit event
* @author Aaron
*/
const handleReplySubmission = async (e) => {
    if (!e.target.classList.contains('reply-form')) {
        return;
    }

    e.preventDefault();

    const form = e.target;
    const commentElement = form.closest('.comment');
    const commentId = commentElement.dataset.commentId;
    const textarea = form.querySelector('textarea');
    const content = textarea.value;

    if (!content.trim()) {
        alert('Reply content cannot be empty');
        return;
    }

    try {
        const response = await fetch(`/comments/${commentId}/replies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        const response_data = await response.json();

        if (!response_data.status) {
            throw new Error(response_data.error || 'Failed to create reply');
        }

        const reply = response_data.result;

        /* Create new reply HTML using template literal */
        const replyHTML = `
            <div class="reply" data-reply-id="${reply.id}">
                <div class="reply-header">
                    <h5>${reply.user_name}</h5>
                    <span class="timestamp">${formatDate(reply.created_at)}</span>
                </div>
                <p class="reply-content">${reply.content}</p>
                <div class="reply-actions">
                    <button class="edit-reply">Edit</button>
                    <button class="delete-reply">Delete</button>
                </div>
            </div>
        `;

        /* Add new reply to the replies section */
        const repliesSection = commentElement.querySelector('.replies');
        repliesSection.insertAdjacentHTML('beforeend', replyHTML);

        /* Clear the form */
        textarea.value = '';
    } catch (error) {
        console.error('Error creating reply:', error);
        alert('Failed to create reply. Please try again.');
    }
};

/**
* DOCU: Generate reply form HTML template <br>
* Triggered: When creating new comment or displaying existing comment <br>
* Last Updated Date: November 17, 2024
* @function
* @param {number} commentId - The ID of the parent comment
* @returns {string} HTML template for reply form
* @author Aaron
*/
const generateReplyFormHTML = (commentId) => {
    return `
        <div class="reply-section">
            <form class="reply-form" data-comment-id="${commentId}">
                <textarea placeholder="Write a reply..." required></textarea>
                <button type="submit">Reply</button>
            </form>
            <div class="replies"></div>
        </div>
    `;
};

/**
* DOCU: Handle reply editing and update UI <br>
* Triggered: When user clicks edit button on their reply <br>
* Last Updated Date: November 17, 2024
* @async
* @function
* @param {Event} e - Click event
* @author Aaron
*/
const handleReplyEdit = async (e) => {
    if (!e.target.classList.contains('edit-reply')) {
        return;
    }

    const replyElement = e.target.closest('.reply');
    const replyId = replyElement.dataset.replyId;
    const contentElement = replyElement.querySelector('.reply-content');
    const currentContent = contentElement.textContent;

    /* Create edit form */
    const editForm = document.createElement('form');
    editForm.className = 'edit-reply-form';
    editForm.innerHTML = `
        <textarea required>${currentContent}</textarea>
        <div class="edit-actions">
            <button type="submit">Save</button>
            <button type="button" class="cancel-edit">Cancel</button>
        </div>
    `;

    /* Hide content and show edit form */
    contentElement.style.display = 'none';
    contentElement.insertAdjacentElement('afterend', editForm);

    /* Handle cancel button */
    editForm.querySelector('.cancel-edit').addEventListener('click', () => {
        contentElement.style.display = 'block';
        editForm.remove();
    });

    /* Handle form submission */
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newContent = editForm.querySelector('textarea').value.trim();

        if (!newContent) {
            alert('Reply content cannot be empty');
            return;
        }

        try {
            const response = await fetch(`/comments/${replyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newContent })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Server response:', errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const response_data = await response.json();

            if (!response_data.status) {
                throw new Error(response_data.error || 'Failed to update reply');
            }

            /* Update content and restore display */
            contentElement.textContent = newContent;
            contentElement.style.display = 'block';
            editForm.remove();
        } catch (error) {
            console.error('Error updating reply:', error);
            alert('Failed to update reply. Please try again.');
        }
    });
};

/* Add event listener when DOM is loaded */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.posts').addEventListener('click', handlePostDeletion);

    // Add event listener for edit buttons
    document.querySelector('.posts').addEventListener('click', handlePostEdit);

    // Handle comment submission
    document.querySelector('.posts').addEventListener('submit', handleCommentSubmission);

    // Handle comment deletion
    document.querySelector('.posts').addEventListener('click', handleCommentDeletion);

    // Handle comment editing
    document.querySelector('.posts').addEventListener('click', handleCommentEdit);

    // Handle reply submission
    document.querySelector('.posts').addEventListener('submit', handleReplySubmission);

    // Handle reply deletion
    document.querySelector('.posts').addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-reply')) {
            e.preventDefault();

            const replyElement = e.target.closest('.reply');
            const replyId = replyElement.dataset.replyId;

            if (!replyId) {
                console.error('No reply ID found');
                return;
            }

            if (confirm('Are you sure you want to delete this reply?')) {
                try {
                    const response = await fetch(`/comments/${replyId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        const errorData = await response.text();
                        console.error('Server response:', errorData);
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    replyElement.remove();
                } catch (error) {
                    console.error('Delete error:', error);
                    alert('Error deleting reply. Please try again.');
                }
            }
        }
    });

    // Handle reply editing
    document.querySelector('.posts').addEventListener('click', handleReplyEdit);
}); 