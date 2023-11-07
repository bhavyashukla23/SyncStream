const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = 3001;

let clients = [];
let documentText = '';

function eventsHandler(request, response, next) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  response.writeHead(200, headers);

  const data = `data: ${JSON.stringify({ text: documentText })}\n\n`;
  response.write(data);

  const clientId = Date.now();

  const newClient = {
    id: clientId,
    response
  };

  clients.push(newClient);

  request.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter(client => client.id !== clientId);
  });
}

function updateDocument(newText) {
  documentText = newText;
  clients.forEach(client => client.response.write(`data: ${JSON.stringify({ text: documentText })}\n\n`));
}

app.get('/status', (request, response) => response.json({ clients: clients.length }));
app.get('/document', (request, response) => response.json({ text: documentText }));
app.get('/events', eventsHandler);

app.post('/update', (request, response) => {
  const { text } = request.body;
  updateDocument(text);
  response.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Real-time Document at http://localhost:${PORT}`);
});

