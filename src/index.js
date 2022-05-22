const depthLimit = require('graphql-depth-limit');
const {createComplexityLimitRule} = require('graphql-validation-complexity');

require('dotenv').config();

const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const express = require('express');
const {ApolloServer} = require('apollo-server-express');
const models = require('./models');
const typeDefs = require('./shcema');
const resolvers = require('./resolvers');

const port = process.env.PORT || 4000;
const DB_HOST = process.env.DB_HOST;
const db = require('./db');
db.connect(DB_HOST);

const app = express();
app.use(helmet());
app.use(cors());

const getUser = token => {
	if (token) {
		try {
			return jwt.verify(token, process.env.JWT_SECRET);
		} catch (e) {
			throw new Error('Session invalid');
		}
	}
};

const server = new ApolloServer({
	typeDefs,
	resolvers,
	validationRules: [depthLimit(5), createComplexityLimitRule(1000)],
	context: ({req}) => {
		const token = req.headers.authorization;
		const user = getUser(token);
		return {models, user};
	}
});
server.applyMiddleware({app, path: '/api'});

app.listen({port}, () => {
	console.log(
		`GraphQL Server running at http://localhost:${port}${server.graphqlPath}`
	);
});
