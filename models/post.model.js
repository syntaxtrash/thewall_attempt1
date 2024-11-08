import { pool } from '../configs/database.config.js';

class PostModel {
    /**
    * DOCU: Get all posts with their comments and replies <br>
    * Triggered: From wall page load and after creating new post <br>
    * Last Updated Date: November 17, 2024
    * @async
    * @function
    * @returns {object} Response with posts data including comments and replies
    * @author Aaron
    */
    getAllPosts = async () => {
        let response_data = { status: false, result: [], error: null };

        try {
            let [posts] = await pool.query(`
                SELECT 
                    p.*,
                    u.first_name AS user_name,
                    u.id AS user_id
                FROM posts p
                JOIN users u ON p.user_id = u.id
                ORDER BY p.created_at DESC
            `);

            // Get comments for each post
            for (let post of posts) {
                let [comments] = await pool.query(`
                    SELECT 
                        c.*,
                        u.first_name AS user_name,
                        u.id AS user_id
                    FROM comments c
                    JOIN users u ON c.user_id = u.id
                    WHERE c.post_id = ? AND c.parent_comment_id IS NULL
                    ORDER BY c.created_at DESC
                `, [post.id]);

                // Get replies for each comment
                for (let comment of comments) {
                    let [replies] = await pool.query(`
                        SELECT 
                            c.*,
                            u.first_name AS user_name,
                            u.id AS user_id
                        FROM comments c
                        JOIN users u ON c.user_id = u.id
                        WHERE c.parent_comment_id = ?
                        ORDER BY c.created_at ASC
                    `, [comment.id]);

                    comment.replies = replies;
                }

                post.comments = comments;
            }

            response_data.status = true;
            response_data.result = posts;
        }
        catch (error) {
            response_data.error = error;
        }

        return response_data;
    }

    /**
    * DOCU: Create a new post <br>
    * Triggered: From wall page when user submits new post <br>
    * Last Updated Date: November 17, 2024
    * @async
    * @function
    * @param {number} userId - The ID of the user creating the post
    * @param {string} content - The content of the post
    * @returns {object} The created post with user information
    * @author Aaron
    */
    createPost = async (userId, content) => {
        let response_data = { status: false, result: null, error: null };

        try {
            const [result] = await pool.query(
                'INSERT INTO posts (user_id, content) VALUES (?, ?)',
                [userId, content]
            );

            // Fetch the created post with user information
            const [posts] = await pool.query(`
                SELECT 
                    p.*,
                    u.first_name AS user_name,
                    u.id AS user_id
                FROM posts p
                JOIN users u ON p.user_id = u.id
                WHERE p.id = ?
            `, [result.insertId]);

            response_data.status = true;
            response_data.result = posts[0];
        } catch (error) {
            response_data.error = error;
        }

        return response_data;
    };

    /**
    * DOCU: Get a post by its ID <br>
    * Triggered: When editing or deleting a post <br>
    * Last Updated Date: November 17, 2024
    * @async
    * @function
    * @param {number} postId - The ID of the post to retrieve
    * @returns {object} Response with post data including user information
    * @author Aaron
    */
    getPostById = async (postId) => {
        let response_data = { status: false, result: null, error: null };

        try {
            const [rows] = await pool.query(`
                SELECT 
                    p.*,
                    u.first_name AS user_name,
                    u.id AS user_id
                FROM posts p
                JOIN users u ON p.user_id = u.id
                WHERE p.id = ?
            `, [postId]);

            response_data.status = true;
            response_data.result = rows[0];
        } catch (error) {
            response_data.error = error;
        }

        return response_data;
    };

    /**
    * DOCU: Delete a post and its associated comments <br>
    * Triggered: When user deletes their post <br>
    * Last Updated Date: November 17, 2024
    * @async
    * @function
    * @param {number} postId - The ID of the post to delete
    * @returns {object} Response with status and any error information
    * @author Aaron
    */
    deletePostById = async (postId) => {
        let response_data = { status: false, result: null, error: null };
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            /* Delete comments first to maintain referential integrity */
            await connection.query('DELETE FROM comments WHERE post_id = ?', [postId]);

            /* Then delete the post */
            const [result] = await connection.query('DELETE FROM posts WHERE id = ?', [postId]);

            if (result.affectedRows === 0) {
                throw new Error('Post not found');
            }

            await connection.commit();
            response_data.status = true;
        } catch (error) {
            await connection.rollback();
            response_data.error = error;
        } finally {
            connection.release();
        }

