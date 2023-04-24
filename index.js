const { WebSocket, WebSocketServer } = require('ws');
const http = require('http');
const uuidv4 = require('uuid').v4;

const server = http.createServer();
const wsServer = new WebSocketServer({ server });
const port = 4567;
server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`);
});

const clients = {};
const users = {};

const player_pos = {}

// Event types
const typesDef = {
  USER_DISCONNECTED: 'userdisconnected',
  USER_CONNECTED: 'userconnected',
  PLAYER_POS: 'playerupdate',
  SELF_CONNECTED: 'selfconnected'
}

function broadcastMessage(json) {
  const data = JSON.stringify(json);
  for(let userId in clients) {
    let client = clients[userId];
    if(client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  };
}

function handleMessage(message, userId) {
  const dataFromClient = JSON.parse(message.toString());
  const json = { type: dataFromClient.type };  
  if (dataFromClient.type === typesDef.USER_CONNECTED) {
    users[userId] = dataFromClient;
    json.data = { username: dataFromClient.username, userID : userId };
  } else if (dataFromClient.type === typesDef.PLAYER_POS) {
    json.userID = userId;
    json.data = dataFromClient.data;
  }
  broadcastMessage(json);
}

function handleDisconnect(userId) {
    console.log(`${userId} disconnected.`);
    delete clients[userId];
    delete users[userId];
    broadcastMessage({ type: typesDef.USER_DISCONNECTED, userID : userId });
}

wsServer.on('connection', function(connection) {
  const userId = uuidv4();
  clients[userId] = connection;
  connection.send(JSON.stringify({ type: typesDef.SELF_CONNECTED, userID : userId }));
  console.log(`${userId} connected.`);
  connection.on('message', (message) => handleMessage(message, userId));
  connection.on('close', () => handleDisconnect(userId));
});
