import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305

# We require a 32-byte key for ChaCha20Poly1305
# If one is not set in the environment, we use a default (NOT RECOMMENDED for production)
CHACHA_KEY_STR = os.getenv('CHACHA20_KEY', 'this_is_a_32_byte_key_1234567890!!')

# Ensure the key is exactly 32 bytes
if len(CHACHA_KEY_STR) < 32:
    CHACHA_KEY_STR = CHACHA_KEY_STR.ljust(32, 'X')
elif len(CHACHA_KEY_STR) > 32:
    CHACHA_KEY_STR = CHACHA_KEY_STR[:32]

CHACHA_KEY = CHACHA_KEY_STR.encode('utf-8')
chacha = ChaCha20Poly1305(CHACHA_KEY)

def encrypt_text(plaintext: str) -> str:
    """Encrypts a string using ChaCha20Poly1305 and returns base64 string."""
    if not plaintext:
        return plaintext
    nonce = os.urandom(12)
    ciphertext = chacha.encrypt(nonce, plaintext.encode('utf-8'), None)
    # Store nonce + ciphertext combined
    return base64.b64encode(nonce + ciphertext).decode('utf-8')

def decrypt_text(encrypted_b64: str) -> str:
    """Decrypts a base64 encoded string using ChaCha20Poly1305."""
    if not encrypted_b64:
        return encrypted_b64
    try:
        data = base64.b64decode(encrypted_b64)
        nonce = data[:12]
        ciphertext = data[12:]
        plaintext = chacha.decrypt(nonce, ciphertext, None)
        return plaintext.decode('utf-8')
    except Exception as e:
        # Fallback if the text was not encrypted (e.g. from before implementation)
        # Or if decryption fails
        print(f"Decryption failed, returning raw string. Error: {e}")
        return encrypted_b64
