import { ApolloClient, InMemoryCache } from '@apollo/client';

// Standard Apollo Client for Magento GraphQL
const client = new ApolloClient({
  uri: 'https://your-magento-instance.com/graphql', // Placeholder URL
  cache: new InMemoryCache(),
  headers: {
    // Add any required headers like Store code here
    'Store': 'default'
  }
});

export default client;