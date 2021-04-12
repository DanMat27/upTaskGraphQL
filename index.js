const { ApolloServer } = require('apollo-server');
const jwt = require('jsonwebtoken');
require('dotenv').config('variables.env');

/* Type Definitions */
const typeDefs = require('./db/schema');
/* Resolvers */
const resolvers = require('./db/resolvers');

/* Connect to DB */
const conectarDB = require('./config/db');
conectarDB();

/* Create server */
const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    context: ({req}) => {
        const token = req.headers['authorization'] || '';
        if(token) {
            try {
                /* Verifica el token */
                const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRET);
                console.log(usuario);
                return usuario;
            } catch (error) {
                console.log(error);
            }
        }
    }
});

/* Start server */
server.listen({ port: process.env.PORT || 4000 }).then( ({url}) => {
    console.log(`Servidor listo en la URL ${url}`)
} )