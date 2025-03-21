"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var web3_js_1 = require("@solana/web3.js");
var spl_token_1 = require("@solana/spl-token");
var bs58_1 = require("bs58");
function createSPLToken() {
    return __awaiter(this, void 0, void 0, function () {
        var connection, PRIVATE_KEY_BASE58, wallet, mint, tokenAccount;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("devnet"), "confirmed");
                    PRIVATE_KEY_BASE58 = "4maUtZeucQdbLu3stnAJTyvH6aQ732nmayPAFARoSuHLefwdKTo9THcLBpw4HEtqQcWx8bmnDkaXnnWdkYV4p1X1";
                    wallet = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(PRIVATE_KEY_BASE58));
                    console.log("Wallet Address:", wallet.publicKey.toBase58());
                    return [4 /*yield*/, (0, spl_token_1.createMint)(connection, wallet, wallet.publicKey, // Mint Authority
                        wallet.publicKey, // Freeze Authority (can be null)
                        9 // Decimals
                        )];
                case 1:
                    mint = _a.sent();
                    console.log("Token Mint Address:", mint.toBase58());
                    return [4 /*yield*/, (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, wallet, mint, wallet.publicKey)];
                case 2:
                    tokenAccount = _a.sent();
                    console.log("Token Account:", tokenAccount.address.toBase58());
                    // Mint tokens to the wallet
                    return [4 /*yield*/, (0, spl_token_1.mintTo)(connection, wallet, mint, tokenAccount.address, wallet.publicKey, 1000 * Math.pow(10, 9) // Minting 1000 tokens (considering 9 decimals)
                        )];
                case 3:
                    // Mint tokens to the wallet
                    _a.sent();
                    console.log("Minted 1000 tokens");
                    return [2 /*return*/, { mintAddress: mint.toBase58(), tokenAccount: tokenAccount.address.toBase58() }];
            }
        });
    });
}
createSPLToken()
    .then(console.log)
    .catch(console.error);
