import React, { Component } from 'react';

function CryptoContext() {

    var nullBytes30Base64 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"; // use non-multiple of block size on purpose to test padding
    var symmetricKey32BytesBase64 = "cHkBm+G9HfIvxM96cHnsKMHHx9FvEBLHDfu2f3Rj62s=";
    var fixedIVBase64 = "02Pk9zBdju1PBZqSN+/+Eg=="; // REMOVE FOR PRODUCTION

    var parent = this;

    var decodeBase64 = function (base64) {
        var binary_string = window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    var nullBytes30 = decodeBase64(nullBytes30Base64);
    var fixedIV = decodeBase64(fixedIVBase64);

    var decodeKey = function (input) {
        return window.crypto.subtle.importKey(
            "raw", //can be "jwk" or "raw"
            decodeBase64(input),
            {   //this is the algorithm options
                name: "AES-CBC",
            },
            false, //whether the key is extractable (i.e. can be used in exportKey)
            ["encrypt", "decrypt"] //can be "encrypt", "decrypt", "wrapKey", or "unwrapKey"
        );
    }

    var buf2hex = function (buffer) { // buffer is an ArrayBuffer
        return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
    }

    this.newEncryptionKeyPair = function () {
        return window.crypto.subtle.generate
    }

    var buf2hex = function (buffer) { // buffer is an ArrayBuffer
        return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
    }

    this.newEncryptionKeyPair = function () {
        return window.crypto.subtle.generateKey(
            {
                name: "ECDH",
                namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
            },
            false, //whether the key is extractable (i.e. can be used in exportKey)
            ["deriveKey", "deriveBits"] //can be any combination of "deriveKey" and "deriveBits"
        );
    }

    this.newSigningKeyPair = function () {
        return window.crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
            },
            false, //whether the key is extractable (i.e. can be used in exportKey)
            ["sign", "verify"] //can be any combination of "sign" and "verify"
        );
    }

    this.signKey = function (signerKey, keyToSign) {
        return crypto.subtle.exportKey("raw", keyToSign)
            .then(function (keydata) {
                return parent.sign(signerKey, keydata);
            });
    }

    this.sign = function (signerKey, data) {
        return window.crypto.subtle.sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
            },
            signerKey.privateKey, //from generateKey or importKey above
            data //ArrayBuffer of data you want to sign
        );
    }

    this.verifyKey = function (signerPubKey, keyToVerify, signature) {
        return crypto.subtle.exportKey("raw", keyToVerify)
            .then(function (keydata) {
                return window.crypto.subtle.verify(
                    {
                        name: "ECDSA",
                        hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
                    },
                    signerPubKey, //from generateKey or importKey above
                    signature,
                    keydata //ArrayBuffer of data you want to sign
                );
            });
    }

    this.produceMsg = function (msg, sig) {
        var obj = new Object();
        obj.msg = msg;
        obj.sig = buf2hex(sig);
        return obj;
    }

    this.encrypt = function (data, encKey) {
        var result = new Object();

        return parent.newEncryptionKeyPair()
            .then(function (key) {
                result.ephemeralPubkey = key.publicKey;
                return window.crypto.subtle.deriveKey(
                    {
                        name: "ECDH",
                        namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
                        public: encKey, //an ECDH public key from generateKey or importKey
                    },
                    key.privateKey, //your ECDH private key from generateKey or importKey
                    { //the key type you want to create based on the derived bits
                        name: "AES-GCM", //can be any AES algorithm ("AES-CTR", "AES-CBC", "AES-CMAC", "AES-GCM", "AES-CFB", "AES-KW", "ECDH", "DH", or "HMAC")
                        //the generateKey parameters for that type of algorithm
                        length: 256, //can be  128, 192, or 256
                    },
                    false, //whether the derived key is extractable (i.e. can be used in exportKey)
                    ["encrypt", "decrypt"] //limited to the options in that algorithm's importKey
                );
            })
            .then(function (key) {
                result.iv = window.crypto.getRandomValues(new Uint8Array(12));
                return window.crypto.subtle.encrypt(
                    {
                        name: "AES-GCM",

                        //Don't re-use initialization vectors!
                        //Always generate a new iv every time your encrypt!
                        //Recommended to use 12 bytes length
                        iv: result.iv,

                        //Tag length (optional)
                        tagLength: 128, //can be 32, 64, 96, 104, 112, 120 or 128 (default)
                    },
                    key, //from generateKey or importKey above
                    data //ArrayBuffer of data you want to encrypt
                );
            })
            .then(function (encrypted) {
                result.encrypted = buf2hex(encrypted);
                return crypto.subtle.exportKey("raw", result.ephemeralPubkey);
            })
            .then(function (keydata) {
                result.ephemeralPubkey = buf2hex(keydata);
                result.iv = buf2hex(result.iv);
                return Promise.resolve(result);
            });
    }

    this.encryptAES = function (onSuccess, onError) {
        var result = {};
        //result.iv = window.crypto.getRandomValues(new Uint8Array(16));
        result.iv = fixedIV;
        /*result.ivHex = result.iv.reduce(function(memo, i) {
            return memo + ('0' + i.toString(16)).slice(-2); //padd with leading 0 if <16
          }, '');*/
        result.ivHex = buf2hex(result.iv);

        decodeKey(symmetricKey32BytesBase64)
            .then(function (decodedKey) {
                return window.crypto.subtle.encrypt(
                    {
                        name: "AES-CBC",
                        //Don't re-use initialization vectors!
                        //Always generate a new iv every time your encrypt!
                        iv: result.iv,
                    },
                    decodedKey, //from generateKey or importKey above
                    nullBytes30 //ArrayBuffer of data you want to encrypt
                );
            })
            .then(function (encrypted) {
                //returns an ArrayBuffer containing the encrypted data
                result.encrypted = buf2hex(encrypted);
                onSuccess(result);
            })
            .catch(function (err) {
                onError(err);
            });
    }

    this.decryptAES = function (data, iv, onSuccess, onError) {
        decodeKey(symmetricKey32BytesBase64)
            .then(function (decodedKey) {
                return window.crypto.subtle.decrypt(
                    {
                        name: "AES-CBC",
                        //Don't re-use initialization vectors!
                        //Always generate a new iv every time your encrypt!
                        iv: iv,
                    },
                    decodedKey, //from generateKey or importKey above
                    data //ArrayBuffer of data you want to encrypt
                );
            })
            .then(function (decrypted) {
                //returns an ArrayBuffer containing the encrypted data
                onSuccess(buf2hex(decrypted));
            })
            .catch(function (err) {
                onError(err);
            });
    }

    this.hashSHA256 = function (onSuccess) {
        crypto.subtle.digest("SHA-256", nullBytes30).then(function (hash) {
            onSuccess(buf2hex(hash));
        });
    }

    this.ECDH = function (onSuccess, onError) {
        var ourKeypair;
        var theirKeypair;
        var ourDerivedKey;
        var theirDerivedKey;
        var ourPublicKeyExtracted;
        var ourPrivateKeyExtracted;
        var theirPublicKeyExtracted;
        var theirPrivateKeyExtracted;
        var ourDerivedKeyExtracted;
        var theirDerivedKeyExtracted;

        window.crypto.subtle.generateKey(
            {
                name: "ECDH",
                namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
            },
            true, //whether the key is extractable (i.e. can be used in exportKey)
            ["deriveKey", "deriveBits"] //can be any combination of "deriveKey" and "deriveBits"
        )
            .then(function (key) {
                ourKeypair = key;

                return window.crypto.subtle.generateKey(
                    {
                        name: "ECDH",
                        namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
                    },
                    true, //whether the key is extractable (i.e. can be used in exportKey)
                    ["deriveKey", "deriveBits"] //can be any combination of "deriveKey" and "deriveBits"
                );
            })
            .then(function (key) {
                theirKeypair = key;

                return window.crypto.subtle.deriveKey(
                    {
                        name: "ECDH",
                        namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
                        public: theirKeypair.publicKey, //an ECDH public key from generateKey or importKey
                    },
                    ourKeypair.privateKey, //your ECDH private key from generateKey or importKey
                    { //the key type you want to create based on the derived bits
                        name: "AES-CBC", //can be any AES algorithm ("AES-CTR", "AES-CBC", "AES-CMAC", "AES-GCM", "AES-CFB", "AES-KW", "ECDH", "DH", or "HMAC")
                        //the generateKey parameters for that type of algorithm
                        length: 256, //can be  128, 192, or 256
                    },
                    true, //whether the derived key is extractable (i.e. can be used in exportKey)
                    ["encrypt", "decrypt"] //limited to the options in that algorithm's importKey
                );
            })
            .then(function (keydata) {
                ourDerivedKey = keydata;

                return window.crypto.subtle.deriveKey(
                    {
                        name: "ECDH",
                        namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
                        public: ourKeypair.publicKey, //an ECDH public key from generateKey or importKey
                    },
                    theirKeypair.privateKey, //your ECDH private key from generateKey or importKey
                    { //the key type you want to create based on the derived bits
                        name: "AES-CBC", //can be any AES algorithm ("AES-CTR", "AES-CBC", "AES-CMAC", "AES-GCM", "AES-CFB", "AES-KW", "ECDH", "DH", or "HMAC")
                        //the generateKey parameters for that type of algorithm
                        length: 256, //can be  128, 192, or 256
                    },
                    true, //whether the derived key is extractable (i.e. can be used in exportKey)
                    ["encrypt", "decrypt"] //limited to the options in that algorithm's importKey
                );
            })
            .then(function (keydata) {
                theirDerivedKey = keydata;

                return window.crypto.subtle.deriveKey(
                    {
                        name: "ECDH",
                        namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
                        public: theirKeypair.publicKey, //an ECDH public key from generateKey or importKey
                    },
                    ourKeypair.privateKey, //your ECDH private key from generateKey or importKey
                    { //the key type you want to create based on the derived bits
                        name: "AES-CBC", //can be any AES algorithm ("AES-CTR", "AES-CBC", "AES-CMAC", "AES-GCM", "AES-CFB", "AES-KW", "ECDH", "DH", or "HMAC")
                        //the generateKey parameters for that type of algorithm
                        length: 256, //can be  128, 192, or 256
                    },
                    true, //whether the derived key is extractable (i.e. can be used in exportKey)
                    ["encrypt", "decrypt"] //limited to the options in that algorithm's importKey
                );
            })
            .then(function (keydata) {
                return crypto.subtle.exportKey("raw", ourKeypair.publicKey);
            })
            .then(function (keydata) {
                ourPublicKeyExtracted = keydata;
                return crypto.subtle.exportKey("jwk", ourKeypair.privateKey);
            })
            .then(function (keydata) {
                ourPrivateKeyExtracted = keydata;
                return crypto.subtle.exportKey("raw", theirKeypair.publicKey);
            })
            .then(function (keydata) {
                theirPublicKeyExtracted = keydata;
                return crypto.subtle.exportKey("jwk", theirKeypair.privateKey);
            })
            .then(function (keydata) {
                theirPrivateKeyExtracted = keydata;
                return crypto.subtle.exportKey("raw", ourDerivedKey);
            })
            .then(function (keydata) {
                ourDerivedKeyExtracted = keydata;
                return crypto.subtle.exportKey("raw", theirDerivedKey);
            })
            .then(function (keydata) {
                theirDerivedKeyExtracted = keydata;
                onSuccess(buf2hex(ourPublicKeyExtracted),
                    ourPrivateKeyExtracted.x + "---|---" + ourPrivateKeyExtracted.y + "---|---" + ourPrivateKeyExtracted.d,
                    buf2hex(theirPublicKeyExtracted),
                    theirPrivateKeyExtracted.x + "---|---" + theirPrivateKeyExtracted.y + "---|---" + theirPrivateKeyExtracted.d,
                    buf2hex(ourDerivedKeyExtracted),
                    buf2hex(theirDerivedKeyExtracted));
            })
            .catch(function (err) {
                onError(err);
            });
    }
}

