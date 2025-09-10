
        module.exports = {
          name: 'test-collector',
          description: 'Test data collector',
          inputSchema: {
            type: 'object',
            properties: {
              source: { type: 'string' }
            },
            required: ['source']
          },
          outputSchema: {
            type: 'object',
            properties: {
              data: { type: 'array' },
              count: { type: 'number' }
            }
          },
          async collect(input) {
            return {
              data: ['item1', 'item2'],
              count: 2
            };
          }
        };
      