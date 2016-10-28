var attach = require('rtc-attach');
var capture = require('rtc-capture');
var quickconnect = require('rtc-quickconnect');
var classtweak = require('classtweak');
var append = require('fdom/append');
var qsa = require('fdom/qsa');
var kgo = require('kgo');
var config = require('./config.js');

/**
  # demo-quickconnect

  This is a demonstration of how
  [`rtc-quickconnect`](https://github.com/rtc-io/rtc-quickconnect) can be used
  to create a simple video conferencing application.


**/
function createConference() {

  console.log('createConference called');

  var conference = quickconnect(config.switchboard, {
    // we are going to let quickconnect autogenerate #room names if not
    // supplied, but we will announce in the "qcdemo" namespace
    ns: 'qcdemo',

    // only start the conference when we have received 1 local stream
    expectedLocalStreams: 1,

    // show rtc internal logs in js console
    debug: true,

    // flag reactive, which allow us to be more flexible in chrome browsers
    // reactive: true,

    // use some standard free ice servers
    iceServers: require('freeice')()
  });

  console.log('quickconnect insteance created : ', conference);

  conference
  .createDataChannel('chat')
  .on('call:ended', removeRemoteVideos)
  .on('stream:added', renderRemote);

  localVideo(conference, config);
}

function localVideo(qc, cfg) {
  // use kgo to help with flow control
  kgo(cfg)
  ('capture', [ 'constraints', 'options' ], capture)
  ('attach', [ 'capture', 'options' ], attach.local)
  ('render-local', [ 'attach' ], function(el) {
    ['+rtc', '+localvideo'].forEach(classtweak(el));
    append.to((cfg || {}).localContainer || '#l-video', el);
  })
  ('start-conference', [ 'capture' ], qc.addStream)
  .on('error', reportError);
}

function removeRemoteVideos(id) {
  console.log('call:ended called with :', id);
  qsa('[data-peer="' + id + '"]').forEach(function(el) {
    el.parentNode.removeChild(el);
  });
}

function renderRemote(id, stream) {
  console.log('stream:added called with :', id, stream);
  kgo({ stream: stream })
  ('attach', [ 'stream' ], attach)
  ('render-remote', [ 'attach' ], function(el) {
    el.dataset.peer = id;
    append.to('#r-video', el);
  })
  .on('error', reportError);
}

function reportError(err) {
  console.error('Encountered error: ', err);
}

createConference();
