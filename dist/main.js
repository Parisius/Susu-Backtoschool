"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
            : true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('SùSù API')
        .setDescription('Commandes et paiements PayDunya pour le site SùSù')
        .setVersion('1.0')
        .addTag('orders', 'Commandes')
        .addTag('payments', 'Paiements PayDunya')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api-docs', app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`SùSù backend listening on port ${port}`);
    console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
}
bootstrap();
