FROM registry.librechat.ai/librechat-ai/librechat-dev:latest
USER root
COPY packages/api/src/career /app/packages/api/src/career
COPY packages/data-provider/src/career.ts /app/packages/data-provider/src/career.ts
COPY packages/data-schemas/src/career /app/packages/data-schemas/src/career
RUN ./node_modules/.bin/tsc --strict --skipLibCheck --esModuleInterop --target ES2022 --module commonjs --moduleResolution node --types node --rootDir packages --outDir career-build packages/api/src/career/main.ts packages/api/src/career/research.test.ts \
    && node --test career-build/api/src/career/research.test.js
USER node
ENTRYPOINT ["node", "/app/career-build/api/src/career/main.js"]
CMD ["/app/librechat.yaml", "/app/companies.json"]
