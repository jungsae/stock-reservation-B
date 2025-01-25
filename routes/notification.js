const express = require('express');
const router = express.Router();
const morgan = require('morgan');

// SSE 클라이언트 목록을 저장할 Set
const clients = new Set();

// SSE 전용 morgan 로깅 설정
router.use(morgan('[:date[clf]] :method :url :status - :remote-addr - SSE Connection'));

router.get('/sse', (req, res) => {
    // 요청의 origin 확인
    const origin = req.headers.origin;
    console.log(origin)
    const allowedOrigins = ['http://localhost:8000', 'http://saehan.shop', 'https://saehan.shop'];

    // SSE 헤더 설정 (CORS 포함)
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        'Access-Control-Allow-Credentials': 'true'
    });

    // 클라이언트에게 연결 확인 메시지 전송
    res.write('data: {"connection": "success"}\n\n');

    // 현재 클라이언트를 Set에 추가
    const client = res;
    clients.add(client);
    console.log(`[${new Date().toISOString()}] New SSE client connected. Total clients: ${clients.size}`);

    // 연결이 종료되면 클라이언트 제거
    req.on('close', () => {
        clients.delete(client);
        console.log(`[${new Date().toISOString()}] SSE client disconnected. Total clients: ${clients.size}`);
    });
});

// 다른 서비스에서 알림을 보낼 때 사용할 함수
const sendNotification = (notification) => {
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify(notification)}\n\n`);
    });
};

module.exports = { router, sendNotification };