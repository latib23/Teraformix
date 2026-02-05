"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@apollo/client");
const client = new client_1.ApolloClient({
    uri: 'https://your-magento-instance.com/graphql',
    cache: new client_1.InMemoryCache(),
    headers: {
        'Store': 'default'
    }
});
exports.default = client;
//# sourceMappingURL=apolloClient.js.map