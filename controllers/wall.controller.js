import postModel, {
    getAllPosts,
    createPost as createPostModel,
    getPostById,
    deletePostById,
    updatePostById,
    createComment as createCommentModel,
    getCommentById,
    deleteCommentById,
    updateCommentById
} from '../models/post.model.js';

/**
* DOCU: Display the wall page with all posts and their comments <br>
* Triggered: When user visits the wall page <br>
* Last Updated Date: November 17, 2024
* @async
* @function
* @param {object} req - Express request object
* @param {object} res - Express response object
* @returns {void}
* @author Aaron
*/
const showWall = async (req, res) => {
    try {
        const response_data = await getAllPosts();

        /* Check if posts were retrieved successfully */
        if (!response_data.status) {
            throw new Error(response_data.error || 'Failed to fetch posts');
        }

        res.render('wall', {
            user: {
                id: req.session.user_id,
                first_name: req.session.user_name
            },
            posts: response_data.result || []
        });
    } catch (error) {
        console.error('Error in showWall:', error);
        res.status(500).send('Server error');
    }
};

/**
* DOCU: Create a new post <br>
* Triggered: When user submits new post form <br>
* Last Updated Date: November 17, 2024
* @async
* @function
* @param {object} req - Express request object containing post content
* @param {object} res - Express response object
* @returns {object} JSON response with created post data
* @author Aaron
*/
const createPost = async (req, res) => {
    let response_data = { status: false, result: null, error: null };

    try {
        const { content } = req.body;
        const user_id = req.session.user_id;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        /* Create new post using model */
        const post_response = await createPostModel(user_id, content);

        if (!post_response.status) {
            throw new Error(post_response.error || 'Failed to create post');
        }

        response_data.status = true;
        response_data.result = {
            ...post_response.result,
            created_at: new Date().toISOString()
        };

        res.json(response_data);
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
* DOCU: Delete a post and its associated comments <br>
* Triggered: When user clicks delete button on their post <br>
* Last Updated Date: November 17, 2024
* @async
* @function
* @param {object} req - Express request object containing post ID
* @param {object} res - Express response object
* @returns {object} JSON response with deletion status
* @author Aaron
*/
const deletePost = async (req, res) => {
    let response_data = { status: false, result: null, error: null };

    try {
        const postId = parseInt(req.params.id);
        const userId = req.session.user_id;

        if (!postId || isNaN(postId)) {
            return res.status(400).json({
                status: false,
                error: 'Invalid post ID'
            });
        }

        /* Get post details to verify ownership */
        const post_response = await getPostById(postId);

        if (!post_response.status || !post_response.result) {
            return res.status(404).json({
                status: false,
                error: 'Post not found'
            });
        }

        if (post_response.result.user_id !== userId) {
            return res.status(403).json({
                status: false,
                error: 'Unauthorized'
            });
        }

        /* Delete post and its comments */
        const delete_response = await deletePostById(postId);

        if (!delete_response.status) {
            throw new Error(delete_response.error || 'Failed to delete post');
        }

        response_data.status = true;
        res.json(response_data);
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({
            status: false,
            error: 'Server error'
        });
    }
};

/**
* DOCU: Update an existing post <br>
* Triggered: When user submits edit post form <br>
* Last Updated Date: November 17, 2024
* @async
* @function
* @param {object} req - Express request object containing post ID and new content
* @param {object} res - Express response object
* @returns {object} JSON response with updated post data
* @author Aaron
*/
const updatePost = async (req, res) => {
    let response_data = { status: false, result: null, error: null };

    try {
        const postId = parseInt(req.params.id);
        const userId = req.session.user_id;
        const { content } = req.body;

        if (!postId || isNaN(postId)) {
            return res.status(400).json({
                status: false,
                error: 'Invalid post ID'
            });
        }

        if (!content) {
            return res.status(400).json({
                status: false,
                error: 'Content is required'
            });
        }

        /* Get post details to verify ownership */
        const post_response = await getPostById(postId);

        if (!post_response.status || !post_response.result) {
            return res.status(404).json({
                status: false,
                error: 'Post not found'
            });
        }

        if (post_response.result.user_id !== userId) {
            return res.status(403).json({
                status: false,
                error: 'Unauthorized'
            });
        }

        /* Update the post */
        const update_response = await updatePostById(postId, content);

        if (!update_response.status) {
            throw new Error(update_response.error || 'Failed to update post');
        }

        response_data.status = true;
        response_data.result = update_response.result;

        res.json(response_data);
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({
            status: false,
            error: 'Server error'
        });
    }
};

const createComment = async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);
        const userId = req.session.user_id;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        const comment = await createCommentModel(userId, postId, content);
        res.json(comment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
* DOCU: Delete a comment and update post's comment count <br>
* Triggered: When user clicks delete button on their comment <br>
* Last Updated Date: November 17, 2024
* @async
* @function
* @param {object} req - Express request object containing comment ID
* @param {object} res - Express response object
* @returns {object} JSON response with deletion status
* @author Aaron
*/
const deleteComment = async (req, res) => {
    let response_data = { status: false, result: null, error: null };

    try {
        const commentId = parseInt(req.params.id);
        const userId = req.session.user_id;

        if (!commentId || isNaN(commentId)) {
            return res.status(400).json({
                status: false,
                error: 'Invalid comment ID'
            });
        }

        /* Get comment details to verify ownership */
        const comment_response = await getCommentById(commentId);

        if (!comment_response.status || !comment_response.result) {
            return res.status(404).json({
                status: false,
                error: 'Comment not found'
            });
        }

        if (comment_response.result.user_id !== userId) {
            return res.status(403).json({
                status: false,
                error: 'Unauthorized'
            });
        }

        /* Delete comment and update post's comment count */
        const delete_response = await deleteCommentById(commentId);

        if (!delete_response.status) {
            throw new Error(delete_response.error || 'Failed to delete comment');
        }

        response_data.status = true;
        res.json(response_data);
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({
            status: false,
            error: 'Server error'
        });
    }
};

/**
* DOCU: Update a comment's content <br>
* Triggered: When user submits edit comment form <br>
* Last Updated Date: November 17, 2024
* @async
* @function
* @param {object} req - Express request object containing comment ID and new content
* @param {object} res - Express response object
* @returns {object} JSON response with updated comment data
* @author Aaron
*/
const updateComment = async (req, res) => {
    let response_data = { status: false, result: null, error: null };

    try {
        const commentId = parseInt(req.params.id);
        const userId = req.session.user_id;
        const { content } = req.body;

        if (!commentId || isNaN(commentId)) {
            return res.status(400).json({
                status: false,
                error: 'Invalid comment ID'
            });
        }

        if (!content) {
            return res.status(400).json({
                status: false,
                error: 'Content is required'
            });
        }

        /* Get comment details to verify ownership */
        const comment_response = await getCommentById(commentId);

        if (!comment_response.status || !comment_response.result) {
            return res.status(404).json({
                status: false,
                error: 'Comment not found'
            });
        }

        if (comment_response.result.user_id !== userId) {
            return res.status(403).json({
                status: false,
                error: 'Unauthorized'
            });
        }

        /* Update the comment */
        const update_response = await updateCommentById(commentId, content);

        if (!update_response.status) {
            throw new Error(update_response.error || 'Failed to update comment');
        }

        response_data.status = true;
        response_data.result = update_response.result;
        res.json(response_data);
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({
            status: false,
            error: 'Server error'
        });
    }
};

/**
* DOCU: Create a reply to a comment <br>
* Triggered: When user submits reply form <br>
* Last Updated Date: November 17, 2024
* @async
* @function
* @param {object} req - Express request object containing comment ID and reply content
* @param {object} res - Express response object
* @returns {object} JSON response with created reply data
* @author Aaron
*/
const createReply = async (req, res) => {
    let response_data = { status: false, result: null, error: null };

    try {
        const commentId = parseInt(req.params.commentId);
        const userId = req.session.user_id;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                status: false,
                error: 'Content is required'
            });
        }

        /* Get parent comment to get post_id */
        const comment_response = await getCommentById(commentId);

        if (!comment_response.status || !comment_response.result) {
            return res.status(404).json({
                status: false,
                error: 'Parent comment not found'
            });
        }

        /* Create reply using the existing createComment function */
        const reply_response = await createCommentModel(
            userId,
            comment_response.result.post_id,
            content,
            commentId  // Pass parent_comment_id for reply
        );

        if (!reply_response.status) {
            throw new Error(reply_response.error || 'Failed to create reply');
        }

        response_data.status = true;
        response_data.result = reply_response.result;
        res.json(response_data);
    } catch (error) {
        console.error('Create reply error:', error);
        res.status(500).json({
            status: false,
            error: 'Server error'
        });
    }
};

export {
    showWall,
    createPost,
    deletePost,
    updatePost,
    createComment,
    deleteComment,
    updateComment,
    createReply
}; 