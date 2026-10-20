FROM node:22-slim AS console
WORKDIR /src/frontend
RUN npm install --global pnpm@11.25.0
COPY frontend/ ./
RUN pnpm install --frozen-lockfile \
 && pnpm --filter @pokayoke/widget build \
 && pnpm --filter @pokayoke/platform build \
 && node scripts/copy-widget.mjs

FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt
COPY backend /app/backend
COPY fallback /app/fallback
COPY data /app/data
COPY --from=console /src/frontend/apps/platform/dist /app/backend/static/console
ENV PORT=8080
CMD ["sh", "-c", "uvicorn backend.app:app --host 0.0.0.0 --port ${PORT}"]
