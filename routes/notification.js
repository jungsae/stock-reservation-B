const express = require('express');
const router = express.Router();
const morgan = require('morgan');

// SSE 클라이언트 목록을 저장할 Set
const clients = new Set();

// SSE 전용 morgan 로깅 설정
router.use(morgan('[:date[clf]] :method :url :status - :remote-addr - SSE Connection'));

router.get('/sse', (req, res) => {
    const origin = req.headers.origin;
    const allowedOrigins = ['http://localhost:8000', 'http://saehan.shop', 'https://saehan.shop'];

    // 헤더 설정 방식 변경
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // 명시적으로 청크 인코딩 설정
    res.setHeader('Transfer-Encoding', 'chunked');

    // 연결 유지를 위한 주기적인 ping
    const pingInterval = setInterval(() => {
        res.write(':\n\n');  // 커멘트 라인으로 연결 유지
    }, 15000);  // 15초마다

    // 연결 수 제한 추가
    if (clients.size >= 100) {  // 최대 연결 수 제한
        res.status(503).end('Too many connections');
        return;
    }

    // 연결 시간 제한 추가
    setTimeout(() => {
        res.end();
        clients.delete(res);
        clearInterval(pingInterval);
    }, 3600000); // 1시간 후 연결 종료

    req.on('close', () => {
        clearInterval(pingInterval);
        clients.delete(res);
        console.log(`[${new Date().toISOString()}] SSE client disconnected. Total clients: ${clients.size}`);
    });

    // 클라이언트에게 연결 확인 메시지 전송
    res.write('data: {"connection": "success"}\n\n');

    // 현재 클라이언트를 Set에 추가
    const client = res;
    clients.add(client);
    console.log(`[${new Date().toISOString()}] New SSE client connected. Total clients: ${clients.size}`);
});

// 다른 서비스에서 알림을 보낼 때 사용할 함수
const sendNotification = (notification) => {
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify(notification)}\n\n`);
    });
};

module.exports = { router, sendNotification };