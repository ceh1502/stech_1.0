const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'STechPro API',
      version: '1.0.0',
      description: '🏈 미식축구 전문 플랫폼 API 문서',
      contact: {
        name: 'STechPro Team',
        email: 'kenlee1502@gmail.com'
      }
    },
    servers: [
      {
        url: 'http://3.34.47.22:4000',
        description: '프로덕션 서버'
      },
      {
        url: 'http://localhost:4000', 
        description: '개발 서버'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js'] // API 주석이 있는 파일들
};

const specs = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  specs
};
