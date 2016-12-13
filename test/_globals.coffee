require 'babel-register'

G = global
G.a = require('chai').assert
G.nock = require 'nock'
G.Monitor = require '../lib/main'
G.F = require 'ramda'
G.FRP = require 'most'
G.P = require 'bluebird'

a.eq = F.curry (ex, ac) -> a.deepEqual ex, ac
