
import { PassThrough } from 'stream';
import * as Analyser from 'audio-analyser';
import * as RenderStream from 'audio-render';

const NS = require('node-sdl2');
const SDL_video = NS.require('SDL_video');
const SDL_render = NS.require('SDL_render');
const SDL_timer = NS.require('SDL_timer');

var portAudio = require('naudiodon');

var fs = require('fs');

export class AudioManager {
  private app: any;
  private window: any;
  private render: any;
  private analyser: Analyser;
  private inputDevide: any;
  private middlestream: PassThrough;
  private renderStream: RenderStream;
  constructor() {
    this.app = NS.app;
    this.AttachAppEvents();

    this.Render.bind(this);
    this.window = new NS.window({
      title: 'test audio',
      show: true,
      w: 500,
      h: 500,
    });
    this.render = this.window.render;
    this.window.on('change', () => {
      this.Render([]);
    });
    this.inputDevide = portAudio.getDevices()[0];

    this.middlestream = new PassThrough();
    this.middlestream.on('data', data => {
      //console.log(data);
    });

    var renderobject = this.render;
    var renderer = this.render._render;


    this.renderStream = RenderStream({
      //custom rendering function, can be passed instead of options 
      render: function (canvas) {
        //see audio-analyser for API 
        var fdata = this.getFrequencyData();
        var waveform = this.getTimeData(1024);

        SDL_render.SDL_SetRenderDrawColor(renderer, 50, 50, 50, 255);
        SDL_render.SDL_RenderClear(renderer);
        SDL_render.SDL_SetRenderDrawColor(renderer, 255, 100, 100, 150);
        var time = 0;
        var points: any[] = waveform.map(y => {
          time++;
          return { y: y * 100 + 100, x: time };
        });
        renderobject.drawPoint(points);
        renderobject.present();
      },
    });

  }
  private AttachAppEvents() {
    this.app.on('window-all-closed', () => { });
    this.app.on('before-quit', (event: any) => { });
    this.app.on('will-quit', (event: any) => { });
    this.app.on('drop', (file: any) => {
      console.log(file);
    });
  }

  public Render(data) {
    var renderer = this.render._render;
    SDL_render.SDL_SetRenderDrawColor(renderer, 50, 50, 50, 255);
    SDL_render.SDL_RenderClear(renderer);
    this.render.present();

  }

  public Play() {
    var pw = new portAudio.AudioWriter({
      channelCount: 2,
      sampleFormat: portAudio.SampleFormat32Bit,
      sampleRate: 44100,
      // deviceId: 2
    }); // Omit the device to select the default device 

    // Create a stream to pipe into the AudioWriter   
    // Note that this does not strip the WAV header so a click will be heard at the beginning 
    var rs = fs.createReadStream('rawAudio.raw');

    // Stop the Node.JS process from closing before the clip plays 
    var to = setTimeout(function () { }, 12345678);

    // When the audio device signals that it is ready, start piping data and start streaming 
    pw.once('audio_ready', (pa) => {
      rs.pipe(this.renderStream).pipe(pw);
      pw.pa.start();
    });

    // When the stream is finished, clear the timeout so the node process can complete 
    pw.once('finish', function () { clearTimeout(to); });
  }


  public Record() {
    var pr = new portAudio.AudioReader({
      channelCount: 2,
      sampleFormat: portAudio.SampleFormat32Bit,
      sampleRate: 44100,
      // deviceId: 0
    });

    //Create a write  stream to write out to a raw audio file 
    var ws = fs.createWriteStream('rawAudio.raw');


    //Set a timeout 
    var to = setTimeout(function () { }, 12345678);

    //Start streaming 
    pr.once('audio_ready', (pa) => {
      pr.pipe(this.renderStream).pipe(ws);
      pr.pa.start();
    });

    //Clear timeout 
    pr.once('finish', function () { clearTimeout(to); });

  }
}