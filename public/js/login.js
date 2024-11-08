document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = '/wall';
        } else {
            document.getElementById('error-messages').innerHTML =
                `<p style="color: red">${data.message}</p>`;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}); 