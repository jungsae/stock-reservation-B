const express = require('express');
const router = express.Router();

// SSE 클라이언트 목록을 저장할 Set
const clients = new Set();

router.get('/sse', (req, res) => {
    // SSE 헤더 설정
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    // 클라이언트에게 연결 확인 메시지 전송
    res.write('data: {"connection": "success"}\n\n');

    // 현재 클라이언트를 Set에 추가
    const client = res;
    clients.add(client);

    // 연결이 종료되면 클라이언트 제거
    req.on('close', () => {
        clients.delete(client);
    });
});

// 다른 서비스에서 알림을 보낼 때 사용할 함수
const sendNotification = (notification) => {
    console.log(notification)
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify(notification)}\n\n`);
    });
};

module.exports = { router, sendNotification };