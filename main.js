const Discord = require("discord.js");
//const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");
const yts = require("yt-search");
const token = 'TOKEN_BOT_DISCORD';
const prefix="?";
var spot=false;

var SpotifyWebApi = require('spotify-web-api-node');

// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId: 'CLIENT_ID_USER1',
  clientSecret: 'CLIENT_SECRET_USER1',
  redirectUri: 'LINK_POSTMAN'
});

spotifyApi.setAccessToken('ACCESS_TOKEN_USER1');
spotifyApi.setRefreshToken('REFRESH_TOKEN_USER1');


spotifyApi.refreshAccessToken().then(
  function(data) {
    console.log('The access token has been refreshed!');

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body['access_token']);
  },
  function(err) {
    console.log('Could not refresh access token', err);
  }
);

var anderson = new SpotifyWebApi({
  clientId: 'CLIENT_ID_USER2',
  clientSecret: 'CLIENT_SECRET_USER2',
  redirectUri: 'LINK_POSTMAN'
});

anderson.setAccessToken('ACCESS_TOKEN_USER2');
anderson.setRefreshToken('REFRESH_TOKEN_USER2');


anderson.refreshAccessToken().then(
  function(data) {
    console.log('The access token has been refreshed!');

    // Save the access token so that it's used in future calls
    anderson.setAccessToken(data.body['access_token']);
  },
  function(err) {
    console.log('Could not refresh access token', err);
  }
);

var listamusica1= [];
var listamusica2= [];
var listamusica= [];

spotifyApi.getMySavedTracks({
  limit : 20,
  offset: 1
})
.then(function(data) {
  let i=0;
  for (const a in data.body.items) {
    //console.log(JSON.stringify(data.body.items[i].track.name));
    listamusica1.push(data.body.items[i].track.name);
    i++;
  }
  console.log(JSON.stringify(listamusica1));
}, function(err) {
  console.log('Something went wrong!', err);
});

anderson.getMySavedTracks({
  limit : 20,
  offset: 1
})
.then(function(data) {
  let i=0;
  for (const a in data.body.items) {
    //console.log(JSON.stringify(data.body.items[i].track.name));
    listamusica2.push(data.body.items[i].track.name);
    i++;
  }
  console.log(JSON.stringify(listamusica2));
  
}, function(err) {
  console.log('Something went wrong!', err);
});

const client = new Discord.Client();

const queue = new Map();

client.once("ready", () => {
  console.log("Ready!");
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    //console.log(message.content.split(" "));
    execute(message, serverQueue, []);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}spotify`)) {
    playspotify(message, serverQueue);
    return;
    }else {
    message.channel.send("Comando invalido!");
  }
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function playspotify(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Você tem que esta no canal de voz para tocar música!"
    );
  listamusica = listamusica1.filter(value => listamusica2.includes(value));
  console.log(JSON.stringify(listamusica));
  for (let i =0;i<listamusica.length;i++) {
    spot=true;
    execute(message ,queue.get(message.guild.id), ['?play', listamusica[i]]);
    await sleep(5000);
  }return message.channel.send(
    "Musicas do Spotify adicionadas!"
  );
  //serverQueue.connection.dispatcher.end();
}

async function execute(message, serverQueue, spotifypar) {

  let args = message.content.split(" ");
  if(spot){
    args = spotifypar;
    spot=false;
  }
  console.log(args);

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "Você tem que esta no canal de voz para tocar música!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "Eu preciso de permissão para entrar no canal de voz!"
    );
  }

let song;
if (ytdl.validateURL(args[1])) {
  const songInfo = await ytdl.getInfo(args[1]);
  song = {
    title: songInfo.title,
    url: songInfo.video_url
  };
} else {
  const {videos} = await yts(args.slice(1).join(" "));
  if (!videos.length) return message.channel.send("Não encontrei a música!");
  song = {
    title: videos[0].title,
    url: videos[0].url
  };
}
  
  /*const songInfo = await ytdl.getInfo(args[1]);
  const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
   };*/

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} foi adicionado a playliste!`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Você tem que estar no canal de voz para pular a música!"
    );
  if (!serverQueue)
    return message.channel.send("Não tem nem uma música para pular!");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Você tem que estar no canal de voz para parar a música!"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Tocando a música: **${song.title}**`);
}

client.login(token);
