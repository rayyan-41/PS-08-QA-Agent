FROM node:22-alpine AS build
WORKDIR /app
RUN npm install --global pnpm@11.25.0
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @pokayoke/widget build && pnpm --filter @pokayoke/platform build
RUN node scripts/copy-widget.mjs

FROM nginx:alpine
RUN apk add --no-cache jq
COPY apps/platform/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/platform/docker-entrypoint.sh /pokayoke-entrypoint.sh
RUN chmod +x /pokayoke-entrypoint.sh
COPY --from=build /app/apps/platform/dist /usr/share/nginx/html
EXPOSE 8080
ENTRYPOINT ["/pokayoke-entrypoint.sh"]
