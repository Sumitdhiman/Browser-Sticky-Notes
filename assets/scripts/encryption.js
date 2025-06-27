// Simple XOR encryption for demonstration
const ENCRYPTION_KEY = 'sticky-notes-key';

function encrypt(text) {
    return btoa(Array.from(text).map((c, i) => 
        String.fromCharCode(c.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
    ).join(''));
}

function decrypt(data) {
    try {
        return Array.from(atob(data)).map((c, i) =>
            String.fromCharCode(c.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
        ).join('');
    } catch {
        return '';
    }
}

export { encrypt, decrypt };
