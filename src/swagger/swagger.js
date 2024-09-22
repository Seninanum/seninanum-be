// swagger.js
const swaggerAutogen = require("swagger-autogen")();

const options = {
  info: {
    title: "TEST API Docs",
    description: "시니나눔",
  },
  servers: [
    {
      url: "http://localhost:3001",
    },
  ],
  schemes: ["http"],
  securityDefinitions: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      in: "header",
      bearerFormat: "JWT",
    },
  },
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./src/app.js"];
swaggerAutogen(outputFile, endpointsFiles, options);
