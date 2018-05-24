#Run React

To be able to run react, install all dependencies with "npm install". Then use "npm start" to run react.

IMPORTANT: If you are running it for the first time, you have to comment the line "import '../scss/style.scss'" in "index.js". With this the bundling should finish.
Afterwards you can simply uncomment the same line again to use the css file.

TODO: Find out what causes this behaviour.

# Server Messages

To ensure authenticity of messages, the users should compare the fingerprints of their signingPublicKeys on an authenticated
channel or in person. The system doesn't provide such functionality because out of scope.

## Login

    bool login(String username, String password);
    bool login(String username, String password, String signingPublicKey, String encryptionPublicKey, String encryptionKeySignature);

The second variant is used on the first login of a new customer. The server needs to store signingPublicKey,
encryptionPublicKey and encryptionKeySignature to give other users when the want to send a message. If the first variant
is used on first login, the account is not usable until the keys are provided.

## FetchKeysOfUser

    UserKeys fetchKeysOfUser(String username);

    class UserKeys {
      String signingKey;
      String encryptionKey;
      String encryptionKeySignature;
    }

Fetches a user's key before being able to send them an encrypted message. The client should verify that the
encryptionKeySignature is a valid signature of the encryption key using the private key corresponding to the signingKey.

## PostEncryptedMessage

    void postEncryptedMessage(String username, String encryptedMessage);

Uploads an encrypted message that should be delivered to user with username `username` when they fetch their messages.

## FetchEncryptedMessages

    String[] fetchEncryptedMessages();

Fetches encrypted messages for the currently logged-in user (see Section Message Format). The client will decrypt the
messages and check the signatures of the decrypted messages. The public signing key of the sender can be retrieved via
fetchKeysOfUser. Only if the signature is valid and the sender's public signing key fingerprint is trusted to be
authentic can a message delivery be considered equivalent to registered mail.

## Key Format

The keys are Base64 encodings of the ArrayBuffer that the Web Crypto API returns when exporting a raw key. Doesn't conform
to ASN.1.

## Message Format

The messages are JSON objects such as

    {
      "sender" : "username of the sender",
      "ephemeralPubkey" : "base64string...",
      "iv" : "base64string...",
      "encrypted" : "base64string..."
    }

The encrypted data is the Base64 encoding of the ArrayBuffer that the Web Crypto API returns when encrypting something.
Contains a MAC tag since the AES-GCM algorithm is used.

The unencrypted message is formatted as

    {
      "msg" : "content of the message",
      "sig" : "base64string..."
    }

The sig is the Base64 encoding of the ArrayBuffer that the Web Crypto API returns when signing something.
