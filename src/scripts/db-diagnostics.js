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
// File: scripts/db-diagnostics.ts
var pg_1 = require("pg");
var dns = require("dns");
var net = require("net");
var https = require("https");
// Run this script with: 
// ts-node scripts/db-diagnostics.ts
function testDbConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var dbUrl, parsedUrl, host_1, port_1, database, addresses, err_1, socket_1, portTest, err_2, minimalConfig, minimalPool, client, result, err_3, apiTest, err_4, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dbUrl = process.env.XATA_DATABASE_URL;
                    if (!dbUrl) {
                        console.error('❌ No XATA_DATABASE_URL found in environment variables');
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 21, , 22]);
                    console.log('🔍 Analyzing database connection string...');
                    parsedUrl = new URL(dbUrl);
                    host_1 = parsedUrl.hostname;
                    port_1 = parsedUrl.port || '5432';
                    database = parsedUrl.pathname.slice(1);
                    console.log("\uD83D\uDCCA Connection Details:\n  \u2022 Host: ".concat(host_1, "\n  \u2022 Port: ").concat(port_1, "\n  \u2022 Database: ").concat(database, "\n  \u2022 SSL Required: ").concat(parsedUrl.searchParams.has('sslmode'), "\n    "));
                    // 1. DNS Resolution Test
                    console.log("\n\uD83D\uDD0D Testing DNS resolution for ".concat(host_1, "..."));
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, dns.promises.lookup(host_1, { all: true })];
                case 3:
                    addresses = _a.sent();
                    console.log("\u2705 DNS resolution successful: ".concat(addresses.map(function (a) { return a.address; }).join(', ')));
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    console.error("\u274C DNS resolution failed: ".concat(err_1 instanceof Error ? err_1.message : String(err_1)));
                    console.log('   This indicates the hostname cannot be found.');
                    console.log('   Verify the hostname is correct and your DNS is working properly.');
                    return [3 /*break*/, 5];
                case 5:
                    // 2. Port Connection Test
                    console.log("\n\uD83D\uDD0D Testing TCP connection to ".concat(host_1, ":").concat(port_1, "..."));
                    socket_1 = new net.Socket();
                    portTest = new Promise(function (resolve, reject) {
                        // Set a timeout for the connection attempt
                        socket_1.setTimeout(10000);
                        socket_1.on('connect', function () {
                            console.log("\u2705 TCP connection successful to ".concat(host_1, ":").concat(port_1));
                            socket_1.end();
                            resolve();
                        });
                        socket_1.on('timeout', function () {
                            socket_1.destroy();
                            reject(new Error("Connection timed out after 10 seconds"));
                        });
                        socket_1.on('error', function (err) {
                            reject(err);
                        });
                        socket_1.connect(parseInt(port_1), host_1);
                    });
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, portTest];
                case 7:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 8:
                    err_2 = _a.sent();
                    console.error("\u274C TCP connection failed: ".concat(err_2 instanceof Error ? err_2.message : String(err_2)));
                    console.log('   This indicates a network connectivity issue or firewall blocking the connection.');
                    console.log('   Check your network/firewall settings and verify the database server is running.');
                    return [3 /*break*/, 9];
                case 9:
                    // 3. Database Connection Test with minimal options
                    console.log('\n🔍 Testing PostgreSQL connection with minimal options...');
                    minimalConfig = {
                        connectionString: dbUrl,
                        connectionTimeoutMillis: 15000, // 15 seconds timeout
                        ssl: parsedUrl.searchParams.has('sslmode') ? {
                            rejectUnauthorized: parsedUrl.searchParams.get('sslmode') !== 'require'
                        } : undefined
                    };
                    minimalPool = new pg_1.Pool(minimalConfig);
                    _a.label = 10;
                case 10:
                    _a.trys.push([10, 13, 14, 16]);
                    return [4 /*yield*/, minimalPool.connect()];
                case 11:
                    client = _a.sent();
                    console.log('✅ PostgreSQL connection successful!');
                    return [4 /*yield*/, client.query('SELECT version()')];
                case 12:
                    result = _a.sent();
                    console.log("   Server version: ".concat(result.rows[0].version));
                    client.release();
                    return [3 /*break*/, 16];
                case 13:
                    err_3 = _a.sent();
                    console.error("\u274C PostgreSQL connection failed: ".concat(err_3 instanceof Error ? err_3.message : String(err_3)));
                    console.log('   Check database credentials, SSL settings, and database server status.');
                    return [3 /*break*/, 16];
                case 14: return [4 /*yield*/, minimalPool.end()];
                case 15:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 16:
                    if (!(host_1.includes('xata.io') || host_1.includes('xata.com'))) return [3 /*break*/, 20];
                    console.log('\n🔍 Testing Xata API accessibility...');
                    apiTest = new Promise(function (resolve, reject) {
                        https.get('https://status.xata.io/api/v2/status.json', function (res) {
                            if (res.statusCode === 200) {
                                var data_1 = '';
                                res.on('data', function (chunk) { return data_1 += chunk; });
                                res.on('end', function () {
                                    try {
                                        var status_1 = JSON.parse(data_1);
                                        console.log("\u2705 Xata API accessible. Status: ".concat(status_1.status.description));
                                        resolve();
                                    }
                                    catch (e) {
                                        reject(new Error('Failed to parse Xata status response'));
                                    }
                                });
                            }
                            else {
                                reject(new Error("Xata API returned status code ".concat(res.statusCode)));
                            }
                        }).on('error', function (err) {
                            reject(err);
                        });
                    });
                    _a.label = 17;
                case 17:
                    _a.trys.push([17, 19, , 20]);
                    return [4 /*yield*/, apiTest];
                case 18:
                    _a.sent();
                    return [3 /*break*/, 20];
                case 19:
                    err_4 = _a.sent();
                    console.error("\u274C Xata API test failed: ".concat(err_4 instanceof Error ? err_4.message : String(err_4)));
                    console.log('   This might indicate general connectivity issues with Xata services.');
                    return [3 /*break*/, 20];
                case 20: return [3 /*break*/, 22];
                case 21:
                    err_5 = _a.sent();
                    console.error("\u274C Failed to parse connection string: ".concat(err_5 instanceof Error ? err_5.message : String(err_5)));
                    console.log('   Verify your XATA_DATABASE_URL is correctly formatted.');
                    return [3 /*break*/, 22];
                case 22: return [2 /*return*/];
            }
        });
    });
}
// Run the tests
testDbConnection()
    .then(function () {
    console.log('\n🔄 Diagnostics completed');
})
    .catch(function (err) {
    console.error('\n❌ Diagnostic process failed:', err);
})
    .finally(function () { return process.exit(); });
