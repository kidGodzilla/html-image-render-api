// Environment Variables
require('dotenv').config();

const { corsAndBodyParser } = require('mr365-utils');
const request = require('superagent');
const express = require('express');
const atob = require('atob');
const btoa = require('btoa');
let app = express();

const port = process.env.port || 5000;
let debug = process.env.debug || 0;

const JSPEN_PUT_ENDPOINT = process.env.JSPEN_PUT_ENDPOINT || `https://put.jspen.co/`;
const JSPEN_RENDERER_BASE = process.env.JSPEN_RENDERER_BASE || 'http://jspen.co/s/';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:' + port;
const THUM_IO_AUTH_KEY = process.env.THUM_IO_AUTH_KEY || '';

corsAndBodyParser(app);

// Simple logger & API Monitor
require('simple-logger-api-monitor')(app);

function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode(parseInt(p1, 16))
    }))
}

function b64DecodeUnicode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
}

/* Return an HTML string for the given html / css / js */
function makeHTML(data) {
    if (!data) return '';
    // Generate an HTML page from the contents of each <textarea>
    let pageData = `<!DOCTYPE html><head><meta charset="utf-8"><meta content="width=device-width,initial-scale=1.0,maximum-scale=1.0" name="viewport"><title>${ data.title || 'New Pen' }</title><meta name="author" content="${ data.author || '' }"><style>${ data.css || '' }</style></head><body>${ data.html || '' }<script>${ data.js || '' }</scr${ '' }ipt></bo${ '' }dy>`;

    return pageData;
}

app.get('/img/:key', (req, res) => {
    let { delay, scale, width, height, type, fullpage } = req.query;
    let { key } = req.params;

    let q = require('url').parse(req.url).query;

    if (key.includes('.')) {
        let parts = key.split('.');
        key = parts[0];
        t = parts[1];
        if (t === 'jpg' || t === 'jpeg') type = 'jpg';
    }

    if (!width) width = 500;
    if (!type) type = 'png';
    if (!scale) scale = 2;

    function make (key) {
        let jspenUrl = `${ JSPEN_RENDERER_BASE }?${ q }#${ key }`;

        let heightStr = height ? `crop/${ (height * scale) }/` : '';
        let waitStr = delay ? `wait/${ delay }/` : '';
        let fullStr = fullpage ? 'fullpage/' : '';
        let jpgStr = type === 'jpg' ? 'allowJPG/' : 'png/';

        let thum = `https://image.thum.io/get/auth/${ THUM_IO_AUTH_KEY }/${ jpgStr }noanimate/${ fullStr }viewportWidth/${ (width * scale) }/width/${ (width * scale) }/${ heightStr }${ waitStr }?url=` + encodeURIComponent(jspenUrl);

        return res.redirect(thum);
    }

    make(key);
});

app.post('/img', (req, res) => {
    let { key, html, css, delay, scale, width, height, type, fullpage } = req.body;

    if (!width) width = 500;
    if (!type) type = 'png';
    if (!scale) scale = 2;

    function make (key) {
        let jspenUrl = `${ JSPEN_RENDERER_BASE }#${ key }`;

        let heightStr = height ? `crop/${ (height * scale) }/` : '';
        let waitStr = delay ? `wait/${ delay }/` : '';
        let fullStr = fullpage ? 'fullpage/' : '';
        let jpgStr = type === 'jpg' ? 'allowJPG/' : 'png/';

        let thum = `https://image.thum.io/get/auth/${ THUM_IO_AUTH_KEY }/${ jpgStr }noanimate/${ fullStr }viewportWidth/${ (width * scale) }/width/${ (width * scale) }/${ heightStr }${ waitStr }?url=` + encodeURIComponent(jspenUrl);

        let scaleStr = scale !== 2 ? `&scale=${ scale }` : '';
        let heightStr = height ? `&height=${ height }` : '';

        return res.json({
            key: key,
            image: `${ SERVER_URL }/img/${ key }.${ type }?width=${ width }${ heightStr }${ scaleStr }`,
            thum: thum,
            preview: jspenUrl
        });
    }

    scale = parseInt(scale);

    if (scale > 1) css += `
body{transform-origin:0 0;transform:scale(${ scale })}
`;
    html += `
<script src="https://cdnjs.cloudflare.com/ajax/libs/mustache.js/4.0.1/mustache.js"></script>
<script>let _o = JSON.parse('{"' + (location.search.substring(1)).replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });document.querySelector('.mustache').innerHTML = Mustache.render(document.querySelector('.mustache').innerHTML, _o);</script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jloutsenhizer/emojijs/emoji.css">
<script src="text/javascript" href="https://cdn.jsdelivr.net/gh/jloutsenhizer/emojijs/emoji.js"></script>
<script>window.timr = setInterval(function () { if (window.emoji) { window.emoji.emojifyWholePage(); clearInterval(window.timr) } }, 100);</script>
`;

    let page = { html: html, css: css };

    let d = { data : `/#${ b64EncodeUnicode(encodeURIComponent(makeHTML(page))) }` };

    if (key) {
        make(key);

    } else {
        request.post(JSPEN_PUT_ENDPOINT).send(d).end((err, ress) => {
            if (err) return res.json(err);
            let { key } = ress.body;
            make(key);
        });
    }
});


// app.use(express.static('public'));
app.listen(port, function () { console.log('App listening on port', port); });