function ServerMock(cryptoCtx) {
    this.cryptoCtx = cryptoCtx;
    this.xPubSigningKey = null;
    this.xPubEncryptionKey = null;
    this.yPubSigningKey = null;
    this.yPubEncryptionKey = null;
    this.xKeySignature = null;
    this.yKeySignature = null;
    this.clientSigKey = null;
    this.clientEncKey = null;
    this.waitingDocument = null;
    var parent = this;

    this.init = function () {
        return parent.cryptoCtx.newSigningKeyPair()
            .then(function (key) {
                parent.xPubSigningKey = key;
                return parent.cryptoCtx.newEncryptionKeyPair();
            })
            .then(function (key) {
                parent.xPubEncryptionKey = key.publicKey;
                return parent.cryptoCtx.newSigningKeyPair();
            })
            .then(function (key) {
                parent.yPubSigningKey = key;
                return parent.cryptoCtx.newEncryptionKeyPair();
            })
            .then(function (key) {
                parent.yPubEncryptionKey = key.publicKey;
                return parent.cryptoCtx.signKey(parent.xPubSigningKey, parent.xPubEncryptionKey);
            })
            .then(function (sig) {
                parent.xKeySignature = sig;
                parent.xPubSigningKey = parent.xPubSigningKey.publicKey; // throw away the private key
                return parent.cryptoCtx.signKey(parent.yPubSigningKey, parent.yPubEncryptionKey);
            })
            .then(function (sig) {
                parent.yKeySignature = sig;
                parent.yPubSigningKey = parent.yPubSigningKey.publicKey; // throw away the private key
                return Promise.resolve();
            });
    }

    this.obtainPublicSigningKey = function (receiver) {
        if (receiver == "x") {
            return Promise.resolve(parent.xPubSigningKey);
        } else if (receiver == "y") {
            return Promise.resolve(parent.yPubSigningKey);
        } else {
            return Promise.reject();
        }
    }

    this.obtainPublicEncryptionKey = function (receiver) {
        if (receiver == "x") {
            return Promise.resolve(parent.xPubEncryptionKey);
        } else if (receiver == "y") {
            return Promise.resolve(parent.yPubEncryptionKey);
        } else {
            return Promise.reject();
        }
    }

    this.obtainEncryptionKeySignature = function (receiver) {
        if (receiver == "x") {
            return Promise.resolve(parent.xKeySignature);
        } else if (receiver == "y") {
            return Promise.resolve(parent.yKeySignature);
        } else {
            return Promise.reject();
        }
    }

    this.uploadPubkeys = function (sigKey, encKey) {
        parent.clientSigKey = sigKey;
        parent.clientEncKey = encKey;

        return Promise.resolve();
    }
}

