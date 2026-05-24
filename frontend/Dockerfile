FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Remove platform-specific dependency that won't install outside Emergent
RUN sed -i '/@emergentbase\/visual-edits/d' package.json && \
    sed -i '/packageManager/d' package.json

# Install dependencies
RUN yarn install --network-timeout 120000 2>/dev/null || yarn install --network-timeout 120000

# Copy source
ARG REACT_APP_BACKEND_URL=
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV ENABLE_HEALTH_CHECK=false

COPY . .

# Remove visual-edits references for production build
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
