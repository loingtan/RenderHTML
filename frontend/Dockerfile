FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./

# Remove platform-specific deps and fix JSON with python
RUN apk add --no-cache python3 && \
    python3 -c "
import json
with open('package.json') as f:
    pkg = json.load(f)
pkg.get('devDependencies', {}).pop('@emergentbase/visual-edits', None)
pkg.pop('packageManager', None)
with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)
" && \
    apk del python3

# Install dependencies (no lockfile since we modified package.json)
RUN yarn install --network-timeout 120000

# Copy source and build
ARG REACT_APP_BACKEND_URL=
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV ENABLE_HEALTH_CHECK=false

COPY . .
RUN rm -f yarn.lock 2>/dev/null; yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
