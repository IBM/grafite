# Install dependencies only when needed
FROM node:lts-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to learn why libc6-compat might be needed
RUN apk add --no-cache libc6-compat
WORKDIR /app

# COPY package.json yarn.lock ./
# RUN yarn install --frozen-lockfile --non-interactive --ignore-scripts
# If using npm with a `package-lock.json` comment out the 2 lines above and use the 2 lines below instead
COPY package.json package-lock.json ./
RUN npm i --ignore-scripts

# Rebuild the source code only when needed
FROM node:lts-alpine AS builder

ENV NEXT_PUBLIC_SESSION_MAXAGE=7200

ENV NEXT_PUBLIC_JUDGE_MODEL=llama3.3:latest
ENV NEXT_PUBLIC_ENSEMBLE_JUDGE_MODELS=llama3.3:latest,mistral-small3.1:latest,gpt-oss:120b
ENV NEXT_PUBLIC_DESIRED_OUTPUT_MODEL=mistral-small3.1:latest
ENV NEXT_PUBLIC_TEST_DEFAULT_MODEL=granite4:small-h
ENV NEXT_PUBLIC_TEST_DEFAULT_MODEL_DISPLAY=granite4:small-h

ENV NEXT_PUBLIC_WX_LIST_ENDPOINT=/api/wx-api/list
ENV NEXT_PUBLIC_DASHBOARD_FEEDBACK_ENDPOINT=/api/dashboard/feedbacks
ENV NEXT_PUBLIC_DASHBOARD_ISSUE_ENDPOINT=/api/dashboard/issues
ENV NEXT_PUBLIC_DASHBOARD_TEST_ENDPOINT=/api/dashboard/tests
ENV NEXT_PUBLIC_DASHBOARD_TEST_RUNNING_ENDPOINT=/api/dashboard/test-runner
ENV NEXT_PUBLIC_DASHBOARD_RESULT_ENDPOINT=/api/dashboard/results
ENV NEXT_PUBLIC_DASHBOARD_SETTINGS_ENDPOINT=/api/dashboard/settings

ENV NEXT_PUBLIC_FEEDBACKS_URL=

ENV NEXT_PUBLIC_OLLAMA_BASE_URL=http://localhost:11434

ARG NODE_ENV production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Uncomment the following line in case you want to disable telemetry during the build
ENV NEXT_TELEMETRY_DISABLED=1

# RUN yarn build
# If using npm comment out above and use below instead
RUN npm run build

# Production image, copy all the files and run next
FROM node:lts-alpine AS runner
WORKDIR /app

# Uncomment the following line in case you want to disable telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED=1
ARG NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/package.json ./package.json

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