        return response_data;
    };

    /**
    * DOCU: Update a post's content <br>
    * Triggered: When user edits their post <br>
    * Last Updated Date: November 17, 2024
    * @async
    * @function
    * @param {number} postId - The ID of the post to update
    * @param {string} content - The new content for the post
    * @returns {object} Response with updated post data including user information
    * @author Aaron
    */
    updatePostById = async (postId, content) => {
        let response_data = { status: false, result: null, error: null };

        try {
            /* Update the post content */
            await pool.query(
                'UPDATE posts SET content = ? WHERE id = ?',
                [content, postId]
            );

            /* Fetch and return the updated post with user information */
            const [posts] = await pool.query(`
                SELECT 
                    p.*,
                    u.first_name AS user_name,
                    u.id AS user_id
                FROM posts p
                JOIN users u ON p.user_id = u.id
                WHERE p.id = ?
            `, [postId]);

            response_data.status = true;
            response_data.result = posts[0];
        } catch (error) {
            response_data.error = error;
        }

        return response_data;
    };

    /**
    * DOCU: Create a new comment or reply <br>
    * Triggered: When user submits a new comment or reply <br>
    * Last Updated Date: November 17, 2024
    * @async
    * @function
    * @param {number} userId - The user ID creating the comment/reply
    * @param {number} postId - The post ID the comment/reply belongs to
    * @param {string} content - The content of the comment/reply
    * @param {number=} parentCommentId - Optional parent comment ID for replies
    * @returns {object} Response with created comment/reply data
    * @author Aaron
    */
    createComment = async (userId, postId, content, parentCommentId = null) => {
        let response_data = { status: false, result: null, error: null };
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            /* Create the comment/reply */
            const [result] = await connection.query(
                'INSERT INTO comments (user_id, post_id, content, parent_comment_id) VALUES (?, ?, ?, ?)',
                [userId, postId, content, parentCommentId]
            );

            /* Update counts based on whether it's a comment or reply */
            if (parentCommentId) {
                await connection.query(
                    'UPDATE comments SET replies_count = replies_count + 1 WHERE id = ?',
                    [parentCommentId]
                );
            } else {
                await connection.query(
                    'UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?',
                    [postId]
                );
            }

            /* Fetch the created comment/reply with user information */
            const [comments] = await connection.query(`
                SELECT 
                    c.*,
                    u.first_name AS user_name,
                    DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i:%s') as created_at
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.id = ?
            `, [result.insertId]);

            await connection.commit();
            response_data.status = true;
            response_data.result = comments[0];
        } catch (error) {
            await connection.rollback();
            response_data.error = error;
        } finally {
            connection.release();
        }

        return response_data;
    };

    /**
    * DOCU: Get a comment by its ID <br>
    * Triggered: When editing or deleting a comment <br>
    * Last Updated Date: November 17, 2024
    * @async
    * @function
    * @param {number} commentId - The ID of the comment to retrieve
    * @returns {object} Response with comment data including user information
    * @author Aaron
    */
    getCommentById = async (commentId) => {
        let response_data = { status: false, result: null, error: null };

        try {
            const [rows] = await pool.query(`
                SELECT 
                    c.*,
                    u.first_name AS user_name,
                    u.id AS user_id
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.id = ?
            `, [commentId]);

            response_data.status = true;
            response_data.result = rows[0];
        } catch (error) {
            response_data.error = error;
        }

        return response_data;
    };

    /**
    * DOCU: Delete a comment and update associated counts <br>
    * Triggered: When user deletes their comment <br>
    * Last Updated Date: November 17, 2024
    * @async
    * @function
    * @param {number} commentId - The ID of the comment to delete
    * @returns {object} Response with status and any error information
    * @author Aaron
    */
    deleteCommentById = async (commentId) => {
        let response_data = { status: false, result: null, error: null };
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            /* Get the comment to find its post_id */
            const [comment] = await connection.query(
                'SELECT post_id FROM comments WHERE id = ?',
                [commentId]
            );

            if (comment[0]) {
                /* Update post's comment count */
                await connection.query(
                    'UPDATE posts SET comments_count = comments_count - 1 WHERE id = ?',
                    [comment[0].post_id]
                );
            }

            /* Delete the comment */
            await connection.query('DELETE FROM comments WHERE id = ?', [commentId]);

            await connection.commit();
            response_data.status = true;
        } catch (error) {
            await connection.rollback();
            response_data.error = error;
        } finally {
            connection.release();
        }

        return response_data;
    };

    /**
    * DOCU: Update a comment's content <br>
    * Triggered: When user edits their comment <br>
    * Last Updated Date: November 17, 2024
    * @async
    * @function
    * @param {number} commentId - The ID of the comment to update
    * @param {string} content - The new content for the comment
    * @returns {object} Response with updated comment data including user information
    * @author Aaron
    */
    updateCommentById = async (commentId, content) => {
        let response_data = { status: false, result: null, error: null };

        try {
            /* Update the comment content */
            await pool.query(
                'UPDATE comments SET content = ? WHERE id = ?',
                [content, commentId]
            );

            /* Fetch and return the updated comment with user information */
            const [comments] = await pool.query(`
                SELECT 
                    c.*,
                    u.first_name AS user_name,
                    u.id AS user_id
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.id = ?
            `, [commentId]);

            response_data.status = true;
            response_data.result = comments[0];
        } catch (error) {
            response_data.error = error;
        }

        return response_data;
    };
}

// Export a single instance
const postModel = new PostModel();
export default postModel;

// Export individual methods
export const {
    getAllPosts,
    createPost,
    getPostById,
    deletePostById,
    updatePostById,
    createComment,
    getCommentById,
    deleteCommentById,
    updateCommentById
} = postModel;