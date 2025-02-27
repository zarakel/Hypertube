FROM node:18
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
EXPOSE 5001
CMD ["npm", "run", "dev"]
