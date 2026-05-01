FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# If serving statically:
# RUN npm install -g serve
# CMD ["serve", "-s", "dist", "-p", "3000"]

# Or just use the vite preview server (less optimal for pure prod, but fine for docker compose)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
