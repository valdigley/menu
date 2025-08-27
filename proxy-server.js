const http = require('http');
const httpProxy = require('http-proxy');

// Criar proxy
const proxy = httpProxy.createProxyServer({});

// Servidor na porta 8080
const server = http.createServer((req, res) => {
  // Adicionar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Se for OPTIONS, responder direto
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Proxy para aplicação na porta 3002
  proxy.web(req, res, {
    target: 'http://localhost:3002',
    changeOrigin: true
  });
});

// Tratar erros do proxy
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('Proxy error');
});

// Iniciar servidor
server.listen(8080, () => {
  console.log('🚀 Proxy rodando na porta 8080');
  console.log('📱 Acesse: http://fotografo.site:8080');
  console.log('📱 Ou: http://147.93.182.205:8080');
});