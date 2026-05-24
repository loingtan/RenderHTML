FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./

# Remove platform-specific deps and fix JSON properly
RUN apk add --no-cache python3 && \
    python3 -c "import json; f=open('package.json'); pkg=json.load(f); f.close(); pkg.get('devDependencies',{}).pop('@emergentbase/visual-edits',None); pkg.pop('packageManager',None); f=open('package.json','w'); json.dump(pkg,f,indent=2); f.close()" && \
    apk del python3

# Install dependencies
RUN yarn install --network-timeout 120000

# Copy source and build
ARG REACT_APP_BACKEND_URL=
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV ENABLE_HEALTH_CHECK=false

COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
