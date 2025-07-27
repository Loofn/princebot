const client = require('../index.js');
const tts = require('../slashCommands/dev/tts.js');

if (tts.voiceStateHandler) {
    client.on('voiceStateUpdate', tts.voiceStateHandler);
}
