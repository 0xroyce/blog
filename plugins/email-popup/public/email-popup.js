console.log('Email popup script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Email Popup Script Loaded');

    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.bottom = '20px';
    popup.style.right = '20px';
    popup.style.width = '300px';
    popup.style.padding = '15px';
    popup.style.backgroundColor = '#fff';
    popup.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
    popup.innerHTML = `
        <h3>Subscribe to our newsletter</h3>
        <form id="email-popup-form">
            <input type="email" id="email-popup-email" name="email" placeholder="Your email" required>
            <button type="submit">Subscribe</button>
        </form>
    `;

    document.body.appendChild(popup);

    document.getElementById('email-popup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email-popup-email').value;
        const response = await fetch('/email-popup/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (response.ok) {
            alert('Thank you for subscribing!');
        } else {
            alert('There was an error. Please try again.');
        }
    });
});