# 1. Base Image : startwith a light weight Node.js enviorment
FROM node:20-alpine

#2. Workdir: Set the directory inside the container where our app will live 
WORKDIR /app

#3. Copy: Bring Over package,Json to install depenedices  first
COPY package*.json ./

#4. Run :Install the dependeinces inside the container
RUN npm install

#5. Copy: Bring over the rest of the application code (the src folder )
COPY src/ ./src/

#6. Expose : Tell the docker which command port run on internally
EXPOSE 3000

#7 Default command to start
CMD ["npm", "start"]