require 'babel-register'

G = global
G.a = require('chai').assert
G.nock = require 'nock'
G.Monitor = require '../source/main'
G.F = require 'ramda'
G.FRP = require 'most'
G.P = require 'bluebird'

a.eq = F.curry (ex, ac) -> a.deepEqual ac, ex
