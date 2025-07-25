FROM node:18-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

ENV VITE_HOST=0.0.0.0
ENV VITE_PORT=3000

EXPOSE 3000

# Use development mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
