# Use an official Node.js runtime as a base image
FROM node:20.10-alpine

# Install build dependencies
RUN apk add --no-cache build-base python3

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the rest of the application code to the container
COPY . .

# Install project dependencies
RUN npm install

# Build the application
RUN npm run build

# Expose the port that Next.js will run on
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "run", "start:migrate"]
