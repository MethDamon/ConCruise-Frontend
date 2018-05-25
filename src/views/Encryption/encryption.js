import React, { Component } from 'react';


var concruise;
(function (concruise) {
    var ConCruise = (function () {
        function ConCruise() {
        }
        ConCruise.main = function (args) {
            var cryptoCtx = new concruise.CryptoContext();
            var serverMock = new concruise.ServerMock(cryptoCtx);
            var ctx = new concruise.Context(cryptoCtx, serverMock);
            var pro1 = serverMock.init();
            var pro2 = pro1.then(function (t) {
                return ctx.login();
            });
            var pro3 = pro2.then(function (t) {
                return ctx.sendDocument("asdf", "x");
            });
            var pro4 = pro3.then(function (t) {
                return ctx.logout();
            });
            var pro5 = pro4.then(function (t) {
                return ctx.login();
            });
            var pro6 = pro5.then(function (t) {
                return ctx.sendDocument("abcd", "y");
            });
            var pro7 = pro6.then(function (t) {
                return ctx.checkDocuments();
            });
            pro7.catch(function (err) {
                ctx.printl(err);
            });
        };
        return ConCruise;
    }());
    concruise.ConCruise = ConCruise;
    ConCruise["__class"] = "concruise.ConCruise";

    // TODO replace
    var ServerMock = (function () {
        function ServerMock(cryptoCtx) {
            /*private*/ this.xPubSigningKey = null;
            /*private*/ this.xPubEncryptionKey = null;
            /*private*/ this.yPubSigningKey = null;
            /*private*/ this.yPubEncryptionKey = null;
            /*private*/ this.xKeySignature = null;
            /*private*/ this.yKeySignature = null;
            /*private*/ this.clientSigKey = null;
            /*private*/ this.clientEncKey = null;
            if (this.cryptoCtx === undefined)
                this.cryptoCtx = null;
            this.cryptoCtx = cryptoCtx;
        }
        ServerMock.prototype.init = function () {
            var _this = this;
            var pro1 = this.cryptoCtx.newSigningKeyPair();
            var pro2 = pro1.then(function (key) {
                _this.xPubSigningKey = key;
                return _this.cryptoCtx.newEncryptionKeyPair();
            });
            var pro3 = pro2.then(function (key) {
                _this.xPubEncryptionKey = key.publicKey;
                return _this.cryptoCtx.newSigningKeyPair();
            });
            var pro4 = pro3.then(function (key) {
                _this.yPubSigningKey = key;
                return _this.cryptoCtx.newEncryptionKeyPair();
            });
            var pro5 = pro4.then(function (key) {
                _this.yPubEncryptionKey = key.publicKey;
                return _this.cryptoCtx.signKey(_this.xPubSigningKey, _this.xPubEncryptionKey);
            });
            var pro6 = pro5.then(function (sig) {
                _this.xKeySignature = sig;
                _this.xPubSigningKey = _this.xPubSigningKey.publicKey;
                return _this.cryptoCtx.signKey(_this.yPubSigningKey, _this.yPubEncryptionKey);
            });
            var pro7 = pro6.then(function (sig) {
                _this.yKeySignature = sig;
                _this.yPubSigningKey = _this.yPubSigningKey.publicKey;
                return Promise.resolve();
            });
            return pro7;
        };
        ServerMock.prototype.uploadPubkeys = function (sigKey, encKey) {
            this.clientSigKey = sigKey;
            this.clientEncKey = encKey;
            return Promise.resolve();
        };
        ServerMock.prototype.obtainPublicSigningKey = function (receiver) {
            if (receiver === "x") {
                return Promise.resolve(this.xPubSigningKey);
            }
            else if (receiver === "y") {
                return Promise.resolve(this.yPubSigningKey);
            }
            else {
                return Promise.reject("user not found");
            }
        };
        ServerMock.prototype.obtainPublicEncryptionKey = function (receiver) {
            if (receiver === "x") {
                return Promise.resolve(this.xPubEncryptionKey);
            }
            else if (receiver === "y") {
                return Promise.resolve(this.yPubEncryptionKey);
            }
            else {
                return Promise.reject("user not found");
            }
        };
        ServerMock.prototype.obtainEncryptionKeySignature = function (receiver) {
            if (receiver === "x") {
                return Promise.resolve(this.xKeySignature);
            }
            else if (receiver === "y") {
                return Promise.resolve(this.yKeySignature);
            }
            else {
                return Promise.reject("user not found");
            }
        };
        ServerMock.prototype.fetchEncryptedDocument = function () {
            var _this = this;
            if (this.clientEncKey != null) {
                var senderSigningKey_1 = null;
                var doc_1 = "asdf";
                var pro1 = this.cryptoCtx.newSigningKeyPair();
                var pro2 = pro1.then(function (key) {
                    senderSigningKey_1 = key;
                    return _this.cryptoCtx.sign(senderSigningKey_1, doc_1);
                });
                var pro3 = pro2.then(function (sig) {
                    var data = _this.cryptoCtx.produceMsg(doc_1, sig);
                    return _this.cryptoCtx.encrypt(_this.cryptoCtx.serializeMessage(data, false), _this.clientEncKey);
                });
                var pro4 = pro3.then(function (encrypted) {
                    encrypted.receiver = "ConCruise Tester";
                    return Promise.resolve(encrypted);
                });

                return pro4;
            }
            else {
                return Promise.reject("forgot to upload public keys");
            }
        };
        return ServerMock;
    }());
    concruise.ServerMock = ServerMock;
    ServerMock["__class"] = "concruise.ServerMock";
    var ServerContext = (function () {
        function ServerContext(ctx, cryptoCtx, serverMock) {
            /*private*/ this.user = "user";
            /*private*/ this.pass = "pass";
            /*private*/ this.signingKeyPair = null;
            /*private*/ this.encryptionKeyPair = null;
            if (this.ctx === undefined)
                this.ctx = null;
            if (this.cryptoCtx === undefined)
                this.cryptoCtx = null;
            if (this.serverMock === undefined)
                this.serverMock = null;
            this.ctx = ctx;
            this.cryptoCtx = cryptoCtx;
            this.serverMock = serverMock;
        }
        ServerContext.prototype.login = function () {
            var _this = this;
            this.signingKeyPair = this.ctx.loadSigningKey();
            this.encryptionKeyPair = this.ctx.loadEncryptionKey();
            if (this.signingKeyPair == null) {
                this.ctx.printl("logging into server for the first time");
                this.ctx.printl("generating new key pairs");
                var pro1 = this.cryptoCtx.newSigningKeyPair();
                var pro2 = pro1.then(function (key) {
                    _this.signingKeyPair = key;
                    return _this.cryptoCtx.newEncryptionKeyPair();
                });
                var pro3 = pro2.then(function (key) {
                    _this.encryptionKeyPair = key;
                    _this.ctx.printl("uploading public keys to server");
                    _this.ctx.storeKeys(_this.signingKeyPair, _this.encryptionKeyPair);
                    return _this.serverMock.uploadPubkeys(_this.signingKeyPair.publicKey, _this.encryptionKeyPair.publicKey);
                });
                return pro3;
            }
            else {
                this.ctx.printl("logging into server");
                return Promise.resolve();
            }
        };
        ServerContext.prototype.sendDocument = function (doc, receiver) {
            var _this = this;
            var sigKey = null;
            var encKey = null;
            var keySig = null;
            var documentSig = null;
            this.ctx.printl("sending document to " + receiver);
            this.ctx.printl("obtaining public keys of " + receiver);
            var pro1 = this.serverMock.obtainPublicSigningKey(receiver);
            var pro2 = pro1.then(function (key) {
                sigKey = key;
                return _this.serverMock.obtainPublicEncryptionKey(receiver);
            });
            var pro3 = pro2.then(function (key) {
                encKey = key;
                return _this.serverMock.obtainEncryptionKeySignature(receiver);
            });
            var pro4 = pro3.then(function (sig) {
                keySig = sig;
                return _this.cryptoCtx.verifyKey(sigKey, encKey, keySig);
            });
            var pro5 = pro4.then(function (success) {
                if (success) {
                    _this.ctx.printl("verified authenticity of encryption key");
                    return _this.cryptoCtx.sign(_this.signingKeyPair, doc);
                }
                else {
                    return Promise.reject("failed key verification");
                }
            });
            var pro6 = pro5.then(function (sig) {
                _this.ctx.printl("signed our message");
                documentSig = sig;
                var data = _this.cryptoCtx.produceMsg(doc, sig);
                _this.ctx.printl("encoded msg as " + _this.cryptoCtx.serializeMessage(data, true));
                return _this.cryptoCtx.encrypt(_this.cryptoCtx.serializeMessage(data, false), encKey);
            });
            var pro7 = pro6.then(function (encrypted) {
                encrypted.receiver = receiver;
                _this.ctx.printl("encrypted the message");
                _this.ctx.printl("encoded msg as " + _this.cryptoCtx.serializeEncryptedMessage(encrypted, true));
                _this.ctx.printl("uploading encrypted message to server");
                return Promise.resolve();
            });
            return pro7;
        };
        ServerContext.prototype.fetchEncryptedDocument = function () {
            var _this = this;
            var pro1 = this.serverMock.fetchEncryptedDocument();
            var pro2 = pro1.then(function (msg) {
                _this.ctx.printl("fetched encrypted document " + _this.cryptoCtx.serializeEncryptedMessage(msg, true));
                return Promise.resolve();
            });
            return pro2;
        };
        return ServerContext;
    }());
    concruise.ServerContext = ServerContext;
    ServerContext["__class"] = "concruise.ServerContext";
    var Context = (function () {
        function Context(cryptoCtx, serverMock) {
            if (this.output === undefined)
                this.output = null;
            if (this.cryptoCtx === undefined)
                this.cryptoCtx = null;
            if (this.serverCtx === undefined)
                this.serverCtx = null;
            this.output = document.getElementById("output");
            this.cryptoCtx = cryptoCtx;
            this.serverCtx = new concruise.ServerContext(this, cryptoCtx, serverMock);
            this.printl("loaded page");
        }
        Context.prototype.printl = function (str) {
            output.innerHTML += str + "<br/>";
        };
        Context.prototype.login = function () {
            return this.serverCtx.login();
        };
        Context.prototype.sendDocument = function (doc, user) {
            return this.serverCtx.sendDocument(doc, user);
        };
        Context.prototype.logout = function () {
            this.printl("logging out");
            return Promise.resolve();
        };
        Context.prototype.checkDocuments = function () {
            return this.serverCtx.fetchEncryptedDocument();
        };
        Context.prototype.loadSigningKey = function () {
            return null; // TODO
        };
        Context.prototype.loadEncryptionKey = function () {
            return null; // TODO
        };
        Context.prototype.storeKeys = function (signingKeyPair, encryptionKeyPair) {
            // TODO
        };
        return Context;
    }());
    concruise.Context = Context;
    Context["__class"] = "concruise.Context";
    var CryptoContext = (function () {
        function CryptoContext() {
        }
        CryptoContext.prototype.newEncryptionKeyPair = function () {
            return window.crypto.subtle.generateKey(
                {
                    name: "ECDH",
                    namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
                },
                false, //whether the key is extractable (i.e. can be used in exportKey)
                ["deriveKey", "deriveBits"] //can be any combination of "deriveKey" and "deriveBits"
            );
        };
        CryptoContext.prototype.newSigningKeyPair = function () {
            return window.crypto.subtle.generateKey(
                {
                    name: "ECDSA",
                    namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
                },
                false, //whether the key is extractable (i.e. can be used in exportKey)
                ["sign", "verify"] //can be any combination of "sign" and "verify"
            );
        };
        CryptoContext.prototype.signKey = function (signingKey, keyToSign) {
            var _this = this;
            return crypto.subtle.exportKey("raw", keyToSign)
                .then(function (keydata) {
                    return _this.sign(signingKey, keydata);
                });
        };
        CryptoContext.prototype.verifyKey = function (signerPubKey, keyToVerify, signature) {
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
        };
        CryptoContext.prototype.sign = function (signerKey, data) {
            if (!(data instanceof ArrayBuffer)) data = new TextEncoder().encode(data);

            return window.crypto.subtle.sign(
                {
                    name: "ECDSA",
                    hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
                },
                signerKey.privateKey, //from generateKey or importKey above
                data //ArrayBuffer of data you want to sign
            );
        };
        CryptoContext.prototype.produceMsg = function (data, sig) {
            var obj = new Object();
            obj.msg = data;
            obj.sig = this.buf2hex(sig);
            return obj;
        };
        CryptoContext.prototype.serializeMessage = function (msg, pretty) {
            if (!pretty) {
                return JSON.stringify(msg);
            }
            else {
                return JSON.stringify(msg, null, 2).replace("\n", "<br/>");
            }
        };
        CryptoContext.prototype.serializeEncryptedMessage = function (msg, pretty) {
            return this.serializeMessage(msg, pretty);
        };
        CryptoContext.prototype.encrypt = function (message, receiverPubKey) {
            var _this = this;
            var result = new Object();

            if (!(message instanceof ArrayBuffer)) message = new TextEncoder().encode(message);

            return this.newEncryptionKeyPair()
                .then(function (key) {
                    result.ephemeralPubkey = key.publicKey;
                    return window.crypto.subtle.deriveKey(
                        {
                            name: "ECDH",
                            namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
                            public: receiverPubKey, //an ECDH public key from generateKey or importKey
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
                    result.iv = window.crypto.getRandomValues(new Uint8Array(16));
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
                        message //ArrayBuffer of data you want to encrypt
                    );
                })
                .then(function (encrypted) {
                    result.encrypted = _this.buf2hex(encrypted);
                    return crypto.subtle.exportKey("raw", result.ephemeralPubkey);
                })
                .then(function (keydata) {
                    result.ephemeralPubkey = _this.buf2hex(keydata);
                    result.iv = _this.buf2hex(result.iv);
                    return Promise.resolve(result);
                });
        };
        /*private*/ CryptoContext.prototype.buf2hex = function (buf) {
            return Array.prototype.map.call(new Uint8Array(buf), x => ('00' + x.toString(16)).slice(-2)).join('');
        };
        return CryptoContext;
    }());
    concruise.CryptoContext = CryptoContext;
    CryptoContext["__class"] = "concruise.CryptoContext";
})(concruise || (concruise = {}));

class Encryption extends Component {

    componentDidMount() {
        concruise.ConCruise.main(null);
    }

    render() {
        return (<div className="animated fadeIn">
            <div className="row">
                <div className="col-md-12 mx-auto">
                    <div className="card">
                        <div className="card-header">
                            <strong>Encryption Example</strong>
                        </div>
                        <div className="card-body">
                            <div id="output"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>)
    }
}

export default Encryption;