var events = require('events');
var fs = require('fs');
var path = require('path');
var jade = require('jade');
var util = require('util');
var mime = require('./mime');
var assert = require('assert');

var client = require('./mantaClient.js');

// Template engine
var gen_files_view = jade.compile([
    '- each file in files',
    '  .file(data-path="#{file.path}", data-type="#{file.type}")',
    '    .icon',
    '      img(src="icons/#{file.type}.png")',
    '    .name #{file.name}',
].join('\n'));

// Our type
function Folder(jquery_element) {
  events.EventEmitter.call(this);
  this.element = jquery_element;

  var self = this;
  // Click on blank
  this.element.parent().on('click', function() {
    self.element.children('.focus').removeClass('focus');
  });
  // Click on file
  this.element.delegate('.file', 'click', function(e) {
    self.element.children('.focus').removeClass('focus');
    $(this).addClass('focus');
    e.stopPropagation();
  });
  // Double click on file
  this.element.delegate('.file', 'dblclick', function() {
    var file_path = $(this).attr('data-path');
    var type = $(this).attr('data-type');
    self.emit('navigate', file_path, type);
  });
}

util.inherits(Folder, events.EventEmitter);

Folder.prototype.open = function(dir) {
  var self = this;

  var opts = {
      offset: 0,
      limit: 256,
      type: 'object'
  };

  client.ls(dir, opts, function(err, res) {

      assert.ifError(err);

      var files = [];

      res.on('object', function (obj) {
          files.push(obj);
      });

      res.on('directory', function (dir) {
          files.push(dir);
      });

      res.once('error', function (err) {
          console.error(err.stack);
          window.alert(err);
      });

      res.once('end', function () {

          for (var i = 0; i < files.length; ++i) {
            files[i] = {
                name: files[i].name,
                path: dir + '/' + files[i].name,
                type: files[i].type === 'directory' ? 'folder' : 'text'
            }
          }

          self.element.html(gen_files_view({ files: files }));
      });
  });
}

exports.Folder = Folder;