function ServerContext(ctx, cryptoCtx, serverMock) {
    this.signingKeyPair = null;
    this.encryptionKeyPair = null;
    this.ctx = ctx;
    this.cryptoCtx = cryptoCtx;
    this.serverMock = serverMock;
    var parent = this;

    this.login = function () {
        if (parent.signingKeyPair == null) {
            ctx.printl("logging into server for the first time");
            ctx.printl("generating new key pairs");
            return cryptoCtx.newSigningKeyPair()
                .then(function (key) {
                    parent.signingKeyPair = key;
                    return cryptoCtx.newEncryptionKeyPair();
                })
                .then(function (key) {
                    parent.encryptionKeyPair = key;
                    ctx.printl("uploading public keys to server");
                    return parent.serverMock.uploadPubkeys(parent.signingKeyPair.publicKey, parent.encryptionKeyPair.publicKey);
                });
        } else {
            ctx.printl("logging into server");
            return Promise.resolve();
        }
    }

    this.sendDocument = function (doc, receiver) {
        var sigKey = null;
        var encKey = null;
        var keySig = null;

        var documentSig = null;

        ctx.printl("sending document to " + receiver);

        ctx.printl("obtaining public keys of " + receiver);
        return parent.serverMock.obtainPublicSigningKey(receiver)
            .then(function (key) {
                sigKey = key;
                return parent.serverMock.obtainPublicEncryptionKey(receiver);
            })
            .then(function (key) {
                encKey = key;
                return parent.serverMock.obtainEncryptionKeySignature(receiver);
            })
            .then(function (sig) {
                keySig = sig;
                return parent.cryptoCtx.verifyKey(sigKey, encKey, keySig);
            })
            .then(function (success) {
                if (success) {
                    ctx.printl("verified authenticity of encryption key");
                    return parent.cryptoCtx.sign(parent.signingKeyPair, new TextEncoder().encode(doc));
                } else {
                    Promise.reject("failed key verification");
                }
            })
            .then(function (sig) {
                ctx.printl("signed our message");
                documentSig = sig;
                var data = parent.cryptoCtx.produceMsg(doc, sig);
                ctx.printl("encoded msg as " + JSON.stringify(data, null, 2).replace("\n", "<br/>"));
                return parent.cryptoCtx.encrypt(new TextEncoder().encode(JSON.stringify(data)), encKey);
            })
            .then(function (encrypted) {
                ctx.printl("encrypted the message");
                ctx.printl("encoded msg as " + JSON.stringify(encrypted, null, 2).replace("\n", "<br/>"));
                ctx.printl("uploading encrypted message to server");
                return Promise.resolve();
            });
    }
}

