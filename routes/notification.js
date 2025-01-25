const express = require('express');
const router = express.Router();

// SSE 클라이언트 목록을 저장할 Set
const clients = new Set();

router.get('/sse', (req, res) => {
    const origin = req.headers.origin;
    const allowedOrigins = ['http://localhost:8000', 'http://saehan.shop', 'https://saehan.shop'];

    // 연결 수 제한 확인
    if (clients.size >= 100) {
        console.log(`[${new Date().toISOString()}] Connection rejected - Too many clients: ${clients.size}`);
        res.status(503).end('Too many connections');
        return;
    }

    // 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Transfer-Encoding', 'chunked');

    // 연결 시작 로그
    console.log(`[${new Date().toISOString()}] New SSE client connected. Total clients: ${clients.size + 1}`);

    // 클라이언트에게 연결 확인 메시지 전송
    res.write('data: {"connection": "success"}\n\n');

    // 현재 클라이언트를 Set에 추가
    const client = res;
    clients.add(client);

    // 연결 유지를 위한 주기적인 ping (15초마다)
    const pingInterval = setInterval(() => {
        if (client.writable) {
            res.write(':\n\n');
        }
    }, 15000);

    // 1시간 후 연결 종료
    const timeoutId = setTimeout(() => {
        if (client.writeable) {
            res.end();
        }
        clients.delete(client);
        clearInterval(pingInterval);
        console.log(`[${new Date().toISOString()}] Connection timeout - Total clients: ${clients.size}`);
    }, 3600000);

    // 에러 처리 개선
    req.on('error', (error) => {
        if (error.code === 'ECONNRESET') {
            console.log(`[${new Date().toISOString()}] Client connection reset - Normal disconnection`);
        } else {
            console.error(`[${new Date().toISOString()}] SSE Error:`, error);
        }

        // 정리 작업
        clients.delete(client);
        clearInterval(pingInterval);
        clearTimeout(timeoutId);
    });

    // 연결이 종료되면 클라이언트 제거
    req.on('close', () => {
        clients.delete(client);
        clearInterval(pingInterval);
        clearTimeout(timeoutId);
        console.log(`[${new Date().toISOString()}] SSE client disconnected. Total clients: ${clients.size}`);
    });

    // 명시적인 에러 처리 추가
    res.on('error', (error) => {
        console.error(`[${new Date().toISOString()}] Response Error:`, error);
        clients.delete(client);
        clearInterval(pingInterval);
        clearTimeout(timeoutId);
    });
});

// 알림 전송 함수
const sendNotification = (notification) => {
    console.log(`[${new Date().toISOString()}] 알림 전송 시작: ${clients.size}명의 클라이언트에게`);
    clients.forEach(client => {
        try {
            client.write(`data: ${JSON.stringify(notification)}\n\n`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 전송 에러:`, error);
            clients.delete(client);
        }
    });
};

module.exports = { router, sendNotification };