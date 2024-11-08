# thewall_attempt1

A social platform built with Node.js and Express that allows users to create posts, comments, and replies. This project is an experiment with CursorAI  exploring how AI assistance can help streamline the development process while maintaining clean architecture and best practices.

## Features

- User authentication (login/registration)
- Create, read, update, and delete posts
- Comment on posts
- Reply to comments
- Real-time updates using AJAX
- Clean MVC architecture

## Tech Stack

- Backend: Node.js with Express
- Database: MySQL
- Frontend: JavaScript (ES6), HTML, CSS
- Template Engine: EJS
- Authentication: bcrypt & express-session

## Setup

1. Clone the repository:
    ```bash
    git clone https://github.com/YOUR_USERNAME/thewall_attempt1.git
    cd thewall_attempt1
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory with the following variables:
    ```plaintext
    PORT=3000
    DB_HOST=localhost
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_DATABASE=thewall
    SESSION_SECRET=your_session_secret
    ```

4. Set up the database:
- Create a MySQL database named 'thewall'
- Run the SQL schema:
    ```sql
    CREATE TABLE `thewall`.`users` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `email_address` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `salt` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NULL DEFAULT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`));

    CREATE TABLE `thewall`.`posts` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `content` TEXT NOT NULL,
    `comments_count` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`));

    CREATE TABLE `thewall`.`comments` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `post_id` INT NOT NULL,
    `parent_comment_id` INT NULL DEFAULT NULL,
    `content` TEXT NOT NULL,
    `replies_count` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`));
    ```


5. Start the server:
```bash
npm run dev
```

## Project Structure
```plaintext
thewall_attempt1/
├── configs/
│   └── database.config.js
├── controllers/
│   ├── auth.controller.js
│   └── wall.controller.js
├── helpers/
├── middleware/
│   └── auth.middleware.js
├── models/
│   ├── post.model.js
│   └── user.model.js
├── node_modules/
├── public/
│   ├── css/
│   └── js/
├── routes/
│   ├── auth.routes.js
│   └── wall.routes.js
├── views/
│   ├── login.ejs
│   ├── register.ejs
│   └── wall.ejs
├── .cursorules
├── .env
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── server.js
```