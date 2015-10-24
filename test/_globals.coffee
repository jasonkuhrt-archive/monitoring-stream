require 'babel/register'

G = GLOBAL
G.a = require('chai').assert
G.nock = require 'nock'
G.Monitor = require '../lib/main'
