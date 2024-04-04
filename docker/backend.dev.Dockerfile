FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

COPY ./ ./

CMD BUILD_ENVIRONMENT=docker npm run dev