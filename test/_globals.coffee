require 'babel-register'

G = GLOBAL
G.a = require('chai').assert
G.nock = require 'nock'
G.Monitor = require '../lib/main'
G.F = require 'ramda'
G.FRP = require 'most'
G.P = require 'bluebird'

a.eq = F.curry (ex, ac) -> a.equal ex, ac