function Context(cryptoCtx, serverMock) {
    var output = document.getElementById("output");
    this.cryptoCtx = cryptoCtx;
    this.serverCtx = new ServerContext(this, this.cryptoCtx, serverMock);
    var parent = this;

    this.printl = function (str) {
        output.innerHTML += str + "<br/>";
    }

    this.printl("loaded page");

    this.login = function () {
        return parent.serverCtx.login()
            .then(function () {
                return Promise.resolve();
            });
    }

    this.logout = function () {
        parent.printl("logging out");
        return Promise.resolve();
    }

    this.sendDocument = function (doc, receiver) {
        return parent.serverCtx.sendDocument(doc, receiver)
            .then(function () {
                return Promise.resolve();
            });
    }

    this.aesExample = function () {
        var parent = this;

        this.printl("<br/>testing AES encryption (using CBC)");
        var encryptionResult;
        this.cryptoCtx.encryptAES(function (result) {
            encryptionResult = result;
            parent.printl("AES encryption success");
            parent.printl("iv: " + result.ivHex);
            parent.printl("encrypted: " + result.encrypted);

            parent.printl("expected: 6536452c7716cd47628a2d9a47859abebfac6887f6a1267490c2de758aceab18");
            parent.printl("<br/>obtained expected result using <span style=\"font-family: monospace\">dd if=/dev/zero bs=30 count=1 | openssl enc -aes-256-cbc -iv d363e4f7305d8eed4f059a9237effe12 -K 7079019be1bd1df22fc4cf7a7079ec28c1c7c7d16f1012c70dfbb67f7463eb6b -nosalt | xxd</span>");
            parent.printl("equivalent to using <span style=\"font-family: monospace\">echo \"000000000000000000000000000000000000000000000000000000000000 0202\" | xxd -r -p | openssl enc -aes-256-cbc -iv d363e4f7305d8eed4f059a9237effe12 -K 7079019be1bd1df22fc4cf7a7079ec28c1c7c7d16f1012c70dfbb67f7463eb6b -nosalt  -nopad | xxd</span>");
            parent.printl("thus, we see that the implementation uses the padding defined by PKCS#7");

            parent.printl("<br/>decryping");
            var ciphertext = new Uint8Array(encryptionResult.encrypted.match(/[\da-f]{2}/gi).map(function (h) {
                return parseInt(h, 16)
            }));
            var iv = new Uint8Array(encryptionResult.ivHex.match(/[\da-f]{2}/gi).map(function (h) {
                return parseInt(h, 16)
            }));
            parent.cryptoCtx.decryptAES(ciphertext, iv, function (result) {
                parent.printl("AES decryption success");
                parent.printl("decrypted: " + result);
                parent.printl("matches expected result");

                parent.printl("<br/>hashing");
                parent.cryptoCtx.hashSHA256(function (hash) {
                    parent.printl("hash of input data (SHA256): " + hash);
                    parent.printl("expecting: 0679246d6c4216de0daa08e5523fb2674db2b6599c3b72ff946b488a15290b62");

                    parent.printl("<br/>ECDH");
                    parent.cryptoCtx.ECDH(function (ourPublicKey, ourPrivateKey, theirPublicKey, theirPrivateKey, ourDerivedKey, theirDerivedKey) {
                        parent.printl("ECDH example success");
                        parent.printl("our public key: " + ourPublicKey);
                        parent.printl("our private key: " + ourPrivateKey);
                        parent.printl("their public key: " + theirPublicKey);
                        parent.printl("their private key: " + theirPrivateKey);
                        parent.printl("<br/>our derived key: " + ourDerivedKey);
                        parent.printl("their derived key: " + theirDerivedKey);
                        //parent.printl("our derived key when calling the function a second time: " + ourDerivedKey2);

                        parent.printl("<br/>our and their derived key should be the same.");
                        parent.printl("for each session both (or at least one) party should generate a new ecdh keypair (and sign it with their ECDSA keypair " +
                            "for authentication) (for forwared secrecy: ephemeral keys)");
                        parent.printl("after key exchange the parties can use the derived shared secret as a symmetric key for subsequent encrypted, authenticated communication");
                    }, function (err) {
                        parent.printl(err);
                    });
                });
            }, function (err) {
                parent.printl(err);
            });
        }, function (err) {
            parent.printl(err);
        });
    }
}

window.onload = function () {
    var cryptoCtx = new CryptoContext();
    var serverMock = new ServerMock(cryptoCtx);
    var ctx = new Context(cryptoCtx, serverMock);

    serverMock.init()
        .then(function () {

            return ctx.login()
                .then(function () {
                    return ctx.sendDocument("asdf", "x");
                })
                .then(function () {
                    return ctx.logout();
                })
                .then(function () {
                    return ctx.login();
                })
                .then(function () {
                    return ctx.sendDocument("abcd", "y");
                });
            //ctx.checkDocuments();

        })
        .catch(function (err) {
            ctx.printl(err);
        });
}


class Encryption extends Component {
    render() {
        return (
            <div id="output" />
        )
    }
}

export default Encryption;
